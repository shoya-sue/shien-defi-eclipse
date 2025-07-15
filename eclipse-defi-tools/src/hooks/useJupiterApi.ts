import { useState, useEffect, useCallback, useRef } from 'react';
import { jupiterApiService, type JupiterRoute, type JupiterToken } from '../services/jupiterApiService';
import type { Token, SwapQuote } from '../types';
import { getErrorMessage } from '../utils';

export interface UseJupiterApiResult {
  // トークン関連
  tokens: JupiterToken[];
  tokensLoading: boolean;
  tokensError: string | null;

  // クォート関連
  quotes: SwapQuote[];
  quotesLoading: boolean;
  quotesError: string | null;

  // API状態
  isHealthy: boolean;
  lastHealthCheck: number;

  // メソッド
  getQuote: (inputToken: Token, outputToken: Token, amount: number, slippage?: number) => Promise<SwapQuote[]>;
  refreshTokens: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
  clearQuotes: () => void;
}

export const useJupiterApi = (): UseJupiterApiResult => {
  const [tokens, setTokens] = useState<JupiterToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<SwapQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const [isHealthy, setIsHealthy] = useState(true);
  const [lastHealthCheck, setLastHealthCheck] = useState(0);

  // リクエストのデバウンス用
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // トークン一覧を取得
  const fetchTokens = useCallback(async () => {
    setTokensLoading(true);
    setTokensError(null);

    try {
      const fetchedTokens = await jupiterApiService.getTokens();
      setTokens(fetchedTokens);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setTokensError(errorMessage);
      console.error('Failed to fetch Jupiter tokens:', errorMessage);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  // ヘルスチェック
  const performHealthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const healthy = await jupiterApiService.healthCheck();
      setIsHealthy(healthy);
      setLastHealthCheck(Date.now());
      return healthy;
    } catch (error) {
      setIsHealthy(false);
      setLastHealthCheck(Date.now());
      console.error('Jupiter API health check failed:', getErrorMessage(error));
      return false;
    }
  }, []);

  // クォート取得（デバウンス付き）
  const getQuote = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    amount: number,
    slippage: number = 50 // 0.5% default
  ): Promise<SwapQuote[]> => {
    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      quoteTimeoutRef.current = setTimeout(async () => {
        setQuotesLoading(true);
        setQuotesError(null);

        try {
          abortControllerRef.current = new AbortController();

          // 入力金額を正しい単位に変換
          const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);

          const routes = await jupiterApiService.getQuote(
            inputToken.address,
            outputToken.address,
            inputAmountLamports,
            slippage
          );

          if (routes.length === 0) {
            throw new Error('No routes found for this token pair');
          }

          // JupiterRouteをSwapQuoteに変換
          const swapQuotes = routes.map(route =>
            jupiterApiService.jupiterRouteToSwapQuote(route, inputToken, outputToken)
          );

          setQuotes(swapQuotes);
          resolve(swapQuotes);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // リクエストがキャンセルされた場合は無視
            return;
          }

          const errorMessage = getErrorMessage(error);
          setQuotesError(errorMessage);
          console.error('Failed to get Jupiter quote:', errorMessage);
          reject(new Error(errorMessage));
        } finally {
          setQuotesLoading(false);
        }
      }, 300); // 300msのデバウンス
    });
  }, []);

  // クォートをクリア
  const clearQuotes = useCallback(() => {
    setQuotes([]);
    setQuotesError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }
  }, []);

  // リフレッシュメソッド
  const refreshTokens = useCallback(async () => {
    await fetchTokens();
  }, [fetchTokens]);

  // 初期化時にトークン一覧とヘルスチェックを実行
  useEffect(() => {
    fetchTokens();
    performHealthCheck();

    // 定期的なヘルスチェック（5分ごと）
    const healthCheckInterval = setInterval(performHealthCheck, 5 * 60 * 1000);

    return () => {
      clearInterval(healthCheckInterval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, [fetchTokens, performHealthCheck]);

  return {
    // 状態
    tokens,
    tokensLoading,
    tokensError,
    quotes,
    quotesLoading,
    quotesError,
    isHealthy,
    lastHealthCheck,

    // メソッド
    getQuote,
    refreshTokens,
    healthCheck: performHealthCheck,
    clearQuotes,
  };
};

// Jupiter API の状態管理用カスタムフック
export const useJupiterQuoteComparison = () => {
  const [comparisons, setComparisons] = useState<{
    routes: JupiterRoute[];
    analysis: ReturnType<typeof jupiterApiService.compareRoutes>;
  } | null>(null);

  const compareRoutes = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    amount: number
  ) => {
    try {
      const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);
      const routes = await jupiterApiService.getQuote(
        inputToken.address,
        outputToken.address,
        inputAmountLamports
      );

      const analysis = jupiterApiService.compareRoutes(routes);
      
      setComparisons({
        routes,
        analysis,
      });

      return analysis;
    } catch (error) {
      console.error('Failed to compare routes:', getErrorMessage(error));
      throw error;
    }
  }, []);

  return {
    comparisons,
    compareRoutes,
  };
};

export default useJupiterApi;