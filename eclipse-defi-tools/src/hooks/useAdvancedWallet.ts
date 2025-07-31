import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  advancedWalletService, 
  type WalletConnectionState, 
  type WalletBalance, 
  type TransactionHistory,
  type TransactionOptions 
} from '../services/advancedWalletService';
import { getErrorMessage } from '../utils';

export interface UseAdvancedWalletResult {
  // 接続状態
  connectionState: WalletConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  
  // 残高情報
  balance: WalletBalance;
  balanceLoading: boolean;
  
  // トランザクション履歴
  recentTransactions: TransactionHistory[];
  transactionLoading: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  transferSOL: (toAddress: string, amount: number, options?: TransactionOptions) => Promise<string>;
  
  // ユーティリティ
  formatBalance: (amount: number, symbol?: string) => string;
  getTransactionStatus: (signature: string) => 'success' | 'failed' | 'pending' | 'unknown';
}

export const useAdvancedWallet = (): UseAdvancedWalletResult => {
  const { wallet, connected, connecting, disconnect: baseDisconnect } = useWallet();
  
  const [connectionState, setConnectionState] = useState<WalletConnectionState>(
    advancedWalletService.getConnectionState()
  );
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 接続状態の監視
  useEffect(() => {
    const updateConnectionState = () => {
      const state = advancedWalletService.getConnectionState();
      setConnectionState(state);
      setError(state.lastError);
    };

    // 初期状態を設定
    updateConnectionState();

    // 定期的に状態を更新（WebSocketやイベントリスナーがない場合の代替）
    const interval = setInterval(updateConnectionState, 1000);

    return () => clearInterval(interval);
  }, []);

  // ウォレット接続状態の変化を監視
  useEffect(() => {
    if (connected && wallet && !connectionState.isConnected) {
      // ウォレットが接続されたが、アドバンスサービスにまだ接続されていない
      connect().catch(console.error);
    } else if (!connected && connectionState.isConnected) {
      // ウォレットが切断されたが、アドバンスサービスはまだ接続状態
      disconnect().catch(console.error);
    }
  }, [connected, wallet, connectionState.isConnected, connect, disconnect]);

  // ウォレット接続
  const connect = useCallback(async (): Promise<void> => {
    if (!wallet) {
      throw new Error('No wallet selected');
    }

    try {
      setError(null);
      await advancedWalletService.connectWallet(wallet.adapter);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [wallet]);

  // ウォレット切断
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await advancedWalletService.disconnectWallet();
      await baseDisconnect();
    } catch (error) {
      console.error('Disconnect error:', getErrorMessage(error));
    }
  }, [baseDisconnect]);

  // 残高更新
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!connectionState.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setBalanceLoading(true);
      setError(null);
      await advancedWalletService.updateBalance();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setBalanceLoading(false);
    }
  }, [connectionState.isConnected]);

  // SOL転送
  const transferSOL = useCallback(async (
    toAddress: string,
    amount: number,
    options: TransactionOptions = {}
  ): Promise<string> => {
    if (!connectionState.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setTransactionLoading(true);
      setError(null);
      
      const signature = await advancedWalletService.transferSOL(toAddress, amount, options);
      return signature;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setTransactionLoading(false);
    }
  }, [connectionState.isConnected]);

  // 残高フォーマット
  const formatBalance = useCallback((amount: number, symbol: string = 'SOL'): string => {
    if (amount === 0) return `0 ${symbol}`;
    
    if (amount < 0.0001) {
      return `<0.0001 ${symbol}`;
    }
    
    if (amount < 1) {
      return `${amount.toFixed(6)} ${symbol}`;
    }
    
    if (amount < 1000) {
      return `${amount.toFixed(4)} ${symbol}`;
    }
    
    return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  }, []);

  // トランザクション状態取得
  const getTransactionStatus = useCallback((signature: string): 'success' | 'failed' | 'pending' | 'unknown' => {
    const transaction = connectionState.recentTransactions.find(tx => tx.signature === signature);
    return transaction?.status || 'unknown';
  }, [connectionState.recentTransactions]);

  return {
    // 接続状態
    connectionState,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting || connecting,
    
    // 残高情報
    balance: connectionState.balance,
    balanceLoading,
    
    // トランザクション履歴
    recentTransactions: connectionState.recentTransactions,
    transactionLoading,
    
    // エラー状態
    error,
    
    // アクション
    connect,
    disconnect,
    refreshBalance,
    transferSOL,
    
    // ユーティリティ
    formatBalance,
    getTransactionStatus,
  };
};

export default useAdvancedWallet;