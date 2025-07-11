import React, { useState } from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export const OfflineBanner: React.FC = () => {
  const { isOffline, lastOnlineAt } = useOfflineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isOffline || isDismissed) {
    return null;
  }

  const getOfflineMessage = () => {
    if (!lastOnlineAt) {
      return 'インターネット接続が確認できません';
    }
    
    const timeDiff = Date.now() - lastOnlineAt;
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間前からオフライン`;
    } else if (minutes > 0) {
      return `${minutes}分前からオフライン`;
    } else {
      return '接続が切断されました';
    }
  };

  return (
    <div className="bg-orange-100 dark:bg-orange-900 border-l-4 border-orange-500 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-orange-700 dark:text-orange-200">
              <strong>オフラインモード:</strong> {getOfflineMessage()}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
              一部の機能が制限されています。キャッシュされたデータを使用しています。
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            className="inline-flex text-orange-400 hover:text-orange-600 focus:outline-none focus:text-orange-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;