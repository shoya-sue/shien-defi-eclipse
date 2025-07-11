import { useState, useEffect, useCallback } from 'react';
import type { FarmingPool, UserFarmingPosition } from '../services/farmingService';
import { farmingService } from '../services/farmingService';

export interface UseYieldPositionsReturn {
  positions: UserFarmingPosition[];
  pools: FarmingPool[];
  portfolioStats: {
    totalStaked: number;
    totalPendingRewards: number;
    totalRewards: number;
    averageAPY: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
  harvestRewards: (positionId: string) => Promise<boolean>;
  stakeToFarm: (poolId: string, amount: number) => Promise<boolean>;
  unstakeFromFarm: (positionId: string, amount: number) => Promise<boolean>;
}

export const useYieldPositions = (userAddress?: string): UseYieldPositionsReturn => {
  const [positions, setPositions] = useState<UserFarmingPosition[]>([]);
  const [pools, setPools] = useState<FarmingPool[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalStaked: 0,
    totalPendingRewards: 0,
    totalRewards: 0,
    averageAPY: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [poolsData, positionsData] = await Promise.all([
        farmingService.getFarmingPools(),
        userAddress ? farmingService.getUserFarmingPositions(userAddress) : Promise.resolve([])
      ]);

      setPools(poolsData);
      setPositions(positionsData);
      
      const stats = farmingService.calculateTotalPortfolioValue(positionsData);
      setPortfolioStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch farming data');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const harvestRewards = useCallback(async (positionId: string): Promise<boolean> => {
    try {
      const success = await farmingService.harvestRewards(positionId);
      if (success) {
        // リフレッシュしてデータを更新
        await fetchData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to harvest rewards');
      return false;
    }
  }, [fetchData]);

  const stakeToFarm = useCallback(async (poolId: string, amount: number): Promise<boolean> => {
    try {
      const success = await farmingService.stakeToFarm(poolId, amount);
      if (success) {
        await fetchData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stake');
      return false;
    }
  }, [fetchData]);

  const unstakeFromFarm = useCallback(async (positionId: string, amount: number): Promise<boolean> => {
    try {
      const success = await farmingService.unstakeFromFarm(positionId, amount);
      if (success) {
        await fetchData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake');
      return false;
    }
  }, [fetchData]);

  return {
    positions,
    pools,
    portfolioStats,
    loading,
    error,
    refetch: fetchData,
    harvestRewards,
    stakeToFarm,
    unstakeFromFarm,
  };
};

export interface UseFarmingPoolsReturn {
  pools: FarmingPool[];
  topPools: FarmingPool[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFarmingPools = (dex?: string): UseFarmingPoolsReturn => {
  const [pools, setPools] = useState<FarmingPool[]>([]);
  const [topPools, setTopPools] = useState<FarmingPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const poolsData = await farmingService.getFarmingPools(dex);
      const topPoolsData = farmingService.getTopFarmsByAPY(poolsData, 5);
      
      setPools(poolsData);
      setTopPools(topPoolsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  }, [dex]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return {
    pools,
    topPools,
    loading,
    error,
    refetch: fetchPools,
  };
};