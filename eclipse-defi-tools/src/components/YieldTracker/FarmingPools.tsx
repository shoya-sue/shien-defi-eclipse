import React, { useState } from 'react';
import { formatNumber, formatPercentage, validateAmount } from '../../utils';
import { useFarmingPools, useYieldPositions } from '../../hooks/useYieldPositions';
import { useWallet } from '../../hooks/useWallet';
import type { FarmingPool } from '../../services/farmingService';

export const FarmingPools: React.FC = () => {
  const { publicKey } = useWallet();
  const { pools, topPools, loading, error } = useFarmingPools();
  const { stakeToFarm } = useYieldPositions(publicKey?.toBase58());
  const [selectedPool, setSelectedPool] = useState<FarmingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [stakeLoading, setStakeLoading] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);

  const handleStakeAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !validateAmount(stakeAmount)) return;

    setStakeLoading(true);
    try {
      await stakeToFarm(selectedPool.poolId, parseFloat(stakeAmount));
      setShowStakeModal(false);
      setStakeAmount('');
      setSelectedPool(null);
    } finally {
      setStakeLoading(false);
    }
  };

  const openStakeModal = (pool: FarmingPool) => {
    setSelectedPool(pool);
    setShowStakeModal(true);
  };

  const closeStakeModal = () => {
    setShowStakeModal(false);
    setSelectedPool(null);
    setStakeAmount('');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            ファーミングプールを取得中...
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
    <div className="space-y-6">
      {/* Top Pools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          🔥 高APYプール
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPools.map((pool) => (
            <div
              key={pool.poolId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {pool.token0.logoURI && (
                      <img
                        src={pool.token0.logoURI}
                        alt={pool.token0.symbol}
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                      />
                    )}
                    {pool.token1.logoURI && (
                      <img
                        src={pool.token1.logoURI}
                        alt={pool.token1.symbol}
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                      />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {pool.name}
                  </span>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatPercentage(pool.apy)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">DEX:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{pool.dex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">流動性:</span>
                  <span className="text-gray-900 dark:text-white">
                    ${formatNumber(pool.totalStaked, 0, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">倍率:</span>
                  <span className="text-gray-900 dark:text-white">{pool.multiplier}x</span>
                </div>
              </div>
              <button
                onClick={() => openStakeModal(pool)}
                disabled={!publicKey}
                className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors ${
                  publicKey
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {publicKey ? 'ステーキング' : 'ウォレット接続が必要'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Pools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          全ファーミングプール
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">プール</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">DEX</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">APY</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">流動性</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">報酬</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">倍率</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">ステータス</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pools.map((pool) => (
                <tr key={pool.poolId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {pool.token0.logoURI && (
                          <img
                            src={pool.token0.logoURI}
                            alt={pool.token0.symbol}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          />
                        )}
                        {pool.token1.logoURI && (
                          <img
                            src={pool.token1.logoURI}
                            alt={pool.token1.symbol}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {pool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pool.token0.symbol}-{pool.token1.symbol}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-900 dark:text-white">{pool.dex}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPercentage(pool.apy)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    ${formatNumber(pool.totalStaked, 0, true)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {pool.rewardTokens.map((token, index) => (
                        <div key={token.address} className="flex items-center gap-1">
                          {token.logoURI && (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                          )}
                          <span className="text-xs text-gray-900 dark:text-white">
                            {token.symbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900 dark:text-white">{pool.multiplier}x</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      pool.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}>
                      {pool.isActive ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openStakeModal(pool)}
                      disabled={!publicKey || !pool.isActive}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        publicKey && pool.isActive
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      ステーキング
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stake Modal */}
      {showStakeModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedPool.name} にステーキング
              </h3>
              <button
                onClick={closeStakeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    {selectedPool.token0.logoURI && (
                      <img
                        src={selectedPool.token0.logoURI}
                        alt={selectedPool.token0.symbol}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      />
                    )}
                    {selectedPool.token1.logoURI && (
                      <img
                        src={selectedPool.token1.logoURI}
                        alt={selectedPool.token1.symbol}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedPool.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      APY: {formatPercentage(selectedPool.apy)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ステーキング額 (USD)
                </label>
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={(e) => handleStakeAmountChange(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeStakeModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleStake}
                  disabled={!validateAmount(stakeAmount) || stakeLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    validateAmount(stakeAmount) && !stakeLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {stakeLoading ? '処理中...' : 'ステーキング'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmingPools;