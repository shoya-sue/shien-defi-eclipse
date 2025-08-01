import React, { useState } from 'react';
import { formatDate, validateAddress } from '../../utils';
import { usePnLCalculation, useTransactionFilter } from '../../hooks/usePnLCalculation';
import { useWallet } from '../../hooks/useWallet';
import type { TransactionFilter } from '../../services/transactionService';

export const TransactionImporter: React.FC = () => {
  const { publicKey } = useWallet();
  const { transactions, loading, error, fetchTransactions } = usePnLCalculation();
  const { setFilter, applyFilter, clearFilter } = useTransactionFilter();
  const [manualAddress, setManualAddress] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedType, setSelectedType] = useState('');

  const handleFetchTransactions = async () => {
    let address = '';
    
    if (publicKey) {
      address = publicKey.toBase58();
    } else if (manualAddress && validateAddress(manualAddress)) {
      address = manualAddress;
    } else {
      return;
    }

    const filterOptions: TransactionFilter = {};
    
    if (dateRange.from) {
      filterOptions.dateFrom = new Date(dateRange.from).getTime();
    }
    if (dateRange.to) {
      filterOptions.dateTo = new Date(dateRange.to).getTime();
    }
    if (selectedType) {
      filterOptions.type = selectedType;
    }

    setFilter(filterOptions);
    await fetchTransactions(address, filterOptions);
  };

  const handleClearFilters = () => {
    clearFilter();
    setDateRange({ from: '', to: '' });
    setSelectedType('');
  };

  const filteredTransactions = applyFilter(transactions);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        取引履歴インポート
      </h2>

      <div className="space-y-6">
        {/* Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ウォレットアドレス
          </label>
          {publicKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="text-sm text-gray-900 dark:text-white">
                  {publicKey.toBase58()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-sm text-success-600 dark:text-success-400">接続済み</span>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="ウォレットアドレスを入力"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              開始日
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              終了日
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              取引タイプ
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="swap">スワップ</option>
              <option value="add_liquidity">流動性追加</option>
              <option value="remove_liquidity">流動性削除</option>
              <option value="stake">ステーキング</option>
              <option value="unstake">アンステーキング</option>
              <option value="claim_rewards">報酬請求</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleFetchTransactions}
            disabled={loading || (!publicKey && !validateAddress(manualAddress))}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              loading || (!publicKey && !validateAddress(manualAddress))
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                取得中...
              </div>
            ) : (
              '取引履歴を取得'
            )}
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            フィルタクリア
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
            <p className="text-error-600 dark:text-error-400">{error}</p>
          </div>
        )}

        {/* Transaction Summary */}
        {filteredTransactions.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              取引履歴概要
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredTransactions.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">総取引数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredTransactions.filter(tx => tx.type === 'swap').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">スワップ</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredTransactions.filter(tx => tx.type.includes('liquidity')).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">流動性操作</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredTransactions.filter(tx => tx.type.includes('stake') || tx.type === 'claim_rewards').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ファーミング</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {filteredTransactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              最近の取引 (最新5件)
            </h3>
            <div className="space-y-2">
              {filteredTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.status === 'success' ? 'bg-success-500' : 
                      tx.status === 'failed' ? 'bg-error-500' : 'bg-warning-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {tx.type === 'swap' ? 'スワップ' :
                           tx.type === 'add_liquidity' ? '流動性追加' :
                           tx.type === 'remove_liquidity' ? '流動性削除' :
                           tx.type === 'stake' ? 'ステーキング' :
                           tx.type === 'unstake' ? 'アンステーキング' :
                           tx.type === 'claim_rewards' ? '報酬請求' : tx.type}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(tx.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {tx.tokens.map((token, index) => (
                          <span key={index}>
                            {token.isInput ? '-' : '+'}
                            {token.amount.toFixed(4)} {token.token.symbol}
                            {index < tx.tokens.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      手数料: ${tx.fees.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {tx.hash.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionImporter;