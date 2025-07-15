import { useEffect, useRef, useState } from 'react';
import type { Token, SwapQuote, PoolData, FarmingPosition } from '../types';
import { priceService } from './priceService';
import { dexService } from './dexService';
import { poolService } from './poolService';
import { farmingService } from './farmingService';

// WebSocket message types
interface WebSocketMessage {
  type: 'price_update' | 'quote_update' | 'pool_update' | 'farming_update' | 'heartbeat';
  token?: string;
  price?: number;
  quote?: SwapQuote;
  pool?: PoolData;
  position?: FarmingPosition;
  timestamp?: number;
}

// Subscription parameter types
type SubscriptionParams = 
  | { token: Token } // for price
  | { inputToken: Token; outputToken: Token; amount: number } // for quote
  | { poolId: string } // for pool
  | { userAddress: string; poolId?: string }; // for farming

// Subscription callback types
type SubscriptionCallback = 
  | ((price: number) => void)
  | ((quotes: SwapQuote[]) => void)
  | ((pool: PoolData) => void)
  | ((positions: FarmingPosition[]) => void);

export interface RealtimeData {
  prices: Map<string, number>;
  quotes: Map<string, SwapQuote>;
  poolData: Map<string, PoolData>;
  farmingPositions: Map<string, FarmingPosition>;
  lastUpdated: number;
}

export interface RealtimeSubscription {
  id: string;
  type: 'price' | 'quote' | 'pool' | 'farming';
  params: SubscriptionParams;
  callback: SubscriptionCallback;
  interval: number;
  enabled: boolean;
}

class RealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private data: RealtimeData = {
    prices: new Map(),
    quotes: new Map(),
    poolData: new Map(),
    farmingPositions: new Map(),
    lastUpdated: Date.now(),
  };

  // WebSocket connection for real-time updates
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    // WebSocket機能が無効化されている場合はスキップ
    if (process.env.REACT_APP_ENABLE_WEBSOCKET === 'false') {
      console.log('WebSocket is disabled');
      return;
    }

    // Eclipse mainnetのWebSocket URLを使用（開発時はポーリングのみ）
    const wsUrl = process.env.REACT_APP_ECLIPSE_WS_URL || 'wss://eclipse-mainnet.rpcpool.com';
    
    // 開発環境ではWebSocket接続を試みない（ポーリングのみ使用）
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_FORCE_WEBSOCKET) {
      console.log('WebSocket disabled in development mode. Using polling instead.');
      return;
    }
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to Eclipse');
        this.reconnectAttempts = 0;
        this.sendHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleWebSocketReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // エラー時はポーリングにフォールバック
      };
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      // 初期化エラー時はポーリングを使用
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'price_update':
        this.data.prices.set(message.token, message.price);
        this.notifySubscribers('price', message.token, message.price);
        break;
      case 'quote_update':
        this.data.quotes.set(message.pair, message.quote);
        this.notifySubscribers('quote', message.pair, message.quote);
        break;
      case 'pool_update':
        this.data.poolData.set(message.poolId, message.pool);
        this.notifySubscribers('pool', message.poolId, message.pool);
        break;
      case 'farming_update':
        this.data.farmingPositions.set(message.positionId, message.position);
        this.notifySubscribers('farming', message.positionId, message.position);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
    
    this.data.lastUpdated = Date.now();
  }

  private handleWebSocketReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initWebSocket();
      }, delay);
    } else {
      console.error('Max WebSocket reconnection attempts reached');
    }
  }

  private sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      setTimeout(() => this.sendHeartbeat(), 30000); // Send heartbeat every 30 seconds
    }
  }

  private notifySubscribers(type: string, _key: string, data: number | SwapQuote | PoolData | FarmingPosition) {
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.type === type && subscription.enabled) {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error(`Error in subscription callback ${id}:`, error);
        }
      }
    }
  }

  // Subscribe to price updates
  subscribeToPrice(
    token: Token,
    callback: (price: number) => void,
    interval: number = 5000
  ): string {
    const id = `price_${token.address}_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id,
      type: 'price',
      params: { token },
      callback,
      interval,
      enabled: true,
    };

    this.subscriptions.set(id, subscription);

    // Start polling if WebSocket is not available
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.startPolling(id);
    }

    // Subscribe via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'price',
        token: token.address,
      }));
    }

    return id;
  }

  // Subscribe to swap quote updates
  subscribeToQuote(
    inputToken: Token,
    outputToken: Token,
    amount: number,
    callback: (quotes: SwapQuote[]) => void,
    interval: number = 10000
  ): string {
    const id = `quote_${inputToken.address}_${outputToken.address}_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id,
      type: 'quote',
      params: { inputToken, outputToken, amount },
      callback,
      interval,
      enabled: true,
    };

    this.subscriptions.set(id, subscription);
    this.startPolling(id);

    return id;
  }

  // Subscribe to pool data updates
  subscribeToPool(
    poolId: string,
    callback: (pool: PoolData) => void,
    interval: number = 15000
  ): string {
    const id = `pool_${poolId}_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id,
      type: 'pool',
      params: { poolId },
      callback,
      interval,
      enabled: true,
    };

    this.subscriptions.set(id, subscription);
    this.startPolling(id);

    // Subscribe via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'pool',
        poolId,
      }));
    }

    return id;
  }

  // Subscribe to farming position updates
  subscribeToFarming(
    userAddress: string,
    callback: (positions: FarmingPosition[]) => void,
    interval: number = 30000
  ): string {
    const id = `farming_${userAddress}_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id,
      type: 'farming',
      params: { userAddress },
      callback,
      interval,
      enabled: true,
    };

    this.subscriptions.set(id, subscription);
    this.startPolling(id);

    return id;
  }

  private startPolling(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    const pollFunction = async () => {
      if (!subscription.enabled) return;

      try {
        let result;
        
        switch (subscription.type) {
          case 'price':
            result = await priceService.getTokenPrice(subscription.params.token.address);
            break;
          case 'quote':
            result = await dexService.getAllQuotes(
              subscription.params.inputToken,
              subscription.params.outputToken,
              subscription.params.amount
            );
            break;
          case 'pool':
            result = await poolService.getPoolData(
              subscription.params.poolId.token0,
              subscription.params.poolId.token1,
              subscription.params.poolId.dex
            );
            break;
          case 'farming':
            result = await farmingService.getUserFarmingPositions(subscription.params.userAddress);
            break;
          default:
            return;
        }

        subscription.callback(result);
      } catch (error) {
        console.error(`Polling error for subscription ${subscriptionId}:`, error);
      }
    };

    // Initial call
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, subscription.interval);
    this.intervals.set(subscriptionId, intervalId);
  }

  // Unsubscribe from updates
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    // Stop polling
    const intervalId = this.intervals.get(subscriptionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(subscriptionId);
    }

    // Unsubscribe from WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel: subscription.type,
        id: subscriptionId,
      }));
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  // Pause subscription
  pauseSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.enabled = false;
    return true;
  }

  // Resume subscription
  resumeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.enabled = true;
    return true;
  }

  // Get current data
  getData(): RealtimeData {
    return { ...this.data };
  }

  // Clear all subscriptions
  clearAllSubscriptions() {
    for (const [id] of this.subscriptions) {
      this.unsubscribe(id);
    }
  }

  // Get subscription info
  getSubscriptionInfo(subscriptionId: string): RealtimeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  // Get all subscriptions
  getAllSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  // Update subscription interval
  updateSubscriptionInterval(subscriptionId: string, newInterval: number): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.interval = newInterval;

    // Restart polling with new interval
    const intervalId = this.intervals.get(subscriptionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(subscriptionId);
      this.startPolling(subscriptionId);
    }

    return true;
  }

  // Close WebSocket connection
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.clearAllSubscriptions();
  }
}

export const realtimeService = new RealtimeService();

// React Hook for real-time data
export const useRealtimeData = () => {
  const [data] = useState<RealtimeData>(realtimeService.getData());
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkConnection = () => {
      const ws = (realtimeService as RealtimeService & { ws: WebSocket | null }).ws;
      setIsConnected(ws && ws.readyState === WebSocket.OPEN);
    };

    const interval = setInterval(checkConnection, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    return () => {
      // Clean up subscriptions on unmount
      subscriptionsRef.current.forEach(id => {
        realtimeService.unsubscribe(id);
      });
    };
  }, []);

  const subscribeToPrice = (
    token: Token,
    callback: (price: number) => void,
    interval?: number
  ) => {
    const id = realtimeService.subscribeToPrice(token, callback, interval);
    subscriptionsRef.current.add(id);
    return id;
  };

  const subscribeToQuote = (
    inputToken: Token,
    outputToken: Token,
    amount: number,
    callback: (quotes: SwapQuote[]) => void,
    interval?: number
  ) => {
    const id = realtimeService.subscribeToQuote(inputToken, outputToken, amount, callback, interval);
    subscriptionsRef.current.add(id);
    return id;
  };

  const subscribeToPool = (
    poolId: string,
    callback: (pool: PoolData) => void,
    interval?: number
  ) => {
    const id = realtimeService.subscribeToPool(poolId, callback, interval);
    subscriptionsRef.current.add(id);
    return id;
  };

  const subscribeToFarming = (
    userAddress: string,
    callback: (positions: FarmingPosition[]) => void,
    interval?: number
  ) => {
    const id = realtimeService.subscribeToFarming(userAddress, callback, interval);
    subscriptionsRef.current.add(id);
    return id;
  };

  const unsubscribe = (subscriptionId: string) => {
    realtimeService.unsubscribe(subscriptionId);
    subscriptionsRef.current.delete(subscriptionId);
  };

  const pauseSubscription = (subscriptionId: string) => {
    return realtimeService.pauseSubscription(subscriptionId);
  };

  const resumeSubscription = (subscriptionId: string) => {
    return realtimeService.resumeSubscription(subscriptionId);
  };

  return {
    data,
    isConnected,
    subscribeToPrice,
    subscribeToQuote,
    subscribeToPool,
    subscribeToFarming,
    unsubscribe,
    pauseSubscription,
    resumeSubscription,
    getAllSubscriptions: () => realtimeService.getAllSubscriptions(),
  };
};

export default realtimeService;