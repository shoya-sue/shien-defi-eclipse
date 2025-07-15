import { 
  Connection, 
  Transaction, 
  VersionedTransaction, 
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import type { 
  WalletAdapter
} from '@solana/wallet-adapter-base';
import type { 
  SendOptions,
  TransactionSignature
} from '@solana/web3.js';
import { getErrorMessage } from '../utils';
import { eclipseRpcService } from './eclipseRpcService';

// トランザクション履歴の型定義
export interface TransactionHistory {
  signature: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  type: 'swap' | 'transfer' | 'stake' | 'unstake' | 'other';
  amount?: number;
  fee: number;
  tokenSymbol?: string;
  fromAddress?: string;
  toAddress?: string;
  errorMessage?: string;
}

// ウォレット残高の詳細情報
export interface WalletBalance {
  sol: number;
  tokens: TokenBalance[];
  totalValueUSD: number;
  lastUpdated: number;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  uiAmount: string;
  decimals: number;
  valueUSD?: number;
}

// トランザクション作成オプション
export interface TransactionOptions {
  priorityFee?: number; // SOL単位
  computeUnitLimit?: number;
  skipPreflight?: boolean;
  maxRetries?: number;
}

// ウォレット接続状態
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;
  balance: WalletBalance;
  recentTransactions: TransactionHistory[];
  lastError: string | null;
}

class AdvancedWalletService {
  private connection: Connection;
  private wallet: WalletAdapter | null = null;
  private connectionState: WalletConnectionState;
  private balanceUpdateInterval: NodeJS.Timeout | null = null;
  private transactionHistory: Map<string, TransactionHistory> = new Map();

