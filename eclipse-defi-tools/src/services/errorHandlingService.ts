import { getErrorMessage } from '../utils';
import { performanceService } from './performanceService';

// エラーの種類
export const ErrorType = {
  NETWORK: 'NETWORK',
  RPC: 'RPC',
  WALLET: 'WALLET',
  API: 'API',
  VALIDATION: 'VALIDATION',
  SYSTEM: 'SYSTEM',
  USER: 'USER',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

// エラーの重要度
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

// エラー情報
export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: Error;
  context?: Record<string, any>;
  timestamp: number;
  resolved: boolean;
  retryCount: number;
  maxRetries: number;
}

// 再試行設定
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

// エラーレポート
export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorInfo[];
  criticalErrors: ErrorInfo[];
  mostCommonErrors: Array<{ message: string; count: number }>;
}

class ErrorHandlingService {
  private errors: Map<string, ErrorInfo> = new Map();
  private errorListeners: Set<(error: ErrorInfo) => void> = new Set();
  private resolvedListeners: Set<(error: ErrorInfo) => void> = new Set();

  // エラーの記録と処理
  public async handleError(
    error: Error,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    retryConfig?: RetryConfig
  ): Promise<ErrorInfo> {
    const errorId = this.generateErrorId();
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      type,
      severity,
      message: getErrorMessage(error),
      originalError: error,
      context,
      timestamp: Date.now(),
      resolved: false,
      retryCount: 0,
      maxRetries: retryConfig?.maxRetries || 0,
    };

    this.errors.set(errorId, errorInfo);

    // パフォーマンス監視にエラーを記録
    performanceService.recordCacheMiss(); // エラーはキャッシュミスとして扱う

    // コンソールログ
    this.logError(errorInfo);

    // リスナーに通知
    this.notifyErrorListeners(errorInfo);

    // 自動再試行
    if (retryConfig && retryConfig.maxRetries > 0) {
      this.scheduleRetry(errorInfo, retryConfig);
    }

