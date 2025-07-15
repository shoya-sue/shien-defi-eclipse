import React, { useState, useEffect } from 'react';
import { autoTradingBotService } from '../../services/autoTradingBotService';
import type {
  BotConfig,
  BotStatus,
  BotExecutionLog,
  BotStats,
  BotStrategyConfig,
  GridStrategyConfig,
  DCAStrategyConfig,
} from '../../services/autoTradingBotService';
import { BotStrategyType } from '../../services/autoTradingBotService';
import { COMMON_TOKENS } from '../../constants';
import { formatNumber, formatPrice, formatPercentage } from '../../utils';

type ViewMode = 'dashboard' | 'create' | 'logs' | 'stats';

export const AutoTradingDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const [botStatuses, setBotStatuses] = useState<Map<string, BotStatus>>(new Map());
  const [executionLogs, setExecutionLogs] = useState<BotExecutionLog[]>([]);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 新規ボット作成フォーム
  const [newBotName, setNewBotName] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<BotStrategyType>(BotStrategyType.GRID);
  const [strategyConfig, setStrategyConfig] = useState<Partial<BotStrategyConfig>>({});

  // データ読み込み
  useEffect(() => {
    autoTradingBotService.loadBots();
    loadBots();
  }, []);

  // ボット一覧の読み込み
  const loadBots = () => {
    const allBots = autoTradingBotService.getAllBots();
    setBots(allBots);

    // ステータスを更新
    const statuses = new Map<string, BotStatus>();
    allBots.forEach(bot => {
      const status = autoTradingBotService.getBotStatus(bot.id);
      if (status) {
        statuses.set(bot.id, status);
      }
    });
    setBotStatuses(statuses);
  };

  // ボット選択時の処理
  const selectBot = (bot: BotConfig) => {
    setSelectedBot(bot);
    
    // 実行ログを取得
    const logs = autoTradingBotService.getBotExecutionLogs(bot.id, 50);
    setExecutionLogs(logs);

    // 統計を取得
    const stats = autoTradingBotService.getBotStats(bot.id);
    setBotStats(stats);
  };

  // ボットの開始/停止
  const toggleBot = async (bot: BotConfig) => {
    const status = botStatuses.get(bot.id);
    
    try {
      if (status === 'RUNNING') {
        autoTradingBotService.stopBot(bot.id);
      } else if (status === 'PAUSED') {
        await autoTradingBotService.resumeBot(bot.id);
      } else {
        await autoTradingBotService.startBot(bot.id);
      }
      
      loadBots();
    } catch (error) {
      console.error('ボット操作エラー:', error);
    }
  };

  // ボットの一時停止
  const pauseBot = (bot: BotConfig) => {
    autoTradingBotService.pauseBot(bot.id);
    loadBots();
  };

  // ボットの削除
  const deleteBot = (bot: BotConfig) => {
    if (window.confirm(`ボット「${bot.name}」を削除しますか？`)) {
      autoTradingBotService.deleteBot(bot.id);
      loadBots();
      setSelectedBot(null);
    }
  };

  // 新規ボット作成
  const createBot = () => {
    if (!newBotName) return;

    const config: Omit<BotConfig, 'id' | 'createdAt'> = {
      name: newBotName,
      strategy: strategyConfig as BotStrategyConfig,
      maxDrawdown: 20,
      dailyLossLimit: 100,
      slippage: 0.5,
      enabled: true,
    };

    autoTradingBotService.createBot(config);
    loadBots();
    setShowCreateModal(false);
    resetCreateForm();
  };

  // フォームリセット
  const resetCreateForm = () => {
    setNewBotName('');
    setSelectedStrategy(BotStrategyType.GRID);
    setStrategyConfig({});
  };

  // ステータスバッジの取得
  const getStatusBadge = (status: BotStatus) => {
    const styles = {
      IDLE: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      RUNNING: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      PAUSED: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      STOPPED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      ERROR: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };

    const labels = {
      IDLE: '待機中',
      RUNNING: '実行中',
      PAUSED: '一時停止',
      STOPPED: '停止',
      ERROR: 'エラー',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // ダッシュボードビュー
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {bots.map(bot => {
          const status = botStatuses.get(bot.id) || 'IDLE';
          const stats = autoTradingBotService.getBotStats(bot.id);

          return (
            <div
              key={bot.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => selectBot(bot)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {bot.name}
                </h3>
                {getStatusBadge(status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">戦略:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bot.strategy.type}
                  </span>
                </div>
                {stats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">総取引数:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.totalTrades}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">損益:</span>
                      <span className={`font-medium ${
                        stats.totalProfit >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${formatNumber(stats.totalProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">勝率:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatPercentage(stats.winRate)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBot(bot);
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    status === 'RUNNING'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {status === 'RUNNING' ? '停止' : '開始'}
                </button>
                {status === 'RUNNING' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pauseBot(bot);
                    }}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium"
                  >
                    一時停止
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBot(bot);
                  }}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBot && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedBot.name} - 詳細情報
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">戦略タイプ</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedBot.strategy.type}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">最大ドローダウン</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedBot.maxDrawdown}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">日次損失制限</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${selectedBot.dailyLossLimit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">スリッページ</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedBot.slippage}%
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('logs')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              実行ログを見る
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              統計を見る
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 実行ログビュー
  const renderExecutionLogs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          実行ログ - {selectedBot?.name}
        </h3>
        <button
          onClick={() => setViewMode('dashboard')}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← 戻る
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-4">時刻</th>
              <th className="text-left py-2 px-4">アクション</th>
              <th className="text-left py-2 px-4">トークン</th>
              <th className="text-right py-2 px-4">数量</th>
              <th className="text-right py-2 px-4">価格</th>
              <th className="text-right py-2 px-4">損益</th>
              <th className="text-left py-2 px-4">理由</th>
              <th className="text-center py-2 px-4">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {executionLogs.map((log, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString('ja-JP')}
                </td>
                <td className="py-2 px-4">
                  <span className={`font-medium ${
                    log.action === 'BUY' 
                      ? 'text-green-600 dark:text-green-400' 
                      : log.action === 'SELL'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {log.action === 'BUY' ? '買い' : log.action === 'SELL' ? '売り' : '保持'}
                  </span>
                </td>
                <td className="py-2 px-4 text-gray-900 dark:text-white">
                  {log.token}
                </td>
                <td className="py-2 px-4 text-right text-gray-900 dark:text-white">
                  {formatNumber(log.amount)}
                </td>
                <td className="py-2 px-4 text-right text-gray-900 dark:text-white">
                  ${formatPrice(log.price)}
                </td>
                <td className="py-2 px-4 text-right">
                  {log.profit !== undefined && (
                    <span className={log.profit >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                    }>
                      ${formatNumber(log.profit)}
                    </span>
                  )}
                </td>
                <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                  {log.reason}
                </td>
                <td className="py-2 px-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded ${
                    log.status === 'SUCCESS'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : log.status === 'PENDING'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {log.status === 'SUCCESS' ? '成功' : log.status === 'PENDING' ? '保留' : '失敗'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 統計ビュー
  const renderStats = () => {
    if (!botStats) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            統計情報 - {selectedBot?.name}
          </h3>
          <button
            onClick={() => setViewMode('dashboard')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← 戻る
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">総取引数</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {botStats.totalTrades}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">成功取引</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {botStats.successfulTrades}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">失敗取引</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {botStats.failedTrades}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">勝率</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(botStats.winRate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">総損益</p>
            <p className={`text-2xl font-bold ${
              botStats.totalProfit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${formatNumber(botStats.totalProfit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">平均損益</p>
            <p className={`text-2xl font-bold ${
              botStats.averageProfit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${formatNumber(botStats.averageProfit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">総取引量</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${formatNumber(botStats.totalVolume)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">シャープレシオ</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {botStats.sharpeRatio.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 新規ボット作成モーダル
  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          新規ボット作成
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ボット名
            </label>
            <input
              type="text"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              placeholder="例: グリッドボット#1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              戦略タイプ
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as BotStrategyType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value={BotStrategyType.GRID}>グリッド戦略</option>
              <option value={BotStrategyType.DCA}>DCA（ドルコスト平均法）</option>
              <option value={BotStrategyType.ARBITRAGE}>アービトラージ</option>
              <option value={BotStrategyType.MOMENTUM}>モメンタム</option>
              <option value={BotStrategyType.MEAN_REVERSION}>平均回帰</option>
              <option value={BotStrategyType.BREAKOUT}>ブレイクアウト</option>
            </select>
          </div>

          {selectedStrategy === BotStrategyType.GRID && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ベーストークン
                  </label>
                  <select
                    onChange={(e) => {
                      const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                      setStrategyConfig({
                        ...strategyConfig,
                        type: BotStrategyType.GRID,
                        tokenPair: {
                          ...(strategyConfig as GridStrategyConfig)?.tokenPair,
                          base: token,
                        },
                      } as GridStrategyConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="">選択してください</option>
                    {COMMON_TOKENS.map(token => (
                      <option key={token.address} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    クオートトークン
                  </label>
                  <select
                    onChange={(e) => {
                      const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                      setStrategyConfig({
                        ...strategyConfig,
                        type: BotStrategyType.GRID,
                        tokenPair: {
                          ...(strategyConfig as GridStrategyConfig)?.tokenPair,
                          quote: token,
                        },
                      } as GridStrategyConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="">選択してください</option>
                    {COMMON_TOKENS.map(token => (
                      <option key={token.address} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最小価格
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.GRID,
                      priceRange: {
                        ...(strategyConfig as GridStrategyConfig)?.priceRange,
                        min: parseFloat(e.target.value),
                      },
                    } as GridStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最大価格
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.GRID,
                      priceRange: {
                        ...(strategyConfig as GridStrategyConfig)?.priceRange,
                        max: parseFloat(e.target.value),
                      },
                    } as GridStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    グリッド数
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.GRID,
                      gridLevels: parseInt(e.target.value),
                    } as GridStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    グリッドあたりの金額
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.GRID,
                      amountPerGrid: parseFloat(e.target.value),
                    } as GridStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="100"
                  />
                </div>
              </div>
            </>
          )}

          {selectedStrategy === BotStrategyType.DCA && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    購入トークン
                  </label>
                  <select
                    onChange={(e) => {
                      const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                      setStrategyConfig({
                        ...strategyConfig,
                        type: BotStrategyType.DCA,
                        token,
                      } as DCAStrategyConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="">選択してください</option>
                    {COMMON_TOKENS.map(token => (
                      <option key={token.address} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    支払いトークン
                  </label>
                  <select
                    onChange={(e) => {
                      const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                      setStrategyConfig({
                        ...strategyConfig,
                        type: BotStrategyType.DCA,
                        quoteToken: token,
                      } as DCAStrategyConfig);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="">選択してください</option>
                    {COMMON_TOKENS.map(token => (
                      <option key={token.address} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    購入間隔（分）
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.DCA,
                      interval: parseInt(e.target.value),
                    } as DCAStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    毎回の購入額
                  </label>
                  <input
                    type="number"
                    onChange={(e) => setStrategyConfig({
                      ...strategyConfig,
                      type: BotStrategyType.DCA,
                      amountPerInterval: parseFloat(e.target.value),
                    } as DCAStrategyConfig)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  総予算
                </label>
                <input
                  type="number"
                  onChange={(e) => setStrategyConfig({
                    ...strategyConfig,
                    type: BotStrategyType.DCA,
                    totalBudget: parseFloat(e.target.value),
                  } as DCAStrategyConfig)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  placeholder="10000"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            キャンセル
          </button>
          <button
            onClick={createBot}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              自動取引ボット
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              戦略に基づいた自動取引を実行
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            新規ボット作成
          </button>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'logs' && renderExecutionLogs()}
        {viewMode === 'stats' && renderStats()}
      </div>

      {showCreateModal && renderCreateModal()}
    </div>
  );
};

export default AutoTradingDashboard;