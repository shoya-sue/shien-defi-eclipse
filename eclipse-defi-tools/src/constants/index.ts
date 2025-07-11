import type { DEXConfig, Token } from '../types';

export const ECLIPSE_CHAIN_ID = 100;

// 環境変数のバリデーション
const validateEnvVar = (value: string | undefined, defaultValue: string, name: string): string => {
  if (!value) {
    console.warn(`Environment variable ${name} is not set, using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};

export const DEX_CONFIGS: Record<string, DEXConfig> = {
  jupiter: {
    name: 'Jupiter',
    // 注意: 実際のJupiter Eclipse APIが利用可能になるまではモック実装を使用
    apiUrl: validateEnvVar(process.env.REACT_APP_JUPITER_API_URL, 'https://mock-api.eclipse-defi-tools.local/jupiter', 'REACT_APP_JUPITER_API_URL'),
    programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
    fee: 0.001,
    enabled: true,
  },
  orca: {
    name: 'Orca',
    // 注意: 実際のOrca Eclipse APIが利用可能になるまではモック実装を使用
    apiUrl: validateEnvVar(process.env.REACT_APP_ORCA_API_URL, 'https://mock-api.eclipse-defi-tools.local/orca', 'REACT_APP_ORCA_API_URL'),
    programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    fee: 0.003,
    enabled: false, // 実際のAPIが利用可能になるまで無効
  },
  raydium: {
    name: 'Raydium',
    // 注意: 実際のRaydium Eclipse APIが利用可能になるまではモック実装を使用
    apiUrl: validateEnvVar(process.env.REACT_APP_RAYDIUM_API_URL, 'https://mock-api.eclipse-defi-tools.local/raydium', 'REACT_APP_RAYDIUM_API_URL'),
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    fee: 0.0025,
    enabled: false, // 実際のAPIが利用可能になるまで無効
  },
};

export const COMMON_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    chainId: ECLIPSE_CHAIN_ID,
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    chainId: ECLIPSE_CHAIN_ID,
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    chainId: ECLIPSE_CHAIN_ID,
  },
];

export const RPC_ENDPOINTS = {
  mainnet: validateEnvVar(process.env.REACT_APP_ECLIPSE_RPC_URL, 'https://mainnetbeta-rpc.eclipse.xyz', 'REACT_APP_ECLIPSE_RPC_URL'),
  websocket: validateEnvVar(process.env.REACT_APP_ECLIPSE_WS_URL, 'wss://mainnetbeta-rpc.eclipse.xyz', 'REACT_APP_ECLIPSE_WS_URL'),
};

export const API_ENDPOINTS = {
  coingecko: 'https://api.coingecko.com/api/v3',
  priceUpdate: parseInt(process.env.REACT_APP_PRICE_UPDATE_INTERVAL || '5000'),
};

export const DEFAULT_SETTINGS = {
  slippage: {
    auto: true,
    value: 0.5,
    maxSlippage: 50,
  },
  notifications: {
    priceAlerts: true,
    positionAlerts: true,
    rewardAlerts: true,
    emailNotifications: false,
  },
  theme: 'auto' as const,
  language: 'en' as const,
  currency: 'USD' as const,
};

export const TRANSACTION_TYPES = {
  swap: 'Swap',
  add_liquidity: 'Add Liquidity',
  remove_liquidity: 'Remove Liquidity',
  stake: 'Stake',
  unstake: 'Unstake',
  claim_rewards: 'Claim Rewards',
} as const;

export const TIME_RANGES = {
  '1h': '1 Hour',
  '24h': '24 Hours',
  '7d': '7 Days',
  '30d': '30 Days',
  '1y': '1 Year',
  'all': 'All Time',
} as const;

export const CACHE_DURATION = {
  price: 30 * 1000, // 30 seconds
  pool: 60 * 1000, // 1 minute
  transaction: 300 * 1000, // 5 minutes
  position: 60 * 1000, // 1 minute
};

export const MAX_SLIPPAGE = 50; // 50%
export const MIN_SLIPPAGE = 0.1; // 0.1%

export const PRECISION = {
  price: 6,
  amount: 2,
  percentage: 2,
  apy: 2,
};

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: '#6B7280',
};

export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export const SUPPORTED_WALLETS = [
  'Phantom',
  'Solflare',
  'Sollet',
  'Ledger',
  'Torus',
] as const;

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error',
  INVALID_AMOUNT: 'Invalid amount',
  SLIPPAGE_EXCEEDED: 'Slippage tolerance exceeded',
  POOL_NOT_FOUND: 'Pool not found',
  TOKEN_NOT_FOUND: 'Token not found',
} as const;