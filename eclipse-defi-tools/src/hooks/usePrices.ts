import { useState, useEffect, useCallback } from 'react';
import type { Token, PriceData } from '../types';
import { priceService } from '../services/priceService';
import { performanceService } from '../services/performanceService';
import { priceCache } from '../services/cacheService';

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

    // キャッシュキーの生成
    const cacheKey = `prices_${tokens.map(t => t.address).sort().join('_')}`;
    
    // キャッシュから取得を試行
    const cached = priceCache.get<PriceData[]>(cacheKey);
    if (cached) {
      setPrices(cached);
      performanceService.recordCacheHit();
      return;
    }
    
    performanceService.recordCacheMiss();
    setLoading(true);
    setError(null);

    try {
      const priceData = await performanceService.measureAsync(
        'fetch_prices',
        () => priceService.getMultipleTokenPrices(tokens),
        { tokenCount: tokens.length }
      );
      
      setPrices(priceData);
      priceCache.set(cacheKey, priceData, 60 * 1000); // 1分間キャッシュ
      setError(null); // 成功時はエラーをクリア
    } catch (err) {
      console.error('Price fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(`価格データの取得に失敗しました: ${errorMessage}`);
      // エラー時は空配列ではなく既存のデータを保持
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