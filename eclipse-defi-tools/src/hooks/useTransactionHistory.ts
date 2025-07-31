import { useState, useEffect, useCallback } from 'react';
import {
  transactionHistoryService,
  TransactionType,
  TransactionStatus,
  SortBy,
} from '../services/transactionHistoryService';
import type {
  TransactionHistoryEntry,
  TransactionFilter,
  TransactionStats,
  SortOptions,
} from '../services/transactionHistoryService';

export interface UseTransactionHistoryOptions {
  filter?: TransactionFilter;
  sort?: SortOptions;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTransactionHistoryReturn {
  transactions: TransactionHistoryEntry[];
  statistics: TransactionStats;
  loading: boolean;
  error: string | null;
  addTransaction: (
    signature: string,
    type: TransactionType,
    from: string,
    metadata?: Record<string, unknown>
  ) => Promise<TransactionHistoryEntry>;
  refresh: () => void;
  clearHistory: (olderThan?: Date) => void;
  exportToCSV: () => string;
  updateFilter: (filter: TransactionFilter) => void;
  updateSort: (sort: SortOptions) => void;
}

export const useTransactionHistory = (
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryReturn => {
  const {
    filter: initialFilter,
    sort: initialSort = { by: SortBy.TIMESTAMP, ascending: false },
    limit = 50,
    autoRefresh = true,
    refreshInterval = 5000,
  } = options;

  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([]);
  const [statistics, setStatistics] = useState<TransactionStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    averageConfirmationTime: 0,
    transactionsByType: Object.values(TransactionType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<TransactionType, number>
    ),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionFilter | undefined>(initialFilter);
  const [sort, setSort] = useState<SortOptions>(initialSort);

  // 履歴の取得
  const fetchHistory = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const history = transactionHistoryService.getHistory(filter, sort, limit);
      const stats = transactionHistoryService.getStatistics(filter);

      setTransactions(history);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  }, [filter, sort, limit]);

  // トランザクションの追加
  const addTransaction = useCallback(
    async (
      signature: string,
      type: TransactionType,
      from: string,
      metadata?: Record<string, unknown>
    ): Promise<TransactionHistoryEntry> => {
      try {
        const entry = await transactionHistoryService.addTransaction(
          signature,
          type,
          from,
          metadata
        );
        
        // 即座に履歴を更新
        fetchHistory();
        
        return entry;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchHistory]
  );

  // 履歴のクリア
  const clearHistory = useCallback(
    (olderThan?: Date) => {
      const clearedCount = transactionHistoryService.clearHistory(olderThan);
      console.log(`Cleared ${clearedCount} transactions`);
      fetchHistory();
    },
    [fetchHistory]
  );

  // CSVエクスポート
  const exportToCSV = useCallback(() => {
    return transactionHistoryService.exportToCSV(filter);
  }, [filter]);

  // フィルターの更新
  const updateFilter = useCallback((newFilter: TransactionFilter) => {
    setFilter(newFilter);
  }, []);

  // ソートの更新
  const updateSort = useCallback((newSort: SortOptions) => {
    setSort(newSort);
  }, []);

  // リフレッシュ
  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 初期ロードとリスナー設定
  useEffect(() => {
    fetchHistory();

    // トランザクション更新リスナー
    const unsubscribe = transactionHistoryService.addListener(() => {
      // トランザクションが更新されたら履歴を再取得
      fetchHistory();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchHistory]);

  // 自動リフレッシュ
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchHistory]);

  // フィルター・ソート変更時の再取得
  useEffect(() => {
    fetchHistory();
  }, [filter, sort, fetchHistory]);

  return {
    transactions,
    statistics,
    loading,
    error,
    addTransaction,
    refresh,
    clearHistory,
    exportToCSV,
    updateFilter,
    updateSort,
  };
};

// 便利なフィルタープリセット
export const transactionFilterPresets = {
  all: {} as TransactionFilter,
  
  pending: {
    status: [TransactionStatus.PENDING],
  } as TransactionFilter,
  
  successful: {
    status: [TransactionStatus.CONFIRMED],
  } as TransactionFilter,
  
  failed: {
    status: [TransactionStatus.FAILED, TransactionStatus.EXPIRED],
  } as TransactionFilter,
  
  swaps: {
    type: [TransactionType.SWAP],
  } as TransactionFilter,
  
  transfers: {
    type: [TransactionType.TRANSFER],
  } as TransactionFilter,
  
  liquidity: {
    type: [TransactionType.LIQUIDITY_ADD, TransactionType.LIQUIDITY_REMOVE],
  } as TransactionFilter,
  
  today: {
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
  } as TransactionFilter,
  
  lastWeek: {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  } as TransactionFilter,
  
  lastMonth: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  } as TransactionFilter,
};

export default useTransactionHistory;