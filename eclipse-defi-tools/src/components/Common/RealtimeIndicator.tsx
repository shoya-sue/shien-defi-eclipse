import React from 'react';

interface RealtimeIndicatorProps {
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ className = '' }) => {
  // 一時的に無効化（realtimeServiceが完全に実装されるまで）
  const isConnected = false;
  const activeSubscriptions: unknown[] = [];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-success-500' : 'bg-gray-400'
        }`} />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isConnected ? 'リアルタイム' : 'モック'}
        </span>
      </div>
      
      {activeSubscriptions.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {activeSubscriptions.length} 更新中
          </span>
          {isConnected && (
            <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeIndicator;