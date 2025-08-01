import React, { useState } from 'react';
import { formatNumber, formatPercentage, formatTimeAgo } from '../../utils';
import { useYieldPositions } from '../../hooks/useYieldPositions';
import { useWallet } from '../../hooks/useWallet';
import { farmingService } from '../../services/farmingService';

export const PositionList: React.FC = () => {
  const { publicKey } = useWallet();
  const { positions, loading, error, harvestRewards, unstakeFromFarm } = useYieldPositions(
    publicKey?.toBase58()
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleHarvest = async (positionId: string) => {
    setActionLoading(positionId);
    try {
      await harvestRewards(positionId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnstake = async (positionId: string, amount: number) => {
    setActionLoading(positionId);
    try {
      await unstakeFromFarm(positionId, amount);
    } finally {
      setActionLoading(null);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            ウォレットを接続して、ファーミングポジションを確認してください
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            ポジションデータを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-error-600 dark:text-error-400">{error}</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ファーミングポジションがありません
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            新しいファーミングプールに参加して、報酬を獲得しましょう
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          ファーミングポジション
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {positions.length} 件のアクティブポジション
        </span>
      </div>

      <div className="space-y-4">
        {positions.map((position) => {
          const performance = farmingService.calculatePositionPerformance(position);
          const totalPendingRewards = position.pendingRewards.reduce((sum, reward) => sum + reward, 0);
          const isHarvestable = totalPendingRewards > 0;

          return (
            <div
              key={position.positionId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {position.pool.token0.logoURI && (
                        <img
                          src={position.pool.token0.logoURI}
                          alt={position.pool.token0.symbol}
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      )}
                      {position.pool.token1.logoURI && (
                        <img
                          src={position.pool.token1.logoURI}
                          alt={position.pool.token1.symbol}
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {position.pool.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {position.pool.dex}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200">
                      {formatPercentage(position.apy)} APY
                    </span>
                    {position.pool.multiplier > 1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        {position.pool.multiplier}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHarvest(position.positionId)}
                    disabled={!isHarvestable || actionLoading === position.positionId}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      isHarvestable
                        ? 'bg-success-600 hover:bg-success-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {actionLoading === position.positionId ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'ハーベスト'
                    )}
                  </button>
                  <button
                    onClick={() => handleUnstake(position.positionId, position.stakedAmount)}
                    disabled={actionLoading === position.positionId}
                    className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    アンステーク
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ステーキング額</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${formatNumber(position.stakedAmount, 2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">未請求報酬</p>
                  <p className="font-semibold text-success-600 dark:text-success-400">
                    ${formatNumber(totalPendingRewards, 2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">総獲得報酬</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${formatNumber(position.totalRewards, 2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">実際のAPY</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(performance.actualAPY)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">開始日</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatTimeAgo(position.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">アクティブ日数</p>
                  <p className="text-gray-900 dark:text-white">
                    {performance.daysActive}日
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">最終ハーベスト</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatTimeAgo(position.lastHarvest)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">日次報酬</p>
                  <p className="text-gray-900 dark:text-white">
                    ${formatNumber(performance.dailyRewards, 2)}
                  </p>
                </div>
              </div>

              {/* Reward Tokens Details */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">報酬トークン</p>
                <div className="flex items-center gap-4">
                  {position.rewardTokens.map((token, index) => (
                    <div key={token.address} className="flex items-center gap-2">
                      {token.logoURI && (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {token.symbol}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(position.pendingRewards[index] || 0, 4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionList;