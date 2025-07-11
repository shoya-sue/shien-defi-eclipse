import type { Token, PriceData } from '../types';
import { API_ENDPOINTS, CACHE_DURATION } from '../constants';
import { LRUCache, debounce } from '../utils';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
    usd_24h_vol: number;
  };
}

class PriceService {
  private cache = new LRUCache<string, { data: PriceData; timestamp: number }>(100);
  private subscribers = new Set<(prices: PriceData[]) => void>();
  
  // デバウンス済みの価格更新通知
  private debouncedNotifySubscribers = debounce((...args: unknown[]) => {
    const prices = args[0] as PriceData[];
    this.subscribers.forEach(callback => callback(prices));
  }, 500);

  async getTokenPrice(token: Token): Promise<PriceData | null> {
    const cacheKey = `price_${token.address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.price) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.coingecko}/simple/token_price/ethereum?contract_addresses=${token.address}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoPrice = await response.json();
      const priceInfo = data[token.address.toLowerCase()];

      if (!priceInfo) {
        return null;
      }

      const priceData: PriceData = {
        token,
        price: priceInfo.usd,
        priceChange24h: priceInfo.usd_24h_change || 0,
        volume24h: priceInfo.usd_24h_vol || 0,
        marketCap: priceInfo.usd_market_cap || 0,
        timestamp: Date.now(),
      };

      this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
      
      // デバウンス済みの通知
      this.debouncedNotifySubscribers([priceData]);
      
      return priceData;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  async getMultipleTokenPrices(tokens: Token[]): Promise<PriceData[]> {
    const addresses = tokens.map(token => token.address.toLowerCase()).join(',');
    
    try {
      const response = await fetch(
        `${API_ENDPOINTS.coingecko}/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoPrice = await response.json();
      
      return tokens.map(token => {
        const priceInfo = data[token.address.toLowerCase()];
        
        if (!priceInfo) {
          return {
            token,
            price: 0,
            priceChange24h: 0,
            volume24h: 0,
            marketCap: 0,
            timestamp: Date.now(),
          };
        }

        const priceData: PriceData = {
          token,
          price: priceInfo.usd,
          priceChange24h: priceInfo.usd_24h_change || 0,
          volume24h: priceInfo.usd_24h_vol || 0,
          marketCap: priceInfo.usd_market_cap || 0,
          timestamp: Date.now(),
        };

        const cacheKey = `price_${token.address}`;
        this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
        
        return priceData;
      });
    } catch (error) {
      console.error('Error fetching multiple token prices:', error);
      return tokens.map(token => ({
        token,
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        timestamp: Date.now(),
      }));
    }
  }

  subscribe(callback: (prices: PriceData[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(prices: PriceData[]) {
    this.subscribers.forEach(callback => callback(prices));
  }

  startPriceUpdates(tokens: Token[], interval: number = API_ENDPOINTS.priceUpdate) {
    const updatePrices = async () => {
      const prices = await this.getMultipleTokenPrices(tokens);
      this.notifySubscribers(prices);
    };

    updatePrices();
    return setInterval(updatePrices, interval);
  }

  stopPriceUpdates(intervalId: NodeJS.Timeout) {
    clearInterval(intervalId);
  }

  clearCache() {
    this.cache.clear();
  }

  getCachedPrice(token: Token): PriceData | null {
    const cacheKey = `price_${token.address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.price) {
      return cached.data;
    }
    
    return null;
  }
}

export const priceService = new PriceService();
export default priceService;