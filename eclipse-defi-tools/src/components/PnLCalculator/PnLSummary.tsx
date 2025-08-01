import React, { useState } from 'react';
import { formatNumber, formatPercentage } from '../../utils';
import { usePnLCalculation } from '../../hooks/usePnLCalculation';
import type { PnLCalculationMethod } from '../../services/transactionService';

export const PnLSummary: React.FC = () => {
  const { pnlData, loading, error, calculatePnL } = usePnLCalculation();
  const [calculationMethod, setCalculationMethod] = useState<PnLCalculationMethod>({
    method: 'FIFO',
    includeFees: true,
    includeUnrealized: true,
  });

  const handleMethodChange = async (newMethod: Partial<PnLCalculationMethod>) => {
    const updatedMethod = { ...calculationMethod, ...newMethod };
    setCalculationMethod(updatedMethod);
    await calculatePnL(updatedMethod);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">PnLを計算中...</p>
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

  if (!pnlData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            PnLデータがありません
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            取引履歴をインポートしてPnLを計算してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calculation Method Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          計算方法設定
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              会計方式
            </label>
            <select
              value={calculationMethod.method}
              onChange={(e) => handleMethodChange({ method: e.target.value as 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FIFO">FIFO (先入先出)</option>
              <option value="LIFO">LIFO (後入先出)</option>
              <option value="WEIGHTED_AVERAGE">加重平均</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={calculationMethod.includeFees}
                onChange={(e) => handleMethodChange({ includeFees: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">手数料を含める</span>
            </label>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={calculationMethod.includeUnrealized}
                onChange={(e) => handleMethodChange({ includeUnrealized: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">未実現損益を含める</span>
            </label>
          </div>
        </div>
      </div>

      {/* PnL Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          PnL概要
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total PnL */}
          <div className={`rounded-lg p-4 ${
            pnlData.totalPnL >= 0 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">総PnL</p>
                <p className="text-2xl font-bold">
                  {pnlData.totalPnL >= 0 ? '+' : ''}${formatNumber(pnlData.totalPnL, 2)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Realized PnL */}
          <div className={`rounded-lg p-4 ${
            pnlData.realizedPnL >= 0 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">実現PnL</p>
                <p className="text-2xl font-bold">
                  {pnlData.realizedPnL >= 0 ? '+' : ''}${formatNumber(pnlData.realizedPnL, 2)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Unrealized PnL */}
          <div className={`rounded-lg p-4 ${
            pnlData.unrealizedPnL >= 0 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
              : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">未実現PnL</p>
                <p className="text-2xl font-bold">
                  {pnlData.unrealizedPnL >= 0 ? '+' : ''}${formatNumber(pnlData.unrealizedPnL, 2)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">ROI</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(pnlData.roi)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          追加統計
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">総手数料:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${formatNumber(pnlData.totalFees, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">総取引量:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${formatNumber(pnlData.totalVolume, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">アクティブポジション:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pnlData.positions.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">手数料率:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pnlData.totalVolume > 0 ? formatPercentage((pnlData.totalFees / pnlData.totalVolume) * 100) : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">純利益率:</span>
              <span className={`font-medium ${
                pnlData.totalPnL >= 0 
                  ? 'text-success-600 dark:text-success-400' 
                  : 'text-error-600 dark:text-error-400'
              }`}>
                {formatPercentage(pnlData.roi)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">実現率:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pnlData.totalPnL !== 0 ? formatPercentage((pnlData.realizedPnL / pnlData.totalPnL) * 100) : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Positions */}
      {pnlData.positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            現在のポジション
          </h3>
          
          <div className="space-y-3">
            {pnlData.positions.map((position, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {position.token.logoURI && (
                    <img
                      src={position.token.logoURI}
                      alt={position.token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {position.token.symbol}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(position.amount, 4)} トークン
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ${formatNumber(position.amount * position.currentPrice, 2)}
                  </div>
                  <div className={`text-sm ${
                    position.unrealizedPnL >= 0 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-error-600 dark:text-error-400'
                  }`}>
                    {position.unrealizedPnL >= 0 ? '+' : ''}${formatNumber(position.unrealizedPnL, 2)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatPercentage(position.percentage)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    平均: ${formatNumber(position.averagePrice, 2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PnLSummary;