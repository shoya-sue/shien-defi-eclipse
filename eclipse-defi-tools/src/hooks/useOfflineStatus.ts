import { useState, useEffect } from 'react';

// Network Information API types
interface NetworkInformation extends EventTarget {
  readonly downlink?: number;
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  addEventListener(type: 'change', listener: EventListener): void;
  removeEventListener(type: 'change', listener: EventListener): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: number | null;
  connectionType: string | null;
  downlink: number | null;
  effectiveType: string | null;
}

export const useOfflineStatus = (): OfflineStatus => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    lastOnlineAt: navigator.onLine ? Date.now() : null,
    connectionType: null,
    downlink: null,
    effectiveType: null,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      
      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        lastOnlineAt: navigator.onLine ? Date.now() : prev.lastOnlineAt,
        connectionType: connection?.type || null,
        downlink: connection?.downlink || null,
        effectiveType: connection?.effectiveType || null,
      }));
    };

    const handleOnline = () => {
      console.log('Network: Online');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      console.log('Network: Connection changed');
      updateNetworkStatus();
    };

    // イベントリスナーの登録
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Connection API のサポートチェック
    const connection = (navigator as NavigatorWithConnection).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // 初期状態の設定
    updateNetworkStatus();

    // クリーンアップ
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return status;
};

export default useOfflineStatus;