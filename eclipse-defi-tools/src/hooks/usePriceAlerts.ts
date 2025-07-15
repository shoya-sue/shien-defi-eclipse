import { useState, useEffect, useCallback } from 'react';
import { 
  priceAlertService, 
  type PriceAlert, 
  type CreateAlertOptions, 
  type AlertStats 
} from '../services/priceAlertService';
import { getErrorMessage } from '../utils';

export interface UsePriceAlertsResult {
  // アラート状態
  alerts: PriceAlert[];
  activeAlerts: PriceAlert[];
  triggeredAlerts: PriceAlert[];
  stats: AlertStats;
  
  // ローディング状態
  loading: boolean;
  error: string | null;
  
  // アクション
  createAlert: (options: CreateAlertOptions) => Promise<PriceAlert>;
  deleteAlert: (alertId: string) => Promise<boolean>;
  toggleAlert: (alertId: string) => Promise<boolean>;
  clearTriggeredAlerts: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  
  // 状態
  notificationPermission: NotificationPermission | 'unknown';
}

export const usePriceAlerts = (): UsePriceAlertsResult => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  
  // アラートデータの更新
  const refreshAlerts = useCallback(() => {
    try {
      const allAlerts = priceAlertService.getAllAlerts();
      setAlerts(allAlerts);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);
  
  // 通知許可状態の確認
  const checkNotificationPermission = useCallback(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unknown');
    }
  }, []);
  
  // アラート作成
  const createAlert = useCallback(async (options: CreateAlertOptions): Promise<PriceAlert> => {
    try {
      setLoading(true);
      setError(null);
      
      const alert = priceAlertService.createAlert(options);
      refreshAlerts();
      
      return alert;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshAlerts]);
  
  // アラート削除
  const deleteAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const deleted = priceAlertService.deleteAlert(alertId);
      refreshAlerts();
      
      return deleted;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshAlerts]);
  
  // アラートトグル
  const toggleAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const toggled = priceAlertService.toggleAlert(alertId);
      refreshAlerts();
      
      return toggled;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refreshAlerts]);
  
  // トリガーされたアラートをクリア
  const clearTriggeredAlerts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const triggeredAlerts = priceAlertService.getTriggeredAlerts();
      triggeredAlerts.forEach(alert => {
        priceAlertService.deleteAlert(alert.id);
      });
      
      refreshAlerts();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshAlerts]);
  
  // 通知許可リクエスト
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await priceAlertService.requestNotificationPermission();
      checkNotificationPermission();
      return granted;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return false;
    }
  }, [checkNotificationPermission]);
  
  // 初期化と監視
  useEffect(() => {
    // 初期データ読み込み
    refreshAlerts();
    checkNotificationPermission();
    
    // アラートトリガー時の更新リスナー
    const unsubscribe = priceAlertService.addAlertListener((triggeredAlert) => {
      console.log('Alert triggered in hook:', triggeredAlert);
      refreshAlerts();
    });
    
    return unsubscribe;
  }, [refreshAlerts, checkNotificationPermission]);
  
  // 通知許可状態の監視
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotificationPermission();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkNotificationPermission]);
  
  // 派生状態の計算
  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.isTriggered);
  const triggeredAlerts = alerts.filter(alert => alert.isTriggered);
  const stats = priceAlertService.getAlertStats();
  
  return {
    // アラート状態
    alerts,
    activeAlerts,
    triggeredAlerts,
    stats,
    
    // ローディング状態
    loading,
    error,
    
    // アクション
    createAlert,
    deleteAlert,
    toggleAlert,
    clearTriggeredAlerts,
    requestNotificationPermission,
    
    // 状態
    notificationPermission,
  };
};

export default usePriceAlerts;