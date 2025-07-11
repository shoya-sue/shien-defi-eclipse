import React from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, isOffline, effectiveType } = useOfflineStatus();

  if (isOnline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 dark:text-green-400">
          オンライン
          {effectiveType && (
            <span className="ml-1 text-gray-500">({effectiveType})</span>
          )}
        </span>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs text-red-600 dark:text-red-400">
          オフライン
        </span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;