  constructor() {
    this.connection = eclipseRpcService.getConnection();
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      publicKey: null,
      walletName: null,
      balance: {
        sol: 0,
        tokens: [],
        totalValueUSD: 0,
        lastUpdated: 0,
      },
      recentTransactions: [],
      lastError: null,
    };
  }

  // ウォレット接続
  public async connectWallet(wallet: WalletAdapter): Promise<void> {
    try {
      this.connectionState.isConnecting = true;
      this.connectionState.lastError = null;
      
      this.wallet = wallet;
      
      if (!wallet.connected) {
        await wallet.connect();
      }

      if (!wallet.publicKey) {
        throw new Error('Wallet connection failed: No public key');
      }

      this.connectionState.isConnected = true;
      this.connectionState.publicKey = wallet.publicKey;
      this.connectionState.walletName = wallet.name;

      // 残高の初期取得
      await this.updateBalance();
      
      // 定期的な残高更新を開始（30秒間隔）
      this.startBalanceUpdates();

      // 最近のトランザクション履歴を取得
      await this.loadRecentTransactions();

      console.log(`Wallet connected: ${wallet.name} - ${wallet.publicKey.toBase58()}`);
    } catch (error) {
      this.connectionState.lastError = getErrorMessage(error);
      throw new Error(`Wallet connection failed: ${getErrorMessage(error)}`);
    } finally {
      this.connectionState.isConnecting = false;
    }
  }

  // ウォレット切断
  public async disconnectWallet(): Promise<void> {
    try {
      if (this.wallet?.connected) {
        await this.wallet.disconnect();
      }
      
      this.wallet = null;
      this.connectionState = {
        isConnected: false,
        isConnecting: false,
        publicKey: null,
        walletName: null,
        balance: {
          sol: 0,
          tokens: [],
          totalValueUSD: 0,
          lastUpdated: 0,
        },
        recentTransactions: [],
        lastError: null,
      };

      if (this.balanceUpdateInterval) {
        clearInterval(this.balanceUpdateInterval);
        this.balanceUpdateInterval = null;
      }

      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', getErrorMessage(error));
    }
  }

  // 残高更新
  public async updateBalance(): Promise<WalletBalance> {
    if (!this.connectionState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // SOL残高を取得
      const solBalance = await eclipseRpcService.getBalance(this.connectionState.publicKey);
      
      // トークン残高を取得（実装は簡略化）
      const tokens: TokenBalance[] = [];

      const balance: WalletBalance = {
        sol: solBalance,
        tokens,
        totalValueUSD: solBalance * 100, // 仮の価格計算
        lastUpdated: Date.now(),
      };

      this.connectionState.balance = balance;
      return balance;
    } catch (error) {
      this.connectionState.lastError = getErrorMessage(error);
      throw new Error(`Failed to update balance: ${getErrorMessage(error)}`);
    }
  }

  // トランザクション送信
  public async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    options: TransactionOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.wallet?.connected || !this.connectionState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const sendOptions: SendOptions = {
        skipPreflight: options.skipPreflight || false,
        maxRetries: options.maxRetries || 3,
      };

      let signature: TransactionSignature;

      if (transaction instanceof VersionedTransaction) {
        // Versioned Transaction の場合
        const signedTransaction = await this.wallet.sendTransaction(transaction, this.connection, sendOptions);
        signature = signedTransaction;
      } else {
        // Legacy Transaction の場合
        const signedTransaction = await this.wallet.sendTransaction(transaction, this.connection, sendOptions);
        signature = signedTransaction;
      }

      // トランザクション履歴に追加
      const historyEntry: TransactionHistory = {
        signature,
        timestamp: Date.now(),
        status: 'pending',
        type: 'other',
        fee: options.priorityFee || 0.000005, // デフォルト手数料
      };

      this.addTransactionToHistory(historyEntry);

      // トランザクションの確認を開始
      this.confirmTransaction(signature).catch(console.error);

      return signature;
    } catch (error) {
      this.connectionState.lastError = getErrorMessage(error);
      throw new Error(`Transaction failed: ${getErrorMessage(error)}`);
    }
  }

  // SOL転送
  public async transferSOL(
    toAddress: string,
    amount: number,
    options: TransactionOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.connectionState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const toPubkey = new PublicKey(toAddress);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.connectionState.publicKey,
          toPubkey,
          lamports,
        })
      );

      // 最新のブロックハッシュを取得
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.connectionState.publicKey;

      const signature = await this.sendTransaction(transaction, options);

      // 履歴を更新
      const historyEntry: TransactionHistory = {
        signature,
        timestamp: Date.now(),
        status: 'pending',
        type: 'transfer',
        amount,
        fee: options.priorityFee || 0.000005,
        tokenSymbol: 'SOL',
        fromAddress: this.connectionState.publicKey.toBase58(),
        toAddress,
      };

      this.updateTransactionInHistory(signature, historyEntry);

      return signature;
    } catch (error) {
      throw new Error(`SOL transfer failed: ${getErrorMessage(error)}`);
    }
  }

  // トランザクション確認
  private async confirmTransaction(signature: TransactionSignature): Promise<void> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      const status = confirmation.value.err ? 'failed' : 'success';
      const errorMessage = confirmation.value.err ? String(confirmation.value.err) : undefined;

      this.updateTransactionStatus(signature, status, errorMessage);

      // 残高を更新
      if (status === 'success') {
        await this.updateBalance();
      }
    } catch (error) {
      console.error(`Failed to confirm transaction ${signature}:`, getErrorMessage(error));
      this.updateTransactionStatus(signature, 'failed', getErrorMessage(error));
    }
  }

  // 最近のトランザクション履歴を読み込み
  private async loadRecentTransactions(): Promise<void> {
    if (!this.connectionState.publicKey) return;

    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.connectionState.publicKey,
        { limit: 20 }
      );

      const transactions: TransactionHistory[] = signatures.map(sig => ({
        signature: sig.signature,
        timestamp: (sig.blockTime || 0) * 1000,
        status: sig.err ? 'failed' : 'success',
        type: 'other',
        fee: 0.000005, // 仮の手数料
        errorMessage: sig.err ? String(sig.err) : undefined,
      }));

      this.connectionState.recentTransactions = transactions;
    } catch (error) {
      console.error('Failed to load transaction history:', getErrorMessage(error));
    }
  }

  // 定期的な残高更新を開始
  private startBalanceUpdates(): void {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval);
    }

    this.balanceUpdateInterval = setInterval(async () => {
      try {
        await this.updateBalance();
      } catch (error) {
        console.error('Background balance update failed:', getErrorMessage(error));
      }
    }, 30000); // 30秒間隔
  }

  // トランザクション履歴管理
  private addTransactionToHistory(transaction: TransactionHistory): void {
    this.transactionHistory.set(transaction.signature, transaction);
    this.connectionState.recentTransactions.unshift(transaction);
    
    // 最新20件のみ保持
    if (this.connectionState.recentTransactions.length > 20) {
      this.connectionState.recentTransactions = this.connectionState.recentTransactions.slice(0, 20);
    }
  }

  private updateTransactionInHistory(signature: string, updates: Partial<TransactionHistory>): void {
    const existing = this.transactionHistory.get(signature);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.transactionHistory.set(signature, updated);
      
      // recentTransactions配列も更新
      const index = this.connectionState.recentTransactions.findIndex(tx => tx.signature === signature);
      if (index !== -1) {
        this.connectionState.recentTransactions[index] = updated;
      }
    }
  }

  private updateTransactionStatus(
    signature: string, 
    status: 'success' | 'failed' | 'pending', 
    errorMessage?: string
  ): void {
    this.updateTransactionInHistory(signature, { status, errorMessage });
  }

  // 公開メソッド
  public getConnectionState(): WalletConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.connectionState.isConnected && this.wallet?.connected === true;
  }

  public getPublicKey(): PublicKey | null {
    return this.connectionState.publicKey;
  }

  public getBalance(): WalletBalance {
    return { ...this.connectionState.balance };
  }

  public getRecentTransactions(): TransactionHistory[] {
    return [...this.connectionState.recentTransactions];
  }

  public async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const { value: fee } = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      return (fee || 5000) / LAMPORTS_PER_SOL; // SOL単位で返す
    } catch (error) {
      console.error('Fee estimation failed:', getErrorMessage(error));
      return 0.000005; // デフォルト手数料
    }
  }
}

// シングルトンインスタンス
export const advancedWalletService = new AdvancedWalletService();

export default AdvancedWalletService;