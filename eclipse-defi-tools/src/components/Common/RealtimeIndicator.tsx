import React from 'react';
import { useRealtimeData } from '../../services/realtimeService';

interface RealtimeIndicatorProps {
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ className = '' }) => {
  const { isConnected, getAllSubscriptions } = useRealtimeData();
  const subscriptions = getAllSubscriptions();
  const activeSubscriptions = subscriptions.filter(sub => sub.enabled);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isConnected ? 'リアルタイム' : 'オフライン'}
        </span>
      </div>
      
      {activeSubscriptions.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {activeSubscriptions.length} 更新中
          </span>
          {isConnected && (
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeIndicator;