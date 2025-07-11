import { useState, useEffect, useCallback } from 'react';
import type { Token, PriceData } from '../types';
import { priceService } from '../services/priceService';

export interface UsePricesReturn {
  prices: PriceData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePrices = (tokens: Token[]): UsePricesReturn => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (tokens.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const priceData = await priceService.getMultipleTokenPrices(tokens);
      setPrices(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (tokens.length === 0) return;

    const unsubscribe = priceService.subscribe((updatedPrices) => {
      setPrices(updatedPrices);
    });

    const intervalId = priceService.startPriceUpdates(tokens);

    return () => {
      unsubscribe();
      priceService.stopPriceUpdates(intervalId);
    };
  }, [tokens]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
};

export const useTokenPrice = (token: Token): PriceData | null => {
  const [price, setPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      const priceData = await priceService.getTokenPrice(token);
      setPrice(priceData);
    };

    fetchPrice();
  }, [token]);

  return price;
};