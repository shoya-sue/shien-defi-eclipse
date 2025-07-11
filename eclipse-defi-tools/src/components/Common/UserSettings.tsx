import React, { useState, useEffect } from 'react';
import { formatNumber, formatPercentage } from '../../utils';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'JPY';
  language: 'en' | 'ja';
  slippageTolerance: number;
  priceAlerts: boolean;
  realtimeUpdates: boolean;
  refreshInterval: number;
  notifications: {
    priceChanges: boolean;
    transactions: boolean;
    farming: boolean;
    pools: boolean;
  };
  privacy: {
    trackingEnabled: boolean;
    analyticsEnabled: boolean;
    shareData: boolean;
  };
  advanced: {
    showAdvancedStats: boolean;
    debugMode: boolean;
    gasOptimization: boolean;
  };
}

const defaultSettings: UserSettings = {
  theme: 'system',
  currency: 'USD',
  language: 'ja',
  slippageTolerance: 0.5,
  priceAlerts: true,
  realtimeUpdates: true,
  refreshInterval: 5000,
  notifications: {
    priceChanges: true,
    transactions: true,
    farming: true,
    pools: true,
  },
  privacy: {
    trackingEnabled: true,
    analyticsEnabled: true,
    shareData: false,
  },
  advanced: {
    showAdvancedStats: false,
    debugMode: false,
    gasOptimization: true,
  },
};

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'advanced'>('general');

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleNestedSettingChange = (
    parentKey: keyof UserSettings,
    childKey: string,
    value: any
  ) => {
    const parentValue = settings[parentKey] as any;
    onSettingsChange({
      ...settings,
      [parentKey]: {
        ...parentValue,
        [childKey]: value,
      },
    });
  };

  const handleReset = () => {
    if (window.confirm('設定をリセットしますか？この操作は取り消せません。')) {
      onSettingsChange(defaultSettings);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eclipse-defi-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          onSettingsChange({ ...defaultSettings, ...importedSettings });
        } catch (error) {
          alert('設定ファイルの読み込みに失敗しました。');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ユーザー設定
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4">
              <div className="space-y-2">
                {[
                  { id: 'general', label: '一般', icon: '⚙️' },
                  { id: 'notifications', label: '通知', icon: '🔔' },
                  { id: 'privacy', label: 'プライバシー', icon: '🔒' },
                  { id: 'advanced', label: '高度な設定', icon: '🛠️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      一般設定
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          テーマ
                        </label>
                        <select
                          value={settings.theme}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="light">ライト</option>
                          <option value="dark">ダーク</option>
                          <option value="system">システム設定に従う</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          通貨表示
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleSettingChange('currency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          言語
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="ja">日本語</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          スリッページ許容値 ({formatPercentage(settings.slippageTolerance)})
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={settings.slippageTolerance}
                          onChange={(e) => handleSettingChange('slippageTolerance', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0.1%</span>
                          <span>5%</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          更新間隔 ({settings.refreshInterval / 1000}秒)
                        </label>
                        <input
                          type="range"
                          min="1000"
                          max="60000"
                          step="1000"
                          value={settings.refreshInterval}
                          onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1秒</span>
                          <span>60秒</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.priceAlerts}
                            onChange={(e) => handleSettingChange('priceAlerts', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            価格アラートを有効にする
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.realtimeUpdates}
                            onChange={(e) => handleSettingChange('realtimeUpdates', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            リアルタイム更新を有効にする
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      通知設定
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.priceChanges}
                          onChange={(e) => handleNestedSettingChange('notifications', 'priceChanges', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          価格変動通知
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.transactions}
                          onChange={(e) => handleNestedSettingChange('notifications', 'transactions', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          取引通知
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.farming}
                          onChange={(e) => handleNestedSettingChange('notifications', 'farming', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          ファーミング通知
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.pools}
                          onChange={(e) => handleNestedSettingChange('notifications', 'pools', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          プール通知
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      プライバシー設定
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy.trackingEnabled}
                          onChange={(e) => handleNestedSettingChange('privacy', 'trackingEnabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          使用状況の追跡を許可
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy.analyticsEnabled}
                          onChange={(e) => handleNestedSettingChange('privacy', 'analyticsEnabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          分析データの送信を許可
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy.shareData}
                          onChange={(e) => handleNestedSettingChange('privacy', 'shareData', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          データの共有を許可
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      高度な設定
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.advanced.showAdvancedStats}
                          onChange={(e) => handleNestedSettingChange('advanced', 'showAdvancedStats', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          高度な統計情報を表示
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.advanced.debugMode}
                          onChange={(e) => handleNestedSettingChange('advanced', 'debugMode', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          デバッグモードを有効にする
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.advanced.gasOptimization}
                          onChange={(e) => handleNestedSettingChange('advanced', 'gasOptimization', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          ガス最適化を有効にする
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-settings"
              />
              <label
                htmlFor="import-settings"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
              >
                設定をインポート
              </label>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                設定をエクスポート
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900"
              >
                リセット
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                保存して閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;