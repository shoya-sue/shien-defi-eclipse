import type { Token, PoolData, ImpermanentLossData } from '../types';
import { DEX_CONFIGS, CACHE_DURATION } from '../constants';
import { calculateAPY, calculateImpermanentLoss } from '../utils';

export interface PoolInfo {
  poolId: string;
  token0: Token;
  token1: Token;
  reserves: [number, number];
  fee: number;
  volume24h: number;
  liquidity: number;
  apy: number;
  dex: string;
}

export interface LiquidityPosition {
  poolId: string;
  token0Amount: number;
  token1Amount: number;
  token0Price: number;
  token1Price: number;
  totalValue: number;
  share: number;
}

class PoolService {
  private cache = new Map<string, { data: PoolData; timestamp: number }>();

  async getPoolData(token0: Token, token1: Token, dex: string): Promise<PoolData | null> {
    const cacheKey = `pool_${token0.address}_${token1.address}_${dex}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.pool) {
      return cached.data;
    }

    try {
      // 仮想的なAPI呼び出し
      const response = await fetch(
        `${DEX_CONFIGS[dex.toLowerCase()]?.apiUrl}/pools/${token0.address}/${token1.address}`
      );

      if (!response.ok) {
        throw new Error(`Pool API error: ${response.status}`);
      }

      const data = await response.json();
      
      const poolData: PoolData = {
        poolId: data.poolId || `${token0.address}-${token1.address}`,
        token0,
        token1,
        reserves: [data.reserves0 || 1000000, data.reserves1 || 2000000],
        fee: data.fee || DEX_CONFIGS[dex.toLowerCase()]?.fee || 0.003,
        apy: data.apy || this.calculatePoolAPY(data.volume24h || 500000, data.liquidity || 3000000, data.fee || 0.003),
        volume24h: data.volume24h || 500000,
        liquidity: data.liquidity || 3000000,
        priceRange: data.priceRange,
      };

      this.cache.set(cacheKey, { data: poolData, timestamp: Date.now() });
      return poolData;
    } catch (error) {
      console.error('Pool data fetch error:', error);
      
      // フォールバック データを返す
      return {
        poolId: `${token0.address}-${token1.address}`,
        token0,
        token1,
        reserves: [1000000, 2000000],
        fee: 0.003,
        apy: 15.5,
        volume24h: 500000,
        liquidity: 3000000,
      };
    }
  }

  async getAllPoolsForPair(token0: Token, token1: Token): Promise<PoolData[]> {
    const dexes = ['jupiter', 'orca', 'raydium'];
    const promises = dexes.map(dex => this.getPoolData(token0, token1, dex));
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<PoolData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  calculatePoolAPY(volume24h: number, liquidity: number, feeRate: number): number {
    if (liquidity === 0) return 0;
    
    const dailyFees = volume24h * feeRate;
    const dailyYield = dailyFees / liquidity;
    const apy = calculateAPY(dailyYield, 365, 1) * 100;
    
    return Math.max(0, Math.min(apy, 1000)); // 0-1000%の範囲に制限
  }

  calculateImpermanentLoss(
    token0InitialPrice: number,
    token1InitialPrice: number,
    token0CurrentPrice: number,
    token1CurrentPrice: number,
    initialAmount0: number,
    initialAmount1: number
  ): ImpermanentLossData {
    const initialRatio = token0InitialPrice / token1InitialPrice;
    const currentRatio = token0CurrentPrice / token1CurrentPrice;
    const priceRatio = currentRatio / initialRatio;
    
    const impermanentLoss = calculateImpermanentLoss(priceRatio);
    
    // 手数料収入の計算（仮想的）
    const initialValue = initialAmount0 * token0InitialPrice + initialAmount1 * token1InitialPrice;
    const feesEarned = initialValue * 0.05; // 5%の手数料収入を仮定
    
    const netResult = impermanentLoss + feesEarned;
    
    return {
      priceRatio,
      impermanentLoss,
      feesEarned,
      netResult,
    };
  }

  calculateOptimalLiquidityAmount(
    token0Price: number,
    token1Price: number,
    token0Amount: number,
    token1Amount: number,
    targetRatio: number = 0.5
  ): { optimalAmount0: number; optimalAmount1: number } {
    const token0Value = token0Amount * token0Price;
    const token1Value = token1Amount * token1Price;
    const totalValue = token0Value + token1Value;
    
    const targetValue0 = totalValue * targetRatio;
    const targetValue1 = totalValue * (1 - targetRatio);
    
    return {
      optimalAmount0: targetValue0 / token0Price,
      optimalAmount1: targetValue1 / token1Price,
    };
  }

  calculatePositionValue(
    position: LiquidityPosition,
    currentPrice0: number,
    currentPrice1: number
  ): number {
    return position.token0Amount * currentPrice0 + position.token1Amount * currentPrice1;
  }

  estimateRewards(
    poolData: PoolData,
    liquidityAmount: number,
    timeInDays: number
  ): { feeRewards: number; tokenRewards: number; totalRewards: number } {
    const poolShare = liquidityAmount / poolData.liquidity;
    const dailyVolume = poolData.volume24h;
    const dailyFees = dailyVolume * poolData.fee;
    const dailyFeeRewards = dailyFees * poolShare;
    
    const feeRewards = dailyFeeRewards * timeInDays;
    const tokenRewards = liquidityAmount * (poolData.apy / 100) * (timeInDays / 365);
    
    return {
      feeRewards,
      tokenRewards,
      totalRewards: feeRewards + tokenRewards,
    };
  }

  getBestPool(pools: PoolData[]): PoolData | null {
    if (pools.length === 0) return null;
    
    return pools.reduce((best, current) => {
      // APY、流動性、ボリュームを考慮してベストプールを選択
      const bestScore = best.apy * 0.5 + (best.liquidity / 1000000) * 0.3 + (best.volume24h / 1000000) * 0.2;
      const currentScore = current.apy * 0.5 + (current.liquidity / 1000000) * 0.3 + (current.volume24h / 1000000) * 0.2;
      
      return currentScore > bestScore ? current : best;
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const poolService = new PoolService();
export default poolService;