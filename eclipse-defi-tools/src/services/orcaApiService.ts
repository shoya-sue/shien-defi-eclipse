import { getErrorMessage } from '../utils';
import type { Token, SwapQuote, PoolData } from '../types';

// Orca API の型定義
export interface OrcaPool {
  address: string;
  tokenA: {
    mint: string;
    amount: string;
    decimals: number;
  };
  tokenB: {
    mint: string;
    amount: string;
    decimals: number;
  };
  fee: number;
  apy: number;
  volume24h: number;
  liquidity: number;
  lpTokenSupply: string;
  whirlpoolsConfig: string;
  whirlpoolBump: number[];
  tickSpacing: number;
  tickCurrentIndex: number;
  sqrtPrice: string;
  feeGrowthGlobalA: string;
  feeGrowthGlobalB: string;
  rewardInfos: OrcaRewardInfo[];
}

export interface OrcaRewardInfo {
  mint: string;
  vault: string;
  authority: string;
  emissionsPerSecondX64: string;
  growthGlobalX64: string;
}

export interface OrcaQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

export interface OrcaQuoteResponse {
  inputAmount: string;
  outputAmount: string;
  minOutputAmount: string;
  priceImpact: number;
  fee: number;
  route: string[];
  poolAddress: string;
  executionPrice: number;
  invertedExecutionPrice: number;
}

export interface OrcaSwapRequest {
  quote: OrcaQuoteResponse;
  userPublicKey: string;
  slippageBps: number;
}

export interface OrcaSwapResponse {
  transaction: string;
  lastValidBlockHeight: number;
}

export interface OrcaPoolsResponse {
  pools: OrcaPool[];
  total: number;
  page: number;
  limit: number;
}

class OrcaApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = process.env.REACT_APP_ORCA_API_URL || 'https://api.orca.so/v1';
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
          console.warn(`Orca API request failed, retrying... (${attempt + 1}/${this.retryAttempts})`);
        }
      }
    }

    throw new Error(`Orca API request failed after ${this.retryAttempts} attempts: ${getErrorMessage(lastError!)}`);
  }

  // プール一覧を取得
  public async getPools(page: number = 1, limit: number = 100): Promise<OrcaPool[]> {
    try {
      const response = await this.makeRequest<OrcaPoolsResponse>(
        `/pools?page=${page}&limit=${limit}`
      );
      return response.pools;
    } catch (error) {
      console.error('Failed to fetch Orca pools:', getErrorMessage(error));
      throw new Error(`Failed to fetch pools: ${getErrorMessage(error)}`);
    }
  }

  // 特定のプール情報を取得
  public async getPool(poolAddress: string): Promise<OrcaPool> {
    try {
      const response = await this.makeRequest<OrcaPool>(`/pools/${poolAddress}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch Orca pool:', getErrorMessage(error));
      throw new Error(`Failed to fetch pool: ${getErrorMessage(error)}`);
    }
  }

  // スワップクォートを取得
  public async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<OrcaQuoteResponse> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        ...(slippageBps && { slippageBps: slippageBps.toString() }),
      });

      const response = await this.makeRequest<OrcaQuoteResponse>(
        `/quote?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Failed to get Orca quote:', getErrorMessage(error));
      throw new Error(`Failed to get quote: ${getErrorMessage(error)}`);
    }
  }

  // 流動性プールデータを取得
  public async getLiquidityPools(
    tokenA?: string,
    tokenB?: string
  ): Promise<PoolData[]> {
    try {
      const params = new URLSearchParams();
      if (tokenA) params.append('tokenA', tokenA);
      if (tokenB) params.append('tokenB', tokenB);

      const response = await this.makeRequest<OrcaPoolsResponse>(
        `/pools/liquidity?${params.toString()}`
      );

      return response.pools.map(pool => this.orcaPoolToPoolData(pool));
    } catch (error) {
      console.error('Failed to fetch Orca liquidity pools:', getErrorMessage(error));
      throw new Error(`Failed to fetch liquidity pools: ${getErrorMessage(error)}`);
    }
  }

  // スワップトランザクションを生成
  public async getSwapTransaction(
    swapRequest: OrcaSwapRequest
  ): Promise<OrcaSwapResponse> {
    try {
      const response = await this.makeRequest<OrcaSwapResponse>('/swap', {
        method: 'POST',
        body: JSON.stringify(swapRequest),
      });

      return response;
    } catch (error) {
      console.error('Failed to get Orca swap transaction:', getErrorMessage(error));
      throw new Error(`Failed to get swap transaction: ${getErrorMessage(error)}`);
    }
  }

  // 内部形式への変換メソッド
  public orcaPoolToPoolData(orcaPool: OrcaPool): PoolData {
    return {
      poolId: orcaPool.address,
      token0: {
        address: orcaPool.tokenA.mint,
        symbol: '', // これは別途トークン情報から取得する必要がある
        name: '',
        decimals: orcaPool.tokenA.decimals,
        chainId: 100, // Eclipse chain ID
      },
      token1: {
        address: orcaPool.tokenB.mint,
        symbol: '',
        name: '',
        decimals: orcaPool.tokenB.decimals,
        chainId: 100,
      },
      reserves: [
        parseFloat(orcaPool.tokenA.amount) / Math.pow(10, orcaPool.tokenA.decimals),
        parseFloat(orcaPool.tokenB.amount) / Math.pow(10, orcaPool.tokenB.decimals),
      ],
      fee: orcaPool.fee,
      apy: orcaPool.apy,
      volume24h: orcaPool.volume24h,
      liquidity: orcaPool.liquidity,
    };
  }

  public orcaQuoteToSwapQuote(
    orcaQuote: OrcaQuoteResponse,
    inputToken: Token,
    outputToken: Token
  ): SwapQuote {
    const inputAmount = parseFloat(orcaQuote.inputAmount) / Math.pow(10, inputToken.decimals);
    const outputAmount = parseFloat(orcaQuote.outputAmount) / Math.pow(10, outputToken.decimals);
    
    return {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      priceImpact: orcaQuote.priceImpact,
      fee: orcaQuote.fee,
      route: orcaQuote.route,
      provider: 'Orca',
      estimatedGas: 0.004, // SOL単位での推定ガス費用
      minimumReceived: parseFloat(orcaQuote.minOutputAmount) / Math.pow(10, outputToken.decimals),
      exchangeRate: outputAmount / inputAmount,
      timestamp: Date.now(),
    };
  }

  // プール分析
  public analyzePoolPerformance(pools: OrcaPool[]): {
    topByApy: OrcaPool[];
    topByVolume: OrcaPool[];
    topByLiquidity: OrcaPool[];
    averageApy: number;
    totalLiquidity: number;
  } {
    if (pools.length === 0) {
      return {
        topByApy: [],
        topByVolume: [],
        topByLiquidity: [],
        averageApy: 0,
        totalLiquidity: 0,
      };
    }

    // APY順でソート
    const topByApy = [...pools].sort((a, b) => b.apy - a.apy).slice(0, 10);
    
    // ボリューム順でソート
    const topByVolume = [...pools].sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
    
    // 流動性順でソート
    const topByLiquidity = [...pools].sort((a, b) => b.liquidity - a.liquidity).slice(0, 10);

    // 平均APY
    const averageApy = pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length;

    // 総流動性
    const totalLiquidity = pools.reduce((sum, pool) => sum + pool.liquidity, 0);

    return {
      topByApy,
      topByVolume,
      topByLiquidity,
      averageApy,
      totalLiquidity,
    };
  }

  // 価格影響を分析
  public async analyzePriceImpact(
    inputMint: string,
    outputMint: string,
    amounts: number[]
  ): Promise<{
    amount: number;
    priceImpact: number;
    outputAmount: number;
  }[]> {
    const results = await Promise.allSettled(
      amounts.map(async (amount) => {
        try {
          const quote = await this.getSwapQuote(inputMint, outputMint, amount);
          return {
            amount,
            priceImpact: quote.priceImpact,
            outputAmount: parseFloat(quote.outputAmount),
          };
        } catch (error) {
          return {
            amount,
            priceImpact: 100, // 失敗時は最大価格影響
            outputAmount: 0,
          };
        }
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{
        amount: number;
        priceImpact: number;
        outputAmount: number;
      }> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  // ヘルスチェック
  public async healthCheck(): Promise<boolean> {
    try {
      // SOL/USDC の簡単なクォートを取得してAPIの健全性をチェック
      const solMint = 'So11111111111111111111111111111111111111112';
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      await this.getSwapQuote(solMint, usdcMint, 1000000); // 0.001 SOL
      return true;
    } catch (error) {
      console.error('Orca API health check failed:', getErrorMessage(error));
      return false;
    }
  }
}

// シングルトンインスタンス
export const orcaApiService = new OrcaApiService();

export default OrcaApiService;