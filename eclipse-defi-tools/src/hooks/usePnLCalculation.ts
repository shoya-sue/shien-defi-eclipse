import { useState, useEffect, useCallback } from 'react';
import type { Transaction, PnLData } from '../types';
import { transactionService, type PnLCalculationMethod, type TransactionFilter } from '../services/transactionService';
import { priceService } from '../services/priceService';

export interface UsePnLCalculationReturn {
  transactions: Transaction[];
  pnlData: PnLData | null;
  loading: boolean;
  error: string | null;
  fetchTransactions: (userAddress: string, filter?: TransactionFilter) => Promise<void>;
  calculatePnL: (method?: PnLCalculationMethod) => Promise<void>;
  exportData: (format: 'csv' | 'json') => Promise<string>;
  generateTaxReport: (taxYear: number, country?: string) => any;
}

export const usePnLCalculation = (): UsePnLCalculationReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (
    userAddress: string,
    filter?: TransactionFilter
  ) => {
    setLoading(true);
    setError(null);

    try {
      const txHistory = await transactionService.getTransactionHistory(userAddress, filter);
      setTransactions(txHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculatePnL = useCallback(async (
    method: PnLCalculationMethod = {
      method: 'FIFO',
      includeFees: true,
      includeUnrealized: true,
    }
  ) => {
    if (transactions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // 現在価格を取得
      const uniqueTokens = Array.from(
        new Set(transactions.flatMap(tx => tx.tokens.map(t => t.token)))
      );
      
      const currentPrices = new Map<string, number>();
      
      // 各トークンの現在価格を取得
      await Promise.all(
        uniqueTokens.map(async token => {
          const priceData = await priceService.getTokenPrice(token);
          if (priceData) {
            currentPrices.set(token.address, priceData.price);
          }
        })
      );

      const pnl = transactionService.calculatePnL(transactions, currentPrices, method);
      setPnlData(pnl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate PnL');
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  const exportData = useCallback(async (format: 'csv' | 'json'): Promise<string> => {
    return transactionService.exportTransactions(transactions, format);
  }, [transactions]);

  const generateTaxReport = useCallback((taxYear: number, country: string = 'US') => {
    return transactionService.generateTaxReport(transactions, taxYear, country);
  }, [transactions]);

  // 自動的にPnLを計算
  useEffect(() => {
    if (transactions.length > 0) {
      calculatePnL();
    }
  }, [transactions, calculatePnL]);

  return {
    transactions,
    pnlData,
    loading,
    error,
    fetchTransactions,
    calculatePnL,
    exportData,
    generateTaxReport,
  };
};

export interface UseTransactionFilterReturn {
  filter: TransactionFilter;
  setFilter: (filter: TransactionFilter) => void;
  applyFilter: (transactions: Transaction[]) => Transaction[];
  clearFilter: () => void;
}

export const useTransactionFilter = (): UseTransactionFilterReturn => {
  const [filter, setFilter] = useState<TransactionFilter>({});

  const applyFilter = useCallback((transactions: Transaction[]): Transaction[] => {
    return transactionService.filterTransactions(transactions, filter);
  }, [filter]);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  return {
    filter,
    setFilter,
    applyFilter,
    clearFilter,
  };
};