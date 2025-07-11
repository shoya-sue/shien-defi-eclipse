import type { Token, TimeRange } from '../types';
import { PRECISION } from '../constants';

export function formatNumber(
  value: number,
  precision: number = PRECISION.amount,
  compact: boolean = false
): string {
  if (compact && value >= 1000) {
    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(value) / 3);
    const unitValue = value / Math.pow(1000, unitIndex);
    return `${unitValue.toFixed(precision)}${units[unitIndex]}`;
  }
  return value.toFixed(precision);
}

export function formatPrice(price: number, precision: number = PRECISION.price): string {
  if (price === 0) return '0';
  if (price < 0.01) return '<0.01';
  return `$${formatNumber(price, precision)}`;
}

export function formatPercentage(value: number, precision: number = PRECISION.percentage): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, precision)}%`;
}

export function formatTokenAmount(
  amount: number,
  token: Token,
  precision: number = PRECISION.amount
): string {
  const formattedAmount = formatNumber(amount, precision);
  return `${formattedAmount} ${token.symbol}`;
}

export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length) return address;
  const start = address.slice(0, length / 2);
  const end = address.slice(-length / 2);
  return `${start}...${end}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAPY(
  rate: number,
  compoundFrequency: number,
  time: number
): number {
  return Math.pow(1 + rate / compoundFrequency, compoundFrequency * time) - 1;
}

export function calculateImpermanentLoss(priceRatio: number): number {
  const newRatio = Math.sqrt(priceRatio);
  const holdValue = priceRatio;
  const lpValue = 2 * newRatio;
  
  return (lpValue / holdValue - 1) * 100;
}

export function calculatePriceImpact(
  outputAmount: number,
  expectedOutput: number
): number {
  if (expectedOutput === 0) return 0;
  return ((expectedOutput - outputAmount) / expectedOutput) * 100;
}

export function calculateSlippage(
  expectedAmount: number,
  actualAmount: number
): number {
  if (expectedAmount === 0) return 0;
  return ((expectedAmount - actualAmount) / expectedAmount) * 100;
}

export function getTimeRangeInMs(timeRange: TimeRange): number {
  const now = Date.now();
  switch (timeRange) {
    case '1h':
      return now - 60 * 60 * 1000;
    case '24h':
      return now - 24 * 60 * 60 * 1000;
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    case '1y':
      return now - 365 * 24 * 60 * 60 * 1000;
    case 'all':
      return 0;
    default:
      return now - 24 * 60 * 60 * 1000;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function validateAmount(amount: string): boolean {
  const numericAmount = parseFloat(amount);
  return !isNaN(numericAmount) && numericAmount > 0;
}

export function validateAddress(address: string): boolean {
  return /^[A-Za-z0-9]{32,44}$/.test(address);
}

export function validateSlippage(slippage: number): boolean {
  return slippage >= 0.1 && slippage <= 50;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isTokenEqual(token1: Token, token2: Token): boolean {
  return token1.address === token2.address && token1.chainId === token2.chainId;
}

export function sortTokens(token1: Token, token2: Token): [Token, Token] {
  return token1.address < token2.address ? [token1, token2] : [token2, token1];
}

export function generatePairId(token1: Token, token2: Token): string {
  const [tokenA, tokenB] = sortTokens(token1, token2);
  return `${tokenA.address}-${tokenB.address}`;
}

export function parseTokenAmount(amount: string, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(parseFloat(amount) * factor);
}

export function formatTokenAmountFromRaw(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals);
}

export function calculateTotalValue(positions: Array<{ amount: number; price: number }>): number {
  return positions.reduce((total, position) => total + position.amount * position.price, 0);
}

export function calculateWeightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  return weightedSum / totalWeight;
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(error => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay));
    }
    throw error;
  });
}