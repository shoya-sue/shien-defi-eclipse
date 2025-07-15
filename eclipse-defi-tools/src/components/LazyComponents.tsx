import { lazy } from 'react';

// 遅延読み込みコンポーネント
export const LazySwapInterface = lazy(() => import('./SwapComparison/SwapInterface'));
export const LazyLiquidityCalculator = lazy(() => import('./LiquidityCalculator/LiquidityCalculator'));
export const LazyLiquidityAnalysis = lazy(() => import('./Liquidity/LiquidityAnalysis'));
export const LazyYieldTracker = lazy(() => import('./YieldTracker/YieldTracker'));
export const LazyPnLCalculator = lazy(() => import('./PnLCalculator/PnLCalculator'));
export const LazyUserSettings = lazy(() => import('./Common/UserSettings'));
export const LazyTransactionHistory = lazy(() => import('./TransactionHistory/TransactionHistory'));
export const LazyChartAnalysis = lazy(() => import('./ChartAnalysis/ChartAnalysis'));
export const LazyDeFiDashboard = lazy(() => import('./DeFi/DeFiDashboard'));
export const LazyMultiChainDashboard = lazy(() => import('./MultiChain/MultiChainDashboard'));
export const LazyAutoTradingDashboard = lazy(() => import('./AutoTrading/AutoTradingDashboard'));

// 共通ローディングコンポーネント
export const ComponentLoader = () => (
  <div className="min-h-96 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">読み込み中...</p>
    </div>
  </div>
);

// 設定モーダル用ローディング
export const SettingsLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">設定を読み込み中...</p>
      </div>
    </div>
  </div>
);