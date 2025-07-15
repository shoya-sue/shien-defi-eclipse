import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js';
import { AccountLayout } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useState, useEffect, useCallback } from 'react';
import type { Token } from '../types';

export interface TokenBalance {
  token: Token;
  balance: number;
  uiBalance: string;
  decimals: number;
}

export interface WalletBalance {
  sol: number;
  tokens: TokenBalance[];
  loading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { connection } = useConnection();
  const wallet = useSolanaWallet();
  const [balance, setBalance] = useState<WalletBalance>({
    sol: 0,
    tokens: [],
    loading: false,
    error: null,
  });

  const fetchTokenBalance = useCallback(async (tokenInfo: Token): Promise<TokenBalance | null> => {
    if (!wallet.publicKey) return null;

    try {
      const tokenAddress = new PublicKey(tokenInfo.address);
      // Calculate associated token address manually for older SPL token version
      const [associatedTokenAddress] = await PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenAddress.toBuffer(),
        ],
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program ID
      );

      const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
      if (!accountInfo || accountInfo.data.length === 0) {
        return {
          token: tokenInfo,
          balance: 0,
          uiBalance: '0',
          decimals: tokenInfo.decimals,
        };
      }

      const accountData = AccountLayout.decode(accountInfo.data);
      const balance = Number(accountData.amount);
      const uiBalance = (balance / Math.pow(10, tokenInfo.decimals)).toFixed(tokenInfo.decimals);

      return {
        token: tokenInfo,
        balance,
        uiBalance,
        decimals: tokenInfo.decimals,
      };
    } catch (error) {
      console.error(`Error fetching balance for ${tokenInfo.symbol}:`, error);
      return null;
    }
  }, [connection, wallet.publicKey]);

  const fetchAllBalances = useCallback(async (tokens: Token[] = []) => {
    if (!wallet.publicKey) {
      setBalance({ sol: 0, tokens: [], loading: false, error: null });
      return;
    }

    setBalance(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch SOL balance
      const lamports = await connection.getBalance(wallet.publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;

      // Fetch token balances in parallel
      const tokenBalancePromises = tokens.map(token => fetchTokenBalance(token));
      const tokenBalances = await Promise.all(tokenBalancePromises);
      const validTokenBalances = tokenBalances.filter((tb): tb is TokenBalance => tb !== null);

      setBalance({
        sol,
        tokens: validTokenBalances,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalance({
        sol: 0,
        tokens: [],
        loading: false,
        error: 'Failed to fetch balances',
      });
    }
  }, [connection, wallet.publicKey, fetchTokenBalance]);

  const fetchBalance = useCallback(async () => {
    await fetchAllBalances();
  }, [fetchAllBalances]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchBalance();
    }
  }, [wallet.connected, wallet.publicKey, fetchBalance]);

  const signTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing transactions');
      }
      return await wallet.signTransaction(transaction);
    },
    [wallet]
  );

  const signAllTransactions = useCallback(
    async (transactions: Transaction[]) => {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions');
      }
      return await wallet.signAllTransactions(transactions);
    },
    [wallet]
  );

  const signMessage = useCallback(
    async (message: Uint8Array) => {
      if (!wallet.signMessage) {
        throw new Error('Wallet does not support message signing');
      }
      return await wallet.signMessage(message);
    },
    [wallet]
  );

  const getTokenBalance = useCallback((tokenAddress: string): TokenBalance | undefined => {
    return balance.tokens.find(tb => tb.token.address === tokenAddress);
  }, [balance.tokens]);

  return {
    ...wallet,
    balance,
    fetchBalance,
    fetchAllBalances,
    fetchTokenBalance,
    getTokenBalance,
    signTransaction,
    signAllTransactions,
    signMessage,
  };
};