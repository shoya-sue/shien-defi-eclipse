import React, { useState, useEffect } from 'react';
import { multiChainService } from '../../services/multiChainService';
import type {
  ChainInfo,
  CrossChainToken,
  BridgeQuote,
  ChainStats,
  MultiChainWallet,
} from '../../services/multiChainService';
import { ChainType } from '../../services/multiChainService';
import { formatNumber } from '../../utils';

type ViewMode = 'overview' | 'tokens' | 'bridge' | 'stats' | 'wallet';

export const MultiChainDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [crossChainTokens, setCrossChainTokens] = useState<CrossChainToken[]>([]);
  const [chainStats, setChainStats] = useState<ChainStats[]>([]);
  const [multiChainWallet, setMultiChainWallet] = useState<MultiChainWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブリッジ設定
  const [selectedFromChain, setSelectedFromChain] = useState<ChainType>(ChainType.ECLIPSE);
  const [selectedToChain, setSelectedToChain] = useState<ChainType>(ChainType.SOLANA);
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [bridgeAmount, setBridgeAmount] = useState<string>('100');
  const [bridgeQuotes, setBridgeQuotes] = useState<BridgeQuote[]>([]);

  // モックウォレットアドレス（実際の実装では接続されたウォレットから取得）
  const mockWalletAddresses = {
    [ChainType.ECLIPSE]: '0x1234...5678',
    [ChainType.SOLANA]: '11111111111111111111111111111111',
    [ChainType.ETHEREUM]: '0xabcd...ef01',
    [ChainType.POLYGON]: '0x2345...6789',
    [ChainType.ARBITRUM]: '0x3456...789a',
    [ChainType.OPTIMISM]: '0x4567...89ab',
    [ChainType.BSC]: '0x5678...9abc',
  };

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [chainsData, tokens, stats, wallet] = await Promise.all([
        Promise.resolve(multiChainService.getAllChains()),
        multiChainService.getCrossChainTokens(mockWalletAddresses),
        multiChainService.getChainStats(),
        multiChainService.getMultiChainWallet(mockWalletAddresses),
      ]);

      setChains(chainsData);
      setCrossChainTokens(tokens);
      setChainStats(stats);
      setMultiChainWallet(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ブリッジ見積もり取得
  const fetchBridgeQuotes = async () => {
    const amount = parseFloat(bridgeAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const quotes = await multiChainService.getBridgeQuote(
        selectedFromChain,
        selectedToChain,
        selectedToken,
        amount
      );
      setBridgeQuotes(quotes);
    } catch (err) {
      console.error('ブリッジ見積もり取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === 'bridge' && bridgeAmount) {
      fetchBridgeQuotes();
    }
  }, [viewMode, selectedFromChain, selectedToChain, selectedToken, bridgeAmount]);

  // チェーン概要の表示
  const renderChainOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {chains.map(chain => (
        <div
          key={chain.type}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{chain.logo}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {chain.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {chain.nativeToken}
                </p>
              </div>
            </div>
            {chain.isTestnet && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                Testnet
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {chain.features.map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href={chain.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                エクスプローラー
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // クロスチェーントークンの表示
  const renderCrossChainTokens = () => (
    <div className="space-y-4">
      {crossChainTokens.map((token, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {token.symbol}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {token.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">総額</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${formatNumber(token.totalValueUSD)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {token.chains.map((chainToken, idx) => {
              const chain = chains.find(c => c.type === chainToken.chain);
              if (!chain) return null;

              return (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{chain.logo}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {chain.name}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">残高:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {chainToken.balance ? formatNumber(chainToken.balance) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">アドレス:</span>
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                        {chainToken.address.slice(0, 6)}...{chainToken.address.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ブリッジインターフェースの表示
  const renderBridgeInterface = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ブリッジ設定
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                送信元チェーン
              </label>
              <select
                value={selectedFromChain}
                onChange={(e) => setSelectedFromChain(e.target.value as ChainType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                {chains.map(chain => (
                  <option key={chain.type} value={chain.type}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                送信先チェーン
              </label>
              <select
                value={selectedToChain}
                onChange={(e) => setSelectedToChain(e.target.value as ChainType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                {chains
                  .filter(chain => chain.type !== selectedFromChain)
                  .map(chain => (
                    <option key={chain.type} value={chain.type}>
                      {chain.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              トークン
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              金額
            </label>
            <input
              type="number"
              value={bridgeAmount}
              onChange={(e) => setBridgeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {bridgeQuotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ブリッジオプション
          </h3>
          {bridgeQuotes.map((quote, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {quote.bridge}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quote.fromChain} → {quote.toChain}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">受取額</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(quote.toAmount)} {quote.toToken}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">手数料</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${formatNumber(quote.fee)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">所要時間</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    約{quote.estimatedTime}分
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">ルート</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {quote.route.join(' → ')}
                  </p>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                このブリッジを使用
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // チェーン統計の表示
  const renderChainStats = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chainStats.map((stat, index) => {
        const chain = chains.find(c => c.type === stat.chain);
        if (!chain) return null;

        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{chain.logo}</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chain.name} 統計
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">TVL</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(stat.tvl / 1000000000).toFixed(2)}B
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">24h取引量</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(stat.volume24h / 1000000000).toFixed(2)}B
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">アクティブウォレット</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(stat.activeWallets / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">24hトランザクション</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(stat.transactionCount24h / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均ガス価格</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stat.avgGasPrice < 1 ? `${(stat.avgGasPrice * 1000).toFixed(2)}m` : stat.avgGasPrice}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ブロック時間</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stat.blockTime}秒
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // マルチチェーンウォレットの表示
  const renderMultiChainWallet = () => {
    if (!multiChainWallet) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              マルチチェーンウォレット概要
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">総資産価値</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${formatNumber(multiChainWallet.totalValueUSD)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {multiChainWallet.chains.map((chainWallet, index) => {
              const chain = chains.find(c => c.type === chainWallet.chain);
              if (!chain) return null;

              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{chain.logo}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {chain.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${formatNumber(chainWallet.valueUSD)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {((chainWallet.valueUSD / multiChainWallet.totalValueUSD) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {chainWallet.tokens.map((token, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {token.symbol}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatNumber(token.balance)} (${formatNumber(token.valueUSD)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              マルチチェーンダッシュボード
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              複数のブロックチェーンの統合管理
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
            { id: 'overview', label: '概要', icon: '🌐' },
            { id: 'tokens', label: 'クロスチェーントークン', icon: '🪙' },
            { id: 'bridge', label: 'ブリッジ', icon: '🌉' },
            { id: 'stats', label: '統計', icon: '📊' },
            { id: 'wallet', label: 'ウォレット', icon: '👛' },
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
            {viewMode === 'overview' && renderChainOverview()}
            {viewMode === 'tokens' && renderCrossChainTokens()}
            {viewMode === 'bridge' && renderBridgeInterface()}
            {viewMode === 'stats' && renderChainStats()}
            {viewMode === 'wallet' && renderMultiChainWallet()}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiChainDashboard;