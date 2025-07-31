import { getErrorMessage } from '../utils';
import type { Token, SwapQuote } from '../types';

// Jupiter API の型定義
export interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
}

export interface JupiterRoute {
  inAmount: string;
  outAmount: string;
  amount: string;
  otherAmountThreshold: string;
  outAmountWithSlippage: string;
  swapMode: 'ExactIn' | 'ExactOut';
  priceImpactPct: number;
  marketInfos: JupiterMarketInfo[];
  instructions?: unknown[];
}

export interface JupiterMarketInfo {
  id: string;
  label: string;
  inputMint: string;
  outputMint: string;
  notEnoughLiquidity: boolean;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  lpFee: {
    amount: string;
    mint: string;
    pct: number;
  };
  platformFee: {
    amount: string;
    mint: string;
    pct: number;
  };
}

export interface JupiterQuoteResponse {
  data: JupiterRoute[];
  timeTaken: number;
  contextSlot: number;
}

export interface JupiterSwapRequest {
  route: JupiterRoute;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  feeAccount?: string;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

class JupiterApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = process.env.REACT_APP_JUPITER_API_URL || 'https://quote-api.jup.ag/v6';
    this.timeout = 10000; // 10秒
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1秒
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          console.warn(`Jupiter API request failed, retrying... (${attempt + 1}/${this.retryAttempts})`);
        }
      }
    }

    throw new Error(`Jupiter API request failed after ${this.retryAttempts} attempts: ${getErrorMessage(lastError!)}`);
  }

  // 利用可能なトークン一覧を取得
  public async getTokens(): Promise<JupiterToken[]> {
    try {
      const response = await this.makeRequest<JupiterToken[]>('/tokens');
      return response;
    } catch (error) {
      console.error('Failed to fetch Jupiter tokens:', getErrorMessage(error));
      throw new Error(`Failed to fetch tokens: ${getErrorMessage(error)}`);
    }
  }

  // スワップクォートを取得
  public async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<JupiterRoute[]> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        ...(slippageBps && { slippageBps: slippageBps.toString() }),
      });

      const response = await this.makeRequest<JupiterQuoteResponse>(
        `/quote?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get Jupiter quote:', getErrorMessage(error));
      throw new Error(`Failed to get quote: ${getErrorMessage(error)}`);
    }
  }

  // スワップトランザクションを生成
  public async getSwapTransaction(
    swapRequest: JupiterSwapRequest
  ): Promise<JupiterSwapResponse> {
    try {
      const response = await this.makeRequest<JupiterSwapResponse>('/swap', {
        method: 'POST',
        body: JSON.stringify(swapRequest),
      });

      return response;
    } catch (error) {
      console.error('Failed to get swap transaction:', getErrorMessage(error));
      throw new Error(`Failed to get swap transaction: ${getErrorMessage(error)}`);
    }
  }

  // 内部形式への変換メソッド
  public jupiterTokenToToken(jupiterToken: JupiterToken): Token {
    return {
      address: jupiterToken.address,
      symbol: jupiterToken.symbol,
      name: jupiterToken.name,
      decimals: jupiterToken.decimals,
      chainId: jupiterToken.chainId,
      logoURI: jupiterToken.logoURI,
    };
  }

  public jupiterRouteToSwapQuote(
    route: JupiterRoute,
    inputToken: Token,
    outputToken: Token
  ): SwapQuote {
    const inputAmount = parseFloat(route.inAmount) / Math.pow(10, inputToken.decimals);
    const outputAmount = parseFloat(route.outAmount) / Math.pow(10, outputToken.decimals);
    
    return {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      priceImpact: route.priceImpactPct,
      fee: this.calculateTotalFee(route),
      route: route.marketInfos.map(info => info.label),
      estimatedGas: 0.001, // SOL単位での推定ガス費用
      minimumReceived: parseFloat(route.outAmountWithSlippage) / Math.pow(10, outputToken.decimals),
      exchangeRate: outputAmount / inputAmount,
      provider: 'Jupiter',
      timestamp: Date.now(),
    };
  }

  private calculateTotalFee(route: JupiterRoute): number {
    return route.marketInfos.reduce((total, info) => {
      return total + info.lpFee.pct + info.platformFee.pct;
    }, 0);
  }

  // 価格影響を分析
  public analyzePriceImpact(routes: JupiterRoute[]): {
    bestRoute: JupiterRoute | null;
    highImpactRoutes: JupiterRoute[];
    averageImpact: number;
  } {
    if (routes.length === 0) {
      return {
        bestRoute: null,
        highImpactRoutes: [],
        averageImpact: 0,
      };
    }

    // 最小価格影響のルートを見つける
    const bestRoute = routes.reduce((best, current) => 
      current.priceImpactPct < best.priceImpactPct ? current : best
    );

    // 高い価格影響のルート（5%以上）
    const highImpactRoutes = routes.filter(route => route.priceImpactPct > 0.05);

    // 平均価格影響
    const averageImpact = routes.reduce((sum, route) => sum + route.priceImpactPct, 0) / routes.length;

    return {
      bestRoute,
      highImpactRoutes,
      averageImpact,
    };
  }

  // ルート比較分析
  public compareRoutes(routes: JupiterRoute[]): {
    route: JupiterRoute;
    metrics: {
      outputAmount: number;
      priceImpact: number;
      totalFee: number;
      marketCount: number;
      recommendation: 'best' | 'good' | 'caution' | 'avoid';
    };
  }[] {
    return routes.map(route => {
      const outputAmount = parseFloat(route.outAmount);
      const totalFee = this.calculateTotalFee(route);
      const marketCount = route.marketInfos.length;

      let recommendation: 'best' | 'good' | 'caution' | 'avoid' = 'good';
      
      if (route.priceImpactPct > 0.1) {
        recommendation = 'avoid'; // 10%以上の価格影響
      } else if (route.priceImpactPct > 0.05) {
        recommendation = 'caution'; // 5%以上の価格影響
      } else if (totalFee < 0.01 && route.priceImpactPct < 0.02) {
        recommendation = 'best'; // 低手数料・低価格影響
      }

      return {
        route,
        metrics: {
          outputAmount,
          priceImpact: route.priceImpactPct,
          totalFee,
          marketCount,
          recommendation,
        },
      };
    }).sort((a, b) => b.metrics.outputAmount - a.metrics.outputAmount); // 出力量の降順でソート
  }

  // ヘルスチェック
  public async healthCheck(): Promise<boolean> {
    try {
      // SOL/USDC の簡単なクォートを取得してAPIの健全性をチェック
      const solMint = 'So11111111111111111111111111111111111111112';
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      await this.getQuote(solMint, usdcMint, 1000000); // 0.001 SOL
      return true;
    } catch (error) {
      console.error('Jupiter API health check failed:', getErrorMessage(error));
      return false;
    }
  }
}

// シングルトンインスタンス
export const jupiterApiService = new JupiterApiService();

export default JupiterApiService;