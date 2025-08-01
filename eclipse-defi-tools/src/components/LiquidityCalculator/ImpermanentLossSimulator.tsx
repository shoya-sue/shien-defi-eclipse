import React, { useState, useEffect } from 'react';
import type { Token } from '../../types';
import { COMMON_TOKENS } from '../../constants';
import { formatNumber, formatPercentage, validateAmount } from '../../utils';
import { useImpermanentLoss } from '../../hooks/usePoolData';
import TokenSelector from '../Common/TokenSelector';

export const ImpermanentLossSimulator: React.FC = () => {
  const [token0, setToken0] = useState<Token>(COMMON_TOKENS[0]); // SOL
  const [token1, setToken1] = useState<Token>(COMMON_TOKENS[1]); // USDC
  
  // Initial state
  const [initialAmount0, setInitialAmount0] = useState<string>('100');
  const [initialAmount1, setInitialAmount1] = useState<string>('500');
  const [initialPrice0, setInitialPrice0] = useState<string>('50');
  const [initialPrice1, setInitialPrice1] = useState<string>('1');
  
  // Current state
  const [currentPrice0, setCurrentPrice0] = useState<string>('50');
  const [currentPrice1, setCurrentPrice1] = useState<string>('1');
  
  // Simulation scenarios
  const [selectedScenario, setSelectedScenario] = useState<string>('custom');
  
  const { impermanentLoss, calculateIL } = useImpermanentLoss();

  const scenarios = [
    { id: 'custom', name: 'カスタム', price0Change: 0, price1Change: 0 },
    { id: 'moderate_up', name: 'Token0 +25%', price0Change: 0.25, price1Change: 0 },
    { id: 'moderate_down', name: 'Token0 -25%', price0Change: -0.25, price1Change: 0 },
    { id: 'high_up', name: 'Token0 +50%', price0Change: 0.5, price1Change: 0 },
    { id: 'high_down', name: 'Token0 -50%', price0Change: -0.5, price1Change: 0 },
    { id: 'extreme_up', name: 'Token0 +100%', price0Change: 1, price1Change: 0 },
    { id: 'extreme_down', name: 'Token0 -75%', price0Change: -0.75, price1Change: 0 },
  ];

  useEffect(() => {
    if (
      validateAmount(initialAmount0) &&
      validateAmount(initialAmount1) &&
      validateAmount(initialPrice0) &&
      validateAmount(initialPrice1) &&
      validateAmount(currentPrice0) &&
      validateAmount(currentPrice1)
    ) {
      calculateIL(
        parseFloat(initialPrice0),
        parseFloat(initialPrice1),
        parseFloat(currentPrice0),
        parseFloat(currentPrice1),
        parseFloat(initialAmount0),
        parseFloat(initialAmount1)
      );
    }
  }, [initialAmount0, initialAmount1, initialPrice0, initialPrice1, currentPrice0, currentPrice1, calculateIL]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    
    if (scenarioId !== 'custom') {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        const basePrice0 = parseFloat(initialPrice0);
        const basePrice1 = parseFloat(initialPrice1);
        
        setCurrentPrice0((basePrice0 * (1 + scenario.price0Change)).toString());
        setCurrentPrice1((basePrice1 * (1 + scenario.price1Change)).toString());
      }
    }
  };

  const handleInputChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      setSelectedScenario('custom');
    }
  };

  const initialValue = validateAmount(initialAmount0) && validateAmount(initialAmount1) && 
                      validateAmount(initialPrice0) && validateAmount(initialPrice1)
    ? parseFloat(initialAmount0) * parseFloat(initialPrice0) + parseFloat(initialAmount1) * parseFloat(initialPrice1)
    : 0;

  const currentValue = validateAmount(currentPrice0) && validateAmount(currentPrice1)
    ? parseFloat(initialAmount0) * parseFloat(currentPrice0) + parseFloat(initialAmount1) * parseFloat(currentPrice1)
    : 0;

  const holdValue = currentValue; // HODLした場合の価値

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Impermanent Loss シミュレーター
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Token Pair */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              流動性ペア
            </label>
            <div className="flex gap-2">
              <TokenSelector
                selectedToken={token0}
                onTokenSelect={setToken0}
                excludeToken={token1}
                className="flex-1"
              />
              <span className="self-center text-gray-500 dark:text-gray-400">-</span>
              <TokenSelector
                selectedToken={token1}
                onTokenSelect={setToken1}
                excludeToken={token0}
                className="flex-1"
              />
            </div>
          </div>

          {/* Scenario Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              シナリオ選択
            </label>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioChange(scenario.id)}
                  className={`px-3 py-2 text-sm rounded ${
                    selectedScenario === scenario.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>

          {/* Initial State */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              初期状態
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token0.symbol} 数量
                </label>
                <input
                  type="text"
                  value={initialAmount0}
                  onChange={(e) => handleInputChange(e.target.value, setInitialAmount0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token0.symbol} 価格
                </label>
                <input
                  type="text"
                  value={initialPrice0}
                  onChange={(e) => handleInputChange(e.target.value, setInitialPrice0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token1.symbol} 数量
                </label>
                <input
                  type="text"
                  value={initialAmount1}
                  onChange={(e) => handleInputChange(e.target.value, setInitialAmount1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token1.symbol} 価格
                </label>
                <input
                  type="text"
                  value={initialPrice1}
                  onChange={(e) => handleInputChange(e.target.value, setInitialPrice1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              初期価値: ${formatNumber(initialValue, 2)}
            </div>
          </div>

          {/* Current State */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              現在の価格
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token0.symbol} 価格
                </label>
                <input
                  type="text"
                  value={currentPrice0}
                  onChange={(e) => handleInputChange(e.target.value, setCurrentPrice0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {token1.symbol} 価格
                </label>
                <input
                  type="text"
                  value={currentPrice1}
                  onChange={(e) => handleInputChange(e.target.value, setCurrentPrice1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              価格比率変化: {impermanentLoss ? formatNumber(impermanentLoss.priceRatio, 3) : '--'}x
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {impermanentLoss && (
            <>
              {/* Impermanent Loss Summary */}
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-error-800 dark:text-error-200 mb-3">
                  Impermanent Loss
                </h3>
                <div className="text-3xl font-bold text-error-600 dark:text-error-400 mb-2">
                  {formatPercentage(impermanentLoss.impermanentLoss)}
                </div>
                <div className="text-sm text-error-700 dark:text-error-300">
                  流動性提供により発生する損失
                </div>
              </div>

              {/* Detailed Comparison */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  詳細比較
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">初期価値:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${formatNumber(initialValue, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">HODL価値:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${formatNumber(holdValue, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">手数料収入:</span>
                    <span className="font-medium text-success-600 dark:text-success-400">
                      ${formatNumber(impermanentLoss.feesEarned, 2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">純結果:</span>
                      <span className={`font-bold ${
                        impermanentLoss.netResult >= 0 
                          ? 'text-success-600 dark:text-success-400' 
                          : 'text-error-600 dark:text-error-400'
                      }`}>
                        {impermanentLoss.netResult >= 0 ? '+' : ''}
                        {formatPercentage(impermanentLoss.netResult)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-3">
                  リスク評価
                </h3>
                <div className="space-y-2 text-sm">
                  {Math.abs(impermanentLoss.impermanentLoss) < 2 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                      <span className="text-success-700 dark:text-success-300">
                        低リスク: 価格変動が小さく、IL は軽微です
                      </span>
                    </div>
                  )}
                  {Math.abs(impermanentLoss.impermanentLoss) >= 2 && Math.abs(impermanentLoss.impermanentLoss) < 10 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                      <span className="text-warning-700 dark:text-warning-300">
                        中リスク: 適度な価格変動による IL が発生
                      </span>
                    </div>
                  )}
                  {Math.abs(impermanentLoss.impermanentLoss) >= 10 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-error-500 rounded-full"></span>
                      <span className="text-error-700 dark:text-error-300">
                        高リスク: 大きな価格変動により、重大な IL が発生
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-3 text-warning-700 dark:text-warning-300">
                    <strong>推奨:</strong> 手数料収入が IL をカバーできるか確認してください
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpermanentLossSimulator;