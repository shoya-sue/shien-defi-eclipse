import React, { useState } from 'react';
import { useAdvancedWallet } from '../../hooks/useAdvancedWallet';
import { formatPrice } from '../../utils';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (address: string, amount: number) => Promise<void>;
  balance: number;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onTransfer, balance }) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    try {
      setError(null);
      setIsTransferring(true);
      
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Invalid amount');
      }
      
      if (transferAmount > balance) {
        throw new Error('Insufficient balance');
      }
      
      await onTransfer(toAddress, transferAmount);
      setToAddress('');
      setAmount('');
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SOL転送
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              送信先アドレス
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="受信者のウォレットアドレスを入力"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              送信量 (SOL)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.000001"
                max={balance}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setAmount((balance * 0.9).toString())}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded"
              >
                Max
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              残高: {balance.toFixed(6)} SOL
            </p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            <button
              onClick={handleTransfer}
              disabled={!toAddress || !amount || isTransferring}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTransferring ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WalletDashboard: React.FC = () => {
  const {
    connectionState,
    isConnected,
    isConnecting,
    balance,
    balanceLoading,
    recentTransactions,
    error,
    connect,
    disconnect,
    refreshBalance,
    transferSOL,
    formatBalance,
  } = useAdvancedWallet();

  const [showTransferModal, setShowTransferModal] = useState(false);

  const handleTransfer = async (address: string, amount: number) => {
    try {
      const signature = await transferSOL(address, amount);
      console.log('Transfer initiated:', signature);
      // 成功通知などを表示
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'failed':
        return '失敗';
      case 'pending':
        return '保留中';
      default:
        return '不明';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ウォレットが接続されていません
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ウォレットを接続して残高や取引履歴を表示します
          </p>
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isConnecting ? '接続中...' : 'ウォレットを接続'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ウォレット情報ヘッダー */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {connectionState.walletName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {connectionState.publicKey?.toBase58().slice(0, 8)}...{connectionState.publicKey?.toBase58().slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
          >
            切断
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 残高情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">SOL残高</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {balanceLoading ? '...' : formatBalance(balance.sol)}
                </p>
              </div>
              <button
                onClick={refreshBalance}
                disabled={balanceLoading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className={`w-5 h-5 ${balanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">推定USD価値</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(balance.totalValueUSD)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">トークン数</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {balance.tokens.length}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            送金
          </button>
          <button
            onClick={refreshBalance}
            disabled={balanceLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            更新
          </button>
        </div>
      </div>

      {/* 最近のトランザクション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          最近のトランザクション
        </h3>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            トランザクション履歴がありません
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.slice(0, 10).map((tx) => (
              <div
                key={tx.signature}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    tx.status === 'success' ? 'bg-green-500' :
                    tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.type === 'transfer' ? '送金' : 
                       tx.type === 'swap' ? 'スワップ' : 
                       'その他'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                    {getStatusText(tx.status)}
                  </p>
                  {tx.amount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBalance(tx.amount, tx.tokenSymbol)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 転送モーダル */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransfer}
        balance={balance.sol}
      />
    </div>
  );
};

export default WalletDashboard;