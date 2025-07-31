import { Connection, PublicKey, LAMPORTS_PER_SOL, type GetProgramAccountsFilter } from '@solana/web3.js';
import { getErrorMessage } from '../utils';
import { errorHandlingService, ErrorType, commonRetryConfigs } from './errorHandlingService';
import { healthCheckService, commonHealthChecks } from './healthCheckService';

// Eclipse RPC接続の設定
export interface EclipseRpcConfig {
  endpoint: string;
  wsEndpoint?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// 接続統計情報
export interface ConnectionStats {
  isConnected: boolean;
  lastPing: number;
  averageResponseTime: number;
  failedRequests: number;
  totalRequests: number;
  lastError?: string;
}

// アカウント情報の型定義
export interface AccountInfo {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data?: Buffer;
}

class EclipseRpcService {
  private connection: Connection;
  private wsConnection?: WebSocket;
  private config: EclipseRpcConfig;
  private stats: ConnectionStats;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private pingInterval?: NodeJS.Timeout;

  constructor(config: EclipseRpcConfig) {
    this.config = {
      commitment: 'confirmed',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.stats = {
      isConnected: false,
      lastPing: 0,
      averageResponseTime: 0,
      failedRequests: 0,
      totalRequests: 0,
    };

    this.connection = new Connection(this.config.endpoint, {
      commitment: this.config.commitment,
      wsEndpoint: this.config.wsEndpoint,
    });

    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.testConnection();
      this.stats.isConnected = true;
      this.reconnectAttempts = 0;
      this.startPingMonitoring();
      
      // ヘルスチェックサービスに登録
      healthCheckService.registerService({
        name: 'Eclipse RPC',
        url: this.config.endpoint,
        timeout: 10000,
        healthCheck: commonHealthChecks.rpcEndpoint(this.config.endpoint),
        critical: true,
      });
      
      if (this.config.wsEndpoint) {
        this.initializeWebSocket();
        
        // WebSocketのヘルスチェックも登録
        healthCheckService.registerService({
          name: 'Eclipse WebSocket',
          url: this.config.wsEndpoint,
          timeout: 10000,
          healthCheck: commonHealthChecks.websocket(this.config.wsEndpoint),
          critical: false,
        });
      }
    } catch (error) {
      await errorHandlingService.handleRpcError(
        error as Error,
        'initializeConnection',
        { endpoint: this.config.endpoint }
      );
      this.stats.isConnected = false;
      this.stats.lastError = getErrorMessage(error);
      this.scheduleReconnect();
    }
  }

  private async testConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      await this.connection.getSlot();
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      this.stats.totalRequests++;
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.totalRequests++;
      throw error;
    }
  }

  private updateResponseTime(responseTime: number): void {
    if (this.stats.averageResponseTime === 0) {
      this.stats.averageResponseTime = responseTime;
    } else {
      this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
    }
  }

  private startPingMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(async () => {
      try {
        await this.testConnection();
        this.stats.lastPing = Date.now();
        this.stats.isConnected = true;
      } catch (error) {
        console.warn('Ping failed:', getErrorMessage(error));
        this.stats.isConnected = false;
        this.stats.lastError = getErrorMessage(error);
        this.scheduleReconnect();
      }
    }, 30000); // 30秒ごとにpingを送信
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.config.retryDelay! * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.initializeConnection();
    }, delay);
  }

  private initializeWebSocket(): void {
    if (!this.config.wsEndpoint) return;

    try {
      this.wsConnection = new WebSocket(this.config.wsEndpoint);
      
      this.wsConnection.onopen = () => {
        console.log('WebSocket connected to Eclipse');
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', getErrorMessage(error));
    }
  }

  // 公開メソッド
  public getConnection(): Connection {
    return this.connection;
  }

  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  public async getBalance(publicKey: PublicKey): Promise<number> {
    return await errorHandlingService.executeWithRetry(
      async () => {
        const startTime = Date.now();
        const lamports = await this.connection.getBalance(publicKey);
        this.updateResponseTime(Date.now() - startTime);
        this.stats.totalRequests++;
        return lamports / LAMPORTS_PER_SOL;
      },
      commonRetryConfigs.rpc,
      ErrorType.RPC,
      { method: 'getBalance', publicKey: publicKey.toBase58() }
    );
  }

  public async getAccountInfo(publicKey: PublicKey): Promise<AccountInfo | null> {
    try {
      const startTime = Date.now();
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      this.updateResponseTime(Date.now() - startTime);
      this.stats.totalRequests++;

      if (!accountInfo) return null;

      return {
        address: publicKey.toBase58(),
        lamports: accountInfo.lamports,
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch ?? 0,
        data: accountInfo.data,
      };
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.totalRequests++;
      throw new Error(`Failed to get account info: ${getErrorMessage(error)}`);
    }
  }

  public async getTokenAccounts(owner: PublicKey, programId: PublicKey): Promise<AccountInfo[]> {
    try {
      const startTime = Date.now();
      const filters: GetProgramAccountsFilter[] = [
        { dataSize: 165 }, // Token account data size
        {
          memcmp: {
            offset: 32, // Owner field offset
            bytes: owner.toBase58(),
          },
        },
      ];

      const accounts = await this.connection.getProgramAccounts(programId, {
        filters,
        commitment: this.config.commitment,
      });

      this.updateResponseTime(Date.now() - startTime);
      this.stats.totalRequests++;

      return accounts.map(({ pubkey, account }) => ({
        address: pubkey.toBase58(),
        lamports: account.lamports,
        owner: account.owner.toBase58(),
        executable: account.executable,
        rentEpoch: account.rentEpoch ?? 0,
        data: account.data,
      }));
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.totalRequests++;
      throw new Error(`Failed to get token accounts: ${getErrorMessage(error)}`);
    }
  }

  public async getSlot(): Promise<number> {
    try {
      const startTime = Date.now();
      const slot = await this.connection.getSlot();
      this.updateResponseTime(Date.now() - startTime);
      this.stats.totalRequests++;
      return slot;
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.totalRequests++;
      throw new Error(`Failed to get slot: ${getErrorMessage(error)}`);
    }
  }

  public async getBlockHeight(): Promise<number> {
    try {
      const startTime = Date.now();
      const blockHeight = await this.connection.getBlockHeight();
      this.updateResponseTime(Date.now() - startTime);
      this.stats.totalRequests++;
      return blockHeight;
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.totalRequests++;
      throw new Error(`Failed to get block height: ${getErrorMessage(error)}`);
    }
  }

  public isHealthy(): boolean {
    const now = Date.now();
    const lastPingThreshold = 60000; // 1分
    const failureRateThreshold = 0.1; // 10%

    if (!this.stats.isConnected) return false;
    if (now - this.stats.lastPing > lastPingThreshold) return false;
    
    const failureRate = this.stats.failedRequests / Math.max(this.stats.totalRequests, 1);
    if (failureRate > failureRateThreshold) return false;

    return true;
  }

  public disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    this.stats.isConnected = false;
  }

  // WebSocketメッセージ送信
  public sendWebSocketMessage(message: object): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // WebSocketイベントリスナー登録
  public onWebSocketMessage(callback: (data: unknown) => void): void {
    if (this.wsConnection) {
      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  }
}

// デフォルトのEclipse RPC設定
const defaultConfig: EclipseRpcConfig = {
  endpoint: import.meta.env.VITE_ECLIPSE_RPC_URL || 'https://mainnetbeta-rpc.eclipse.xyz',
  wsEndpoint: import.meta.env.VITE_ECLIPSE_WS_URL || 'wss://mainnetbeta-rpc.eclipse.xyz',
  commitment: 'confirmed',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// シングルトンインスタンス
export const eclipseRpcService = new EclipseRpcService(defaultConfig);

// フック用のサービス取得関数
export const getEclipseRpcService = (): EclipseRpcService => eclipseRpcService;

export default EclipseRpcService;