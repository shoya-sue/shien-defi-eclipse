import type { Token, SwapQuote } from '../types';
import { DEX_CONFIGS } from '../constants';

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }[];
}

export interface OrcaQuoteResponse {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
  route: string[];
}

class DEXService {
  private cache = new Map<string, { data: SwapQuote; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 1000; // 30秒

  async getJupiterQuote(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    slippageBps: number = 50
  ): Promise<SwapQuote | null> {
    const cacheKey = `jupiter_${inputToken.address}_${outputToken.address}_${amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${DEX_CONFIGS.jupiter.apiUrl}/v6/quote?` +
        new URLSearchParams({
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          amount: (amount * Math.pow(10, inputToken.decimals)).toString(),
          slippageBps: slippageBps.toString(),
        })
      );

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const data: JupiterQuoteResponse = await response.json();
      
      const quote: SwapQuote = {
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: parseInt(data.outAmount) / Math.pow(10, outputToken.decimals),
        priceImpact: data.priceImpactPct,
        fee: DEX_CONFIGS.jupiter.fee,
        route: data.routePlan.map(plan => plan.swapInfo.label),
        dex: 'Jupiter',
        estimatedGas: 0.005, // SOL estimate
      };

      this.cache.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error('Jupiter quote error:', error);
      return null;
    }
  }

  async getOrcaQuote(
    inputToken: Token,
    outputToken: Token,
    amount: number
  ): Promise<SwapQuote | null> {
    const cacheKey = `orca_${inputToken.address}_${outputToken.address}_${amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Orca API実装 (仮想的なエンドポイント)
      const response = await fetch(
        `${DEX_CONFIGS.orca.apiUrl}/quote?` +
        new URLSearchParams({
          inputToken: inputToken.address,
          outputToken: outputToken.address,
          amount: (amount * Math.pow(10, inputToken.decimals)).toString(),
        })
      );

      if (!response.ok) {
        throw new Error(`Orca API error: ${response.status}`);
      }

      const data: OrcaQuoteResponse = await response.json();
      
      const quote: SwapQuote = {
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: parseInt(data.outputAmount) / Math.pow(10, outputToken.decimals),
        priceImpact: data.priceImpact,
        fee: DEX_CONFIGS.orca.fee,
        route: data.route,
        dex: 'Orca',
        estimatedGas: 0.004, // SOL estimate
      };

      this.cache.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error('Orca quote error:', error);
      return null;
    }
  }

  async getRaydiumQuote(
    inputToken: Token,
    outputToken: Token,
    amount: number
  ): Promise<SwapQuote | null> {
    const cacheKey = `raydium_${inputToken.address}_${outputToken.address}_${amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Raydium API実装 (仮想的なエンドポイント)
      const response = await fetch(
        `${DEX_CONFIGS.raydium.apiUrl}/quote?` +
        new URLSearchParams({
          inputToken: inputToken.address,
          outputToken: outputToken.address,
          amount: (amount * Math.pow(10, inputToken.decimals)).toString(),
        })
      );

      if (!response.ok) {
        throw new Error(`Raydium API error: ${response.status}`);
      }

      const data = await response.json();
      
      const quote: SwapQuote = {
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: data.outputAmount / Math.pow(10, outputToken.decimals),
        priceImpact: data.priceImpact || 0,
        fee: DEX_CONFIGS.raydium.fee,
        route: data.route || ['Direct'],
        dex: 'Raydium',
        estimatedGas: 0.0035, // SOL estimate
      };

      this.cache.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error('Raydium quote error:', error);
      return null;
    }
  }

  async getAllQuotes(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    slippageBps: number = 50
  ): Promise<SwapQuote[]> {
    const promises = [
      this.getJupiterQuote(inputToken, outputToken, amount, slippageBps),
      this.getOrcaQuote(inputToken, outputToken, amount),
      this.getRaydiumQuote(inputToken, outputToken, amount),
    ];

    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SwapQuote> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  getBestQuote(quotes: SwapQuote[]): SwapQuote | null {
    if (quotes.length === 0) return null;
    
    return quotes.reduce((best, current) => {
      // より多くのアウトプットを得られる方を選択
      const bestNetOutput = best.outputAmount - (best.outputAmount * best.fee);
      const currentNetOutput = current.outputAmount - (current.outputAmount * current.fee);
      
      return currentNetOutput > bestNetOutput ? current : best;
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const dexService = new DEXService();
export default dexService;