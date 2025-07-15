import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { getErrorMessage } from '../utils';

// サービスのヘルス状態
export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN',
} as const;

export type HealthStatus = typeof HealthStatus[keyof typeof HealthStatus];

// ヘルスチェック結果
export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  responseTime: number;
  error?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// サービス設定
export interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  healthCheck: () => Promise<boolean>;
  critical: boolean; // クリティカルサービスかどうか
}

// 全体のヘルス状態
export interface SystemHealth {
  overallStatus: HealthStatus;
  services: HealthCheckResult[];
  criticalIssues: string[];
  lastUpdated: number;
}

class HealthCheckService {
  private services: Map<string, ServiceConfig> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(health: SystemHealth) => void> = new Set();
  private isRunning = false;

  // サービスの登録
  public registerService(config: ServiceConfig): void {
    this.services.set(config.name, config);
    console.log(`Health check registered for service: ${config.name}`);
  }

  // ヘルスチェック開始
  public start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      console.warn('Health check is already running');
      return;
    }

    this.isRunning = true;
    
    // 初回チェック
    this.performHealthChecks();

    // 定期チェック
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);

    console.log(`Health check started with interval: ${intervalMs}ms`);
  }

  // ヘルスチェック停止
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Health check stopped');
  }

  // 手動ヘルスチェック実行
  public async performHealthChecks(): Promise<SystemHealth> {
    const results: HealthCheckResult[] = [];
    const checkPromises: Promise<HealthCheckResult>[] = [];

    // 全サービスのヘルスチェックを並行実行
    for (const [serviceName, config] of this.services.entries()) {
      checkPromises.push(this.checkServiceHealth(serviceName, config));
    }

    // 全ての結果を待機
    try {
      const allResults = await Promise.allSettled(checkPromises);
      
      allResults.forEach((result, index) => {
        const serviceName = Array.from(this.services.keys())[index];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
          this.lastResults.set(serviceName, result.value);
        } else {
          // ヘルスチェック自体が失敗した場合
          const failedResult: HealthCheckResult = {
            service: serviceName,
            status: HealthStatus.UNHEALTHY,
            responseTime: 0,
            error: getErrorMessage(result.reason),
            timestamp: Date.now(),
          };
          results.push(failedResult);
          this.lastResults.set(serviceName, failedResult);
        }
      });
    } catch (error) {
      console.error('Health check failed:', getErrorMessage(error));
    }

    const systemHealth = this.calculateSystemHealth(results);
    
    // リスナーに通知
    this.notifyListeners(systemHealth);

    return systemHealth;
  }

  // 個別サービスのヘルスチェック
  private async checkServiceHealth(
    serviceName: string,
    config: ServiceConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await Promise.race([
        config.healthCheck(),
        this.createTimeoutPromise(config.timeout),
      ]);

      const responseTime = Date.now() - startTime;
      const status = isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;

      return {
        service: serviceName,
        status,
        responseTime,
        timestamp: Date.now(),
        metadata: {
          url: config.url,
          critical: config.critical,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);

      // エラーハンドリングサービスに報告
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        config.critical ? ErrorSeverity.CRITICAL : ErrorSeverity.MEDIUM,
        { service: serviceName, healthCheck: true }
      );

      return {
        service: serviceName,
        status: HealthStatus.UNHEALTHY,
        responseTime,
        error: errorMessage,
        timestamp: Date.now(),
        metadata: {
          url: config.url,
          critical: config.critical,
        },
      };
    }
  }

  // タイムアウトプロミスの作成
  private createTimeoutPromise(timeoutMs: number): Promise<boolean> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  // システム全体のヘルス状態計算
  private calculateSystemHealth(results: HealthCheckResult[]): SystemHealth {
    const criticalIssues: string[] = [];
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    results.forEach(result => {
      switch (result.status) {
        case HealthStatus.HEALTHY:
          healthyCount++;
          break;
        case HealthStatus.DEGRADED:
          degradedCount++;
          break;
        case HealthStatus.UNHEALTHY:
          unhealthyCount++;
          // クリティカルサービスが不健全な場合
          if (result.metadata?.critical) {
            criticalIssues.push(`Critical service ${result.service} is unhealthy: ${result.error || 'Unknown error'}`);
          }
          break;
      }
    });

    // 全体の状態を決定
    let overallStatus: HealthStatus;
    
    if (criticalIssues.length > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (unhealthyCount > 0 || degradedCount > healthyCount) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (healthyCount > 0) {
      overallStatus = HealthStatus.HEALTHY;
    } else {
      overallStatus = HealthStatus.UNKNOWN;
    }

    return {
      overallStatus,
      services: results,
      criticalIssues,
      lastUpdated: Date.now(),
    };
  }

  // 特定サービスの最新状態取得
  public getServiceHealth(serviceName: string): HealthCheckResult | null {
    return this.lastResults.get(serviceName) || null;
  }

  // 全サービスの最新状態取得
  public getCurrentSystemHealth(): SystemHealth {
    const results = Array.from(this.lastResults.values());
    return this.calculateSystemHealth(results);
  }

  // ヘルスチェックリスナーの追加
  public addHealthListener(listener: (health: SystemHealth) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // リスナーへの通知
  private notifyListeners(health: SystemHealth): void {
    this.listeners.forEach(listener => {
      try {
        listener(health);
      } catch (error) {
        console.error('Error in health listener:', getErrorMessage(error));
      }
    });
  }

  // サービスの削除
  public unregisterService(serviceName: string): boolean {
    const deleted = this.services.delete(serviceName);
    this.lastResults.delete(serviceName);
    return deleted;
  }

  // 統計情報の取得
  public getHealthStats(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    averageResponseTime: number;
  } {
    const results = Array.from(this.lastResults.values());
    
    const stats = {
      totalServices: results.length,
      healthyServices: 0,
      degradedServices: 0,
      unhealthyServices: 0,
      averageResponseTime: 0,
    };

    if (results.length === 0) return stats;

    let totalResponseTime = 0;

    results.forEach(result => {
      totalResponseTime += result.responseTime;
      
      switch (result.status) {
        case HealthStatus.HEALTHY:
          stats.healthyServices++;
          break;
        case HealthStatus.DEGRADED:
          stats.degradedServices++;
          break;
        case HealthStatus.UNHEALTHY:
          stats.unhealthyServices++;
          break;
      }
    });

    stats.averageResponseTime = totalResponseTime / results.length;

    return stats;
  }
}

// シングルトンインスタンス
export const healthCheckService = new HealthCheckService();

// 共通のヘルスチェック関数
export const commonHealthChecks = {
  // HTTP エンドポイントのヘルスチェック
  httpEndpoint: (url: string, timeout: number = 5000) => async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // WebSocket接続のヘルスチェック
  websocket: (url: string, timeout: number = 5000) => async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        const timeoutId = setTimeout(() => {
          ws.close();
          resolve(false);
        }, timeout);

        ws.onopen = () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeoutId);
          resolve(false);
        };
      } catch (error) {
        resolve(false);
      }
    });
  },

  // RPC エンドポイントのヘルスチェック
  rpcEndpoint: (url: string) => async (): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
          params: [],
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return !data.error;
    } catch (error) {
      return false;
    }
  },
};

export default HealthCheckService;