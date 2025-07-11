import React, { useState, useEffect } from 'react';
import type { Token } from '../../types';
import { COMMON_TOKENS } from '../../constants';
import { formatNumber, formatPercentage, validateAmount } from '../../utils';
import { usePoolData } from '../../hooks/usePoolData';
import { poolService } from '../../services/poolService';
import TokenSelector from '../Common/TokenSelector';

export const APYCalculator: React.FC = () => {
  const [token0, setToken0] = useState<Token>(COMMON_TOKENS[0]); // SOL
  const [token1, setToken1] = useState<Token>(COMMON_TOKENS[1]); // USDC
  const [liquidityAmount, setLiquidityAmount] = useState<string>('');
  const [timeInDays, setTimeInDays] = useState<number>(30);
  const [rewards, setRewards] = useState<{
    feeRewards: number;
    tokenRewards: number;
    totalRewards: number;
  } | null>(null);

  const { pools, bestPool, loading, error, fetchPools } = usePoolData();

  useEffect(() => {
    fetchPools(token0, token1);
  }, [token0, token1, fetchPools]);

  useEffect(() => {
    if (bestPool && liquidityAmount && validateAmount(liquidityAmount)) {
      const amount = parseFloat(liquidityAmount);
      const estimatedRewards = poolService.estimateRewards(bestPool, amount, timeInDays);
      setRewards(estimatedRewards);
    } else {
      setRewards(null);
    }
  }, [bestPool, liquidityAmount, timeInDays]);

  const handleLiquidityAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLiquidityAmount(value);
    }
  };

  const presetDays = [7, 30, 90, 365];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        APY計算機
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              流動性ペア
            </label>
            <div className="flex gap-2">
              <TokenSelector
                selectedToken={token0}
                onTokenSelect={setToken0}
                excludeToken={token1}
                className="flex-1"
              />
              <span className="self-center text-gray-500 dark:text-gray-400">-</span>
              <TokenSelector
                selectedToken={token1}
                onTokenSelect={setToken1}
                excludeToken={token0}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              流動性提供額 (USD)
            </label>
            <input
              type="text"
              value={liquidityAmount}
              onChange={(e) => handleLiquidityAmountChange(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              期間 (日)
            </label>
            <div className="flex gap-2 mb-2">
              {presetDays.map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeInDays(days)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeInDays === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {days}日
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={timeInDays}
              onChange={(e) => setTimeInDays(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                プールデータを取得中...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {bestPool && !loading && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                最適プール
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">DEX:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bestPool.poolId.includes('jupiter') ? 'Jupiter' : 
                     bestPool.poolId.includes('orca') ? 'Orca' : 'Raydium'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">APY:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatPercentage(bestPool.apy)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">手数料:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPercentage(bestPool.fee * 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">24h出来高:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formatNumber(bestPool.volume24h, 0, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">流動性:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formatNumber(bestPool.liquidity, 0, true)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {rewards && liquidityAmount && validateAmount(liquidityAmount) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                収益予測 ({timeInDays}日間)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">初期投資:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formatNumber(parseFloat(liquidityAmount), 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">手数料報酬:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${formatNumber(rewards.feeRewards, 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">トークン報酬:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${formatNumber(rewards.tokenRewards, 2)}
                  </span>
                </div>
                <div className="border-t border-green-200 dark:border-green-800 pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-green-800 dark:text-green-200">総収益:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ${formatNumber(rewards.totalRewards, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-green-800 dark:text-green-200">ROI:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatPercentage((rewards.totalRewards / parseFloat(liquidityAmount)) * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Pools Comparison */}
      {pools.length > 0 && !loading && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全プール比較
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">DEX</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">APY</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">手数料</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">24h出来高</th>
                  <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">流動性</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pools.map((pool, index) => (
                  <tr
                    key={index}
                    className={`${
                      pool === bestPool
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {pool.poolId.includes('jupiter') ? 'Jupiter' : 
                           pool.poolId.includes('orca') ? 'Orca' : 'Raydium'}
                        </span>
                        {pool === bestPool && (
                          <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            最適
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium text-green-600 dark:text-green-400">
                      {formatPercentage(pool.apy)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {formatPercentage(pool.fee * 100)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      ${formatNumber(pool.volume24h, 0, true)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      ${formatNumber(pool.liquidity, 0, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default APYCalculator;