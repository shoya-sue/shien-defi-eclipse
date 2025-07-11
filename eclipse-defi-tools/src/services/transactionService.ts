import type { Transaction, PnLData, PositionData } from '../types';
import { CACHE_DURATION } from '../constants';

export interface TransactionFilter {
  type?: string;
  dateFrom?: number;
  dateTo?: number;
  tokenAddress?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PnLCalculationMethod {
  method: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE';
  includeFees: boolean;
  includeUnrealized: boolean;
}

class TransactionService {
  private cache = new Map<string, { data: Transaction[]; timestamp: number }>();
  private pnlCache = new Map<string, { data: PnLData; timestamp: number }>();

  async getTransactionHistory(
    userAddress: string,
    filter?: TransactionFilter
  ): Promise<Transaction[]> {
    const cacheKey = `transactions_${userAddress}_${JSON.stringify(filter)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.transaction) {
      return cached.data;
    }

    try {
      const transactions = await this.fetchTransactionsFromAPI(userAddress, filter);
      this.cache.set(cacheKey, { data: transactions, timestamp: Date.now() });
      return transactions;
    } catch (error) {
      console.error('Transaction history fetch error:', error);
      return this.getMockTransactions(userAddress);
    }
  }

  private async fetchTransactionsFromAPI(
    userAddress: string,
    filter?: TransactionFilter
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    params.append('address', userAddress);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom.toString());
    if (filter?.dateTo) params.append('dateTo', filter.dateTo.toString());
    if (filter?.tokenAddress) params.append('tokenAddress', filter.tokenAddress);
    if (filter?.minAmount) params.append('minAmount', filter.minAmount.toString());
    if (filter?.maxAmount) params.append('maxAmount', filter.maxAmount.toString());
    
    const response = await fetch(`/api/transactions?${params}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  private getMockTransactions(_userAddress: string): Transaction[] {
    const mockTokens = [
      { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, chainId: 100 },
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 100 },
      { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 100 },
    ];

    return [
      {
        hash: '5xK2JvC...',
        timestamp: Date.now() - 3600000, // 1時間前
        blockNumber: 12345678,
        type: 'swap',
        tokens: [
          { token: mockTokens[0], amount: 10, price: 50, isInput: true },
          { token: mockTokens[1], amount: 490, price: 1, isInput: false },
        ],
        fees: 2.5,
        gasUsed: 0.005,
        status: 'success',
      },
      {
        hash: '8mN3PqR...',
        timestamp: Date.now() - 86400000, // 1日前
        blockNumber: 12345600,
        type: 'add_liquidity',
        tokens: [
          { token: mockTokens[0], amount: 5, price: 48, isInput: true },
          { token: mockTokens[1], amount: 240, price: 1, isInput: true },
        ],
        fees: 1.2,
        gasUsed: 0.008,
        status: 'success',
      },
      {
        hash: '2wL9KjD...',
        timestamp: Date.now() - 172800000, // 2日前
        blockNumber: 12345500,
        type: 'swap',
        tokens: [
          { token: mockTokens[1], amount: 1000, price: 1, isInput: true },
          { token: mockTokens[2], amount: 998, price: 1, isInput: false },
        ],
        fees: 3.0,
        gasUsed: 0.004,
        status: 'success',
      },
      {
        hash: '9pQ4TnX...',
        timestamp: Date.now() - 259200000, // 3日前
        blockNumber: 12345400,
        type: 'claim_rewards',
        tokens: [
          { token: mockTokens[0], amount: 0.5, price: 49, isInput: false },
        ],
        fees: 0.8,
        gasUsed: 0.003,
        status: 'success',
      },
      {
        hash: '7cF5MnY...',
        timestamp: Date.now() - 604800000, // 1週間前
        blockNumber: 12345000,
        type: 'remove_liquidity',
        tokens: [
          { token: mockTokens[0], amount: 3, price: 47, isInput: false },
          { token: mockTokens[1], amount: 141, price: 1, isInput: false },
        ],
        fees: 1.5,
        gasUsed: 0.007,
        status: 'success',
      },
    ];
  }

  calculatePnL(
    transactions: Transaction[],
    currentPrices: Map<string, number>,
    method: PnLCalculationMethod = {
      method: 'FIFO',
      includeFees: true,
      includeUnrealized: true,
    }
  ): PnLData {
    const positions = new Map<string, PositionData>();
    let totalFees = 0;
    let totalVolume = 0;
    let realizedPnL = 0;

    // トランザクションを時系列順にソート
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    for (const tx of sortedTransactions) {
      if (method.includeFees) {
        totalFees += tx.fees;
      }

      for (const tokenTx of tx.tokens) {
        const tokenAddress = tokenTx.token.address;
        const value = tokenTx.amount * tokenTx.price;
        totalVolume += value;

        if (!positions.has(tokenAddress)) {
          positions.set(tokenAddress, {
            token: tokenTx.token,
            amount: 0,
            averagePrice: 0,
            currentPrice: currentPrices.get(tokenAddress) || tokenTx.price,
            unrealizedPnL: 0,
            percentage: 0,
          });
        }

        const position = positions.get(tokenAddress)!;

        if (tokenTx.isInput) {
          // 購入/取得
          const newTotalValue = position.amount * position.averagePrice + value;
          const newTotalAmount = position.amount + tokenTx.amount;
          
          if (newTotalAmount > 0) {
            position.averagePrice = newTotalValue / newTotalAmount;
            position.amount = newTotalAmount;
          }
        } else {
          // 売却/支払い
          if (position.amount > 0) {
            const sellValue = tokenTx.amount * position.averagePrice;
            const actualValue = value;
            realizedPnL += (actualValue - sellValue);
            position.amount = Math.max(0, position.amount - tokenTx.amount);
          }
        }
      }
    }

    // 未実現損益を計算
    let unrealizedPnL = 0;
    let totalCurrentValue = 0;
    let totalCostBasis = 0;

    for (const [_tokenAddress, position] of positions) {
      if (position.amount > 0) {
        const currentValue = position.amount * position.currentPrice;
        const costBasis = position.amount * position.averagePrice;
        
        position.unrealizedPnL = currentValue - costBasis;
        unrealizedPnL += position.unrealizedPnL;
        totalCurrentValue += currentValue;
        totalCostBasis += costBasis;
      }
    }

    // ポジションのパーセンテージを計算
    for (const position of positions.values()) {
      if (position.amount > 0 && totalCurrentValue > 0) {
        const positionValue = position.amount * position.currentPrice;
        position.percentage = (positionValue / totalCurrentValue) * 100;
      }
    }

    const totalPnL = realizedPnL + (method.includeUnrealized ? unrealizedPnL : 0);
    const roi = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalPnL,
      realizedPnL,
      unrealizedPnL,
      totalFees,
      totalVolume,
      roi,
      positions: Array.from(positions.values()).filter(p => p.amount > 0),
    };
  }

  async exportTransactions(
    transactions: Transaction[],
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(transactions, null, 2);
    }

    // CSV format
    const headers = [
      'Hash',
      'Date',
      'Type',
      'Token Symbol',
      'Amount',
      'Price',
      'Value',
      'Direction',
      'Fees',
      'Gas Used',
      'Status',
    ];

    const rows = transactions.flatMap(tx => 
      tx.tokens.map(token => [
        tx.hash,
        new Date(tx.timestamp).toISOString(),
        tx.type,
        token.token.symbol,
        token.amount.toString(),
        token.price.toString(),
        (token.amount * token.price).toString(),
        token.isInput ? 'IN' : 'OUT',
        tx.fees.toString(),
        tx.gasUsed.toString(),
        tx.status,
      ])
    );

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  generateTaxReport(
    transactions: Transaction[],
    taxYear: number,
    _country: string = 'US'
  ): {
    totalGains: number;
    totalLosses: number;
    shortTermGains: number;
    longTermGains: number;
    taxableEvents: Transaction[];
  } {
    const yearStart = new Date(taxYear, 0, 1).getTime();
    const yearEnd = new Date(taxYear + 1, 0, 1).getTime();
    
    const taxableEvents = transactions.filter(tx => 
      tx.timestamp >= yearStart && 
      tx.timestamp < yearEnd &&
      (tx.type === 'swap' || tx.type === 'remove_liquidity')
    );

    let totalGains = 0;
    let totalLosses = 0;
    let shortTermGains = 0;
    let longTermGains = 0;

    // 簡易計算 - 実際の税務計算はより複雑
    for (const tx of taxableEvents) {
      const outputTokens = tx.tokens.filter(t => !t.isInput);
      const inputTokens = tx.tokens.filter(t => t.isInput);
      
      const outputValue = outputTokens.reduce((sum, t) => sum + t.amount * t.price, 0);
      const inputValue = inputTokens.reduce((sum, t) => sum + t.amount * t.price, 0);
      
      const gain = outputValue - inputValue - tx.fees;
      
      if (gain > 0) {
        totalGains += gain;
        // 1年以上保有かどうかの判定は簡略化
        const holdingPeriod = Date.now() - tx.timestamp;
        if (holdingPeriod > 365 * 24 * 60 * 60 * 1000) {
          longTermGains += gain;
        } else {
          shortTermGains += gain;
        }
      } else {
        totalLosses += Math.abs(gain);
      }
    }

    return {
      totalGains,
      totalLosses,
      shortTermGains,
      longTermGains,
      taxableEvents,
    };
  }

  filterTransactions(
    transactions: Transaction[],
    filter: TransactionFilter
  ): Transaction[] {
    return transactions.filter(tx => {
      if (filter.type && tx.type !== filter.type) return false;
      if (filter.dateFrom && tx.timestamp < filter.dateFrom) return false;
      if (filter.dateTo && tx.timestamp > filter.dateTo) return false;
      if (filter.tokenAddress && 
          !tx.tokens.some(t => t.token.address === filter.tokenAddress)) return false;
      if (filter.minAmount && 
          !tx.tokens.some(t => t.amount >= filter.minAmount!)) return false;
      if (filter.maxAmount && 
          !tx.tokens.some(t => t.amount <= filter.maxAmount!)) return false;
      return true;
    });
  }

  clearCache() {
    this.cache.clear();
    this.pnlCache.clear();
  }
}

export const transactionService = new TransactionService();
export default transactionService;