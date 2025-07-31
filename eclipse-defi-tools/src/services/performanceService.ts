import { getErrorMessage } from '../utils';
import { debounce, throttle } from '../utils/performance';

// パフォーマンス測定の結果
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

// リクエストバッチング用の設定
interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
}

// パフォーマンス統計
interface PerformanceStats {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  batchedRequests: number;
  cacheHitRate: number;
}

// バッチリクエストのキュー項目
interface BatchQueueItem<T> {
  key: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private requestStats = {
    total: 0,
    errors: 0,
    totalDuration: 0,
    batchedRequests: 0,
    cacheHits: 0,
    cacheTotal: 0,
  };
  
  // バッチングキュー
  private batchQueues: Map<string, BatchQueueItem<unknown>[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  // パフォーマンス測定開始
  public startMeasurement(name: string, metadata?: Record<string, unknown>): void {
    const startTime = performance.now();
    this.activeTimers.set(name, startTime);
    
    if (metadata) {
      console.debug(`Performance measurement started: ${name}`, metadata);
    }
  }

  // パフォーマンス測定終了
  public endMeasurement(name: string, metadata?: Record<string, unknown>): PerformanceMetric | null {
    const endTime = performance.now();
    const startTime = this.activeTimers.get(name);
    
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return null;
    }
    
    this.activeTimers.delete(name);
    
    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration: endTime - startTime,
      metadata,
    };
    
    this.metrics.push(metric);
    this.requestStats.total++;
    this.requestStats.totalDuration += metric.duration;
    
    // メトリクス履歴のサイズ制限
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500); // 新しい500件を保持
    }
    
    console.debug(`Performance measurement completed: ${name} (${metric.duration.toFixed(2)}ms)`, metadata);
    
    return metric;
  }

  // 関数のパフォーマンスを測定
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startMeasurement(name, metadata);
    
    try {
      const result = await fn();
      this.endMeasurement(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.requestStats.errors++;
      this.endMeasurement(name, { ...metadata, success: false, error: getErrorMessage(error) });
      throw error;
    }
  }

  // 同期関数のパフォーマンスを測定
  public measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startMeasurement(name, metadata);
    
    try {
      const result = fn();
      this.endMeasurement(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.requestStats.errors++;
      this.endMeasurement(name, { ...metadata, success: false, error: getErrorMessage(error) });
      throw error;
    }
  }

  // リクエストのバッチング
  public async batchRequest<T>(
    batchKey: string,
    requestKey: string,
    batchFunction: (keys: string[]) => Promise<Map<string, T>>,
    config: BatchConfig = { maxBatchSize: 10, maxWaitTime: 100 }
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // バッチキューの初期化
      if (!this.batchQueues.has(batchKey)) {
        this.batchQueues.set(batchKey, []);
      }
      
      const queue = this.batchQueues.get(batchKey)!;
      
      // キューに追加
      queue.push({
        key: requestKey,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
      });
      
      // バッチサイズに達した場合はすぐに実行
      if (queue.length >= config.maxBatchSize) {
        this.executeBatch(batchKey, batchFunction);
        return;
      }
      
      // タイマーがない場合は設定
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.executeBatch(batchKey, batchFunction);
        }, config.maxWaitTime);
        
        this.batchTimers.set(batchKey, timer);
      }
    });
  }

  // バッチの実行
  private async executeBatch<T>(
    batchKey: string,
    batchFunction: (keys: string[]) => Promise<Map<string, T>>
  ): Promise<void> {
    const queue = this.batchQueues.get(batchKey);
    if (!queue || queue.length === 0) return;
    
    // キューをクリア
    this.batchQueues.set(batchKey, []);
    
    // タイマーをクリア
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }
    
    const keys = queue.map(item => item.key);
    this.requestStats.batchedRequests += keys.length;
    
    try {
      this.startMeasurement(`batch_${batchKey}`);
      const results = await batchFunction(keys);
      this.endMeasurement(`batch_${batchKey}`, { batchSize: keys.length });
      
      // 結果を各プロミスに配布
      for (const item of queue) {
        const result = results.get(item.key);
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result found for key: ${item.key}`));
        }
      }
    } catch (error) {
      // エラーの場合は全てのプロミスを reject
      const errorMessage = getErrorMessage(error);
      for (const item of queue) {
        item.reject(new Error(`Batch request failed: ${errorMessage}`));
      }
    }
  }

  // デバウンスされた関数の作成
  public createDebouncedFunction<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): T {
    return debounce(fn, delay) as T;
  }

  // スロットルされた関数の作成
  public createThrottledFunction<T extends (...args: unknown[]) => void>(
    fn: T,
    limit: number
  ): T {
    return throttle(fn, limit) as T;
  }

  // キャッシュヒット率を記録
  public recordCacheHit(): void {
    this.requestStats.cacheHits++;
    this.requestStats.cacheTotal++;
  }

  // キャッシュミスを記録
  public recordCacheMiss(): void {
    this.requestStats.cacheTotal++;
  }

  // 統計情報の取得
  public getStats(): PerformanceStats {
    const averageResponseTime = this.requestStats.total > 0 
      ? this.requestStats.totalDuration / this.requestStats.total 
      : 0;
    
    const errorRate = this.requestStats.total > 0 
      ? (this.requestStats.errors / this.requestStats.total) * 100 
      : 0;
    
    const cacheHitRate = this.requestStats.cacheTotal > 0 
      ? (this.requestStats.cacheHits / this.requestStats.cacheTotal) * 100 
      : 0;
    
    return {
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      totalRequests: this.requestStats.total,
      errorRate: Math.round(errorRate * 100) / 100,
      batchedRequests: this.requestStats.batchedRequests,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    };
  }

  // 特定の測定名の統計取得
  public getMetricStats(name: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    errorCount: number;
  } {
    const filteredMetrics = this.metrics.filter(m => m.name === name);
    
    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorCount: 0,
      };
    }
    
    const durations = filteredMetrics.map(m => m.duration);
    const errorCount = filteredMetrics.filter(m => m.metadata?.success === false).length;
    
    return {
      count: filteredMetrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      errorCount,
    };
  }

  // 最近のメトリクスを取得
  public getRecentMetrics(limit: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  // 遅いリクエストの検出
  public getSlowRequests(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  // 統計のリセット
  public resetStats(): void {
    this.metrics = [];
    this.requestStats = {
      total: 0,
      errors: 0,
      totalDuration: 0,
      batchedRequests: 0,
      cacheHits: 0,
      cacheTotal: 0,
    };
    this.activeTimers.clear();
  }

  // メトリクスを記録
  public recordMetric(
    name: string,
    startTime: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime: startTime + duration,
      duration,
      metadata,
    };
    
    this.metrics.push(metric);
    
    // メトリクス履歴のサイズ制限
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500); // 新しい500件を保持
    }
  }

  // Web Vitals のようなメトリクスの監視
  public monitorWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              this.metrics.push({
                name: 'FCP',
                startTime: 0,
                endTime: entry.startTime,
                duration: entry.startTime,
                metadata: { type: 'web-vital' },
              });
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              this.metrics.push({
                name: 'LCP',
                startTime: 0,
                endTime: entry.startTime,
                duration: entry.startTime,
                metadata: { type: 'web-vital' },
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.warn('Web Vitals monitoring failed:', getErrorMessage(error));
      }
    }
  }

  // メモリ使用量の監視
  public getMemoryInfo(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    if ('memory' in performance) {
      return (performance as { memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
    }
    return null;
  }
}

// シングルトンインスタンス
export const performanceService = new PerformanceService();

// Web Vitals監視を自動開始
if (typeof window !== 'undefined') {
  performanceService.monitorWebVitals();
}

export default PerformanceService;