import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';

export interface WalletBalance {
  sol: number;
  loading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { connection } = useConnection();
  const wallet = useSolanaWallet();
  const [balance, setBalance] = useState<WalletBalance>({
    sol: 0,
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance({ sol: 0, loading: false, error: null });
      return;
    }

    setBalance(prev => ({ ...prev, loading: true, error: null }));

    try {
      const lamports = await connection.getBalance(wallet.publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalance({ sol, loading: false, error: null });
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({
        sol: 0,
        loading: false,
        error: 'Failed to fetch balance',
      });
    }
  }, [connection, wallet.publicKey]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchBalance();
    }
  }, [wallet.connected, wallet.publicKey, fetchBalance]);

  const signTransaction = useCallback(
    async (transaction: any) => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing transactions');
      }
      return await wallet.signTransaction(transaction);
    },
    [wallet.signTransaction]
  );

  const signAllTransactions = useCallback(
    async (transactions: any[]) => {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions');
      }
      return await wallet.signAllTransactions(transactions);
    },
    [wallet.signAllTransactions]
  );

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!wallet.signMessage) {
        throw new Error('Wallet does not support message signing');
      }
      return await wallet.signMessage(message);
    },
    [wallet.signMessage]
  );

  return {
    ...wallet,
    balance,
    fetchBalance,
    signTransaction,
    signAllTransactions,
    signMessage,
  };
};