// パフォーマンス最適化ユーティリティ

// デバウンス関数
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// スロットル関数
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// メモ化関数
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result as ReturnType<T>);
    return result;
  }) as T;
}

// LRUキャッシュクラス
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // アクセスされたアイテムを最新に移動
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 最も古いアイテムを削除
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 重複排除関数
export function deduplicateArray<T>(
  array: T[],
  keyFn: (item: T) => string | number = (item) => JSON.stringify(item)
): T[] {
  const seen = new Set<string | number>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 配列のバッチ処理
export function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const batches: T[][] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return Promise.all(batches.map(processor)).then(results => 
    results.flat()
  );
}

// 遅延実行
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// リトライ機能
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt);
    }
  }
  
  throw lastError!;
}

// 並列処理制限
export function limitConcurrency<T>(
  promises: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    const errors: Error[] = [];
    let completed = 0;
    let started = 0;
    
    const startNext = () => {
      if (started >= promises.length) return;
      
      const index = started++;
      const promise = promises[index];
      
      promise()
        .then(result => {
          results[index] = result;
        })
        .catch(error => {
          errors[index] = error;
        })
        .finally(() => {
          completed++;
          
          if (completed === promises.length) {
            if (errors.length > 0) {
              reject(errors);
            } else {
              resolve(results);
            }
          } else {
            startNext();
          }
        });
    };
    
    // 初期実行
    for (let i = 0; i < Math.min(limit, promises.length); i++) {
      startNext();
    }
  });
}

// Virtual scrolling用のアイテム計算
export function calculateVirtualItems(
  containerHeight: number,
  itemHeight: number,
  itemCount: number,
  scrollTop: number,
  overscan: number = 5
): {
  startIndex: number;
  endIndex: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
} {
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(visibleStartIndex + visibleItemCount, itemCount - 1);
  
  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(itemCount - 1, visibleEndIndex + overscan);
  
  return {
    startIndex,
    endIndex,
    visibleStartIndex,
    visibleEndIndex,
    totalHeight: itemCount * itemHeight,
  };
}

// パフォーマンス測定
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  start(key: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const existing = this.metrics.get(key) || [];
      existing.push(duration);
      this.metrics.set(key, existing);
    };
  }
  
  getMetrics(key: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } | null {
    const durations = this.metrics.get(key);
    if (!durations || durations.length === 0) return null;
    
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: durations.reduce((a, b) => a + b, 0),
    };
  }
  
  clear(key?: string): void {
    if (key) {
      this.metrics.delete(key);
    } else {
      this.metrics.clear();
    }
  }
}

// グローバルパフォーマンスモニター
export const performanceMonitor = new PerformanceMonitor();