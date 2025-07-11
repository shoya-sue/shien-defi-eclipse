import { useState } from 'react';
import WalletConnector from './components/Common/WalletConnector';
import WalletButton from './components/Common/WalletButton';
import SwapInterface from './components/SwapComparison/SwapInterface';
import LiquidityCalculator from './components/LiquidityCalculator/LiquidityCalculator';
import YieldTracker from './components/YieldTracker/YieldTracker';
import { COMMON_TOKENS } from './constants';
import { usePrices } from './hooks/usePrices';
import { formatPrice, formatPercentage } from './utils';

type ActiveTab = 'swap' | 'pools' | 'farming' | 'pnl' | 'prices';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('swap');
  const { prices, loading, error } = usePrices(COMMON_TOKENS);

  const renderContent = () => {
    switch (activeTab) {
      case 'swap':
        return <SwapInterface />;
      case 'pools':
        return <LiquidityCalculator />;
      case 'farming':
        return <YieldTracker />;
      case 'pnl':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              PnL計算機
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Coming soon...
            </p>
          </div>
        );
      case 'prices':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              トークン価格
            </h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">価格データを取得中...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">エラー: {error}</p>
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
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
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
      default:
        return null;
    }
  };

  return (
    <WalletConnector>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Eclipse DeFi Tools
                </h1>
              </div>
              <WalletButton />
            </div>
          </div>
        </header>

        <nav className="bg-white dark:bg-gray-800 shadow-sm border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'swap', label: 'スワップ', icon: '💱' },
                { id: 'pools', label: '流動性プール', icon: '💧' },
                { id: 'farming', label: 'ファーミング', icon: '🌾' },
                { id: 'pnl', label: 'PnL', icon: '📊' },
                { id: 'prices', label: '価格', icon: '💰' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
      </div>
    </WalletConnector>
  );
}

export default App;
