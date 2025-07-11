import { useState, useCallback } from 'react';
import type { Token, SwapQuote } from '../types';
import { dexService } from '../services/dexService';

export interface UseSwapQuotesReturn {
  quotes: SwapQuote[];
  bestQuote: SwapQuote | null;
  loading: boolean;
  error: string | null;
  fetchQuotes: (inputToken: Token, outputToken: Token, amount: number, slippageBps?: number) => Promise<void>;
  clearQuotes: () => void;
}

export const useSwapQuotes = (): UseSwapQuotesReturn => {
  const [quotes, setQuotes] = useState<SwapQuote[]>([]);
  const [bestQuote, setBestQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    amount: number,
    slippageBps: number = 50
  ) => {
    if (amount <= 0) {
      setQuotes([]);
      setBestQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allQuotes = await dexService.getAllQuotes(inputToken, outputToken, amount, slippageBps);
      const best = dexService.getBestQuote(allQuotes);
      
      setQuotes(allQuotes);
      setBestQuote(best);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
      setQuotes([]);
      setBestQuote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearQuotes = useCallback(() => {
    setQuotes([]);
    setBestQuote(null);
    setError(null);
  }, []);

  return {
    quotes,
    bestQuote,
    loading,
    error,
    fetchQuotes,
    clearQuotes,
  };
};