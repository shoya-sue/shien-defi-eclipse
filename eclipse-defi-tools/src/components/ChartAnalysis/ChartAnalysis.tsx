import React, { useState, useEffect, useCallback } from 'react';
import {
  chartAnalysisService,
  TimeFrame,
  ChartType,
  IndicatorType,
} from '../../services/chartAnalysisService';
import type {
  ChartData,
  TechnicalAnalysis,
  PriceStatistics,
} from '../../services/chartAnalysisService';
import { formatPrice, formatPercentage } from '../../utils';
import { COMMON_TOKENS } from '../../constants';
import type { Token } from '../../types';

interface ChartAnalysisProps {
  initialToken?: Token;
}

export const ChartAnalysis: React.FC<ChartAnalysisProps> = ({ 
  initialToken = COMMON_TOKENS[0] 
}) => {
  const [selectedToken, setSelectedToken] = useState<Token>(initialToken);
  const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.HOUR_1);
  const [chartType, setChartType] = useState<ChartType>(ChartType.CANDLESTICK);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [statistics, setStatistics] = useState<PriceStatistics | null>(null);
  const [indicators, setIndicators] = useState<Set<IndicatorType>>(new Set([IndicatorType.VOLUME]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チャートデータ取得
  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await chartAnalysisService.getChartData(
        selectedToken.symbol,
        timeframe,
        100
      );
      setChartData(data);

      // テクニカル分析
      const technicalAnalysis = await chartAnalysisService.performTechnicalAnalysis(data);
      setAnalysis(technicalAnalysis);

      // 価格統計
      const priceStats = chartAnalysisService.calculatePriceStatistics(data);
      setStatistics(priceStats);

      // インジケーター計算
      const updatedData: ChartData = { ...data, indicators: {} };
      for (const indicator of indicators) {
        if (updatedData.indicators) {
          updatedData.indicators[indicator] = chartAnalysisService.calculateIndicator(
            data,
            indicator
          );
        }
      }
      setChartData(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'チャートデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedToken, timeframe, indicators]);

  // インジケーター切り替え
  const toggleIndicator = (indicator: IndicatorType) => {
    setIndicators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indicator)) {
        newSet.delete(indicator);
      } else {
        newSet.add(indicator);
      }
      return newSet;
    });
  };

  // 初期データ取得
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // 自動更新
  useEffect(() => {
    const interval = setInterval(fetchChartData, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [fetchChartData]);

  // チャート描画（簡易版）
  const renderChart = () => {
    if (!chartData || chartData.data.length === 0) return null;

    const maxPrice = Math.max(...chartData.data.map(d => d.high));
    const minPrice = Math.min(...chartData.data.map(d => d.low));
    const priceRange = maxPrice - minPrice;

    return (
      <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <svg className="w-full h-full" viewBox="0 0 1000 400">
          {/* 価格グリッド */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = 400 - ratio * 400;
            const price = minPrice + ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  className="text-gray-500"
                />
                <text
                  x="5"
                  y={y - 5}
                  className="text-xs fill-current text-gray-500 dark:text-gray-400"
                >
                  {formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* ローソク足 */}
          {chartType === ChartType.CANDLESTICK && chartData.data.map((candle, index) => {
            const x = (index / chartData.data.length) * 1000;
            const width = 1000 / chartData.data.length * 0.8;
            
            const highY = 400 - ((candle.high - minPrice) / priceRange) * 400;
            const lowY = 400 - ((candle.low - minPrice) / priceRange) * 400;
            const openY = 400 - ((candle.open - minPrice) / priceRange) * 400;
            const closeY = 400 - ((candle.close - minPrice) / priceRange) * 400;
            
            const isGreen = candle.close > candle.open;
            const color = isGreen ? '#10b981' : '#ef4444';

            return (
              <g key={index}>
                {/* 影 */}
                <line
                  x1={x + width / 2}
                  y1={highY}
                  x2={x + width / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1"
                />
                {/* 実体 */}
                <rect
                  x={x}
                  y={Math.min(openY, closeY)}
                  width={width}
                  height={Math.abs(openY - closeY) || 1}
                  fill={color}
                  fillOpacity={isGreen ? 1 : 0.8}
                />
              </g>
            );
          })}

          {/* ボリューム */}
          {indicators.has(IndicatorType.VOLUME) && (
            <g opacity="0.3">
              {chartData.data.map((candle, index) => {
                const x = (index / chartData.data.length) * 1000;
                const width = 1000 / chartData.data.length * 0.8;
                const maxVolume = Math.max(...chartData.data.map(d => d.volume));
                const height = (candle.volume / maxVolume) * 100;
                const isGreen = candle.close > candle.open;

                return (
                  <rect
                    key={index}
                    x={x}
                    y={400 - height}
                    width={width}
                    height={height}
                    fill={isGreen ? '#10b981' : '#ef4444'}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              高度なチャート分析
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              テクニカル分析とリアルタイムチャート
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* トークン選択 */}
            <select
              value={selectedToken.address}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.address === e.target.value);
                if (token) setSelectedToken(token);
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              {COMMON_TOKENS.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>

            {/* 時間枠選択 */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              <option value={TimeFrame.MINUTE_5}>5分</option>
              <option value={TimeFrame.MINUTE_15}>15分</option>
              <option value={TimeFrame.MINUTE_30}>30分</option>
              <option value={TimeFrame.HOUR_1}>1時間</option>
              <option value={TimeFrame.HOUR_4}>4時間</option>
              <option value={TimeFrame.DAY_1}>1日</option>
            </select>

            {/* チャートタイプ */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              <option value={ChartType.CANDLESTICK}>ローソク足</option>
              <option value={ChartType.LINE}>ライン</option>
              <option value={ChartType.AREA}>エリア</option>
              <option value={ChartType.HEIKIN_ASHI}>平均足</option>
            </select>

            <button
              onClick={fetchChartData}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      {/* 価格統計 */}
      {statistics && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">現在価格</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(statistics.current)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h変化</p>
              <p className={`text-lg font-bold ${
                statistics.changePercent24h >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPercentage(statistics.changePercent24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h高値</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(statistics.high24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h安値</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(statistics.low24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">24h取引量</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${(statistics.volume24h / 1000000).toFixed(2)}M
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">VWAP</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(statistics.vwap)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">ボラティリティ</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {statistics.volatility.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">トレンド</p>
              <p className={`text-lg font-semibold ${
                analysis?.trend === 'bullish' 
                  ? 'text-green-600 dark:text-green-400' 
                  : analysis?.trend === 'bearish'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {analysis?.trend === 'bullish' ? '上昇' : 
                 analysis?.trend === 'bearish' ? '下降' : '中立'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* インジケーター選択 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          インジケーター
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.values(IndicatorType).map(indicator => (
            <button
              key={indicator}
              onClick={() => toggleIndicator(indicator)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                indicators.has(indicator)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {indicator}
            </button>
          ))}
        </div>
      </div>

      {/* チャート */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* テクニカル分析 */}
      {analysis && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            テクニカル分析
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* シグナル */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                取引シグナル
              </h4>
              <div className="space-y-2">
                {analysis.signals.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    現在シグナルはありません
                  </p>
                ) : (
                  analysis.signals.map((signal, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        signal.type === 'buy'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : signal.type === 'sell'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            signal.type === 'buy'
                              ? 'text-green-800 dark:text-green-200'
                              : signal.type === 'sell'
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {signal.type === 'buy' ? '買い' : 
                             signal.type === 'sell' ? '売り' : '中立'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {signal.indicator}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          強度: {signal.strength}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {signal.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* サポート・レジスタンス */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                サポート & レジスタンス
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    レジスタンス
                  </p>
                  <div className="space-y-1">
                    {analysis.resistance.map((level, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded"
                      >
                        <span className="text-sm text-red-600 dark:text-red-400">
                          R{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(level)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    サポート
                  </p>
                  <div className="space-y-1">
                    {analysis.support.map((level, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                      >
                        <span className="text-sm text-green-600 dark:text-green-400">
                          S{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(level)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ピボットポイント */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              ピボットポイント
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded">
                <p className="text-xs text-red-600 dark:text-red-400">R3</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.r3)}
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/10 rounded">
                <p className="text-xs text-red-600 dark:text-red-400">R2</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.r2)}
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/10 rounded">
                <p className="text-xs text-red-600 dark:text-red-400">R1</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.r1)}
                </p>
              </div>
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">ピボット</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.pivot)}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <p className="text-xs text-green-600 dark:text-green-400">S1</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.s1)}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <p className="text-xs text-green-600 dark:text-green-400">S2</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.s2)}
                </p>
              </div>
              <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <p className="text-xs text-green-600 dark:text-green-400">S3</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis.pivotPoints.s3)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartAnalysis;