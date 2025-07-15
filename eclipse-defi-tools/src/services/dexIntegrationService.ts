import type { Token, SwapQuote } from '../types';
import { DEX_CONFIGS } from '../constants';

export interface DEXResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SwapInstruction {
  programId: string;
  accounts: string[];
  data: Uint8Array;
}

export interface SwapTransaction {
  instructions: SwapInstruction[];
  signers: string[];
  recentBlockhash: string;
}

class DEXIntegrationService {
  private apiKeys: Map<string, string> = new Map();

  setApiKey(dex: string, apiKey: string) {
    this.apiKeys.set(dex, apiKey);
  }

  async getJupiterSwapInstructions(
    quote: SwapQuote,
    userPublicKey: string,
    slippageBps: number = 50
  ): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${DEX_CONFIGS.jupiter.apiUrl}/v6/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          slippageBps,
          wrapUnwrapSOL: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Jupiter swap API error:', errorBody);
        throw new Error(`Jupiter swap API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      
      // エラーレスポンスの確認
      if (data.error) {
        throw new Error(`Jupiter API error: ${data.error}`);
      }
      
      return {
        instructions: data.swapTransaction?.instructions || [],
        signers: data.swapTransaction?.signers || [],
        recentBlockhash: data.swapTransaction?.recentBlockhash || '',
      };
    } catch (error) {
      console.error('Jupiter swap instructions error:', error);
      if (error instanceof Error) {
        throw new Error(`Jupiter swap failed: ${error.message}`);
      }
      throw new Error('Jupiter swap failed: Unknown error');
    }
  }

  async getOrcaSwapInstructions(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    userPublicKey: string,
    slippage: number = 0.5
  ): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${DEX_CONFIGS.orca.apiUrl}/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputToken: inputToken.address,
          outputToken: outputToken.address,
          amount: amount * Math.pow(10, inputToken.decimals),
          userPublicKey,
          slippage,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Orca swap API error:', errorBody);
        throw new Error(`Orca swap API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error('Orca swap instructions error:', error);
      if (error instanceof Error) {
        throw new Error(`Orca swap failed: ${error.message}`);
      }
      throw new Error('Orca swap failed: Unknown error');
    }
  }

  async getRaydiumSwapInstructions(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    userPublicKey: string,
    slippage: number = 0.5
  ): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${DEX_CONFIGS.raydium.apiUrl}/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputToken: inputToken.address,
          outputToken: outputToken.address,
          amount: amount * Math.pow(10, inputToken.decimals),
          userPublicKey,
          slippage,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Raydium swap API error:', errorBody);
        throw new Error(`Raydium swap API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error('Raydium swap instructions error:', error);
      if (error instanceof Error) {
        throw new Error(`Raydium swap failed: ${error.message}`);
      }
      throw new Error('Raydium swap failed: Unknown error');
    }
  }

  async addLiquidity(
    dex: string,
    token0: Token,
    token1: Token,
    amount0: number,
    amount1: number,
    userPublicKey: string,
    slippage: number = 0.5
  ): Promise<SwapTransaction> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        throw new Error(`Unsupported DEX: ${dex}`);
      }

      const response = await fetch(`${config.apiUrl}/v1/liquidity/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token0: token0.address,
          token1: token1.address,
          amount0: amount0 * Math.pow(10, token0.decimals),
          amount1: amount1 * Math.pow(10, token1.decimals),
          userPublicKey,
          slippage,
        }),
      });

      if (!response.ok) {
        throw new Error(`${dex} add liquidity API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error(`${dex} add liquidity error:`, error);
      throw error;
    }
  }

  async removeLiquidity(
    dex: string,
    poolAddress: string,
    lpTokenAmount: number,
    userPublicKey: string,
    slippage: number = 0.5
  ): Promise<SwapTransaction> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        throw new Error(`Unsupported DEX: ${dex}`);
      }

      const response = await fetch(`${config.apiUrl}/v1/liquidity/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress,
          lpTokenAmount,
          userPublicKey,
          slippage,
        }),
      });

      if (!response.ok) {
        throw new Error(`${dex} remove liquidity API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error(`${dex} remove liquidity error:`, error);
      throw error;
    }
  }

  async stakeFarm(
    dex: string,
    poolId: string,
    amount: number,
    userPublicKey: string
  ): Promise<SwapTransaction> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        throw new Error(`Unsupported DEX: ${dex}`);
      }

      const response = await fetch(`${config.apiUrl}/v1/farm/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId,
          amount,
          userPublicKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`${dex} stake farm API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error(`${dex} stake farm error:`, error);
      throw error;
    }
  }

  async unstakeFarm(
    dex: string,
    poolId: string,
    amount: number,
    userPublicKey: string
  ): Promise<SwapTransaction> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        throw new Error(`Unsupported DEX: ${dex}`);
      }

      const response = await fetch(`${config.apiUrl}/v1/farm/unstake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId,
          amount,
          userPublicKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`${dex} unstake farm API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error(`${dex} unstake farm error:`, error);
      throw error;
    }
  }

  async harvestRewards(
    dex: string,
    poolId: string,
    userPublicKey: string
  ): Promise<SwapTransaction> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        throw new Error(`Unsupported DEX: ${dex}`);
      }

      const response = await fetch(`${config.apiUrl}/v1/farm/harvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId,
          userPublicKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`${dex} harvest rewards API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        instructions: data.instructions || [],
        signers: [userPublicKey],
        recentBlockhash: data.recentBlockhash || '',
      };
    } catch (error) {
      console.error(`${dex} harvest rewards error:`, error);
      throw error;
    }
  }

  async getTokenAccountInfo(
    tokenAddress: string,
    userPublicKey: string
  ): Promise<{ balance: number; exists: boolean }> {
    try {
      // Eclipse RPC call to get token account info
      const rpcUrl = process.env.REACT_APP_ECLIPSE_RPC_URL || 'https://eclipse-mainnet.rpcpool.com';
      if (!rpcUrl) {
        throw new Error('Eclipse RPC URL not configured');
      }
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            userPublicKey,
            {
              mint: tokenAddress,
            },
            {
              encoding: 'jsonParsed',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const accounts = data.result?.value || [];
      if (accounts.length === 0) {
        return { balance: 0, exists: false };
      }

      const balance = accounts[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
      return { balance, exists: true };
    } catch (error) {
      console.error('Token account info error:', error);
      // ネットワークエラーの場合は再試行可能とマーク
      if (error instanceof Error && error.message.includes('fetch')) {
        console.warn('Network error fetching token info, returning default');
      }
      return { balance: 0, exists: false };
    }
  }

  async estimateSwapFee(
    dex: string,
    inputToken: Token,
    outputToken: Token,
    amount: number
  ): Promise<number> {
    try {
      const config = DEX_CONFIGS[dex];
      if (!config) {
        return 0.005; // Default fee
      }

      // Base fee from DEX config
      const baseFee = config.fee;
      
      // Add dynamic fee estimation based on liquidity, volatility, etc.
      // Fee can vary based on token pair and amount
      const pairComplexity = inputToken.symbol === 'SOL' || outputToken.symbol === 'SOL' ? 1.0 : 1.2;
      const amountFactor = amount > 1000 ? 1.1 : 1.0;
      const dynamicFee = baseFee * 0.1 * pairComplexity * amountFactor;
      
      return baseFee + dynamicFee;
    } catch (error) {
      console.error('Fee estimation error:', error);
      return 0.005;
    }
  }

  async validateTransaction(
    transaction: SwapTransaction,
    userPublicKey: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Basic validation
      if (!transaction.instructions || transaction.instructions.length === 0) {
        return { valid: false, error: 'No instructions found' };
      }

      if (!transaction.recentBlockhash) {
        return { valid: false, error: 'No recent blockhash' };
      }

      if (!transaction.signers.includes(userPublicKey)) {
        return { valid: false, error: 'User not in signers' };
      }

      // Additional validation can be added here
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getDEXConfigs() {
    return DEX_CONFIGS;
  }

  isSupported(dex: string): boolean {
    return dex in DEX_CONFIGS && DEX_CONFIGS[dex].enabled;
  }
}

export const dexIntegrationService = new DEXIntegrationService();
export default dexIntegrationService;