    // クリティカルエラーの場合は即座に通知
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(errorInfo);
    }

    return errorInfo;
  }

  // 自動再試行付きの関数実行
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryConfig: RetryConfig,
    errorType: ErrorType = ErrorType.SYSTEM,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 再試行条件をチェック
        if (retryConfig.retryCondition && !retryConfig.retryCondition(lastError)) {
          break;
        }

        // 最後の試行でない場合は待機
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt, retryConfig);
          await this.sleep(delay);
          
          console.log(`Retrying function execution (attempt ${attempt + 1}/${retryConfig.maxRetries}) after ${delay}ms`);
        }
      }
    }

    // 全ての再試行が失敗した場合
    const errorInfo = await this.handleError(
      lastError!,
      errorType,
      ErrorSeverity.HIGH,
      { ...context, totalAttempts: retryConfig.maxRetries + 1 }
    );

    throw new Error(`Function failed after ${retryConfig.maxRetries + 1} attempts: ${errorInfo.message}`);
  }

  // ネットワークエラーの処理
  public async handleNetworkError(
    error: Error,
    operation: string,
    context?: Record<string, any>
  ): Promise<ErrorInfo> {
    const retryConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryCondition: (err) => this.isRetryableNetworkError(err),
    };

    return this.handleError(
      error,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      { operation, ...context },
      retryConfig
    );
  }

  // RPCエラーの処理
  public async handleRpcError(
    error: Error,
    method: string,
    context?: Record<string, any>
  ): Promise<ErrorInfo> {
    const retryConfig: RetryConfig = {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 8000,
      backoffMultiplier: 2,
      retryCondition: (err) => this.isRetryableRpcError(err),
    };

    return this.handleError(
      error,
      ErrorType.RPC,
      ErrorSeverity.HIGH,
      { method, ...context },
      retryConfig
    );
  }

  // ウォレットエラーの処理
  public async handleWalletError(
    error: Error,
    action: string,
    context?: Record<string, any>
  ): Promise<ErrorInfo> {
    // ウォレットエラーは通常再試行しない
    return this.handleError(
      error,
      ErrorType.WALLET,
      ErrorSeverity.HIGH,
      { action, ...context }
    );
  }

  // APIエラーの処理
  public async handleApiError(
    error: Error,
    endpoint: string,
    context?: Record<string, any>
  ): Promise<ErrorInfo> {
    const retryConfig: RetryConfig = {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryCondition: (err) => this.isRetryableApiError(err),
    };

    return this.handleError(
      error,
      ErrorType.API,
      ErrorSeverity.MEDIUM,
      { endpoint, ...context },
      retryConfig
    );
  }

  // バリデーションエラーの処理
  public handleValidationError(
    message: string,
    field?: string,
    value?: any
  ): ErrorInfo {
    const error = new Error(message);
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      originalError: error,
      context: { field, value },
      timestamp: Date.now(),
      resolved: false,
      retryCount: 0,
      maxRetries: 0,
    };

    this.errors.set(errorInfo.id, errorInfo);
    this.logError(errorInfo);
    this.notifyErrorListeners(errorInfo);

    return errorInfo;
  }

  // エラーの解決マーク
  public resolveError(errorId: string, resolution?: string): boolean {
    const errorInfo = this.errors.get(errorId);
    if (!errorInfo) return false;

    errorInfo.resolved = true;
    if (resolution) {
      errorInfo.context = { ...errorInfo.context, resolution };
    }

    this.errors.set(errorId, errorInfo);
    this.notifyResolvedListeners(errorInfo);

    console.log(`Error resolved: ${errorId} - ${resolution || 'No details'}`);
    return true;
  }

  // エラーレポートの生成
  public generateErrorReport(): ErrorReport {
    const allErrors = Array.from(this.errors.values());
    const recentErrors = allErrors
      .filter(e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000) // 24時間以内
      .sort((a, b) => b.timestamp - a.timestamp);

    const criticalErrors = allErrors.filter(e => e.severity === ErrorSeverity.CRITICAL);

    // エラーの種類別カウント
    const errorsByType: Record<ErrorType, number> = Object.values(ErrorType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<ErrorType, number>
    );

    // エラーの重要度別カウント
    const errorsBySeverity: Record<ErrorSeverity, number> = Object.values(ErrorSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<ErrorSeverity, number>
    );

    allErrors.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });

    // よくあるエラーメッセージの集計
    const messageCount = new Map<string, number>();
    allErrors.forEach(error => {
      const count = messageCount.get(error.message) || 0;
      messageCount.set(error.message, count + 1);
    });

    const mostCommonErrors = Array.from(messageCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors: allErrors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: recentErrors.slice(0, 50),
      criticalErrors,
      mostCommonErrors,
    };
  }

  // エラーリスナーの追加
  public addErrorListener(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  // 解決リスナーの追加
  public addResolvedListener(listener: (error: ErrorInfo) => void): () => void {
    this.resolvedListeners.add(listener);
    return () => this.resolvedListeners.delete(listener);
  }

  // エラーのクリア
  public clearErrors(olderThan?: number): number {
    const cutoff = olderThan || Date.now() - 7 * 24 * 60 * 60 * 1000; // 7日前
    let clearedCount = 0;

    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff && error.resolved) {
        this.errors.delete(id);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  // 再試行のスケジューリング
  private async scheduleRetry(errorInfo: ErrorInfo, retryConfig: RetryConfig): Promise<void> {
    if (errorInfo.retryCount >= errorInfo.maxRetries) return;

    const delay = this.calculateDelay(errorInfo.retryCount, retryConfig);
    
    setTimeout(async () => {
      if (!errorInfo.resolved && errorInfo.retryCount < errorInfo.maxRetries) {
        errorInfo.retryCount++;
        console.log(`Attempting retry ${errorInfo.retryCount}/${errorInfo.maxRetries} for error: ${errorInfo.id}`);
        
        // 実際の再試行ロジックはここで実装されるべき
        // 現在はログのみ
      }
    }, delay);
  }

  // 遅延時間の計算
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  // 再試行可能なネットワークエラーかチェック
  private isRetryableNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch')
    );
  }

  // 再試行可能なRPCエラーかチェック
  private isRetryableRpcError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('server error') ||
      message.includes('503') ||
      message.includes('502')
    );
  }

  // 再試行可能なAPIエラーかチェック
  private isRetryableApiError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }

  // クリティカルエラーの処理
  private handleCriticalError(errorInfo: ErrorInfo): void {
    console.error('CRITICAL ERROR:', errorInfo);
    
    // 必要に応じて外部サービスに送信
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Critical Error', {
          body: `Critical error occurred: ${errorInfo.message}`,
          icon: '/favicon.ico',
        });
      }
    }
  }

  // エラーのログ出力
  private logError(errorInfo: ErrorInfo): void {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorInfo);
        break;
      case 'warn':
        console.warn(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }

  // ログレベルの決定
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }

  // エラーリスナーへの通知
  private notifyErrorListeners(errorInfo: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  // 解決リスナーへの通知
  private notifyResolvedListeners(errorInfo: ErrorInfo): void {
    this.resolvedListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error in resolved listener:', error);
      }
    });
  }

  // エラーIDの生成
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // スリープユーティリティ
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンス
export const errorHandlingService = new ErrorHandlingService();

// 共通のリトライ設定
export const commonRetryConfigs = {
  network: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  api: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },
  rpc: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
  },
};

export default ErrorHandlingService;