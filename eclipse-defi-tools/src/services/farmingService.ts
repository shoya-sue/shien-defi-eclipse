import type { Token } from '../types';
import { CACHE_DURATION } from '../constants';

export interface FarmingPool {
  poolId: string;
  name: string;
  token0: Token;
  token1: Token;
  rewardTokens: Token[];
  apy: number;
  totalStaked: number;
  totalRewards: number;
  endTime?: number;
  dex: string;
  isActive: boolean;
  multiplier: number;
}

export interface UserFarmingPosition {
  positionId: string;
  poolId: string;
  userAddress: string;
  stakedAmount: number;
  rewardTokens: Token[];
  pendingRewards: number[];
  startTime: number;
  lastHarvest: number;
  totalRewards: number;
  apy: number;
  pool: FarmingPool;
}

class FarmingService {
  private cache = new Map<string, { data: FarmingPool[]; timestamp: number }>();
  private positionsCache = new Map<string, { data: UserFarmingPosition[]; timestamp: number }>();

  async getFarmingPools(dex?: string): Promise<FarmingPool[]> {
    const cacheKey = `farming_pools_${dex || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.pool) {
      return cached.data;
    }

    try {
      // 仮想的なAPI呼び出し
      const pools = await this.fetchFarmingPoolsFromAPI(dex);
      this.cache.set(cacheKey, { data: pools, timestamp: Date.now() });
      return pools;
    } catch (error) {
      console.error('Farming pools fetch error:', error);
      return this.getMockFarmingPools();
    }
  }

  private async fetchFarmingPoolsFromAPI(dex?: string): Promise<FarmingPool[]> {
    // 実際のAPIエンドポイントに置き換える
    const response = await fetch(`/api/farming/pools${dex ? `?dex=${dex}` : ''}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  private getMockFarmingPools(): FarmingPool[] {
    const mockTokens = [
      { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, chainId: 100 },
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 100 },
      { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 100 },
      { address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', name: 'Orca', decimals: 6, chainId: 100 },
      { address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RAY', name: 'Raydium', decimals: 6, chainId: 100 },
    ];

    return [
      {
        poolId: 'sol-usdc-farm',
        name: 'SOL-USDC Farm',
        token0: mockTokens[0],
        token1: mockTokens[1],
        rewardTokens: [mockTokens[3]], // ORCA
        apy: 45.2,
        totalStaked: 2500000,
        totalRewards: 125000,
        dex: 'orca',
        isActive: true,
        multiplier: 1.5,
      },
      {
        poolId: 'sol-usdt-farm',
        name: 'SOL-USDT Farm',
        token0: mockTokens[0],
        token1: mockTokens[2],
        rewardTokens: [mockTokens[4]], // RAY
        apy: 38.7,
        totalStaked: 1800000,
        totalRewards: 95000,
        dex: 'raydium',
        isActive: true,
        multiplier: 1.2,
      },
      {
        poolId: 'usdc-usdt-farm',
        name: 'USDC-USDT Farm',
        token0: mockTokens[1],
        token1: mockTokens[2],
        rewardTokens: [mockTokens[3], mockTokens[4]], // ORCA + RAY
        apy: 25.3,
        totalStaked: 5000000,
        totalRewards: 200000,
        dex: 'jupiter',
        isActive: true,
        multiplier: 1.0,
      },
    ];
  }

  async getUserFarmingPositions(userAddress: string): Promise<UserFarmingPosition[]> {
    const cacheKey = `user_positions_${userAddress}`;
    const cached = this.positionsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.position) {
      return cached.data;
    }

    try {
      const positions = await this.fetchUserPositionsFromAPI(userAddress);
      this.positionsCache.set(cacheKey, { data: positions, timestamp: Date.now() });
      return positions;
    } catch (error) {
      console.error('User positions fetch error:', error);
      return this.getMockUserPositions(userAddress);
    }
  }

  private async fetchUserPositionsFromAPI(userAddress: string): Promise<UserFarmingPosition[]> {
    const response = await fetch(`/api/farming/positions/${userAddress}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  private getMockUserPositions(userAddress: string): UserFarmingPosition[] {
    const pools = this.getMockFarmingPools();
    
    return [
      {
        positionId: `${userAddress}-1`,
        poolId: 'sol-usdc-farm',
        userAddress,
        stakedAmount: 10000,
        rewardTokens: pools[0].rewardTokens,
        pendingRewards: [125.5],
        startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30日前
        lastHarvest: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7日前
        totalRewards: 850.75,
        apy: 45.2,
        pool: pools[0],
      },
      {
        positionId: `${userAddress}-2`,
        poolId: 'usdc-usdt-farm',
        userAddress,
        stakedAmount: 5000,
        rewardTokens: pools[2].rewardTokens,
        pendingRewards: [45.2, 32.1],
        startTime: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14日前
        lastHarvest: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3日前
        totalRewards: 245.3,
        apy: 25.3,
        pool: pools[2],
      },
    ];
  }

  calculateTotalPortfolioValue(positions: UserFarmingPosition[]): {
    totalStaked: number;
    totalPendingRewards: number;
    totalRewards: number;
    averageAPY: number;
  } {
    if (positions.length === 0) {
      return { totalStaked: 0, totalPendingRewards: 0, totalRewards: 0, averageAPY: 0 };
    }

    const totalStaked = positions.reduce((sum, pos) => sum + pos.stakedAmount, 0);
    const totalPendingRewards = positions.reduce((sum, pos) => 
      sum + pos.pendingRewards.reduce((rewardSum, reward) => rewardSum + reward, 0), 0
    );
    const totalRewards = positions.reduce((sum, pos) => sum + pos.totalRewards, 0);
    
    // 加重平均APY
    const weightedAPY = positions.reduce((sum, pos) => 
      sum + (pos.apy * pos.stakedAmount), 0
    );
    const averageAPY = totalStaked > 0 ? weightedAPY / totalStaked : 0;

    return {
      totalStaked,
      totalPendingRewards,
      totalRewards,
      averageAPY,
    };
  }

  calculatePositionPerformance(position: UserFarmingPosition): {
    daysActive: number;
    dailyRewards: number;
    projectedYearlyRewards: number;
    actualAPY: number;
  } {
    const now = Date.now();
    const daysActive = Math.max(1, Math.floor((now - position.startTime) / (24 * 60 * 60 * 1000)));
    const dailyRewards = position.totalRewards / daysActive;
    const projectedYearlyRewards = dailyRewards * 365;
    const actualAPY = position.stakedAmount > 0 ? (projectedYearlyRewards / position.stakedAmount) * 100 : 0;

    return {
      daysActive,
      dailyRewards,
      projectedYearlyRewards,
      actualAPY,
    };
  }

  async harvestRewards(positionId: string): Promise<boolean> {
    try {
      // 実際のハーベスト処理
      console.log(`Harvesting rewards for position ${positionId}`);
      // API呼び出しまたはブロックチェーン取引
      return true;
    } catch (error) {
      console.error('Harvest error:', error);
      return false;
    }
  }

  async stakeToFarm(poolId: string, amount: number): Promise<boolean> {
    try {
      // 実際のステーキング処理
      console.log(`Staking ${amount} to pool ${poolId}`);
      return true;
    } catch (error) {
      console.error('Stake error:', error);
      return false;
    }
  }

  async unstakeFromFarm(positionId: string, amount: number): Promise<boolean> {
    try {
      // 実際のアンステーキング処理
      console.log(`Unstaking ${amount} from position ${positionId}`);
      return true;
    } catch (error) {
      console.error('Unstake error:', error);
      return false;
    }
  }

  getTopFarmsByAPY(pools: FarmingPool[], limit: number = 5): FarmingPool[] {
    return pools
      .filter(pool => pool.isActive)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, limit);
  }

  clearCache() {
    this.cache.clear();
    this.positionsCache.clear();
  }
}

export const farmingService = new FarmingService();
export default farmingService;