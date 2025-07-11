import React, { useState } from 'react';
import APYCalculator from './APYCalculator';
import ImpermanentLossSimulator from './ImpermanentLossSimulator';

type CalculatorTab = 'apy' | 'impermanent-loss';

export const LiquidityCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('apy');

  const tabs = [
    { id: 'apy', label: 'APY計算', icon: '📈' },
    { id: 'impermanent-loss', label: 'IL シミュレーター', icon: '⚠️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'apy':
        return <APYCalculator />;
      case 'impermanent-loss':
        return <ImpermanentLossSimulator />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CalculatorTab)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Information Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          流動性提供について
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <p>
            <strong>APY (Annual Percentage Yield):</strong> 年間利回り。手数料収入とトークン報酬を含む年間収益率。
          </p>
          <p>
            <strong>Impermanent Loss:</strong> 価格変動により流動性提供がHODLよりも不利になる現象。
            価格が元に戻れば IL も解消されるため「一時的な損失」と呼ばれる。
          </p>
          <p>
            <strong>リスク管理:</strong> 相関性の高いトークンペア（例：ETH/WETH）を選ぶことで IL を軽減できる。
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiquidityCalculator;