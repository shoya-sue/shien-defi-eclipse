import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { performanceService } from './performanceService';
import { transactionHistoryService, TransactionType } from './transactionHistoryService';
import type { Token } from '../types';

// ボット戦略タイプ
export const BotStrategyType = {
  GRID: 'GRID',
  DCA: 'DCA',
  ARBITRAGE: 'ARBITRAGE',
  MOMENTUM: 'MOMENTUM',
  MEAN_REVERSION: 'MEAN_REVERSION',
  BREAKOUT: 'BREAKOUT',
} as const;

export type BotStrategyType = typeof BotStrategyType[keyof typeof BotStrategyType];

// ボットステータス
export const BotStatus = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
} as const;

export type BotStatus = typeof BotStatus[keyof typeof BotStatus];

// グリッド戦略設定
export interface GridStrategyConfig {
  type: typeof BotStrategyType.GRID;
  tokenPair: {
    base: Token;
    quote: Token;
  };
  priceRange: {
    min: number;
    max: number;
  };
  gridLevels: number;
  amountPerGrid: number;
  takeProfit?: number;
  stopLoss?: number;
}

// DCA戦略設定
export interface DCAStrategyConfig {
  type: typeof BotStrategyType.DCA;
  token: Token;
  quoteToken: Token;
  interval: number; // 分
  amountPerInterval: number;
  totalBudget: number;
  targetPrice?: number;
}

// アービトラージ戦略設定
export interface ArbitrageStrategyConfig {
  type: typeof BotStrategyType.ARBITRAGE;
  tokens: Token[];
  minProfitPercentage: number;
  maxAmount: number;
  includeGasFees: boolean;
}

// モメンタム戦略設定
export interface MomentumStrategyConfig {
  type: typeof BotStrategyType.MOMENTUM;
  token: Token;
  quoteToken: Token;
  lookbackPeriod: number; // 分
  momentumThreshold: number; // パーセント
  positionSize: number;
  trailingStop?: number;
}

// 平均回帰戦略設定
export interface MeanReversionStrategyConfig {
  type: typeof BotStrategyType.MEAN_REVERSION;
  token: Token;
  quoteToken: Token;
  movingAveragePeriod: number;
  deviationThreshold: number; // 標準偏差の倍数
  positionSize: number;
}

// ブレイクアウト戦略設定
export interface BreakoutStrategyConfig {
  type: typeof BotStrategyType.BREAKOUT;
  token: Token;
  quoteToken: Token;
  resistanceLevel: number;
  supportLevel: number;
  volumeThreshold: number;
  positionSize: number;
}

export type BotStrategyConfig = 
  | GridStrategyConfig
  | DCAStrategyConfig
  | ArbitrageStrategyConfig
  | MomentumStrategyConfig
  | MeanReversionStrategyConfig
  | BreakoutStrategyConfig;

// ボット設定
export interface BotConfig {
  id: string;
  name: string;
  strategy: BotStrategyConfig;
  maxDrawdown: number; // パーセント
  dailyLossLimit: number; // USD
  slippage: number; // パーセント
  enabled: boolean;
  createdAt: Date;
}

// ボット実行履歴
export interface BotExecutionLog {
  botId: string;
  timestamp: Date;
  action: 'BUY' | 'SELL' | 'HOLD';
  token: string;
  amount: number;
  price: number;
  profit?: number;
  reason: string;
  txHash?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

// ボット統計
export interface BotStats {
  botId: string;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: number;
  totalVolume: number;
  winRate: number;
  averageProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

class AutoTradingBotService {
  private bots = new Map<string, BotConfig>();
  private botIntervals = new Map<string, NodeJS.Timeout>();
  private botStatus = new Map<string, BotStatus>();
  private executionLogs = new Map<string, BotExecutionLog[]>();
  private botStats = new Map<string, BotStats>();

  // ボットの作成
  public createBot(config: Omit<BotConfig, 'id' | 'createdAt'>): BotConfig {
    const bot: BotConfig = {
      ...config,
      id: this.generateBotId(),
      createdAt: new Date(),
    };

    this.bots.set(bot.id, bot);
    this.botStatus.set(bot.id, BotStatus.IDLE);
    this.executionLogs.set(bot.id, []);
    this.initializeBotStats(bot.id);

    this.saveBots();
    return bot;
  }

  // ボットの開始
  public async startBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot || !bot.enabled) {
      throw new Error('ボットが見つからないか、無効です');
    }

    const currentStatus = this.botStatus.get(botId);
    if (currentStatus === BotStatus.RUNNING) {
      throw new Error('ボットは既に実行中です');
    }

    try {
      this.botStatus.set(botId, BotStatus.RUNNING);

      // 戦略に基づいて実行間隔を設定
      const interval = this.getExecutionInterval(bot.strategy);
      
      const intervalId = setInterval(async () => {
        await this.executeBot(botId);
      }, interval);

      this.botIntervals.set(botId, intervalId);

      // 初回実行
      await this.executeBot(botId);
    } catch (error) {
      this.botStatus.set(botId, BotStatus.ERROR);
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.HIGH,
        { method: 'startBot', botId }
      );
      throw error;
    }
  }

  // ボットの停止
  public stopBot(botId: string): void {
    const intervalId = this.botIntervals.get(botId);
    if (intervalId) {
      clearInterval(intervalId);
      this.botIntervals.delete(botId);
    }

    this.botStatus.set(botId, BotStatus.STOPPED);
  }

  // ボットの一時停止
  public pauseBot(botId: string): void {
    const intervalId = this.botIntervals.get(botId);
    if (intervalId) {
      clearInterval(intervalId);
      this.botIntervals.delete(botId);
    }

    this.botStatus.set(botId, BotStatus.PAUSED);
  }

  // ボットの再開
  public async resumeBot(botId: string): Promise<void> {
    const currentStatus = this.botStatus.get(botId);
    if (currentStatus !== BotStatus.PAUSED) {
      throw new Error('ボットは一時停止中ではありません');
    }

    await this.startBot(botId);
  }

  // ボットの削除
  public deleteBot(botId: string): void {
    this.stopBot(botId);
    this.bots.delete(botId);
    this.botStatus.delete(botId);
    this.executionLogs.delete(botId);
    this.botStats.delete(botId);
    this.saveBots();
  }

  // 全ボットの取得
  public getAllBots(): BotConfig[] {
    return Array.from(this.bots.values());
  }

  // ボットステータスの取得
  public getBotStatus(botId: string): BotStatus | null {
    return this.botStatus.get(botId) || null;
  }

  // ボット実行履歴の取得
  public getBotExecutionLogs(botId: string, limit: number = 100): BotExecutionLog[] {
    const logs = this.executionLogs.get(botId) || [];
    return logs.slice(-limit);
  }

  // ボット統計の取得
  public getBotStats(botId: string): BotStats | null {
    return this.botStats.get(botId) || null;
  }

  // ボットの実行
  private async executeBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot || this.botStatus.get(botId) !== BotStatus.RUNNING) {
      return;
    }

    try {
      await performanceService.measureAsync(`bot_execution_${botId}`, async () => {
        // 簡略化された実行ロジック（モック）
        const mockPrice = 100 + Math.random() * 20;
        const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
        
        if (Math.random() > 0.3) { // 70%の確率で取引実行
          await this.executeTrade(bot.id, {
            action: action as 'BUY' | 'SELL',
            token: 'SOL',
            amount: 10,
            price: mockPrice,
            reason: `モック取引: ${bot.strategy.type}戦略`,
          });
        }
      });
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        { method: 'executeBot', botId, strategy: bot.strategy.type }
      );

      // エラーをログに記録
      this.addExecutionLog(bot.id, {
        action: 'HOLD',
        token: '',
        amount: 0,
        price: 0,
        reason: `エラー: ${(error as Error).message}`,
        status: 'FAILED',
      });
    }
  }

  // 取引の実行
  private async executeTrade(
    botId: string,
    trade: Omit<BotExecutionLog, 'botId' | 'timestamp' | 'txHash' | 'status'>
  ): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) return;

    // リスク管理チェック
    if (!this.checkRiskLimits(botId)) {
      this.addExecutionLog(botId, {
        ...trade,
        status: 'FAILED',
        reason: `リスク管理: ${trade.reason}`,
      });
      return;
    }

    try {
      // 実際の取引実行（モック）
      const txHash = await this.mockExecuteTrade();

      // 実行ログに追加
      this.addExecutionLog(botId, {
        ...trade,
        txHash,
        status: 'SUCCESS',
      });

      // 統計を更新
      this.updateBotStats(botId, trade);

      // トランザクション履歴に記録
      await transactionHistoryService.addTransaction(
        txHash,
        TransactionType.SWAP,
        trade.action === 'BUY' ? 'USDC' : trade.token,
        {
          to: trade.action === 'BUY' ? trade.token : 'USDC',
          amount: trade.amount,
          value: trade.amount * trade.price,
          fee: 0.01,
          description: `自動取引ボット: ${bot.name} - ${trade.reason}`,
        }
      );
    } catch (error) {
      this.addExecutionLog(botId, {
        ...trade,
        status: 'FAILED',
        reason: `取引失敗: ${(error as Error).message}`,
      });
    }
  }

  // リスク管理チェック
  private checkRiskLimits(
    botId: string
  ): boolean {
    const bot = this.bots.get(botId);
    if (!bot) return false;

    const stats = this.botStats.get(botId);
    if (!stats) return true;

    // 最大ドローダウンチェック
    if (stats.maxDrawdown > bot.maxDrawdown) {
      return false;
    }

    // 日次損失制限チェック
    const todayLogs = (this.executionLogs.get(botId) || [])
      .filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      });

    const todayLoss = todayLogs
      .filter(log => log.profit && log.profit < 0)
      .reduce((sum, log) => sum + Math.abs(log.profit!), 0);

    if (todayLoss >= bot.dailyLossLimit) {
      return false;
    }

    return true;
  }

  // 実行ログの追加
  private addExecutionLog(
    botId: string,
    log: Omit<BotExecutionLog, 'botId' | 'timestamp'>
  ): void {
    const executionLog: BotExecutionLog = {
      ...log,
      botId,
      timestamp: new Date(),
    };

    const logs = this.executionLogs.get(botId) || [];
    logs.push(executionLog);
    this.executionLogs.set(botId, logs);

    // メモリ管理（最大1000件）
    if (logs.length > 1000) {
      logs.shift();
    }
  }

  // ボット統計の更新
  private updateBotStats(
    botId: string,
    trade: Omit<BotExecutionLog, 'botId' | 'timestamp' | 'txHash' | 'status'>
  ): void {
    const stats = this.botStats.get(botId) || this.initializeBotStats(botId);
    
    stats.totalTrades++;
    stats.totalVolume += trade.amount * trade.price;

    if (trade.profit) {
      if (trade.profit > 0) {
        stats.successfulTrades++;
      } else {
        stats.failedTrades++;
      }
      stats.totalProfit += trade.profit;
    }

    stats.winRate = stats.totalTrades > 0 
      ? (stats.successfulTrades / stats.totalTrades) * 100 
      : 0;
    
    stats.averageProfit = stats.totalTrades > 0 
      ? stats.totalProfit / stats.totalTrades 
      : 0;

    // シャープレシオの簡易計算
    if (stats.totalTrades > 20) {
      const logs = this.executionLogs.get(botId) || [];
      const returns = logs
        .filter(log => log.profit !== undefined)
        .map(log => log.profit! / (log.amount * log.price));
      
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const stdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      
      stats.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;
    }

    this.botStats.set(botId, stats);
  }

  // ボット統計の初期化
  private initializeBotStats(botId: string): BotStats {
    const stats: BotStats = {
      botId,
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
      totalVolume: 0,
      winRate: 0,
      averageProfit: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
    };

    this.botStats.set(botId, stats);
    return stats;
  }

  // 実行間隔の取得
  private getExecutionInterval(strategy: BotStrategyConfig): number {
    switch (strategy.type) {
      case BotStrategyType.GRID:
        return 30000; // 30秒
      case BotStrategyType.DCA:
        return (strategy as DCAStrategyConfig).interval * 60000;
      case BotStrategyType.ARBITRAGE:
        return 10000; // 10秒
      case BotStrategyType.MOMENTUM:
        return 60000; // 1分
      case BotStrategyType.MEAN_REVERSION:
        return 300000; // 5分
      case BotStrategyType.BREAKOUT:
        return 60000; // 1分
      default:
        return 60000;
    }
  }

  // モック取引実行
  private async mockExecuteTrade(): Promise<string> {
    // 実際の実装では swapExecutionService を使用
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }

  // ボットIDの生成
  private generateBotId(): string {
    return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ボット設定の保存
  private saveBots(): void {
    const botsArray = Array.from(this.bots.values());
    localStorage.setItem('trading_bots', JSON.stringify(botsArray));
  }

  // ボット設定の読み込み
  public loadBots(): void {
    const saved = localStorage.getItem('trading_bots');
    if (saved) {
      try {
        const bots = JSON.parse(saved) as BotConfig[];
        bots.forEach(bot => {
          this.bots.set(bot.id, {
            ...bot,
            createdAt: new Date(bot.createdAt),
          });
          this.botStatus.set(bot.id, BotStatus.IDLE);
          this.executionLogs.set(bot.id, []);
          this.initializeBotStats(bot.id);
        });
      } catch (error) {
        console.error('ボット設定の読み込みエラー:', error);
      }
    }
  }
}

// シングルトンインスタンス
export const autoTradingBotService = new AutoTradingBotService();

export default AutoTradingBotService;