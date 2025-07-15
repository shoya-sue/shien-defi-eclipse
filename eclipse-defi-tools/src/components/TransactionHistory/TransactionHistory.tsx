import React, { useState, useMemo, useEffect } from 'react';
import {
  TransactionType,
  TransactionStatus,
  SortBy,
} from '../../services/transactionHistoryService';
import type {
  TransactionFilter,
  SortOptions,
} from '../../services/transactionHistoryService';
import { useTransactionHistory, transactionFilterPresets } from '../../hooks/useTransactionHistory';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TransactionHistoryProps {
  walletAddress?: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ walletAddress }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'successful' | 'failed'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [showStats, setShowStats] = useState(false);

  // フィルター構築
  const filter = useMemo<TransactionFilter>(() => {
    let baseFilter: TransactionFilter = {};

    // ステータスフィルター
    if (activeFilter === 'pending') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.pending };
    } else if (activeFilter === 'successful') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.successful };
    } else if (activeFilter === 'failed') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.failed };
    }

    // 時間範囲フィルター
    if (timeRange === 'today') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.today };
    } else if (timeRange === 'week') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.lastWeek };
    } else if (timeRange === 'month') {
      baseFilter = { ...baseFilter, ...transactionFilterPresets.lastMonth };
    }

    // タイプフィルター
    if (typeFilter !== 'ALL') {
      baseFilter = { ...baseFilter, type: [typeFilter] };
    }

    // ウォレットアドレスフィルター
    if (walletAddress) {
      baseFilter = { ...baseFilter, address: walletAddress };
    }

    return baseFilter;
  }, [activeFilter, timeRange, typeFilter, walletAddress]);

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    by: SortBy.TIMESTAMP,
    ascending: false,
  });

  const {
    transactions,
    statistics,
    loading,
    error,
    refresh,
    clearHistory,
    exportToCSV,
    updateSort,
  } = useTransactionHistory({
    filter,
    sort: sortOptions,
    limit: 100,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  // CSVダウンロード処理
  const handleExportCSV = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transaction_history_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ソート変更処理
  const handleSortChange = (by: SortBy) => {
    if (sortOptions.by === by) {
      setSortOptions({ by, ascending: !sortOptions.ascending });
    } else {
      setSortOptions({ by, ascending: false });
    }
  };

  // ステータスアイコンの取得
  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return '⏳';
      case TransactionStatus.CONFIRMED:
        return '✅';
      case TransactionStatus.FAILED:
        return '❌';
      case TransactionStatus.EXPIRED:
        return '⏰';
      default:
        return '❓';
    }
  };

  // ステータスカラーの取得
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'text-yellow-600 dark:text-yellow-400';
      case TransactionStatus.CONFIRMED:
        return 'text-green-600 dark:text-green-400';
      case TransactionStatus.FAILED:
        return 'text-red-600 dark:text-red-400';
      case TransactionStatus.EXPIRED:
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // トランザクションタイプの表示名
  const getTransactionTypeName = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SWAP:
        return 'スワップ';
      case TransactionType.TRANSFER:
        return '送金';
      case TransactionType.STAKE:
        return 'ステーク';
      case TransactionType.UNSTAKE:
        return 'アンステーク';
      case TransactionType.LIQUIDITY_ADD:
        return '流動性追加';
      case TransactionType.LIQUIDITY_REMOVE:
        return '流動性削除';
      default:
        return '不明';
    }
  };

  useEffect(() => {
    updateSort(sortOptions);
  }, [sortOptions, updateSort]);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              トランザクション履歴
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {statistics.totalTransactions}件のトランザクション
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              📊 統計
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📥 CSV
            </button>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              🔄 更新
            </button>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      {showStats && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">成功</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statistics.successfulTransactions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">失敗</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {statistics.failedTransactions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">保留中</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {statistics.pendingTransactions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">総取引量</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.totalVolume.toFixed(2)} SOL
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">総手数料</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.totalFees.toFixed(6)} SOL
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">平均確認時間</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(statistics.averageConfirmationTime / 1000).toFixed(1)}秒
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">スワップ取引</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.transactionsByType[TransactionType.SWAP]}件
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {/* ステータスフィルター */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              全て
            </button>
            <button
              onClick={() => setActiveFilter('successful')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeFilter === 'successful'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              成功
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              保留中
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeFilter === 'failed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              失敗
            </button>
          </div>

          {/* 時間範囲フィルター */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            <option value="all">全期間</option>
            <option value="today">今日</option>
            <option value="week">過去7日間</option>
            <option value="month">過去30日間</option>
          </select>

          {/* タイプフィルター */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
          >
            <option value="ALL">全タイプ</option>
            <option value={TransactionType.SWAP}>スワップ</option>
            <option value={TransactionType.TRANSFER}>送金</option>
            <option value={TransactionType.STAKE}>ステーク</option>
            <option value={TransactionType.LIQUIDITY_ADD}>流動性追加</option>
            <option value={TransactionType.LIQUIDITY_REMOVE}>流動性削除</option>
          </select>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* トランザクションテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                タイプ
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSortChange(SortBy.TIMESTAMP)}
              >
                時間 {sortOptions.by === SortBy.TIMESTAMP && (sortOptions.ascending ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSortChange(SortBy.AMOUNT)}
              >
                金額 {sortOptions.by === SortBy.AMOUNT && (sortOptions.ascending ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSortChange(SortBy.FEE)}
              >
                手数料 {sortOptions.by === SortBy.FEE && (sortOptions.ascending ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                署名
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  トランザクションがありません
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 ${getStatusColor(tx.status)}`}>
                      {getStatusIcon(tx.status)}
                      <span className="text-sm font-medium">
                        {tx.status === TransactionStatus.PENDING ? '保留中' :
                         tx.status === TransactionStatus.CONFIRMED ? '完了' :
                         tx.status === TransactionStatus.FAILED ? '失敗' : '期限切れ'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {getTransactionTypeName(tx.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDistanceToNow(tx.timestamp, { addSuffix: true, locale: ja })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.amount ? `${tx.amount.toFixed(4)} ${tx.token || 'SOL'}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tx.fee ? `${tx.fee.toFixed(6)} SOL` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=mainnet-beta`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* フッター */}
      {transactions.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {transactions.length}件を表示中
            </p>
            <button
              onClick={() => clearHistory()}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              履歴をクリア
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;