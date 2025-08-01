import React, { useState, useEffect } from 'react';
import type { Token } from '../../types';
import { COMMON_TOKENS } from '../../constants';
import { formatTokenAmount, formatPercentage, validateAmount } from '../../utils';
import { useSwapQuotes } from '../../hooks/useSwapQuotes';
import { useWallet } from '../../hooks/useWallet';
import { useSecurityContext } from '../../hooks/useSecurityContext';
import { useJupiterApi } from '../../hooks/useJupiterApi';
import { useOrcaApi } from '../../hooks/useOrcaApi';
// import { useRealtimeData } from '../../services/realtimeService';
import { 
  swapExecutionService, 
  type SwapExecutionOptions, 
  type SwapConfirmation
} from '../../services/swapExecutionService';
import TokenSelector from '../Common/TokenSelector';
import RealtimeIndicator from '../Common/RealtimeIndicator';

export const SwapInterface: React.FC = () => {
  const [inputToken, setInputToken] = useState<Token>(COMMON_TOKENS[0]); // SOL
  const [outputToken, setOutputToken] = useState<Token>(COMMON_TOKENS[1]); // USDC
  const [inputAmount, setInputAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  
  // スワップ実行関連の状態
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [swapConfirmation, setSwapConfirmation] = useState<SwapConfirmation | null>(null);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  
  const { quotes, bestQuote, loading, error, fetchQuotes, clearQuotes } = useSwapQuotes();
  const { connected, balance, fetchAllBalances, getTokenBalance } = useWallet();
  const { sanitizeInput, auditInput } = useSecurityContext();
  const { 
    quotes: jupiterQuotes, 
    quotesLoading: jupiterLoading, 
    quotesError: jupiterError,
    getQuote: getJupiterQuote,
    isHealthy: jupiterHealthy,
    clearQuotes: clearJupiterQuotes 
  } = useJupiterApi();
  
  const { 
    quotes: orcaQuotes, 
    quotesLoading: orcaLoading, 
    quotesError: orcaError,
    getSwapQuote: getOrcaQuote,
    isHealthy: orcaHealthy,
    clearQuotes: clearOrcaQuotes 
  } = useOrcaApi();
  
  // リアルタイム機能は将来の実装で使用予定
  // const { subscribeToQuote } = useRealtimeData();

  // ウォレット接続時にトークンバランスを取得
  useEffect(() => {
    if (connected) {
      fetchAllBalances(COMMON_TOKENS);
    }
  }, [connected, fetchAllBalances]);

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

  // Jupiter API統合のため、実際のAPIクォートも取得
  useEffect(() => {
    if (inputAmount && validateAmount(inputAmount) && jupiterHealthy) {
      const amount = parseFloat(inputAmount);
      const slippageBps = slippage * 100;
      
      // Jupiter APIからも並行してクォートを取得
      getJupiterQuote(inputToken, outputToken, amount, slippageBps)
        .then((jupiterQuotes) => {
          console.log('Jupiter quotes received:', jupiterQuotes.length);
        })
        .catch((error) => {
          console.warn('Jupiter quote failed (fallback to mock):', error.message);
        });

      // Orca APIからも並行してクォートを取得
      getOrcaQuote(inputToken, outputToken, amount, slippageBps)
        .then((orcaQuotes) => {
          console.log('Orca quotes received:', orcaQuotes.length);
        })
        .catch((error) => {
          console.warn('Orca quote failed (fallback to mock):', error.message);
        });
    } else {
      clearJupiterQuotes();
      clearOrcaQuotes();
    }
  }, [inputAmount, inputToken, outputToken, slippage, getJupiterQuote, clearJupiterQuotes, jupiterHealthy, getOrcaQuote, clearOrcaQuotes, orcaHealthy]);

  const handleInputAmountChange = (value: string) => {
    // セキュリティチェック
    if (!auditInput(value, 'swap_input_amount')) {
      return;
    }
    
    // 数値と小数点のみを許可
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const sanitizedValue = sanitizeInput(value);
      setInputAmount(sanitizedValue);
    }
  };

  const handleTokenSwap = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    clearQuotes();
    clearJupiterQuotes();
    clearOrcaQuotes();
  };

  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowSlippageSettings(false);
  };

  // スワップ実行ハンドラー
  const handleSwapClick = async () => {
    if (!bestQuote || !isValidAmount) return;

    try {
      // スワップ確認情報を取得
      const confirmation = await swapExecutionService.prepareSwapConfirmation(bestQuote, {
        slippageBps: slippage * 100,
      });
      
      setSwapConfirmation(confirmation);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Failed to prepare swap confirmation:', error);
      alert(`スワップ準備に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConfirmSwap = async () => {
    if (!swapConfirmation || !isValidAmount) return;

    try {
      setIsExecutingSwap(true);
      
      const options: SwapExecutionOptions = {
        slippageBps: slippage * 100,
        priorityFee: 0.000005, // デフォルト優先手数料
        skipSimulation: false,
        maxRetries: 3,
      };

      const result = await swapExecutionService.executeOptimalSwap(
        inputToken,
        outputToken,
        parseFloat(inputAmount),
        options
      );

      setShowConfirmModal(false);
      setInputAmount('');
      
      // 成功通知
      alert(`スワップが完了しました!\nプロバイダー: ${result.provider}\n受取量: ${result.outputAmount.toFixed(6)} ${outputToken.symbol}\nトランザクション: ${result.signature}`);
      
    } catch (error) {
      console.error('Swap execution failed:', error);
      alert(`スワップに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecutingSwap(false);
    }
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
                          ? 'bg-primary-600 text-white'
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
              Balance: {inputToken.symbol === 'SOL' 
                ? balance.sol.toFixed(4) 
                : getTokenBalance(inputToken.address)?.uiBalance || '0'}
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
              Balance: {outputToken.symbol === 'SOL' 
                ? balance.sol.toFixed(4) 
                : getTokenBalance(outputToken.address)?.uiBalance || '0'}
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
        {(loading || jupiterLoading || orcaLoading) && isValidAmount && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              最適なレートを検索中...
              {jupiterLoading && <span className="block text-xs mt-1">Jupiter API取得中...</span>}
              {orcaLoading && <span className="block text-xs mt-1">Orca API取得中...</span>}
            </p>
          </div>
        )}

        {/* Error State */}
        {(error || jupiterError || orcaError) && (
          <div className="text-center py-4">
            {error && <p className="text-error-600 dark:text-error-400">{error}</p>}
            {jupiterError && (
              <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                Jupiter API: {jupiterError}
              </p>
            )}
            {orcaError && (
              <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                Orca API: {orcaError}
              </p>
            )}
          </div>
        )}

        {/* Best Quote */}
        {bestQuote && !loading && (
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-success-800 dark:text-success-200">
                最適なレート
              </span>
              <span className="text-sm font-semibold text-success-800 dark:text-success-200">
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
                <span className={`font-medium ${bestQuote.priceImpact > 5 ? 'text-error-600' : 'text-gray-900 dark:text-white'}`}>
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
          onClick={handleSwapClick}
          disabled={!connected || !isValidAmount || loading || jupiterLoading || orcaLoading || !bestQuote}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            !connected || !isValidAmount || loading || jupiterLoading || orcaLoading || !bestQuote
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {!connected
            ? 'ウォレットを接続してください'
            : !isValidAmount
            ? '金額を入力してください'
            : loading || jupiterLoading || orcaLoading
            ? 'レートを取得中...'
            : !bestQuote
            ? 'レートが見つかりません'
            : 'スワップ実行'}
        </button>

        {/* All Quotes - Mock + Jupiter + Orca */}
        {(quotes.length > 0 || jupiterQuotes.length > 0 || orcaQuotes.length > 0) && !loading && !jupiterLoading && !orcaLoading && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              全DEX比較
            </h3>
            
            {/* Mock quotes */}
            {quotes.map((quote, index) => (
              <div
                key={`mock-${index}`}
                className={`border rounded-lg p-3 ${
                  quote === bestQuote
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quote.provider || 'Mock DEX'}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      モック
                    </span>
                    {quote === bestQuote && (
                      <span className="text-xs bg-success-100 dark:bg-success-800 text-success-800 dark:text-success-200 px-2 py-1 rounded">
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
            
            {/* Jupiter quotes */}
            {jupiterQuotes.map((quote, index) => (
              <div
                key={`jupiter-${index}`}
                className="border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quote.provider}
                    </span>
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                      実際のAPI
                    </span>
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
            
            {/* Orca quotes */}
            {orcaQuotes.map((quote, index) => (
              <div
                key={`orca-${index}`}
                className="border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quote.provider}
                    </span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                      実際のAPI
                    </span>
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

      {/* スワップ確認モーダル */}
      {showConfirmModal && swapConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                スワップ確認
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* スワップ詳細 */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">送信</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {inputAmount} {inputToken.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">受取予定</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {swapConfirmation.quote.outputAmount.toFixed(6)} {outputToken.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">最小受取量</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {swapConfirmation.minimumReceived.toFixed(6)} {outputToken.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">価格影響</span>
                    <span className={`font-medium ${
                      swapConfirmation.priceImpactWarning ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatPercentage(swapConfirmation.quote.priceImpact)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">推定ガス手数料</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {swapConfirmation.estimatedGasFee.toFixed(6)} SOL
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">プロバイダー</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {swapConfirmation.quote.dex}
                    </span>
                  </div>
                </div>
              </div>

              {/* 警告表示 */}
              {swapConfirmation.recommendation === 'high_risk' && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium text-error-800 dark:text-error-200">
                      高リスク取引
                    </span>
                  </div>
                  <p className="text-sm text-error-600 dark:text-error-400 mt-1">
                    価格影響が大きいか、流動性が低い可能性があります。
                  </p>
                </div>
              )}

              {swapConfirmation.recommendation === 'caution' && (
                <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium text-warning-800 dark:text-warning-200">
                      注意が必要
                    </span>
                  </div>
                  <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">
                    価格影響を確認してください。
                  </p>
                </div>
              )}

              {/* 実行ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmSwap}
                  disabled={isExecutingSwap}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isExecutingSwap ? 'スワップ実行中...' : 'スワップ実行'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapInterface;