import React, { useState, useEffect } from 'react';
import { useOrcaApi, useOrcaPoolAnalysis } from '../../hooks/useOrcaApi';
import { COMMON_TOKENS } from '../../constants';
import { formatPercentage } from '../../utils';
import type { Token, PoolData } from '../../types';
import type { OrcaPool } from '../../services/orcaApiService';

export const LiquidityAnalysis: React.FC = () => {
  const [selectedTokenA, setSelectedTokenA] = useState<Token>(COMMON_TOKENS[0]); // SOL
  const [selectedTokenB, setSelectedTokenB] = useState<Token>(COMMON_TOKENS[1]); // USDC
  const [analysisType, setAnalysisType] = useState<'apy' | 'volume' | 'liquidity'>('apy');
  const [priceImpactAmounts] = useState<number[]>([0.1, 1, 10, 100, 1000]); // SOL amounts

  const { 
    poolsLoading, 
    poolsError, 
    getLiquidityPools,
    isHealthy 
  } = useOrcaApi();

  const {
    analysis,
    priceImpactAnalysis,
    analyzePoolPerformance,
    analyzePriceImpact
  } = useOrcaPoolAnalysis();

  const [filteredPools, setFilteredPools] = useState<PoolData[]>([]);
  const [poolsForTokenPair, setPoolsForTokenPair] = useState<PoolData[]>([]);

  // プール分析を実行
  useEffect(() => {
    if (isHealthy) {
      analyzePoolPerformance().catch(console.error);
    }
  }, [analyzePoolPerformance, isHealthy]);

  // 価格影響分析を実行
  useEffect(() => {
    if (isHealthy && selectedTokenA && selectedTokenB) {
      analyzePriceImpact(selectedTokenA, selectedTokenB, priceImpactAmounts)
        .catch(console.error);
    }
  }, [analyzePriceImpact, selectedTokenA, selectedTokenB, priceImpactAmounts, isHealthy]);

  // 選択されたトークンペアのプールを取得
  useEffect(() => {
    if (isHealthy && selectedTokenA && selectedTokenB) {
      getLiquidityPools(selectedTokenA, selectedTokenB)
        .then(setPoolsForTokenPair)
        .catch(console.error);
    }
  }, [getLiquidityPools, selectedTokenA, selectedTokenB, isHealthy]);

  // 分析タイプに基づいてプールをフィルタリング
  useEffect(() => {
    if (!analysis) return;

    let topPools: OrcaPool[] = [];
    switch (analysisType) {
      case 'apy':
        topPools = analysis.topByApy;
        break;
      case 'volume':
        topPools = analysis.topByVolume;
        break;
      case 'liquidity':
        topPools = analysis.topByLiquidity;
        break;
    }

    // OrcaPoolをPoolDataに変換
    const convertedPools = topPools.map(pool => ({
      poolId: pool.address,
      token0: {
        address: pool.tokenA.mint,
        symbol: 'TokenA', // 実際の実装では別途トークン情報を取得
        name: 'Token A',
        decimals: pool.tokenA.decimals,
        chainId: 100,
      },
      token1: {
        address: pool.tokenB.mint,
        symbol: 'TokenB',
        name: 'Token B',
        decimals: pool.tokenB.decimals,
        chainId: 100,
      },
      reserves: [
        parseFloat(pool.tokenA.amount) / Math.pow(10, pool.tokenA.decimals),
        parseFloat(pool.tokenB.amount) / Math.pow(10, pool.tokenB.decimals),
      ] as [number, number],
      fee: pool.fee,
      apy: pool.apy,
      volume24h: pool.volume24h,
      liquidity: pool.liquidity,
    }));

    setFilteredPools(convertedPools);
  }, [analysis, analysisType]);

  const handleTokenSwap = () => {
    setSelectedTokenA(selectedTokenB);
    setSelectedTokenB(selectedTokenA);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          流動性プール分析
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-success-500' : 'bg-error-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isHealthy ? 'Orca API 接続中' : 'Orca API 切断'}
          </span>
        </div>
      </div>

      {/* エラー表示 */}
      {poolsError && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <p className="text-error-600 dark:text-error-400">
            プールデータの取得に失敗しました: {poolsError}
          </p>
        </div>
      )}

      {/* トークンペア選択 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          トークンペア分析
        </h3>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token A
            </label>
            <select 
              value={selectedTokenA.address}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.address === e.target.value);
                if (token) setSelectedTokenA(token);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {COMMON_TOKENS.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTokenSwap}
            className="mt-6 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token B
            </label>
            <select 
              value={selectedTokenB.address}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.address === e.target.value);
                if (token) setSelectedTokenB(token);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {COMMON_TOKENS.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 選択したトークンペアのプール情報 */}
        {poolsForTokenPair.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
              {selectedTokenA.symbol}/{selectedTokenB.symbol} プール
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poolsForTokenPair.slice(0, 4).map((pool, index) => (
                <div key={pool.poolId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Pool #{index + 1}
                    </span>
                    <span className="text-xs bg-success-100 dark:bg-success-800 text-success-800 dark:text-success-200 px-2 py-1 rounded">
                      APY: {formatPercentage(pool.apy)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>流動性:</span>
                      <span>${pool.liquidity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>24h取引量:</span>
                      <span>${pool.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>手数料:</span>
                      <span>{formatPercentage(pool.fee * 100)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 価格影響分析 */}
      {priceImpactAnalysis && priceImpactAnalysis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            価格影響分析 ({selectedTokenA.symbol} → {selectedTokenB.symbol})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-900 dark:text-white">取引量</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">受け取り量</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">価格影響</th>
                  <th className="text-left py-2 text-gray-900 dark:text-white">推奨度</th>
                </tr>
              </thead>
              <tbody>
                {priceImpactAnalysis.map((analysis, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-600 dark:text-gray-300">
                      {analysis.amount / Math.pow(10, selectedTokenA.decimals)} {selectedTokenA.symbol}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-300">
                      {(analysis.outputAmount / Math.pow(10, selectedTokenB.decimals)).toFixed(4)} {selectedTokenB.symbol}
                    </td>
                    <td className="py-2">
                      <span className={`${
                        analysis.priceImpact > 10 ? 'text-error-600' :
                        analysis.priceImpact > 5 ? 'text-warning-600' :
                        'text-success-600'
                      }`}>
                        {formatPercentage(analysis.priceImpact)}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        analysis.priceImpact > 10 ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' :
                        analysis.priceImpact > 5 ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' :
                        analysis.priceImpact > 2 ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' :
                        'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                      }`}>
                        {analysis.priceImpact > 10 ? '避けるべき' :
                         analysis.priceImpact > 5 ? '注意' :
                         analysis.priceImpact > 2 ? '良好' : '最適'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* トップパフォーマンスプール */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            トップパフォーマンス プール
          </h3>
          
          <div className="flex gap-2">
            {(['apy', 'volume', 'liquidity'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setAnalysisType(type)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  analysisType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'apy' ? 'APY順' : type === 'volume' ? '取引量順' : '流動性順'}
              </button>
            ))}
          </div>
        </div>

        {/* 全体統計 */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatPercentage(analysis.averageApy)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">平均APY</div>
            </div>
            <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                ${(analysis.totalLiquidity / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">総流動性</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.topByApy.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">アクティブプール数</div>
            </div>
          </div>
        )}

        {/* プール一覧 */}
        {poolsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">プールデータを読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPools.slice(0, 10).map((pool, index) => (
              <div
                key={pool.poolId}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      手数料: {formatPercentage(pool.fee * 100)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-white">
                      APY: {formatPercentage(pool.apy)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      流動性: ${pool.liquidity.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-white">
                      24h: ${pool.volume24h.toLocaleString()}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      リザーブ: {pool.reserves[0].toFixed(2)}/{pool.reserves[1].toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquidityAnalysis;