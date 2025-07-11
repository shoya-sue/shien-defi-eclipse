import React, { useState, useEffect } from 'react';
import type { Token } from '../../types';
import { COMMON_TOKENS } from '../../constants';
import { formatTokenAmount, formatPercentage, validateAmount } from '../../utils';
import { useSwapQuotes } from '../../hooks/useSwapQuotes';
import { useWallet } from '../../hooks/useWallet';
// import { useRealtimeData } from '../../services/realtimeService';
import TokenSelector from '../Common/TokenSelector';
import RealtimeIndicator from '../Common/RealtimeIndicator';

export const SwapInterface: React.FC = () => {
  const [inputToken, setInputToken] = useState<Token>(COMMON_TOKENS[0]); // SOL
  const [outputToken, setOutputToken] = useState<Token>(COMMON_TOKENS[1]); // USDC
  const [inputAmount, setInputAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  
  const { quotes, bestQuote, loading, error, fetchQuotes, clearQuotes } = useSwapQuotes();
  const { connected } = useWallet();
  // リアルタイム機能は将来の実装で使用予定
  // const { subscribeToQuote } = useRealtimeData();

  useEffect(() => {
    if (inputAmount && validateAmount(inputAmount)) {
      const amount = parseFloat(inputAmount);
      // スリッページをbps（basis points）に変換 (0.5% = 50bps)
      const slippageBps = slippage * 100;
      fetchQuotes(inputToken, outputToken, amount, slippageBps);
    } else {
      clearQuotes();
    }
  }, [inputAmount, inputToken, outputToken, slippage, fetchQuotes, clearQuotes]);

  const handleInputAmountChange = (value: string) => {
    // 数値と小数点のみを許可
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value);
    }
  };

  const handleTokenSwap = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    clearQuotes();
  };

  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowSlippageSettings(false);
  };

  const isValidAmount = inputAmount && validateAmount(inputAmount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            スワップ価格比較
          </h2>
          <RealtimeIndicator />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {slippage}%
          </button>
          
          {showSlippageSettings && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  スリッページ許容値
                </p>
                <div className="flex gap-2 mb-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleSlippageChange(value)}
                      className={`px-3 py-1 text-sm rounded ${
                        slippage === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Token */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              From
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Balance: --
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputAmount}
              onChange={(e) => handleInputAmountChange(e.target.value)}
              placeholder="0.0"
              className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
            />
            <TokenSelector
              selectedToken={inputToken}
              onTokenSelect={setInputToken}
              excludeToken={outputToken}
              className="min-w-[120px]"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleTokenSwap}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output Token */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Balance: --
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={bestQuote ? bestQuote.outputAmount.toFixed(6) : ''}
              placeholder="0.0"
              readOnly
              className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
            />
            <TokenSelector
              selectedToken={outputToken}
              onTokenSelect={setOutputToken}
              excludeToken={inputToken}
              className="min-w-[120px]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && isValidAmount && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              最適なレートを検索中...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Best Quote */}
        {bestQuote && !loading && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                最適なレート
              </span>
              <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                {bestQuote.dex}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">受け取り額:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTokenAmount(bestQuote.outputAmount, bestQuote.outputToken)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">価格影響:</span>
                <span className={`font-medium ${bestQuote.priceImpact > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatPercentage(bestQuote.priceImpact)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">手数料:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPercentage(bestQuote.fee * 100)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          disabled={!connected || !isValidAmount || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            !connected || !isValidAmount || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {!connected
            ? 'ウォレットを接続してください'
            : !isValidAmount
            ? '金額を入力してください'
            : loading
            ? 'レートを取得中...'
            : 'スワップ実行'}
        </button>

        {/* All Quotes */}
        {quotes.length > 0 && !loading && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              全DEX比較
            </h3>
            {quotes.map((quote, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  quote === bestQuote
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quote.dex}
                    </span>
                    {quote === bestQuote && (
                      <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        最適
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatTokenAmount(quote.outputAmount, quote.outputToken)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      影響: {formatPercentage(quote.priceImpact)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapInterface;