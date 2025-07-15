import { useState, useEffect, useCallback, useRef } from 'react';
import { orcaApiService, type OrcaPool } from '../services/orcaApiService';
import type { Token, SwapQuote, PoolData } from '../types';
import { getErrorMessage } from '../utils';

export interface UseOrcaApiResult {
  // プール関連
  pools: PoolData[];
  poolsLoading: boolean;
  poolsError: string | null;

  // クォート関連
  quotes: SwapQuote[];
  quotesLoading: boolean;
  quotesError: string | null;

  // API状態
  isHealthy: boolean;
  lastHealthCheck: number;

  // メソッド
  getSwapQuote: (inputToken: Token, outputToken: Token, amount: number, slippage?: number) => Promise<SwapQuote[]>;
  getLiquidityPools: (tokenA?: Token, tokenB?: Token) => Promise<PoolData[]>;
  refreshPools: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
  clearQuotes: () => void;
}

export const useOrcaApi = (): UseOrcaApiResult => {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [poolsError, setPoolsError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<SwapQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const [isHealthy, setIsHealthy] = useState(true);
  const [lastHealthCheck, setLastHealthCheck] = useState(0);

  // リクエストのデバウンス用
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // プール一覧を取得
  const fetchPools = useCallback(async () => {
    setPoolsLoading(true);
    setPoolsError(null);

    try {
      const fetchedPools = await orcaApiService.getPools();
      const poolData = fetchedPools.map(pool => orcaApiService.orcaPoolToPoolData(pool));
      setPools(poolData);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setPoolsError(errorMessage);
      console.error('Failed to fetch Orca pools:', errorMessage);
    } finally {
      setPoolsLoading(false);
    }
  }, []);

  // 流動性プールを取得
  const getLiquidityPools = useCallback(async (
    tokenA?: Token,
    tokenB?: Token
  ): Promise<PoolData[]> => {
    try {
      const poolData = await orcaApiService.getLiquidityPools(
        tokenA?.address,
        tokenB?.address
      );
      return poolData;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to get Orca liquidity pools:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // ヘルスチェック
  const performHealthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const healthy = await orcaApiService.healthCheck();
      setIsHealthy(healthy);
      setLastHealthCheck(Date.now());
      return healthy;
    } catch (error) {
      setIsHealthy(false);
      setLastHealthCheck(Date.now());
      console.error('Orca API health check failed:', getErrorMessage(error));
      return false;
    }
  }, []);

  // スワップクォート取得（デバウンス付き）
  const getSwapQuote = useCallback(async (
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

          const orcaQuote = await orcaApiService.getSwapQuote(
            inputToken.address,
            outputToken.address,
            inputAmountLamports,
            slippage
          );

          // OrcaQuoteResponseをSwapQuoteに変換
          const swapQuote = orcaApiService.orcaQuoteToSwapQuote(
            orcaQuote,
            inputToken,
            outputToken
          );

          setQuotes([swapQuote]);
          resolve([swapQuote]);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // リクエストがキャンセルされた場合は無視
            return;
          }

          const errorMessage = getErrorMessage(error);
          setQuotesError(errorMessage);
          console.error('Failed to get Orca quote:', errorMessage);
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
  const refreshPools = useCallback(async () => {
    await fetchPools();
  }, [fetchPools]);

  // 初期化時にプール一覧とヘルスチェックを実行
  useEffect(() => {
    fetchPools();
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
  }, [fetchPools, performHealthCheck]);

  return {
    // 状態
    pools,
    poolsLoading,
    poolsError,
    quotes,
    quotesLoading,
    quotesError,
    isHealthy,
    lastHealthCheck,

    // メソッド
    getSwapQuote,
    getLiquidityPools,
    refreshPools,
    healthCheck: performHealthCheck,
    clearQuotes,
  };
};

// Orca API のプール分析用カスタムフック
export const useOrcaPoolAnalysis = () => {
  const [analysis, setAnalysis] = useState<{
    topByApy: OrcaPool[];
    topByVolume: OrcaPool[];
    topByLiquidity: OrcaPool[];
    averageApy: number;
    totalLiquidity: number;
  } | null>(null);

  const [priceImpactAnalysis, setPriceImpactAnalysis] = useState<{
    amount: number;
    priceImpact: number;
    outputAmount: number;
  }[] | null>(null);

  const analyzePoolPerformance = useCallback(async () => {
    try {
      const pools = await orcaApiService.getPools();
      const analysisResult = orcaApiService.analyzePoolPerformance(pools);
      setAnalysis(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Failed to analyze pool performance:', getErrorMessage(error));
      throw error;
    }
  }, []);

  const analyzePriceImpact = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    amounts: number[]
  ) => {
    try {
      const lamportAmounts = amounts.map(amount => amount * Math.pow(10, inputToken.decimals));
      const analysisResult = await orcaApiService.analyzePriceImpact(
        inputToken.address,
        outputToken.address,
        lamportAmounts
      );
      setPriceImpactAnalysis(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Failed to analyze price impact:', getErrorMessage(error));
      throw error;
    }
  }, []);

  return {
    analysis,
    priceImpactAnalysis,
    analyzePoolPerformance,
    analyzePriceImpact,
  };
};

export default useOrcaApi;