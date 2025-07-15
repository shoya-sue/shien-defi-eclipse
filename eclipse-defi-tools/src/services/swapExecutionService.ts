import { 
  Transaction, 
  VersionedTransaction
} from '@solana/web3.js';
import type { TransactionSignature } from '@solana/web3.js';
import { jupiterApiService, type JupiterSwapRequest } from './jupiterApiService';
import { orcaApiService, type OrcaSwapRequest } from './orcaApiService';
import { advancedWalletService } from './advancedWalletService';
import { transactionHistoryService, TransactionType } from './transactionHistoryService';
import { getErrorMessage } from '../utils';
import type { Token, SwapQuote } from '../types';

// スワップ実行の結果
export interface SwapExecutionResult {
  signature: TransactionSignature;
  inputAmount: number;
  outputAmount: number;
  actualPriceImpact: number;
  actualFee: number;
  provider: 'Jupiter' | 'Orca';
  timestamp: number;
}

// スワップ実行オプション
export interface SwapExecutionOptions {
  slippageBps?: number; // スリッページ許容値（bps）
  priorityFee?: number; // 優先手数料（SOL）
  skipSimulation?: boolean; // シミュレーションをスキップするか
  maxRetries?: number; // 最大リトライ回数
}

// スワップ実行前の確認情報
export interface SwapConfirmation {
  quote: SwapQuote;
  estimatedGasFee: number;
  minimumReceived: number;
  priceImpactWarning: boolean;
  liquidityWarning: boolean;
  recommendation: 'safe' | 'caution' | 'high_risk';
}

class SwapExecutionService {
  
  // スワップ実行前の確認情報を生成
  public async prepareSwapConfirmation(
    quote: SwapQuote,
    options: SwapExecutionOptions = {}
  ): Promise<SwapConfirmation> {
    try {
      // ガス手数料を推定
      let estimatedGasFee = quote.estimatedGas;
      
      // 最小受取量を計算（スリッページ考慮）
      const slippageBps = options.slippageBps || 50; // デフォルト 0.5%
      const slippageMultiplier = 1 - (slippageBps / 10000);
      const minimumReceived = quote.outputAmount * slippageMultiplier;
      
      // 警告フラグの設定
      const priceImpactWarning = quote.priceImpact > 5; // 5%以上で警告
      const liquidityWarning = quote.outputAmount < quote.inputAmount * 0.1; // 極端な出力量で警告
      
      // 推奨度の計算
      let recommendation: 'safe' | 'caution' | 'high_risk' = 'safe';
      
      if (quote.priceImpact > 15 || liquidityWarning) {
        recommendation = 'high_risk';
      } else if (quote.priceImpact > 5 || priceImpactWarning) {
        recommendation = 'caution';
      }
      
      return {
        quote,
        estimatedGasFee,
        minimumReceived,
        priceImpactWarning,
        liquidityWarning,
        recommendation,
      };
    } catch (error) {
      throw new Error(`Failed to prepare swap confirmation: ${getErrorMessage(error)}`);
    }
  }
  
  // Jupiter経由でスワップを実行
  public async executeJupiterSwap(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    options: SwapExecutionOptions = {}
  ): Promise<SwapExecutionResult> {
    try {
      const userPublicKey = advancedWalletService.getPublicKey();
      if (!userPublicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Jupiter APIからクォートを取得
      const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);
      const routes = await jupiterApiService.getQuote(
        inputToken.address,
        outputToken.address,
        inputAmountLamports,
        options.slippageBps
      );
      
      if (routes.length === 0) {
        throw new Error('No routes available for this swap');
      }
      
      const bestRoute = routes[0];
      
      // スワップトランザクションを取得
      const swapRequest: JupiterSwapRequest = {
        route: bestRoute,
        userPublicKey: userPublicKey.toBase58(),
        wrapUnwrapSOL: true,
      };
      
      const swapResponse = await jupiterApiService.getSwapTransaction(swapRequest);
      
      // トランザクションを送信
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapResponse.swapTransaction, 'base64')
      );
      
