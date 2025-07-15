// API共通の型定義

// 共通のAPIレスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
  requestId?: string;
}

// APIエラーの詳細情報
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
  retryable?: boolean;
}

// ページネーション情報
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ページング付きレスポンス
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// Jupiter API の型定義
export namespace JupiterApi {
  // Jupiter ルート情報
  export interface Route {
    inAmount: string;
    outAmount: string;
    amount: string;
    slippageBps: number;
    priceImpactPct: number;
    marketInfos: MarketInfo[];
    timeTaken?: number;
  }

  export interface MarketInfo {
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    inAmount: string;
    outAmount: string;
    minInAmount?: string;
    minOutAmount?: string;
    priceImpactPct: number;
    lpFee: Fee;
    platformFee: Fee;
  }

  export interface Fee {
    amount: string;
    mint: string;
    pct: number;
  }

  // Jupiter クォートリクエスト
  export interface QuoteRequest {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
    feeBps?: number;
    onlyDirectRoutes?: boolean;
    asLegacyTransaction?: boolean;
  }

  // Jupiter クォートレスポンス
  export interface QuoteResponse extends ApiResponse<Route[]> {
    contextSlot?: number;
    timeTaken?: number;
  }

  // Jupiter スワップリクエスト
  export interface SwapRequest {
    route: Route;
    userPublicKey: string;
    wrapUnwrapSOL?: boolean;
    computeUnitPriceMicroLamports?: number;
    asLegacyTransaction?: boolean;
    destinationTokenAccount?: string;
  }

  // Jupiter スワップレスポンス
  export interface SwapResponse extends ApiResponse {
    swapTransaction: string; // base64 encoded
    lastValidBlockHeight?: number;
  }

  // Jupiter トークン情報
  export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
    verified?: boolean;
  }

  // Jupiter 価格情報
  export interface PriceInfo {
    id: string;
    type: string;
    price: number;
    extraInfo?: Record<string, any>;
  }
}

// Orca API の型定義
export namespace OrcaApi {
  // Orca プール情報
  export interface Pool {
    address: string;
    tokenA: PoolToken;
    tokenB: PoolToken;
    liquidity: string;
    apy: number;
    volume24h: number;
    fees24h: number;
    tvl: number;
  }

  export interface PoolToken {
    mint: string;
    symbol: string;
    decimals: number;
    amount: string;
    uiAmount: number;
  }

  // Orca スワップクォート
  export interface SwapQuote {
    inputAmount: string;
    outputAmount: string;
    priceImpact: number;
    fee: string;
    route: RouteInfo[];
  }

  export interface RouteInfo {
    poolAddress: string;
    inputMint: string;
    outputMint: string;
    inputAmount: string;
    outputAmount: string;
  }

  // Orca スワップリクエスト
  export interface SwapRequest {
    quote: SwapQuote;
    userPublicKey: string;
    slippageBps: number;
  }

  // Orca スワップレスポンス
  export interface SwapResponse extends ApiResponse {
    transaction: string; // base64 encoded
  }

  // Orca 価格情報
  export interface PriceData {
    mint: string;
    price: number;
    timestamp: number;
  }
}

// CoinGecko API の型定義
export namespace CoinGeckoApi {
  // CoinGecko 価格情報
  export interface PriceResponse {
    [coinId: string]: {
      usd: number;
      usd_24h_change?: number;
      usd_market_cap?: number;
      usd_24h_vol?: number;
      last_updated_at?: number;
    };
  }

  // CoinGecko コイン情報
  export interface CoinInfo {
    id: string;
    symbol: string;
    name: string;
    image?: {
      thumb: string;
      small: string;
      large: string;
    };
    current_price?: number;
    market_cap?: number;
    market_cap_rank?: number;
    fully_diluted_valuation?: number;
    total_volume?: number;
    high_24h?: number;
    low_24h?: number;
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    market_cap_change_24h?: number;
    market_cap_change_percentage_24h?: number;
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number;
    ath?: number;
    ath_change_percentage?: number;
    ath_date?: string;
    atl?: number;
    atl_change_percentage?: number;
    atl_date?: string;
    last_updated?: string;
  }

  // CoinGecko マーケットデータ
  export interface MarketData {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
  }
}

// Solana RPC API の型定義
export namespace SolanaRpc {
  // RPC リクエストの基本形
  export interface RpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: any[];
  }

  // RPC レスポンスの基本形
  export interface RpcResponse<T = any> {
    jsonrpc: '2.0';
    id: number | string;
    result?: T;
    error?: RpcError;
  }

  // RPC エラー
  export interface RpcError {
    code: number;
    message: string;
    data?: any;
  }

  // アカウント情報
  export interface AccountInfo {
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
    data: [string, string]; // [data, encoding]
  }

  // トランザクション情報
  export interface TransactionInfo {
    signature: string;
    slot: number;
    blockTime?: number;
    confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
    err?: any;
    memo?: string;
  }

  // ブロック情報
  export interface BlockInfo {
    blockhash: string;
    parentSlot: number;
    slot: number;
    blockTime?: number;
    transactions: TransactionInfo[];
  }

  // ヘルス情報
  export interface HealthInfo {
    numSlotsBehind?: number;
  }

  // バージョン情報
  export interface VersionInfo {
    'solana-core': string;
    'feature-set'?: number;
  }
}

// WebSocket メッセージの型定義
export namespace WebSocketTypes {
  // 基本的な WebSocket メッセージ
  export interface BaseMessage {
    type: string;
    timestamp: number;
    id?: string;
  }

  // 価格更新メッセージ
  export interface PriceUpdateMessage extends BaseMessage {
    type: 'price_update';
    token: string;
    price: number;
    change24h: number;
  }

  // プール更新メッセージ
  export interface PoolUpdateMessage extends BaseMessage {
    type: 'pool_update';
    poolAddress: string;
    liquidity: number;
    apy: number;
    volume24h: number;
  }

  // トランザクション更新メッセージ
  export interface TransactionUpdateMessage extends BaseMessage {
    type: 'transaction_update';
    signature: string;
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
  }

  // エラーメッセージ
  export interface ErrorMessage extends BaseMessage {
    type: 'error';
    error: {
      code: string;
      message: string;
      details?: any;
    };
  }

  // 接続状態メッセージ
  export interface ConnectionMessage extends BaseMessage {
    type: 'connection';
    status: 'connected' | 'disconnected' | 'reconnecting';
    reason?: string;
  }
}

// バリデーション関数の型
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type Validator<T> = (value: T) => ValidationResult;

// API クライアント設定
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers?: Record<string, string>;
  apiKey?: string;
}

// レート制限情報
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// API メトリクス
export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  lastRequestTime: number;
}