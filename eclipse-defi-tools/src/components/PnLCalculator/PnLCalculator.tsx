import React, { useState } from 'react';
import TransactionImporter from './TransactionImporter';
import PnLSummary from './PnLSummary';
import TaxReport from './TaxReport';

type PnLCalculatorTab = 'importer' | 'summary' | 'tax';

export const PnLCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PnLCalculatorTab>('importer');

  const tabs = [
    { id: 'importer', label: '取引履歴', icon: '📥' },
    { id: 'summary', label: 'PnL概要', icon: '📊' },
    { id: 'tax', label: '税務レポート', icon: '📄' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'importer':
        return <TransactionImporter />;
      case 'summary':
        return <PnLSummary />;
      case 'tax':
        return <TaxReport />;
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
              onClick={() => setActiveTab(tab.id as PnLCalculatorTab)}
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
          PnL計算について
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <p>
            <strong>実現損益:</strong> 実際に売却・交換した取引から確定した損益。
            税務上の課税対象となります。
          </p>
          <p>
            <strong>未実現損益:</strong> 現在保有している資産の評価損益。
            売却するまでは税務上の損益として認識されません。
          </p>
          <p>
            <strong>会計方式:</strong> FIFO（先入先出）、LIFO（後入先出）、加重平均の3つの方法で計算できます。
            国や税務方針によって適用される方式が異なります。
          </p>
          <p>
            <strong>税務注意:</strong> 実際の税務申告には専門家のアドバイスを求めることをお勧めします。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PnLCalculator;