      const signature = await advancedWalletService.sendTransaction(transaction, {
        priorityFee: options.priorityFee,
        skipPreflight: options.skipSimulation,
        maxRetries: options.maxRetries,
      });
      
      // 結果を返す
      const outputAmount = parseFloat(bestRoute.outAmount) / Math.pow(10, outputToken.decimals);
      
      // トランザクション履歴に記録
      await transactionHistoryService.addTransaction(
        signature,
        TransactionType.SWAP,
        userPublicKey.toBase58(),
        {
          provider: 'Jupiter',
          inputToken: inputToken.symbol,
          outputToken: outputToken.symbol,
          inputAmount: amount,
          outputAmount,
          priceImpact: bestRoute.priceImpactPct,
          route: bestRoute,
        }
      );
      
      return {
        signature,
        inputAmount: amount,
        outputAmount,
        actualPriceImpact: bestRoute.priceImpactPct,
        actualFee: 0.000005, // 推定手数料
        provider: 'Jupiter',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Jupiter swap failed: ${getErrorMessage(error)}`);
    }
  }
  
  // Orca経由でスワップを実行
  public async executeOrcaSwap(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    options: SwapExecutionOptions = {}
  ): Promise<SwapExecutionResult> {
    try {
      const userPublicKey = advancedWalletService.getPublicKey();
      if (!userPublicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Orca APIからクォートを取得
      const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);
      const quote = await orcaApiService.getSwapQuote(
        inputToken.address,
        outputToken.address,
        inputAmountLamports,
        options.slippageBps
      );
      
      // スワップトランザクションを取得
      const swapRequest: OrcaSwapRequest = {
        quote,
        userPublicKey: userPublicKey.toBase58(),
        slippageBps: options.slippageBps || 50,
      };
      
      const swapResponse = await orcaApiService.getSwapTransaction(swapRequest);
      
      // トランザクションを送信
      const transaction = Transaction.from(
        Buffer.from(swapResponse.transaction, 'base64')
      );
      
      const signature = await advancedWalletService.sendTransaction(transaction, {
        priorityFee: options.priorityFee,
        skipPreflight: options.skipSimulation,
        maxRetries: options.maxRetries,
      });
      
      // 結果を返す
      const outputAmount = parseFloat(quote.outputAmount) / Math.pow(10, outputToken.decimals);
      
      // トランザクション履歴に記録
      await transactionHistoryService.addTransaction(
        signature,
        TransactionType.SWAP,
        userPublicKey.toBase58(),
        {
          provider: 'Orca',
          inputToken: inputToken.symbol,
          outputToken: outputToken.symbol,
          inputAmount: amount,
          outputAmount,
          priceImpact: quote.priceImpact,
          quote,
        }
      );
      
      return {
        signature,
        inputAmount: amount,
        outputAmount,
        actualPriceImpact: quote.priceImpact,
        actualFee: 0.000005, // 推定手数料
        provider: 'Orca',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Orca swap failed: ${getErrorMessage(error)}`);
    }
  }
  
  // 最適なプロバイダーを選択してスワップを実行
  public async executeOptimalSwap(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    options: SwapExecutionOptions = {}
  ): Promise<SwapExecutionResult> {
    try {
      // 両プロバイダーからクォートを取得して比較
      const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);
      
      const [jupiterRoutes, orcaQuote] = await Promise.allSettled([
        jupiterApiService.getQuote(
          inputToken.address,
          outputToken.address,
          inputAmountLamports,
          options.slippageBps
        ),
        orcaApiService.getSwapQuote(
          inputToken.address,
          outputToken.address,
          inputAmountLamports,
          options.slippageBps
        ),
      ]);
      
      // 最適なルートを選択
      let useJupiter = true;
      
      if (jupiterRoutes.status === 'fulfilled' && orcaQuote.status === 'fulfilled') {
        const jupiterOutput = parseFloat(jupiterRoutes.value[0]?.outAmount || '0');
        const orcaOutput = parseFloat(orcaQuote.value.outputAmount || '0');
        
        // より高い出力量を提供するプロバイダーを選択
        useJupiter = jupiterOutput >= orcaOutput;
      } else if (jupiterRoutes.status === 'rejected' && orcaQuote.status === 'fulfilled') {
        useJupiter = false;
      } else if (jupiterRoutes.status === 'fulfilled' && orcaQuote.status === 'rejected') {
        useJupiter = true;
      } else {
        throw new Error('Both providers failed to provide quotes');
      }
      
      // 選択されたプロバイダーでスワップを実行
      if (useJupiter) {
        return await this.executeJupiterSwap(inputToken, outputToken, amount, options);
      } else {
        return await this.executeOrcaSwap(inputToken, outputToken, amount, options);
      }
    } catch (error) {
      throw new Error(`Optimal swap execution failed: ${getErrorMessage(error)}`);
    }
  }
  
  // スワップのシミュレーションを実行
  public async simulateSwap(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    provider: 'Jupiter' | 'Orca' | 'Auto' = 'Auto'
  ): Promise<SwapConfirmation[]> {
    try {
      const inputAmountLamports = amount * Math.pow(10, inputToken.decimals);
      const confirmations: SwapConfirmation[] = [];
      
      // Jupiter シミュレーション
      if (provider === 'Jupiter' || provider === 'Auto') {
        try {
          const routes = await jupiterApiService.getQuote(
            inputToken.address,
            outputToken.address,
            inputAmountLamports
          );
          
          if (routes.length > 0) {
            const quote = jupiterApiService.jupiterRouteToSwapQuote(
              routes[0],
              inputToken,
              outputToken
            );
            
            const confirmation = await this.prepareSwapConfirmation(quote);
            confirmations.push(confirmation);
          }
        } catch (error) {
          console.warn('Jupiter simulation failed:', getErrorMessage(error));
        }
      }
      
      // Orca シミュレーション
      if (provider === 'Orca' || provider === 'Auto') {
        try {
          const orcaQuote = await orcaApiService.getSwapQuote(
            inputToken.address,
            outputToken.address,
            inputAmountLamports
          );
          
          const quote = orcaApiService.orcaQuoteToSwapQuote(
            orcaQuote,
            inputToken,
            outputToken
          );
          
          const confirmation = await this.prepareSwapConfirmation(quote);
          confirmations.push(confirmation);
        } catch (error) {
          console.warn('Orca simulation failed:', getErrorMessage(error));
        }
      }
      
      if (confirmations.length === 0) {
        throw new Error('No providers available for simulation');
      }
      
      // 出力量順でソート（降順）
      confirmations.sort((a, b) => b.quote.outputAmount - a.quote.outputAmount);
      
      return confirmations;
    } catch (error) {
      throw new Error(`Swap simulation failed: ${getErrorMessage(error)}`);
    }
  }
  
  // スワップ実行可能性をチェック
  public async validateSwap(
    inputToken: Token,
    outputToken: Token,
    amount: number
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // ウォレット接続確認
      if (!advancedWalletService.isConnected()) {
        errors.push('Wallet not connected');
      }
      
      // 残高確認
      const balance = advancedWalletService.getBalance();
      if (inputToken.symbol === 'SOL') {
        if (balance.sol < amount) {
          errors.push('Insufficient SOL balance');
        }
        if (balance.sol < amount + 0.01) { // ガス手数料考慮
          warnings.push('Low SOL balance after swap (may not cover future gas fees)');
        }
      } else {
        const tokenBalance = balance.tokens.find(t => t.mint === inputToken.address);
        if (!tokenBalance || tokenBalance.amount < amount) {
          errors.push(`Insufficient ${inputToken.symbol} balance`);
        }
      }
      
      // 金額の妥当性確認
      if (amount <= 0) {
        errors.push('Invalid swap amount');
      }
      
      if (amount < 0.000001) {
        warnings.push('Very small swap amount may result in high slippage');
      }
      
      // トークンペアの有効性確認
      if (inputToken.address === outputToken.address) {
        errors.push('Cannot swap the same token');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Validation failed: ${getErrorMessage(error)}`);
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }
}

// シングルトンインスタンス
export const swapExecutionService = new SwapExecutionService();

export default SwapExecutionService;