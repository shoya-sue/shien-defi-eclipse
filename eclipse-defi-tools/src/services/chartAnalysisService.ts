import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';

// 時間枠
export const TimeFrame = {
  MINUTE_1: '1m',
  MINUTE_5: '5m',
  MINUTE_15: '15m',
  MINUTE_30: '30m',
  HOUR_1: '1h',
  HOUR_4: '4h',
  DAY_1: '1d',
  WEEK_1: '1w',
} as const;

export type TimeFrame = typeof TimeFrame[keyof typeof TimeFrame];

// チャートタイプ
export const ChartType = {
  CANDLESTICK: 'candlestick',
  LINE: 'line',
  AREA: 'area',
  HEIKIN_ASHI: 'heikin_ashi',
} as const;

export type ChartType = typeof ChartType[keyof typeof ChartType];

// インジケータータイプ
export const IndicatorType = {
  SMA: 'SMA',
  EMA: 'EMA',
  RSI: 'RSI',
  MACD: 'MACD',
  BOLLINGER_BANDS: 'BOLLINGER_BANDS',
  VOLUME: 'VOLUME',
  STOCHASTIC: 'STOCHASTIC',
  ATR: 'ATR',
} as const;

export type IndicatorType = typeof IndicatorType[keyof typeof IndicatorType];

// OHLCVデータ
export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// チャートデータ
export interface ChartData {
  symbol: string;
  timeframe: TimeFrame;
  data: OHLCV[];
  indicators?: Record<string, IndicatorData>;
}

// インジケーターデータ
export interface IndicatorData {
  type: IndicatorType;
  values: Array<{
    timestamp: number;
    value: number | { upper?: number; middle?: number; lower?: number; signal?: number };
  }>;
  settings: Record<string, number | string | boolean>;
}

// テクニカル分析結果
export interface TechnicalAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  signals: TechnicalSignal[];
  support: number[];
  resistance: number[];
  pivotPoints: PivotPoints;
}

// テクニカルシグナル
export interface TechnicalSignal {
  type: 'buy' | 'sell' | 'neutral';
  indicator: IndicatorType;
  strength: number; // 0-100
  message: string;
  timestamp: number;
}

// ピボットポイント
export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

// 価格統計
export interface PriceStatistics {
  current: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  vwap: number;
  volatility: number;
}

class ChartAnalysisService {
  private chartDataCache = new Map<string, { data: ChartData; timestamp: number }>();
  private cacheExpiry = 60000; // 1分

  // チャートデータの取得
  public async getChartData(
    symbol: string,
    timeframe: TimeFrame,
    limit: number = 100
  ): Promise<ChartData> {
    const cacheKey = `${symbol}-${timeframe}-${limit}`;
    const cached = this.chartDataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // モックデータ生成（実際のAPIに置き換える）
      const data = this.generateMockOHLCV(symbol, timeframe, limit);
      
      const chartData: ChartData = {
        symbol,
        timeframe,
        data,
      };
      
      this.chartDataCache.set(cacheKey, { data: chartData, timestamp: Date.now() });
      return chartData;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { symbol, timeframe, limit }
      );
      throw error;
    }
  }

  // テクニカル分析の実行
  public async performTechnicalAnalysis(
    chartData: ChartData
  ): Promise<TechnicalAnalysis> {
    try {
      const signals: TechnicalSignal[] = [];
      const prices = chartData.data.map(d => d.close);
      const latest = chartData.data[chartData.data.length - 1];
      
      // RSI計算
      const rsi = this.calculateRSI(prices, 14);
      if (rsi !== null) {
        if (rsi < 30) {
          signals.push({
            type: 'buy',
            indicator: IndicatorType.RSI,
            strength: 80,
            message: 'RSI oversold condition',
            timestamp: latest.timestamp,
          });
        } else if (rsi > 70) {
          signals.push({
            type: 'sell',
            indicator: IndicatorType.RSI,
            strength: 80,
            message: 'RSI overbought condition',
            timestamp: latest.timestamp,
          });
        }
      }
      
      // SMA交差
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, 50);
      
      if (sma20.length >= 2 && sma50.length >= 2) {
        const prevCross = sma20[sma20.length - 2] - sma50[sma50.length - 2];
        const currCross = sma20[sma20.length - 1] - sma50[sma50.length - 1];
        
        if (prevCross < 0 && currCross > 0) {
          signals.push({
            type: 'buy',
            indicator: IndicatorType.SMA,
            strength: 70,
            message: 'Golden cross (SMA20 crossed above SMA50)',
            timestamp: latest.timestamp,
          });
        } else if (prevCross > 0 && currCross < 0) {
          signals.push({
            type: 'sell',
            indicator: IndicatorType.SMA,
            strength: 70,
            message: 'Death cross (SMA20 crossed below SMA50)',
            timestamp: latest.timestamp,
          });
        }
      }
      
      // トレンド判定
      const trend = this.determineTrend(prices);
      const strength = this.calculateTrendStrength(prices);
      
      // サポート・レジスタンス
      const { support, resistance } = this.findSupportResistance(chartData.data);
      
      // ピボットポイント
      const pivotPoints = this.calculatePivotPoints(
        latest.high,
        latest.low,
        latest.close
      );
      
      return {
        trend,
        strength,
        signals,
        support,
        resistance,
        pivotPoints,
      };
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.LOW,
        { symbol: chartData.symbol }
      );
      throw error;
    }
  }

  // 価格統計の計算
  public calculatePriceStatistics(chartData: ChartData): PriceStatistics {
    const data = chartData.data;
    const current = data[data.length - 1].close;
    const data24h = data.slice(-24); // 最近24時間のデータ
    
    const open24h = data24h[0].open;
    const change24h = current - open24h;
    const changePercent24h = (change24h / open24h) * 100;
    
    const prices24h = data24h.map(d => ({ high: d.high, low: d.low }));
    const high24h = Math.max(...prices24h.map(d => d.high));
    const low24h = Math.min(...prices24h.map(d => d.low));
    
    const volume24h = data24h.reduce((sum, d) => sum + d.volume, 0);
    
    // VWAP計算
    const vwap = this.calculateVWAP(data24h);
    
    // ボラティリティ計算
    const volatility = this.calculateVolatility(data24h.map(d => d.close));
    
    return {
      current,
      change24h,
      changePercent24h,
      high24h,
      low24h,
      volume24h,
      vwap,
      volatility,
    };
  }

  // インジケーターの計算
  public calculateIndicator(
    chartData: ChartData,
    type: IndicatorType,
    settings: Record<string, number | string | boolean> = {}
  ): IndicatorData {
    const prices = chartData.data.map(d => d.close);
    const timestamps = chartData.data.map(d => d.timestamp);
    let values: Array<{
      timestamp: number;
      value: number | { upper?: number; middle?: number; lower?: number; signal?: number };
    }> = [];
    
    switch (type) {
      case IndicatorType.SMA: {
        const period = typeof settings.period === 'number' ? settings.period : 20;
        values = this.calculateSMA(prices, period).map((v, i) => ({
          timestamp: timestamps[i + period - 1],
          value: v,
        }));
        break;
      }
        
      case IndicatorType.EMA: {
        const emaPeriod = typeof settings.period === 'number' ? settings.period : 20;
        values = this.calculateEMA(prices, emaPeriod).map((v, i) => ({
          timestamp: timestamps[i],
          value: v,
        }));
        break;
      }
        
      case IndicatorType.RSI: {
        const rsiPeriod = typeof settings.period === 'number' ? settings.period : 14;
        values = this.calculateRSIArray(prices, rsiPeriod).map((v, i) => ({
          timestamp: timestamps[i],
          value: v,
        }));
        break;
      }
        
      case IndicatorType.BOLLINGER_BANDS: {
        const bbPeriod = typeof settings.period === 'number' ? settings.period : 20;
        const stdDev = typeof settings.stdDev === 'number' ? settings.stdDev : 2;
        values = this.calculateBollingerBands(prices, bbPeriod, stdDev).map((v, i) => ({
          timestamp: timestamps[i + bbPeriod - 1],
          value: v,
        }));
        break;
      }
        
      case IndicatorType.MACD: {
        const fast = typeof settings.fast === 'number' ? settings.fast : 12;
        const slow = typeof settings.slow === 'number' ? settings.slow : 26;
        const signal = typeof settings.signal === 'number' ? settings.signal : 9;
        values = this.calculateMACD(prices, fast, slow, signal).map((v, i) => ({
          timestamp: timestamps[i + slow - 1],
          value: v,
        }));
        break;
      }
    }
    
    return {
      type,
      values,
      settings,
    };
  }

  // 移動平均計算
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }

  // 指数移動平均計算
  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // 最初のEMAはSMA
    const firstSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(firstSMA);
    
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }

  // RSI計算
  private calculateRSI(prices: number[], period: number): number | null {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // RSI配列計算
  private calculateRSIArray(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    
    for (let i = period; i < prices.length; i++) {
      const priceSlice = prices.slice(0, i + 1);
      const rsiValue = this.calculateRSI(priceSlice, period);
      rsi.push(rsiValue ?? 50);
    }
    
    return rsi;
  }

  // ボリンジャーバンド計算
  private calculateBollingerBands(
    prices: number[],
    period: number,
    stdDev: number
  ): Array<{ upper: number; middle: number; lower: number }> {
    const bands: Array<{ upper: number; middle: number; lower: number }> = [];
    const sma = this.calculateSMA(prices, period);
    
    for (let i = 0; i < sma.length; i++) {
      const dataSlice = prices.slice(i, i + period);
      const mean = sma[i];
      const variance = dataSlice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + stdDev * standardDeviation,
        middle: mean,
        lower: mean - stdDev * standardDeviation,
      });
    }
    
    return bands;
  }

  // MACD計算
  private calculateMACD(
    prices: number[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number
  ): Array<{ value: number; signal: number }> {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    const macdLine: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    const result: Array<{ value: number; signal: number }> = [];
    
    for (let i = 0; i < signalLine.length; i++) {
      result.push({
        value: macdLine[i + signalPeriod - 1],
        signal: signalLine[i],
      });
    }
    
    return result;
  }

  // トレンド判定
  private determineTrend(prices: number[]): 'bullish' | 'bearish' | 'neutral' {
    if (prices.length < 20) return 'neutral';
    
    const sma20 = this.calculateSMA(prices, 20);
    const current = prices[prices.length - 1];
    const sma = sma20[sma20.length - 1];
    
    const priceAboveSMA = current > sma;
    const smaSlope = sma20.length >= 2 ? sma20[sma20.length - 1] - sma20[sma20.length - 2] : 0;
    
    if (priceAboveSMA && smaSlope > 0) return 'bullish';
    if (!priceAboveSMA && smaSlope < 0) return 'bearish';
    return 'neutral';
  }

  // トレンド強度計算
  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 20) return 50;
    
    const sma20 = this.calculateSMA(prices, 20);
    const current = prices[prices.length - 1];
    const sma = sma20[sma20.length - 1];
    
    const deviation = Math.abs((current - sma) / sma) * 100;
    return Math.min(deviation * 10, 100);
  }

  // サポート・レジスタンス検出
  private findSupportResistance(
    data: OHLCV[]
  ): { support: number[]; resistance: number[] } {
    const pivots = this.findPivotPoints(data);
    
    // 価格帯でグループ化
    const priceZones = new Map<number, number>();
    const zoneSize = (Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low))) * 0.01;
    
    pivots.forEach(pivot => {
      const zone = Math.floor(pivot.price / zoneSize);
      priceZones.set(zone, (priceZones.get(zone) || 0) + 1);
    });
    
    // 頻度の高い価格帯を抽出
    const significantZones = Array.from(priceZones.entries())
      .filter(([, count]) => count >= 2)
      .map(([zone]) => zone * zoneSize);
    
    const currentPrice = data[data.length - 1].close;
    
    const support = significantZones
      .filter(price => price < currentPrice)
      .sort((a, b) => b - a)
      .slice(0, 3);
    
    const resistance = significantZones
      .filter(price => price > currentPrice)
      .sort((a, b) => a - b)
      .slice(0, 3);
    
    return { support, resistance };
  }

  // ピボットポイント検出
  private findPivotPoints(data: OHLCV[]): Array<{ price: number; type: 'high' | 'low' }> {
    const pivots: Array<{ price: number; type: 'high' | 'low' }> = [];
    
    for (let i = 2; i < data.length - 2; i++) {
      // 高値ピボット
      if (
        data[i].high > data[i - 1].high &&
        data[i].high > data[i - 2].high &&
        data[i].high > data[i + 1].high &&
        data[i].high > data[i + 2].high
      ) {
        pivots.push({ price: data[i].high, type: 'high' });
      }
      
      // 安値ピボット
      if (
        data[i].low < data[i - 1].low &&
        data[i].low < data[i - 2].low &&
        data[i].low < data[i + 1].low &&
        data[i].low < data[i + 2].low
      ) {
        pivots.push({ price: data[i].low, type: 'low' });
      }
    }
    
    return pivots;
  }

  // ピボットポイント計算
  private calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
    const pivot = (high + low + close) / 3;
    const range = high - low;
    
    return {
      pivot,
      r1: pivot * 2 - low,
      r2: pivot + range,
      r3: pivot + range * 2,
      s1: pivot * 2 - high,
      s2: pivot - range,
      s3: pivot - range * 2,
    };
  }

  // VWAP計算
  private calculateVWAP(data: OHLCV[]): number {
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    data.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    });
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  // ボラティリティ計算
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // 年率換算
  }

  // モックOHLCVデータ生成
  private generateMockOHLCV(
    _symbol: string,
    timeframe: TimeFrame,
    limit: number
  ): OHLCV[] {
    const data: OHLCV[] = [];
    const now = Date.now();
    const intervalMs = this.getIntervalMs(timeframe);
    let price = 100 + Math.random() * 50;
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const volatility = 0.02;
      
      const open = price;
      const change = (Math.random() - 0.5) * volatility;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
      const volume = Math.random() * 1000000;
      
      data.push({ timestamp, open, high, low, close, volume });
      price = close;
    }
    
    return data;
  }

  // 時間枠をミリ秒に変換
  private getIntervalMs(timeframe: TimeFrame): number {
    const intervals: Record<TimeFrame, number> = {
      [TimeFrame.MINUTE_1]: 60 * 1000,
      [TimeFrame.MINUTE_5]: 5 * 60 * 1000,
      [TimeFrame.MINUTE_15]: 15 * 60 * 1000,
      [TimeFrame.MINUTE_30]: 30 * 60 * 1000,
      [TimeFrame.HOUR_1]: 60 * 60 * 1000,
      [TimeFrame.HOUR_4]: 4 * 60 * 60 * 1000,
      [TimeFrame.DAY_1]: 24 * 60 * 60 * 1000,
      [TimeFrame.WEEK_1]: 7 * 24 * 60 * 60 * 1000,
    };
    
    return intervals[timeframe] || intervals[TimeFrame.HOUR_1];
  }
}

// シングルトンインスタンス
export const chartAnalysisService = new ChartAnalysisService();

export default ChartAnalysisService;