import React, { useState, useEffect } from 'react';
import { performanceService } from '../../services/performanceService';
import { cacheService, apiCache, priceCache, poolCache, userDataCache } from '../../services/cacheService';

interface CacheInfo {
  name: string;
  instance: any;
  stats: any;
}

export const PerformanceDashboard: React.FC = () => {
  const [performanceStats, setPerformanceStats] = useState(performanceService.getStats());
  const [cacheStats, setCacheStats] = useState<CacheInfo[]>([]);
  const [recentMetrics, setRecentMetrics] = useState(performanceService.getRecentMetrics(20));
  const [slowRequests, setSlowRequests] = useState(performanceService.getSlowRequests());
  const [memoryInfo, setMemoryInfo] = useState(performanceService.getMemoryInfo());

  useEffect(() => {
    const updateStats = () => {
      setPerformanceStats(performanceService.getStats());
      setRecentMetrics(performanceService.getRecentMetrics(20));
      setSlowRequests(performanceService.getSlowRequests());
      setMemoryInfo(performanceService.getMemoryInfo());
      
      // キャッシュ統計の更新
      const cacheInfos: CacheInfo[] = [
        { name: 'Default Cache', instance: cacheService, stats: cacheService.getStats() },
        { name: 'API Cache', instance: apiCache, stats: apiCache.getStats() },
        { name: 'Price Cache', instance: priceCache, stats: priceCache.getStats() },
        { name: 'Pool Cache', instance: poolCache, stats: poolCache.getStats() },
        { name: 'User Data Cache', instance: userDataCache, stats: userDataCache.getStats() },
      ];
      setCacheStats(cacheInfos);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // 5秒間隔で更新

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = (cacheInstance: any) => {
    cacheInstance.clear();
    // 統計を即座に更新
    const cacheInfos: CacheInfo[] = [
      { name: 'Default Cache', instance: cacheService, stats: cacheService.getStats() },
      { name: 'API Cache', instance: apiCache, stats: apiCache.getStats() },
      { name: 'Price Cache', instance: priceCache, stats: priceCache.getStats() },
      { name: 'Pool Cache', instance: poolCache, stats: poolCache.getStats() },
      { name: 'User Data Cache', instance: userDataCache, stats: userDataCache.getStats() },
    ];
    setCacheStats(cacheInfos);
  };

  const handleResetStats = () => {
    performanceService.resetStats();
    setPerformanceStats(performanceService.getStats());
    setRecentMetrics([]);
    setSlowRequests([]);
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            パフォーマンス監視
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            アプリケーションのパフォーマンスとキャッシュ状況を監視
          </p>
        </div>
        <button
          onClick={handleResetStats}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          統計リセット
        </button>
      </div>

      {/* パフォーマンス統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-300">平均応答時間</p>
          <p className={`text-2xl font-bold ${getPerformanceColor(performanceStats.averageResponseTime, { good: 100, warning: 500 })}`}>
            {performanceStats.averageResponseTime.toFixed(1)}ms
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-300">総リクエスト数</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {performanceStats.totalRequests.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-300">エラー率</p>
          <p className={`text-2xl font-bold ${getPerformanceColor(performanceStats.errorRate, { good: 1, warning: 5 })}`}>
            {performanceStats.errorRate.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-300">バッチ処理数</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {performanceStats.batchedRequests.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-300">キャッシュ率</p>
          <p className={`text-2xl font-bold ${getPerformanceColor(100 - performanceStats.cacheHitRate, { good: 20, warning: 50 })}`}>
            {performanceStats.cacheHitRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* メモリ情報 */}
      {memoryInfo && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            メモリ使用状況
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">使用中</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">総容量</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">上限</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* キャッシュ統計 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          キャッシュ統計
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cacheStats.map((cache, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">{cache.name}</h4>
                <button
                  onClick={() => handleClearCache(cache.instance)}
                  className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                >
                  クリア
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">エントリ数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cache.stats.entries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">ヒット数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cache.stats.hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">ミス数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cache.stats.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">ヒット率:</span>
                  <span className={`font-medium ${getPerformanceColor(100 - cache.stats.hitRate, { good: 20, warning: 50 })}`}>
                    {cache.stats.hitRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">メモリ使用量:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cache.stats.memoryUsage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近のメトリクス */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          最近のメトリクス (直近20件)
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          {recentMetrics.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">メトリクスがありません</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{metric.name}</span>
                    {metric.metadata?.success === false && (
                      <span className="text-red-600 dark:text-red-400 text-xs">ERROR</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getPerformanceColor(metric.duration, { good: 100, warning: 500 })}`}>
                      {metric.duration.toFixed(1)}ms
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(metric.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 遅いリクエスト */}
      {slowRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            遅いリクエスト (1秒以上)
          </h3>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {slowRequests.slice(0, 10).map((metric, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{metric.name}</span>
                    {metric.metadata && (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {JSON.stringify(metric.metadata)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {metric.duration.toFixed(1)}ms
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(metric.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;