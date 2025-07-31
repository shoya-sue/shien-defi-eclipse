// API共通の型定義

// 共通のAPIレスポンス型
export interface ApiResponse<T = unknown> {
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
  details?: Record<string, unknown>;
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
// Jupiter ルート情報
export interface JupiterRoute {
  inAmount: string;
  outAmount: string;
  amount: string;
  slippageBps: number;
  priceImpactPct: number;
  marketInfos: JupiterMarketInfo[];
  timeTaken?: number;
}

export interface JupiterMarketInfo {
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
  lpFee: JupiterFee;
  platformFee: JupiterFee;
}

export interface JupiterFee {
  amount: string;
  mint: string;
  pct: number;
}

// Jupiter クォートリクエスト
export interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  feeBps?: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}

// Jupiter クォートレスポンス
export interface JupiterQuoteResponse extends ApiResponse<JupiterRoute[]> {
  contextSlot?: number;
  timeTaken?: number;
}

// Jupiter スワップリクエスト
export interface JupiterSwapRequest {
  route: JupiterRoute;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  computeUnitPriceMicroLamports?: number;
  asLegacyTransaction?: boolean;
  destinationTokenAccount?: string;
}

// Jupiter スワップレスポンス
export interface JupiterSwapResponse extends ApiResponse {
  swapTransaction: string; // base64 encoded
  lastValidBlockHeight?: number;
}

// Jupiter トークン情報
export interface JupiterTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  verified?: boolean;
}

// Jupiter 価格情報
export interface JupiterPriceInfo {
  id: string;
  type: string;
  price: number;
  extraInfo?: Record<string, unknown>;
}

// Orca API の型定義
// Orca プール情報
export interface OrcaPool {
  address: string;
  tokenA: OrcaPoolToken;
  tokenB: OrcaPoolToken;
  liquidity: string;
  apy: number;
  volume24h: number;
  fees24h: number;
  tvl: number;
}

export interface OrcaPoolToken {
  mint: string;
  symbol: string;
  decimals: number;
  amount: string;
  uiAmount: number;
}

// Orca スワップクォート
export interface OrcaSwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: string;
  route: OrcaRouteInfo[];
}

export interface OrcaRouteInfo {
  poolAddress: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
}

// Orca スワップリクエスト
export interface OrcaSwapRequest {
  quote: OrcaSwapQuote;
  userPublicKey: string;
  slippageBps: number;
}

// Orca スワップレスポンス
export interface OrcaSwapResponse extends ApiResponse {
  transaction: string; // base64 encoded
}

// Orca 価格情報
export interface OrcaPriceData {
  mint: string;
  price: number;
  timestamp: number;
}

// CoinGecko API の型定義
// CoinGecko 価格情報
export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    last_updated_at?: number;
  };
}

// CoinGecko コイン情報
export interface CoinGeckoCoinInfo {
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
export interface CoinGeckoMarketData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
}

// Solana RPC API の型定義
// RPC リクエストの基本形
export interface SolanaRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[];
}

// RPC レスポンスの基本形
export interface SolanaRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: SolanaRpcError;
}

// RPC エラー
export interface SolanaRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// アカウント情報
export interface SolanaAccountInfo {
  executable: boolean;
  lamports: number;
  owner: string;
  rentEpoch: number;
  data: [string, string]; // [data, encoding]
}

// トランザクション情報
export interface SolanaTransactionInfo {
  signature: string;
  slot: number;
  blockTime?: number;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
  err?: unknown;
  memo?: string;
}

// ブロック情報
export interface SolanaBlockInfo {
  blockhash: string;
  parentSlot: number;
  slot: number;
  blockTime?: number;
  transactions: SolanaTransactionInfo[];
}

// ヘルス情報
export interface SolanaHealthInfo {
  numSlotsBehind?: number;
}

// バージョン情報
export interface SolanaVersionInfo {
  'solana-core': string;
  'feature-set'?: number;
}

// WebSocket メッセージの型定義
// 基本的な WebSocket メッセージ
export interface WebSocketBaseMessage {
  type: string;
  timestamp: number;
  id?: string;
}

// 価格更新メッセージ
export interface WebSocketPriceUpdateMessage extends WebSocketBaseMessage {
  type: 'price_update';
  token: string;
  price: number;
  change24h: number;
}

// プール更新メッセージ
export interface WebSocketPoolUpdateMessage extends WebSocketBaseMessage {
  type: 'pool_update';
  poolAddress: string;
  liquidity: number;
  apy: number;
  volume24h: number;
}

// トランザクション更新メッセージ
export interface WebSocketTransactionUpdateMessage extends WebSocketBaseMessage {
  type: 'transaction_update';
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
}

// エラーメッセージ
export interface WebSocketErrorMessage extends WebSocketBaseMessage {
  type: 'error';
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 接続状態メッセージ
export interface WebSocketConnectionMessage extends WebSocketBaseMessage {
  type: 'connection';
  status: 'connected' | 'disconnected' | 'reconnecting';
  reason?: string;
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