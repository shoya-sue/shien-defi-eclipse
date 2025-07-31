import { Connection } from '@solana/web3.js';
import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { performanceService } from './performanceService';
import { cacheService } from './cacheService';

// サポートされるチェーン
export const ChainType = {
  ECLIPSE: 'ECLIPSE',
  SOLANA: 'SOLANA',
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
  ARBITRUM: 'ARBITRUM',
  OPTIMISM: 'OPTIMISM',
  BSC: 'BSC',
} as const;

export type ChainType = typeof ChainType[keyof typeof ChainType];

// チェーン情報
export interface ChainInfo {
  type: ChainType;
  name: string;
  logo: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: string;
  chainId?: number; // EVMチェーン用
  isTestnet: boolean;
  features: string[];
}

// クロスチェーントークン情報
export interface CrossChainToken {
  symbol: string;
  name: string;
  chains: Array<{
    chain: ChainType;
    address: string;
    decimals: number;
    balance?: number;
  }>;
  totalValueUSD: number;
}

// ブリッジ情報
export interface BridgeInfo {
  name: string;
  fromChain: ChainType;
  toChain: ChainType;
  supportedTokens: string[];
  estimatedTime: number; // 分
  fee: number; // パーセント
  minAmount: number;
  maxAmount: number;
}

// ブリッジ見積もり
export interface BridgeQuote {
  bridge: string;
  fromChain: ChainType;
  toChain: ChainType;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  estimatedTime: number;
  route: string[];
}

// チェーン統計
export interface ChainStats {
  chain: ChainType;
  tvl: number;
  volume24h: number;
  activeWallets: number;
  transactionCount24h: number;
  avgGasPrice: number;
  blockTime: number;
}

// マルチチェーンウォレット情報
export interface MultiChainWallet {
  totalValueUSD: number;
  chains: Array<{
    chain: ChainType;
    address: string;
    valueUSD: number;
    tokens: Array<{
      symbol: string;
      balance: number;
      valueUSD: number;
    }>;
  }>;
}

class MultiChainService {
  private connections: Map<ChainType, Connection> = new Map();
  private chainInfoCache: Map<ChainType, ChainInfo> = new Map();
  private bridgeCache: Map<string, BridgeInfo[]> = new Map();

  constructor() {
    this.initializeChains();
  }

  // チェーン情報の初期化
  private initializeChains(): void {
    const chains: ChainInfo[] = [
      {
        type: ChainType.ECLIPSE,
        name: 'Eclipse',
        logo: '🌘',
        rpcUrl: import.meta.env.VITE_ECLIPSE_RPC_URL || 'https://mainnetbeta-rpc.eclipse.xyz',
        explorerUrl: 'https://explorer.eclipse.xyz',
        nativeToken: 'ETH',
        isTestnet: false,
        features: ['Solana VM', 'Ethereum互換', '高速'],
      },
      {
        type: ChainType.SOLANA,
        name: 'Solana',
        logo: '☀️',
        rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        nativeToken: 'SOL',
        isTestnet: false,
        features: ['高速', '低コスト', 'DeFi'],
      },
      {
        type: ChainType.ETHEREUM,
        name: 'Ethereum',
        logo: '⟠',
        rpcUrl: import.meta.env.VITE_ETH_RPC_URL || 'https://eth.llamarpc.com',
        explorerUrl: 'https://etherscan.io',
        nativeToken: 'ETH',
        chainId: 1,
        isTestnet: false,
        features: ['スマートコントラクト', 'DeFi', 'NFT'],
      },
      {
        type: ChainType.POLYGON,
        name: 'Polygon',
        logo: '🟣',
        rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
        nativeToken: 'MATIC',
        chainId: 137,
        isTestnet: false,
        features: ['低コスト', 'Ethereum互換', 'スケーラブル'],
      },
      {
        type: ChainType.ARBITRUM,
        name: 'Arbitrum',
        logo: '🔷',
        rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        explorerUrl: 'https://arbiscan.io',
        nativeToken: 'ETH',
        chainId: 42161,
        isTestnet: false,
        features: ['Layer 2', '低コスト', 'Ethereum互換'],
      },
      {
        type: ChainType.OPTIMISM,
        name: 'Optimism',
        logo: '🔴',
        rpcUrl: import.meta.env.VITE_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
        explorerUrl: 'https://optimistic.etherscan.io',
        nativeToken: 'ETH',
        chainId: 10,
        isTestnet: false,
        features: ['Layer 2', 'Optimistic Rollup', '低コスト'],
      },
      {
        type: ChainType.BSC,
        name: 'BNB Chain',
        logo: '🟡',
        rpcUrl: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        explorerUrl: 'https://bscscan.com',
        nativeToken: 'BNB',
        chainId: 56,
        isTestnet: false,
        features: ['低コスト', 'DeFi', 'GameFi'],
      },
    ];

    chains.forEach(chain => {
      this.chainInfoCache.set(chain.type, chain);
      
      // Solana系チェーンのConnection設定
      if (chain.type === ChainType.ECLIPSE || chain.type === ChainType.SOLANA) {
        this.connections.set(chain.type, new Connection(chain.rpcUrl));
      }
    });
  }

  // 全チェーン情報の取得
  public getAllChains(): ChainInfo[] {
    return Array.from(this.chainInfoCache.values());
  }

  // 特定チェーン情報の取得
  public getChainInfo(chain: ChainType): ChainInfo | null {
    return this.chainInfoCache.get(chain) || null;
  }

  // クロスチェーントークン情報の取得
  public async getCrossChainTokens(
    walletAddresses: Record<ChainType, string>
  ): Promise<CrossChainToken[]> {
    const cacheKey = `cross_chain_tokens_${Object.values(walletAddresses).join('_')}`;
    const cached = await cacheService.get<CrossChainToken[]>(cacheKey);
    if (cached) return cached;

    try {
      const tokens = await performanceService.measureAsync('fetch_cross_chain_tokens', async () => {
        // モックデータ（実際のAPIに置き換える）
        return [
          {
            symbol: 'USDC',
            name: 'USD Coin',
            chains: [
              { chain: ChainType.ECLIPSE, address: 'USDC_ECLIPSE', decimals: 6, balance: 1000 },
              { chain: ChainType.SOLANA, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, balance: 500 },
              { chain: ChainType.ETHEREUM, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, balance: 2000 },
              { chain: ChainType.POLYGON, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, balance: 1500 },
            ],
            totalValueUSD: 5000,
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            chains: [
              { chain: ChainType.ECLIPSE, address: 'ETH_ECLIPSE', decimals: 18, balance: 0.5 },
              { chain: ChainType.ETHEREUM, address: 'NATIVE', decimals: 18, balance: 1.2 },
              { chain: ChainType.ARBITRUM, address: 'NATIVE', decimals: 18, balance: 0.8 },
              { chain: ChainType.OPTIMISM, address: 'NATIVE', decimals: 18, balance: 0.3 },
            ],
            totalValueUSD: 5600, // $2000/ETH
          },
          {
            symbol: 'SOL',
            name: 'Solana',
            chains: [
              { chain: ChainType.SOLANA, address: 'NATIVE', decimals: 9, balance: 50 },
              { chain: ChainType.ETHEREUM, address: '0xD31a59c85aE9D8edEFeC411D448f90841571b89c', decimals: 9, balance: 10 },
            ],
            totalValueUSD: 2400, // $40/SOL
          },
        ];
      });

      await cacheService.set(cacheKey, tokens, 300000); // 5分キャッシュ
      return tokens;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getCrossChainTokens' }
      );
      return [];
    }
  }

  // ブリッジ情報の取得
  public async getBridgeOptions(
    fromChain: ChainType,
    toChain: ChainType,
    token?: string
  ): Promise<BridgeInfo[]> {
    const cacheKey = `bridges_${fromChain}_${toChain}_${token || 'all'}`;
    const cached = this.bridgeCache.get(cacheKey);
    if (cached) return cached;

    try {
      const bridges = await performanceService.measureAsync('fetch_bridge_options', async () => {
        // モックデータ（実際のAPIに置き換える）
        const allBridges: BridgeInfo[] = [
          {
            name: 'Wormhole',
            fromChain,
            toChain,
            supportedTokens: ['USDC', 'ETH', 'SOL', 'USDT'],
            estimatedTime: 20,
            fee: 0.1,
            minAmount: 10,
            maxAmount: 1000000,
          },
          {
            name: 'LayerZero',
            fromChain,
            toChain,
            supportedTokens: ['USDC', 'ETH', 'USDT'],
            estimatedTime: 15,
            fee: 0.15,
            minAmount: 20,
            maxAmount: 500000,
          },
          {
            name: 'Allbridge',
            fromChain,
            toChain,
            supportedTokens: ['USDC', 'SOL', 'BNB'],
            estimatedTime: 10,
            fee: 0.2,
            minAmount: 5,
            maxAmount: 100000,
          },
        ];

        return token
          ? allBridges.filter(bridge => bridge.supportedTokens.includes(token))
          : allBridges;
      });

      this.bridgeCache.set(cacheKey, bridges);
      return bridges;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getBridgeOptions', fromChain, toChain, token }
      );
      return [];
    }
  }

  // ブリッジ見積もりの取得
  public async getBridgeQuote(
    fromChain: ChainType,
    toChain: ChainType,
    fromToken: string,
    amount: number
  ): Promise<BridgeQuote[]> {
    try {
      const quotes = await performanceService.measureAsync('fetch_bridge_quotes', async () => {
        const bridges = await this.getBridgeOptions(fromChain, toChain, fromToken);
        
        // 各ブリッジの見積もりを計算
        return bridges.map(bridge => {
          const fee = amount * (bridge.fee / 100);
          const toAmount = amount - fee;
          
          return {
            bridge: bridge.name,
            fromChain,
            toChain,
            fromToken,
            toToken: fromToken, // 同じトークンと仮定
            fromAmount: amount,
            toAmount,
            fee,
            estimatedTime: bridge.estimatedTime,
            route: [fromChain, toChain],
          };
        });
      });

      return quotes.sort((a, b) => b.toAmount - a.toAmount);
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getBridgeQuote', fromChain, toChain, fromToken, amount }
      );
      return [];
    }
  }

  // チェーン統計の取得
  public async getChainStats(): Promise<ChainStats[]> {
    const cacheKey = 'chain_stats';
    const cached = await cacheService.get<ChainStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const stats = await performanceService.measureAsync('fetch_chain_stats', async () => {
        // モックデータ（実際のAPIに置き換える）
        return [
          {
            chain: ChainType.ECLIPSE,
            tvl: 500000000,
            volume24h: 50000000,
            activeWallets: 150000,
            transactionCount24h: 2000000,
            avgGasPrice: 0.00001,
            blockTime: 0.4,
          },
          {
            chain: ChainType.SOLANA,
            tvl: 8000000000,
            volume24h: 1500000000,
            activeWallets: 2000000,
            transactionCount24h: 50000000,
            avgGasPrice: 0.00025,
            blockTime: 0.4,
          },
          {
            chain: ChainType.ETHEREUM,
            tvl: 50000000000,
            volume24h: 10000000000,
            activeWallets: 5000000,
            transactionCount24h: 1000000,
            avgGasPrice: 30,
            blockTime: 12,
          },
          {
            chain: ChainType.POLYGON,
            tvl: 5000000000,
            volume24h: 500000000,
            activeWallets: 1500000,
            transactionCount24h: 3000000,
            avgGasPrice: 30,
            blockTime: 2,
          },
          {
            chain: ChainType.ARBITRUM,
            tvl: 3000000000,
            volume24h: 800000000,
            activeWallets: 1000000,
            transactionCount24h: 2500000,
            avgGasPrice: 0.1,
            blockTime: 0.3,
          },
          {
            chain: ChainType.OPTIMISM,
            tvl: 2000000000,
            volume24h: 400000000,
            activeWallets: 800000,
            transactionCount24h: 1500000,
            avgGasPrice: 0.001,
            blockTime: 2,
          },
          {
            chain: ChainType.BSC,
            tvl: 6000000000,
            volume24h: 2000000000,
            activeWallets: 3000000,
            transactionCount24h: 8000000,
            avgGasPrice: 5,
            blockTime: 3,
          },
        ];
      });

      await cacheService.set(cacheKey, stats, 300000); // 5分キャッシュ
      return stats;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getChainStats' }
      );
      return [];
    }
  }

  // マルチチェーンウォレット情報の取得
  public async getMultiChainWallet(
    addresses: Record<ChainType, string>
  ): Promise<MultiChainWallet> {
    try {
      const [crossChainTokens] = await Promise.all([
        this.getCrossChainTokens(addresses),
      ]);

      const chainData: MultiChainWallet['chains'] = [];
      let totalValueUSD = 0;

      // 各チェーンのトークン情報を集計
      Object.entries(addresses).forEach(([chain, address]) => {
        const chainType = chain as ChainType;
        const tokens: Array<{ symbol: string; balance: number; valueUSD: number }> = [];
        let chainValueUSD = 0;

        crossChainTokens.forEach(token => {
          const chainToken = token.chains.find(c => c.chain === chainType);
          if (chainToken && chainToken.balance && chainToken.balance > 0) {
            const tokenValueUSD = (chainToken.balance / token.chains.length) * token.totalValueUSD;
            tokens.push({
              symbol: token.symbol,
              balance: chainToken.balance,
              valueUSD: tokenValueUSD,
            });
            chainValueUSD += tokenValueUSD;
          }
        });

        if (tokens.length > 0) {
          chainData.push({
            chain: chainType,
            address,
            valueUSD: chainValueUSD,
            tokens,
          });
          totalValueUSD += chainValueUSD;
        }
      });

      return { totalValueUSD, chains: chainData };
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        { method: 'getMultiChainWallet' }
      );
      return { totalValueUSD: 0, chains: [] };
    }
  }

  // 最適なブリッジルートの検索
  public async findOptimalBridgeRoute(
    fromChain: ChainType,
    toChain: ChainType,
    token: string,
    amount: number
  ): Promise<{
    route: ChainType[];
    bridges: string[];
    totalFee: number;
    totalTime: number;
    finalAmount: number;
  } | null> {
    try {
      // 直接ルート
      const directQuotes = await this.getBridgeQuote(fromChain, toChain, token, amount);
      
      if (directQuotes.length === 0) {
        // 中継チェーンを経由するルートを検索
        // 実装は簡略化
        return null;
      }

      const bestQuote = directQuotes[0];
      return {
        route: [fromChain, toChain],
        bridges: [bestQuote.bridge],
        totalFee: bestQuote.fee,
        totalTime: bestQuote.estimatedTime,
        finalAmount: bestQuote.toAmount,
      };
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.LOW,
        { method: 'findOptimalBridgeRoute', fromChain, toChain, token, amount }
      );
      return null;
    }
  }
}

// シングルトンインスタンス
export const multiChainService = new MultiChainService();

export default MultiChainService;