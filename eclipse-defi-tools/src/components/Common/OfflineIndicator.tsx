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
        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
        <span className="text-xs text-success-600 dark:text-success-400">
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
        <div className="w-2 h-2 bg-error-500 rounded-full" />
        <span className="text-xs text-error-600 dark:text-error-400">
          オフライン
        </span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;