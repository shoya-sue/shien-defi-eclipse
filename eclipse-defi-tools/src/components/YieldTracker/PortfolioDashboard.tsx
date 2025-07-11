import React from 'react';
import { formatNumber, formatPercentage } from '../../utils';
import { useYieldPositions } from '../../hooks/useYieldPositions';
import { useWallet } from '../../hooks/useWallet';

export const PortfolioDashboard: React.FC = () => {
  const { publicKey } = useWallet();
  const { portfolioStats, loading, error } = useYieldPositions(
    publicKey?.toBase58()
  );

  if (!publicKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ウォレットを接続
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            ファーミングポジションを確認するには、ウォレットを接続してください
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            ポートフォリオデータを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          ポートフォリオ概要
        </h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            リアルタイム更新
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Staked */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">総ステーキング額</p>
              <p className="text-2xl font-bold">
                ${formatNumber(portfolioStats.totalStaked, 2, true)}
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">未請求報酬</p>
              <p className="text-2xl font-bold">
                ${formatNumber(portfolioStats.totalPendingRewards, 2, true)}
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Rewards */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">総獲得報酬</p>
              <p className="text-2xl font-bold">
                ${formatNumber(portfolioStats.totalRewards, 2, true)}
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average APY */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">平均APY</p>
              <p className="text-2xl font-bold">
                {formatPercentage(portfolioStats.averageAPY)}
              </p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            パフォーマンス概要
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">総投資額:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${formatNumber(portfolioStats.totalStaked, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">総収益:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ${formatNumber(portfolioStats.totalRewards + portfolioStats.totalPendingRewards, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">収益率:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {portfolioStats.totalStaked > 0 ? 
                  formatPercentage(((portfolioStats.totalRewards + portfolioStats.totalPendingRewards) / portfolioStats.totalStaked) * 100) : 
                  '0%'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            最近の活動
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">報酬を獲得しました</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2時間前</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">新しいポジションを追加</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1日前</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">報酬をハーベスト</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">3日前</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboard;