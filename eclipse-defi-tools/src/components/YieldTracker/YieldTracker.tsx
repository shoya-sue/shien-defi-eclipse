import React, { useState } from 'react';
import PortfolioDashboard from './PortfolioDashboard';
import PositionList from './PositionList';
import FarmingPools from './FarmingPools';

type YieldTrackerTab = 'dashboard' | 'positions' | 'pools';

export const YieldTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<YieldTrackerTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
    { id: 'positions', label: 'ポジション', icon: '📈' },
    { id: 'pools', label: 'プール', icon: '🏊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PortfolioDashboard />;
      case 'positions':
        return <PositionList />;
      case 'pools':
        return <FarmingPools />;
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
              onClick={() => setActiveTab(tab.id as YieldTrackerTab)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
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
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
          Yield Farming について
        </h3>
        <div className="text-sm text-primary-700 dark:text-primary-300 space-y-2">
          <p>
            <strong>Yield Farming:</strong> 暗号資産を流動性プールにステーキングして報酬を獲得する手法。
            DeFiプロトコルから追加のトークン報酬を得ることができます。
          </p>
          <p>
            <strong>APY (年間利回り):</strong> 複利効果を含む年間収益率。
            高APYプールほど高いリターンが期待できますが、リスクも高くなります。
          </p>
          <p>
            <strong>リスク管理:</strong> Impermanent Loss、スマートコントラクトリスク、
            流動性リスクを理解して投資することが重要です。
          </p>
        </div>
      </div>
    </div>
  );
};

export default YieldTracker;