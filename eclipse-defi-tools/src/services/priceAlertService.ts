import { getErrorMessage } from '../utils';
import type { Token } from '../types';

// 価格アラートの型定義
export interface PriceAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
  notificationMethod: 'browser' | 'sound' | 'both';
}

// アラート作成時のオプション
export interface CreateAlertOptions {
  token: Token;
  targetPrice: number;
  condition: 'above' | 'below';
  notificationMethod?: 'browser' | 'sound' | 'both';
}

// アラート状態の統計情報
export interface AlertStats {
  total: number;
  active: number;
  triggered: number;
  recentlyTriggered: number; // 過去24時間以内
}

class PriceAlertService {
  private alerts: Map<string, PriceAlert> = new Map();
  private priceCache: Map<string, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(alert: PriceAlert) => void> = new Set();
  
  // アラート作成
  public createAlert(options: CreateAlertOptions): PriceAlert {
    const alertId = this.generateAlertId();
    
    const alert: PriceAlert = {
      id: alertId,
      tokenAddress: options.token.address,
      tokenSymbol: options.token.symbol,
      targetPrice: options.targetPrice,
      currentPrice: this.priceCache.get(options.token.address) || 0,
      condition: options.condition,
      isActive: true,
      isTriggered: false,
      createdAt: Date.now(),
      notificationMethod: options.notificationMethod || 'both',
    };
    
    this.alerts.set(alertId, alert);
    
    // 価格チェックを開始（まだ開始していない場合）
    if (!this.checkInterval) {
      this.startPriceChecking();
    }
    
    console.log(`Price alert created: ${alert.tokenSymbol} ${alert.condition} $${alert.targetPrice}`);
    return alert;
  }
  
  // アラート削除
  public deleteAlert(alertId: string): boolean {
    const deleted = this.alerts.delete(alertId);
    
    // アクティブなアラートがなくなったら価格チェックを停止
    if (this.getActiveAlerts().length === 0 && this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    return deleted;
  }
  
  // アラートのトグル（有効/無効切り替え）
  public toggleAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.isActive = !alert.isActive;
    this.alerts.set(alertId, alert);
    
    return true;
  }
  
  // 全アラート取得
  public getAllAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
  
  // アクティブなアラート取得
  public getActiveAlerts(): PriceAlert[] {
    return this.getAllAlerts().filter(alert => alert.isActive && !alert.isTriggered);
  }
  
  // トリガーされたアラート取得
  public getTriggeredAlerts(): PriceAlert[] {
    return this.getAllAlerts().filter(alert => alert.isTriggered);
  }
  
  // アラート統計情報
  public getAlertStats(): AlertStats {
    const allAlerts = this.getAllAlerts();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    return {
      total: allAlerts.length,
      active: allAlerts.filter(a => a.isActive && !a.isTriggered).length,
      triggered: allAlerts.filter(a => a.isTriggered).length,
      recentlyTriggered: allAlerts.filter(a => 
        a.isTriggered && a.triggeredAt && a.triggeredAt > dayAgo
      ).length,
    };
  }
  
  // 価格更新
  public updatePrice(tokenAddress: string, price: number): void {
    this.priceCache.set(tokenAddress, price);
    
    // 該当トークンのアラートをチェック
    this.checkAlertsForToken(tokenAddress, price);
  }
  
  // 複数トークンの価格を一括更新
  public updatePrices(prices: Record<string, number>): void {
    Object.entries(prices).forEach(([tokenAddress, price]) => {
      this.updatePrice(tokenAddress, price);
    });
  }
  
  // アラートトリガー時のリスナー登録
  public addAlertListener(listener: (alert: PriceAlert) => void): () => void {
    this.listeners.add(listener);
    
    // リスナー削除関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // 特定トークンのアラートチェック
  private checkAlertsForToken(tokenAddress: string, currentPrice: number): void {
    const relevantAlerts = this.getActiveAlerts().filter(
      alert => alert.tokenAddress === tokenAddress
    );
    
    relevantAlerts.forEach(alert => {
      const shouldTrigger = this.shouldTriggerAlert(alert, currentPrice);
      
      if (shouldTrigger) {
        this.triggerAlert(alert, currentPrice);
      } else {
        // 価格を更新（トリガーされていない場合）
        alert.currentPrice = currentPrice;
        this.alerts.set(alert.id, alert);
      }
    });
  }
  
  // アラートがトリガーされるべきかチェック
  private shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
    if (alert.condition === 'above') {
      return currentPrice >= alert.targetPrice;
    } else {
      return currentPrice <= alert.targetPrice;
    }
  }
  
  // アラートをトリガー
  private triggerAlert(alert: PriceAlert, currentPrice: number): void {
    alert.isTriggered = true;
    alert.triggeredAt = Date.now();
    alert.currentPrice = currentPrice;
    this.alerts.set(alert.id, alert);
    
    // 通知実行
    this.sendNotification(alert);
    
    // リスナーに通知
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Alert listener error:', getErrorMessage(error));
      }
    });
    
    console.log(`Alert triggered: ${alert.tokenSymbol} reached $${currentPrice} (target: ${alert.condition} $${alert.targetPrice})`);
  }
  
  // 通知送信
  private sendNotification(alert: PriceAlert): void {
    const title = `価格アラート: ${alert.tokenSymbol}`;
    const message = `${alert.tokenSymbol} が $${alert.currentPrice.toFixed(6)} に${
      alert.condition === 'above' ? '上昇' : '下落'
    }しました (目標: ${alert.condition === 'above' ? '≥' : '≤'} $${alert.targetPrice})`;
    
    // ブラウザ通知
    if ((alert.notificationMethod === 'browser' || alert.notificationMethod === 'both') && 
        'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `price-alert-${alert.id}`,
        });
      } catch (error) {
        console.error('Browser notification error:', getErrorMessage(error));
      }
    }
    
    // サウンド通知
    if (alert.notificationMethod === 'sound' || alert.notificationMethod === 'both') {
      this.playNotificationSound();
    }
  }
  
  // 通知音再生
  private playNotificationSound(): void {
    try {
      // AudioContext を使用してビープ音を生成
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Sound notification error:', getErrorMessage(error));
    }
  }
  
  // 定期的な価格チェック開始
  private startPriceChecking(): void {
    this.checkInterval = setInterval(() => {
      this.checkAllAlerts();
    }, 10000); // 10秒間隔でチェック
  }
  
  // 全アラートのチェック
  private checkAllAlerts(): void {
    const activeAlerts = this.getActiveAlerts();
    
    if (activeAlerts.length === 0) {
      // アクティブなアラートがない場合は停止
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      return;
    }
    
    // ユニークなトークンアドレスを取得
    const uniqueTokens = Array.from(new Set(
      activeAlerts.map(alert => alert.tokenAddress)
    ));
    
    // 各トークンの価格を取得してチェック
    uniqueTokens.forEach(async (tokenAddress) => {
      try {
        const price = await this.fetchCurrentPrice(tokenAddress);
        if (price > 0) {
          this.updatePrice(tokenAddress, price);
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${tokenAddress}:`, getErrorMessage(error));
      }
    });
  }
  
  // 現在価格の取得（実際の実装では外部APIを使用）
  private async fetchCurrentPrice(tokenAddress: string): Promise<number> {
    // モック実装 - 実際の実装では CoinGecko や Jupiter Price API を使用
    try {
      // シンプルなモック価格生成（実際の実装では外部APIへのリクエスト）
      const basePrice = this.priceCache.get(tokenAddress) || 100;
      const variation = (Math.random() - 0.5) * 0.1; // ±5%の変動
      return basePrice * (1 + variation);
    } catch (error) {
      throw new Error(`Price fetch failed: ${getErrorMessage(error)}`);
    }
  }
  
  // アラートID生成
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 通知許可リクエスト
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', getErrorMessage(error));
      return false;
    }
  }
  
  // サービス停止
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.alerts.clear();
    this.priceCache.clear();
    this.listeners.clear();
  }
}

// シングルトンインスタンス
export const priceAlertService = new PriceAlertService();

export default PriceAlertService;