import WalletConnector from './components/Common/WalletConnector';
import WalletButton from './components/Common/WalletButton';
import { COMMON_TOKENS } from './constants';
import { usePrices } from './hooks/usePrices';
import { formatPrice, formatPercentage } from './utils';

function App() {
  const { prices, loading, error } = usePrices(COMMON_TOKENS);

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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                スワップ価格比較
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                複数DEXの価格を比較し、最適な取引ルートを提案
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                流動性プール計算機
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                APYやImpermanent Loss計算
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Yield Farming Tracker
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                利回り農業のポジション管理
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                PnL計算機
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                損益計算と税務サポート
              </p>
            </div>
          </div>

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
        </main>
      </div>
    </WalletConnector>
  );
}

export default App;
