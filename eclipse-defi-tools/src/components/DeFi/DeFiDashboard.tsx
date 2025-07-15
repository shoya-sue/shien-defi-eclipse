import React, { useState, useEffect } from 'react';
import { defiProtocolService } from '../../services/defiProtocolService';
import type {
  ProtocolInfo,
  StakingInfo,
  LendingInfo,
  FarmingOpportunity,
  ArbitrageOpportunity,
} from '../../services/defiProtocolService';
import { COMMON_TOKENS } from '../../constants';

type ViewMode = 'overview' | 'staking' | 'lending' | 'farming' | 'arbitrage' | 'strategy';

export const DeFiDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [protocols, setProtocols] = useState<ProtocolInfo[]>([]);
  const [stakingOpportunities, setStakingOpportunities] = useState<StakingInfo[]>([]);
  const [lendingOpportunities, setLendingOpportunities] = useState<LendingInfo[]>([]);
  const [farmingOpportunities, setFarmingOpportunities] = useState<FarmingOpportunity[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 戦略設定
  const [strategyAmount, setStrategyAmount] = useState<string>('1000');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [optimalStrategy, setOptimalStrategy] = useState<any>(null);

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [protocolsData, staking, lending, farming] = await Promise.all([
        defiProtocolService.getAllProtocols(),
        defiProtocolService.getStakingOpportunities(),
        defiProtocolService.getLendingOpportunities(),
        defiProtocolService.getFarmingOpportunities(10), // 10% APR以上
      ]);

      setProtocols(protocolsData);
      setStakingOpportunities(staking);
      setLendingOpportunities(lending);
      setFarmingOpportunities(farming);

      // アービトラージ機会の検出
      const arbitrage = await defiProtocolService.detectArbitrageOpportunities(
        COMMON_TOKENS.slice(0, 5),
        0.5
      );
      setArbitrageOpportunities(arbitrage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 最適戦略の計算
  const calculateOptimalStrategy = async () => {
    const amount = parseFloat(strategyAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const strategy = await defiProtocolService.getOptimalYieldStrategy(
        amount,
        riskTolerance
      );
      setOptimalStrategy(strategy);
    } catch (err) {
      console.error('戦略計算エラー:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === 'strategy' && strategyAmount) {
      calculateOptimalStrategy();
    }
  }, [viewMode, strategyAmount, riskTolerance]);

  // プロトコル概要の表示
  const renderProtocolOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {protocols.map(protocol => (
        <div
          key={protocol.type}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{protocol.logo}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {protocol.name}
              </h3>
            </div>
            <a
              href={protocol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="space-y-2 text-sm">
            {protocol.tvl && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">TVL:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(protocol.tvl / 1000000000).toFixed(2)}B
                </span>
              </div>
            )}
            {protocol.volume24h && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">24h Volume:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(protocol.volume24h / 1000000).toFixed(2)}M
                </span>
              </div>
            )}
            {protocol.apr && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">APR:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {protocol.apr.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-1">
              {protocol.features.map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ステーキング機会の表示
  const renderStakingOpportunities = () => (
    <div className="space-y-4">
      {stakingOpportunities.map((staking, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {staking.tokenSymbol} ステーキング
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {protocols.find(p => p.type === staking.protocol)?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {staking.apy.toFixed(2)}% APY
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                TVL: ${(staking.tvl / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">最小ステーク</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {staking.minStake} {staking.tokenSymbol}
              </p>
            </div>
            {staking.lockPeriod && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ロック期間</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {staking.lockPeriod}日
                </p>
              </div>
            )}
          </div>

          {staking.rewards.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                報酬内訳
              </p>
              <div className="space-y-1">
                {staking.rewards.map((reward, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {reward.token} ({reward.frequency})
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {reward.apr.toFixed(2)}% APR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // レンディング機会の表示
  const renderLendingOpportunities = () => (
    <div className="space-y-4">
      {lendingOpportunities.map((lending, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lending.asset} レンディング
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {protocols.find(p => p.type === lending.protocol)?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">利用率</p>
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${lending.utilization}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {lending.utilization}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">供給APY</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {lending.supplyApy.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">借入APY</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {lending.borrowApy.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">総供給量</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${(lending.totalSupply / 1000000).toFixed(2)}M
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">利用可能</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${(lending.availableLiquidity / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ファーミング機会の表示
  const renderFarmingOpportunities = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {farmingOpportunities.map((farming, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {farming.poolName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {protocols.find(p => p.type === farming.protocol)?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {farming.apr.toFixed(2)}% APR
              </p>
              <span className={`text-xs px-2 py-1 rounded ${
                farming.impermanentLossRisk === 'low' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : farming.impermanentLossRisk === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                IL リスク: {
                  farming.impermanentLossRisk === 'low' ? '低' :
                  farming.impermanentLossRisk === 'medium' ? '中' : '高'
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">ペア</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {farming.tokenA}/{farming.tokenB}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">TVL</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${(farming.tvl / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>

          {farming.rewards.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                報酬
              </p>
              <div className="space-y-1">
                {farming.rewards.map((reward, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {reward.token}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {reward.apr.toFixed(2)}% APR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // アービトラージ機会の表示
  const renderArbitrageOpportunities = () => (
    <div className="space-y-4">
      {arbitrageOpportunities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            現在利用可能なアービトラージ機会はありません
          </p>
        </div>
      ) : (
        arbitrageOpportunities.map((arb, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {arb.tokenIn} → {arb.tokenOut}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  投資額: ${arb.amountIn.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +${arb.netProfit.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {arb.profitPercentage.toFixed(2)}% 利益
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                取引経路:
              </p>
              {arb.protocols.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {protocols.find(p => p.type === step.protocol)?.name}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    価格: {step.price.toFixed(4)} | 出力: ${step.amountOut.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">推定ガス代</span>
                <span className="text-gray-900 dark:text-white">
                  {arb.gasEstimate.toFixed(4)} SOL
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // 最適戦略の表示
  const renderOptimalStrategy = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          戦略設定
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              投資金額 (USD)
            </label>
            <input
              type="number"
              value={strategyAmount}
              onChange={(e) => setStrategyAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="1000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              リスク許容度
            </label>
            <select
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="low">低リスク</option>
              <option value="medium">中リスク</option>
              <option value="high">高リスク</option>
            </select>
          </div>
        </div>
      </div>

      {optimalStrategy && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              推奨戦略
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">予想APY</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {optimalStrategy.totalExpectedApy.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {optimalStrategy.strategies.map((strategy: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {strategy.type === 'staking' ? 'ステーキング' :
                       strategy.type === 'lending' ? 'レンディング' : 'ファーミング'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {protocols.find(p => p.type === strategy.protocol)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {strategy.allocation}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${(parseFloat(strategyAmount) * strategy.allocation / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">期待APY</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {strategy.expectedApy.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">年間収益予想</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      +${(parseFloat(strategyAmount) * strategy.allocation / 100 * strategy.expectedApy / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">総投資額</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${parseFloat(strategyAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-600 dark:text-gray-400">年間収益予想</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                +${(parseFloat(strategyAmount) * optimalStrategy.totalExpectedApy / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              DeFiプロトコルダッシュボード
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              複数のDeFiプロトコルの統合管理
            </p>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            データ更新
          </button>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: '概要', icon: '📊' },
            { id: 'staking', label: 'ステーキング', icon: '🔒' },
            { id: 'lending', label: 'レンディング', icon: '💰' },
            { id: 'farming', label: 'ファーミング', icon: '🌾' },
            { id: 'arbitrage', label: 'アービトラージ', icon: '♻️' },
            { id: 'strategy', label: '最適戦略', icon: '🎯' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === 'overview' && renderProtocolOverview()}
            {viewMode === 'staking' && renderStakingOpportunities()}
            {viewMode === 'lending' && renderLendingOpportunities()}
            {viewMode === 'farming' && renderFarmingOpportunities()}
            {viewMode === 'arbitrage' && renderArbitrageOpportunities()}
            {viewMode === 'strategy' && renderOptimalStrategy()}
          </>
        )}
      </div>
    </div>
  );
};

export default DeFiDashboard;