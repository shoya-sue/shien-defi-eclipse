import { useState, Suspense, useEffect } from 'react';
import WalletConnector from './components/Common/WalletConnector';
import WalletButton from './components/Common/WalletButton';
import RealtimeIndicator from './components/Common/RealtimeIndicator';
import OfflineIndicator from './components/Common/OfflineIndicator';
import OfflineBanner from './components/Common/OfflineBanner';
import PWAInstallPrompt from './components/Common/PWAInstallPrompt';
import ErrorBoundary from './components/Common/ErrorBoundary';
import SecurityDashboard from './components/Common/SecurityDashboard';
import SecurityProvider from './components/Common/SecurityProvider';
import {
  LazySwapInterface,
  LazyLiquidityCalculator,
  LazyLiquidityAnalysis,
  LazyYieldTracker,
  LazyPnLCalculator,
  LazyUserSettings,
  LazyTransactionHistory,
  LazyChartAnalysis,
  LazyDeFiDashboard,
  LazyMultiChainDashboard,
  LazyAutoTradingDashboard,
  ComponentLoader,
  SettingsLoader
} from './components/LazyComponents';
import PriceAlertManager from './components/PriceAlerts/PriceAlertManager';
import type { UserSettings as UserSettingsType } from './types';
import { COMMON_TOKENS } from './constants';
import { usePrices } from './hooks/usePrices';
import { useSettings } from './hooks/useSettings';
import { formatPrice, formatPercentage } from './utils';
import { priceAlertService } from './services/priceAlertService';

type ActiveTab = 'swap' | 'pools' | 'farming' | 'pnl' | 'prices' | 'analysis' | 'alerts' | 'history' | 'charts' | 'defi' | 'multichain' | 'autotrading';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('swap');
  const [showSettings, setShowSettings] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const { prices, loading, error } = usePrices(COMMON_TOKENS);
  const { settings, saveSettings } = useSettings();

  // 価格データを価格アラートサービスに送信
  useEffect(() => {
    if (prices.length > 0) {
      const priceMap: Record<string, number> = {};
      prices.forEach(priceData => {
        priceMap[priceData.token.address] = priceData.price;
      });
      priceAlertService.updatePrices(priceMap);
    }
  }, [prices]);

  const renderContent = () => {
    switch (activeTab) {
      case 'swap':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazySwapInterface />
          </Suspense>
        );
      case 'pools':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyLiquidityCalculator />
          </Suspense>
        );
      case 'farming':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyYieldTracker />
          </Suspense>
        );
      case 'pnl':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyPnLCalculator />
          </Suspense>
        );
      case 'analysis':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyLiquidityAnalysis />
          </Suspense>
        );
      case 'prices':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              トークン価格
            </h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">価格データを取得中...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-error-600 dark:text-error-400">エラー: {error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prices.map((priceData) => (
                  <div
                    key={priceData.token.address}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {priceData.token.logoURI && (
                          <img
                            src={priceData.token.logoURI}
                            alt={priceData.token.symbol}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {priceData.token.symbol}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(priceData.price)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="block">{priceData.token.name}</span>
                      <span
                        className={`block ${
                          priceData.priceChange24h >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-error-600 dark:text-error-400'
                        }`}
                      >
                        24h: {formatPercentage(priceData.priceChange24h)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'alerts':
        return <PriceAlertManager />;
      case 'history':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyTransactionHistory />
          </Suspense>
        );
      case 'charts':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyChartAnalysis />
          </Suspense>
        );
      case 'defi':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyDeFiDashboard />
          </Suspense>
        );
      case 'multichain':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyMultiChainDashboard />
          </Suspense>
        );
      case 'autotrading':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <LazyAutoTradingDashboard />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <SecurityProvider>
        <WalletConnector>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Eclipse DeFi Tools
                </h1>
                <RealtimeIndicator />
                <OfflineIndicator />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSecurityDashboard(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="セキュリティ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="設定"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        <OfflineBanner />

        <nav className="bg-white dark:bg-gray-800 shadow-sm border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'swap', label: 'スワップ', icon: '💱' },
                { id: 'pools', label: '流動性プール', icon: '💧' },
                { id: 'analysis', label: 'プール分析', icon: '📈' },
                { id: 'farming', label: 'ファーミング', icon: '🌾' },
                { id: 'pnl', label: 'PnL', icon: '📊' },
                { id: 'prices', label: '価格', icon: '💰' },
                { id: 'alerts', label: '価格アラート', icon: '🔔' },
                { id: 'history', label: '取引履歴', icon: '📜' },
                { id: 'charts', label: 'チャート分析', icon: '📉' },
                { id: 'defi', label: 'DeFi統合', icon: '🏦' },
                { id: 'multichain', label: 'マルチチェーン', icon: '🌐' },
                { id: 'autotrading', label: '自動取引', icon: '🤖' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
        
        {/* Settings Modal */}
        {showSettings && (
          <Suspense fallback={<SettingsLoader />}>
            <LazyUserSettings
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              settings={settings}
              onSettingsChange={saveSettings as (settings: UserSettingsType) => void}
            />
          </Suspense>
        )}
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* Security Dashboard */}
        <SecurityDashboard
          isOpen={showSecurityDashboard}
          onClose={() => setShowSecurityDashboard(false)}
        />
          </div>
        </WalletConnector>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

export default App;
