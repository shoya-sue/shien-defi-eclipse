import { getErrorMessage } from '../utils';

// キャッシュエントリの型定義
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// キャッシュ設定
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  persistent?: boolean; // Use localStorage for persistence
}

// 統計情報
interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: string;
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private stats = { hits: 0, misses: 0 };
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 1000, persistent: false }) {
    this.config = {
      ttl: config.ttl,
      maxSize: config.maxSize || 1000,
      persistent: config.persistent || false,
    };

    // 永続化が有効な場合、初期化時にlocalStorageから復元
    if (this.config.persistent) {
      this.loadFromStorage();
    }

    // 定期的な期限切れエントリのクリーンアップ
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5分間隔
  }

  // データをキャッシュに保存
  public set<T>(key: string, data: T, customTtl?: number): void {
    try {
      const ttl = customTtl || this.config.ttl;
      const now = Date.now();
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };

      // サイズ制限チェック
      if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
        this.evictOldest();
      }

      this.cache.set(key, entry);

      // 永続化
      if (this.config.persistent) {
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Cache set error:', getErrorMessage(error));
    }
  }

  // キャッシュからデータを取得
  public get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // 有効期限チェック
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data as T;
    } catch (error) {
      console.error('Cache get error:', getErrorMessage(error));
      this.stats.misses++;
      return null;
    }
  }

  // キャッシュされた関数の実行（メモ化）
  public async memoize<T>(
    key: string,
    fn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // キャッシュから取得を試行
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // キャッシュにない場合は関数を実行
    try {
      const result = await fn();
      this.set(key, result, customTtl);
      return result;
    } catch (error) {
      throw new Error(`Memoized function failed: ${getErrorMessage(error)}`);
    }
  }

  // 同期版のメモ化
  public memoizeSync<T>(
    key: string,
    fn: () => T,
    customTtl?: number
  ): T {
    // キャッシュから取得を試行
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // キャッシュにない場合は関数を実行
    try {
      const result = fn();
      this.set(key, result, customTtl);
      return result;
    } catch (error) {
      throw new Error(`Memoized sync function failed: ${getErrorMessage(error)}`);
    }
  }

  // 特定のキーを削除
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (this.config.persistent && deleted) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  // パターンに一致するキーを削除
  public deletePattern(pattern: string | RegExp): number {
    let deletedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (this.config.persistent && deletedCount > 0) {
      this.saveToStorage();
    }
    
    return deletedCount;
  }

  // キャッシュをクリア
  public clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    
    if (this.config.persistent) {
      this.clearStorage();
    }
  }

  // 期限切れエントリのクリーンアップ
  public cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (this.config.persistent && cleanedCount > 0) {
      this.saveToStorage();
    }
    
    return cleanedCount;
  }

  // 統計情報の取得
  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // メモリ使用量の推定
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2; // 文字列のメモリ使用量（概算）
    }
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.formatBytes(memoryUsage),
    };
  }

  // キーの存在確認
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // 有効期限チェック
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // 全キーの取得
  public keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }

  // TTL（残り生存時間）の取得
  public getTtl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    
    const remaining = entry.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  // TTLの更新
  public updateTtl(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.expiresAt = Date.now() + ttl;
    this.cache.set(key, entry);
    
    if (this.config.persistent) {
      this.saveToStorage();
    }
    
    return true;
  }

  // 最も古いエントリを削除（LRU風）
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // localStorageへの保存
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('cache_service_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', getErrorMessage(error));
    }
  }

  // localStorageからの読み込み
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('cache_service_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
        
        // 期限切れエントリをクリーンアップ
        this.cleanup();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', getErrorMessage(error));
    }
  }

  // localStorageのクリア
  private clearStorage(): void {
    try {
      localStorage.removeItem('cache_service_data');
    } catch (error) {
      console.error('Failed to clear cache storage:', getErrorMessage(error));
    }
  }

  // バイト数の人間readable形式変換
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// プリセット構成のキャッシュインスタンス
export const apiCache = new CacheService({
  ttl: 30 * 1000, // 30秒
  maxSize: 500,
  persistent: false,
});

export const priceCache = new CacheService({
  ttl: 60 * 1000, // 1分
  maxSize: 100,
  persistent: true,
});

export const poolCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5分
  maxSize: 200,
  persistent: true,
});

export const userDataCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10分
  maxSize: 50,
  persistent: true,
});

// デフォルトキャッシュインスタンス
export const cacheService = new CacheService();

export default CacheService;