import { eclipseRpcService } from './eclipseRpcService';
import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { performanceService } from './performanceService';
import { getErrorMessage } from '../utils';

// トランザクションの種類
export const TransactionType = {
  SWAP: 'SWAP',
  TRANSFER: 'TRANSFER',
  STAKE: 'STAKE',
  UNSTAKE: 'UNSTAKE',
  LIQUIDITY_ADD: 'LIQUIDITY_ADD',
  LIQUIDITY_REMOVE: 'LIQUIDITY_REMOVE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

// トランザクションステータス
export const TransactionStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

// トランザクション履歴エントリ
export interface TransactionHistoryEntry {
  id: string;
  signature: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: number;
  from: string;
  to?: string;
  amount?: number;
  token?: string;
  fee?: number;
  slot?: number;
  confirmations?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// トランザクション統計
export interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalVolume: number;
  totalFees: number;
  averageConfirmationTime: number;
  transactionsByType: Record<TransactionType, number>;
}

// フィルターオプション
export interface TransactionFilter {
  type?: TransactionType[];
  status?: TransactionStatus[];
  startDate?: Date;
  endDate?: Date;
  address?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ソートオプション
export const SortBy = {
  TIMESTAMP: 'TIMESTAMP',
  AMOUNT: 'AMOUNT',
  FEE: 'FEE',
  STATUS: 'STATUS',
} as const;

export type SortBy = typeof SortBy[keyof typeof SortBy];

export interface SortOptions {
  by: SortBy;
  ascending: boolean;
}

class TransactionHistoryService {
  private transactions: Map<string, TransactionHistoryEntry> = new Map();
  private pendingTransactions: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<(transaction: TransactionHistoryEntry) => void> = new Set();
  private maxHistorySize = 10000;
  private confirmationInterval = 2000; // 2秒
  private maxConfirmationAttempts = 30; // 最大60秒まで確認

  constructor() {
    // ローカルストレージから履歴を復元
    this.loadFromStorage();
    
    // 定期的にストレージに保存
    setInterval(() => this.saveToStorage(), 30000); // 30秒ごと
  }

  // トランザクションの追加
  public async addTransaction(
    signature: string,
    type: TransactionType,
    from: string,
    metadata?: Record<string, any>
  ): Promise<TransactionHistoryEntry> {
    const id = this.generateTransactionId();
    
    const entry: TransactionHistoryEntry = {
      id,
      signature,
      type,
      status: TransactionStatus.PENDING,
      timestamp: Date.now(),
      from,
      metadata,
    };

    this.transactions.set(id, entry);
    this.notifyListeners(entry);

    // トランザクション確認の開始
    this.startConfirmationTracking(id, signature);

    // パフォーマンス記録
    performanceService.recordMetric('transaction_added', Date.now(), 0, { type });

    return entry;
  }

  // トランザクション確認の追跡
  private async startConfirmationTracking(id: string, signature: string): Promise<void> {
    let attempts = 0;

    const checkConfirmation = async () => {
      try {
        attempts++;
        
        const connection = eclipseRpcService.getConnection();
        const signatureStatus = await connection.getSignatureStatus(signature);

        if (signatureStatus.value) {
          const entry = this.transactions.get(id);
          if (!entry) return;

          if (signatureStatus.value.err) {
            // トランザクション失敗
            entry.status = TransactionStatus.FAILED;
            entry.error = JSON.stringify(signatureStatus.value.err);
            entry.confirmations = signatureStatus.value.confirmations || 0;
          } else {
            // トランザクション成功
            entry.status = TransactionStatus.CONFIRMED;
            entry.confirmations = signatureStatus.value.confirmations || 0;
            entry.slot = signatureStatus.value.slot;

            // トランザクション詳細を取得
            await this.fetchTransactionDetails(entry, signature);
          }

          this.transactions.set(id, entry);
          this.notifyListeners(entry);
          
          // タイマーをクリア
          const timer = this.pendingTransactions.get(id);
          if (timer) {
            clearInterval(timer);
            this.pendingTransactions.delete(id);
          }

          // 統計を更新
          performanceService.recordMetric('transaction_confirmed', Date.now(), attempts * this.confirmationInterval);
        } else if (attempts >= this.maxConfirmationAttempts) {
          // タイムアウト
          const entry = this.transactions.get(id);
          if (entry && entry.status === TransactionStatus.PENDING) {
            entry.status = TransactionStatus.EXPIRED;
            this.transactions.set(id, entry);
            this.notifyListeners(entry);
          }

          const timer = this.pendingTransactions.get(id);
          if (timer) {
            clearInterval(timer);
            this.pendingTransactions.delete(id);
          }
        }
      } catch (error) {
        await errorHandlingService.handleError(
          error as Error,
          ErrorType.RPC,
          ErrorSeverity.MEDIUM,
          { transactionId: id, signature, attempts }
        );
      }
    };

    // 定期的に確認
    const timer = setInterval(checkConfirmation, this.confirmationInterval);
    this.pendingTransactions.set(id, timer);

    // 初回チェック
    checkConfirmation();
  }

  // トランザクション詳細の取得
  private async fetchTransactionDetails(
    entry: TransactionHistoryEntry,
    signature: string
  ): Promise<void> {
    try {
      const connection = eclipseRpcService.getConnection();
      const transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (transaction) {
        // 手数料の計算
        entry.fee = transaction.meta?.fee ? transaction.meta.fee / 1e9 : undefined;

        // トランザクションタイプの詳細判定
        if (transaction.meta?.logMessages) {
          entry.metadata = {
            ...entry.metadata,
            logs: transaction.meta.logMessages,
          };
        }

        // 転送額の計算（簡易版）
        if (transaction.meta?.postBalances && transaction.meta?.preBalances) {
          const balanceChange = Math.abs(
            transaction.meta.postBalances[0] - transaction.meta.preBalances[0]
          );
          if (balanceChange > 0) {
            entry.amount = balanceChange / 1e9;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch transaction details:', getErrorMessage(error));
    }
  }

  // 履歴の取得
  public getHistory(
    filter?: TransactionFilter,
    sort?: SortOptions,
    limit?: number,
    offset?: number
  ): TransactionHistoryEntry[] {
    let entries = Array.from(this.transactions.values());

    // フィルタリング
    if (filter) {
      entries = entries.filter(entry => {
        if (filter.type && !filter.type.includes(entry.type)) return false;
        if (filter.status && !filter.status.includes(entry.status)) return false;
        if (filter.startDate && entry.timestamp < filter.startDate.getTime()) return false;
        if (filter.endDate && entry.timestamp > filter.endDate.getTime()) return false;
        if (filter.address && entry.from !== filter.address && entry.to !== filter.address) return false;
        if (filter.minAmount && (!entry.amount || entry.amount < filter.minAmount)) return false;
        if (filter.maxAmount && (!entry.amount || entry.amount > filter.maxAmount)) return false;
        return true;
      });
    }

    // ソート
    if (sort) {
      entries.sort((a, b) => {
        let comparison = 0;
        
        switch (sort.by) {
          case SortBy.TIMESTAMP:
            comparison = a.timestamp - b.timestamp;
            break;
          case SortBy.AMOUNT:
            comparison = (a.amount || 0) - (b.amount || 0);
            break;
          case SortBy.FEE:
            comparison = (a.fee || 0) - (b.fee || 0);
            break;
          case SortBy.STATUS:
            comparison = a.status.localeCompare(b.status);
            break;
        }

        return sort.ascending ? comparison : -comparison;
      });
    } else {
      // デフォルトは新しい順
      entries.sort((a, b) => b.timestamp - a.timestamp);
    }

    // ページネーション
    const start = offset || 0;
    const end = limit ? start + limit : undefined;
    
    return entries.slice(start, end);
  }

  // 特定のトランザクション取得
  public getTransaction(id: string): TransactionHistoryEntry | null {
    return this.transactions.get(id) || null;
  }

  // トランザクション統計の取得
  public getStatistics(filter?: TransactionFilter): TransactionStats {
    const entries = this.getHistory(filter);
    
    const stats: TransactionStats = {
      totalTransactions: entries.length,
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
    };

    let totalConfirmationTime = 0;
    let confirmedCount = 0;

    entries.forEach(entry => {
      // ステータス別カウント
      switch (entry.status) {
        case TransactionStatus.CONFIRMED:
          stats.successfulTransactions++;
          confirmedCount++;
          if (entry.metadata?.confirmationTime) {
            totalConfirmationTime += entry.metadata.confirmationTime;
          }
          break;
        case TransactionStatus.FAILED:
        case TransactionStatus.EXPIRED:
          stats.failedTransactions++;
          break;
        case TransactionStatus.PENDING:
          stats.pendingTransactions++;
          break;
      }

      // タイプ別カウント
      stats.transactionsByType[entry.type]++;

      // ボリュームと手数料
      if (entry.amount) stats.totalVolume += entry.amount;
      if (entry.fee) stats.totalFees += entry.fee;
    });

    // 平均確認時間
    if (confirmedCount > 0) {
      stats.averageConfirmationTime = totalConfirmationTime / confirmedCount;
    }

    return stats;
  }

  // CSVエクスポート
  public exportToCSV(filter?: TransactionFilter): string {
    const entries = this.getHistory(filter);
    
    const headers = [
      'ID',
      'Signature',
      'Type',
      'Status',
      'Timestamp',
      'From',
      'To',
      'Amount',
      'Token',
      'Fee',
      'Confirmations',
      'Error',
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.signature,
      entry.type,
      entry.status,
      new Date(entry.timestamp).toISOString(),
      entry.from,
      entry.to || '',
      entry.amount?.toString() || '',
      entry.token || '',
      entry.fee?.toString() || '',
      entry.confirmations?.toString() || '',
      entry.error || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  // リスナーの追加
  public addListener(listener: (transaction: TransactionHistoryEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // リスナーへの通知
  private notifyListeners(transaction: TransactionHistoryEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(transaction);
      } catch (error) {
        console.error('Error in transaction listener:', getErrorMessage(error));
      }
    });
  }

  // ローカルストレージへの保存
  private saveToStorage(): void {
    try {
      const entries = Array.from(this.transactions.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxHistorySize);

      localStorage.setItem('transactionHistory', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save transaction history:', getErrorMessage(error));
    }
  }

  // ローカルストレージからの読み込み
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('transactionHistory');
      if (stored) {
        const entries: TransactionHistoryEntry[] = JSON.parse(stored);
        entries.forEach(entry => {
          this.transactions.set(entry.id, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load transaction history:', getErrorMessage(error));
    }
  }

  // 履歴のクリア
  public clearHistory(olderThan?: Date): number {
    let clearedCount = 0;
    const cutoff = olderThan?.getTime() || 0;

    for (const [id, entry] of this.transactions.entries()) {
      if (entry.timestamp < cutoff || !olderThan) {
        this.transactions.delete(id);
        clearedCount++;
      }
    }

    this.saveToStorage();
    return clearedCount;
  }

  // トランザクションIDの生成
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // pending トランザクションの再確認
  public async retryPendingTransactions(): Promise<void> {
    const pendingEntries = Array.from(this.transactions.values()).filter(
      entry => entry.status === TransactionStatus.PENDING
    );

    for (const entry of pendingEntries) {
      if (!this.pendingTransactions.has(entry.id)) {
        this.startConfirmationTracking(entry.id, entry.signature);
      }
    }
  }

  // クリーンアップ
  public dispose(): void {
    // 全てのタイマーをクリア
    this.pendingTransactions.forEach(timer => clearInterval(timer));
    this.pendingTransactions.clear();
    
    // ストレージに保存
    this.saveToStorage();
  }
}

// シングルトンインスタンス
export const transactionHistoryService = new TransactionHistoryService();

export default TransactionHistoryService;