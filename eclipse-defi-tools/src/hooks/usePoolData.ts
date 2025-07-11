import { useState, useCallback } from 'react';
import type { Token, PoolData, ImpermanentLossData } from '../types';
import { poolService } from '../services/poolService';

export interface UsePoolDataReturn {
  pools: PoolData[];
  bestPool: PoolData | null;
  loading: boolean;
  error: string | null;
  fetchPools: (token0: Token, token1: Token) => Promise<void>;
  clearPools: () => void;
}

export const usePoolData = (): UsePoolDataReturn => {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [bestPool, setBestPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async (token0: Token, token1: Token) => {
    setLoading(true);
    setError(null);

    try {
      const allPools = await poolService.getAllPoolsForPair(token0, token1);
      const best = poolService.getBestPool(allPools);
      
      setPools(allPools);
      setBestPool(best);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pool data');
      setPools([]);
      setBestPool(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPools = useCallback(() => {
    setPools([]);
    setBestPool(null);
    setError(null);
  }, []);

  return {
    pools,
    bestPool,
    loading,
    error,
    fetchPools,
    clearPools,
  };
};

export interface UseImpermanentLossReturn {
  impermanentLoss: ImpermanentLossData | null;
  calculateIL: (
    token0InitialPrice: number,
    token1InitialPrice: number,
    token0CurrentPrice: number,
    token1CurrentPrice: number,
    initialAmount0: number,
    initialAmount1: number
  ) => void;
}

export const useImpermanentLoss = (): UseImpermanentLossReturn => {
  const [impermanentLoss, setImpermanentLoss] = useState<ImpermanentLossData | null>(null);

  const calculateIL = useCallback((
    token0InitialPrice: number,
    token1InitialPrice: number,
    token0CurrentPrice: number,
    token1CurrentPrice: number,
    initialAmount0: number,
    initialAmount1: number
  ) => {
    const result = poolService.calculateImpermanentLoss(
      token0InitialPrice,
      token1InitialPrice,
      token0CurrentPrice,
      token1CurrentPrice,
      initialAmount0,
      initialAmount1
    );
    setImpermanentLoss(result);
  }, []);

  return {
    impermanentLoss,
    calculateIL,
  };
};