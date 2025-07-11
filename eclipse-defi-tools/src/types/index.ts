export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface SwapQuote {
  inputToken: Token;
  outputToken: Token;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route: string[];
  dex: string;
  estimatedGas: number;
}

export interface PoolData {
  poolId: string;
  token0: Token;
  token1: Token;
  reserves: [number, number];
  fee: number;
  apy: number;
  volume24h: number;
  liquidity: number;
  priceRange?: [number, number];
}

export interface FarmingPosition {
  poolId: string;
  userAddress: string;
  stakedAmount: number;
  rewardTokens: Token[];
  pendingRewards: number[];
  startTime: number;
  lastHarvest: number;
  totalRewards: number;
  apy: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  blockNumber: number;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake' | 'claim_rewards';
  tokens: TransactionToken[];
  fees: number;
  gasUsed: number;
  status: 'success' | 'failed' | 'pending';
}

export interface TransactionToken {
  token: Token;
  amount: number;
  price: number;
  isInput: boolean;
}

export interface PnLData {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalFees: number;
  totalVolume: number;
  roi: number;
  positions: PositionData[];
}

export interface PositionData {
  token: Token;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  percentage: number;
}

export interface DEXConfig {
  name: string;
  apiUrl: string;
  programId: string;
  fee: number;
  logo?: string;
  enabled: boolean;
}

export interface WalletAdapter {
  name: string;
  icon: string;
  url: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported';
}

export interface PriceData {
  token: Token;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: number;
}

export interface ImpermanentLossData {
  priceRatio: number;
  impermanentLoss: number;
  feesEarned: number;
  netResult: number;
}

export interface SlippageSettings {
  auto: boolean;
  value: number;
  maxSlippage: number;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  positionAlerts: boolean;
  rewardAlerts: boolean;
  emailNotifications: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'JPY';
  language: 'en' | 'ja';
  slippageTolerance: number;
  priceAlerts: boolean;
  realtimeUpdates: boolean;
  refreshInterval: number;
  notifications: {
    priceChanges: boolean;
    transactions: boolean;
    farming: boolean;
    pools: boolean;
  };
  privacy: {
    trackingEnabled: boolean;
    analyticsEnabled: boolean;
    shareData: boolean;
  };
  advanced: {
    showAdvancedStats: boolean;
    debugMode: boolean;
    gasOptimization: boolean;
  };
}

export type TimeRange = '1h' | '24h' | '7d' | '30d' | '1y' | 'all';

export interface ChartData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}