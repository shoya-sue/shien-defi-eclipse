import React, { useState } from 'react';
import { usePriceAlerts } from '../../hooks/usePriceAlerts';
import { COMMON_TOKENS } from '../../constants';
import { formatPrice } from '../../utils';
import type { Token } from '../../types';
import type { CreateAlertOptions } from '../../services/priceAlertService';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert: (options: CreateAlertOptions) => Promise<void>;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ isOpen, onClose, onCreateAlert }) => {
  const [selectedToken, setSelectedToken] = useState<Token>(COMMON_TOKENS[0]);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [notificationMethod, setNotificationMethod] = useState<'browser' | 'sound' | 'both'>('both');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAlert = async () => {
    try {
      setError(null);
      setIsCreating(true);
      
      const price = parseFloat(targetPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error('有効な価格を入力してください');
      }
      
      await onCreateAlert({
        token: selectedToken,
        targetPrice: price,
        condition,
        notificationMethod,
      });
      
      // リセット
      setTargetPrice('');
      setCondition('above');
      setNotificationMethod('both');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アラート作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            価格アラート作成
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* トークン選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              トークン
            </label>
            <select
              value={selectedToken.address}
              onChange={(e) => {
                const token = COMMON_TOKENS.find(t => t.address === e.target.value);
                if (token) setSelectedToken(token);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {COMMON_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>

          {/* 目標価格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目標価格 (USD)
            </label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.000001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* 条件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              アラート条件
            </label>
            <div className="flex gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value="above"
                  checked={condition === 'above'}
                  onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  価格が上昇した時
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value="below"
                  checked={condition === 'below'}
                  onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  価格が下落した時
                </span>
              </label>
            </div>
          </div>

          {/* 通知方法 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              通知方法
            </label>
            <select
              value={notificationMethod}
              onChange={(e) => setNotificationMethod(e.target.value as 'browser' | 'sound' | 'both')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="both">ブラウザ通知 + 音</option>
              <option value="browser">ブラウザ通知のみ</option>
              <option value="sound">音のみ</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateAlert}
              disabled={!targetPrice || isCreating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCreating ? '作成中...' : 'アラート作成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PriceAlertManager: React.FC = () => {
  const {
    alerts,
    activeAlerts,
    triggeredAlerts,
    stats,
    loading,
    error,
    createAlert,
    deleteAlert,
    toggleAlert,
    clearTriggeredAlerts,
    requestNotificationPermission,
    notificationPermission,
  } = usePriceAlerts();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');

  const handleCreateAlert = async (options: CreateAlertOptions) => {
    await createAlert(options);
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (confirm('このアラートを削除しますか？')) {
      await deleteAlert(alertId);
    }
  };

  const handleToggleAlert = async (alertId: string) => {
    await toggleAlert(alertId);
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert('通知が有効になりました！');
    } else {
      alert('通知の許可が必要です。ブラウザの設定で通知を有効にしてください。');
    }
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'active':
        return activeAlerts;
      case 'triggered':
        return triggeredAlerts;
      default:
        return alerts;
    }
  };

  const getConditionText = (condition: 'above' | 'below') => {
    return condition === 'above' ? '以上' : '以下';
  };

  const getConditionIcon = (condition: 'above' | 'below') => {
    return condition === 'above' ? '↑' : '↓';
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            価格アラート
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            目標価格に達した際に通知を受け取ります
          </p>
        </div>
        <div className="flex gap-3">
          {notificationPermission !== 'granted' && notificationPermission !== 'unknown' && (
            <button
              onClick={handleRequestNotification}
              className="px-3 py-2 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/30"
            >
              通知を有効化
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + アラート作成
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">総アラート数</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-300">アクティブ</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-300">トリガー済み</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.triggered}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-300">24h以内</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.recentlyTriggered}</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['all', 'active', 'triggered'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-2 text-sm rounded-md ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterOption === 'all' ? '全て' : 
               filterOption === 'active' ? 'アクティブ' : 'トリガー済み'}
            </button>
          ))}
        </div>
        
        {triggeredAlerts.length > 0 && (
          <button
            onClick={clearTriggeredAlerts}
            className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
          >
            トリガー済みをクリア
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* アラートリスト */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">読み込み中...</p>
          </div>
        )}

        {!loading && getFilteredAlerts().length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'アラートがありません' :
             filter === 'active' ? 'アクティブなアラートがありません' :
             'トリガーされたアラートがありません'}
          </div>
        )}

        {getFilteredAlerts().map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${
              alert.isTriggered
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : alert.isActive
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  alert.isTriggered ? 'bg-green-500' :
                  alert.isActive ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {alert.tokenSymbol}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getConditionIcon(alert.condition)} {formatPrice(alert.targetPrice)} {getConditionText(alert.condition)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    現在価格: {formatPrice(alert.currentPrice)}
                    {alert.isTriggered && alert.triggeredAt && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        • {new Date(alert.triggeredAt).toLocaleString()} にトリガー
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!alert.isTriggered && (
                  <button
                    onClick={() => handleToggleAlert(alert.id)}
                    className={`px-3 py-1 text-xs rounded ${
                      alert.isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {alert.isActive ? '無効化' : '有効化'}
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 作成モーダル */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAlert={handleCreateAlert}
      />
    </div>
  );
};

export default PriceAlertManager;