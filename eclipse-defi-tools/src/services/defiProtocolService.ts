import { errorHandlingService, ErrorType, ErrorSeverity } from './errorHandlingService';
import { performanceService } from './performanceService';
import { cacheService } from './cacheService';
import type { Token } from '../types';

// DeFiプロトコルタイプ
export const ProtocolType = {
  JUPITER: 'JUPITER',
  ORCA: 'ORCA',
  RAYDIUM: 'RAYDIUM',
  MARINADE: 'MARINADE',
  KAMINO: 'KAMINO',
  METEORA: 'METEORA',
  LIFINITY: 'LIFINITY',
} as const;

export type ProtocolType = typeof ProtocolType[keyof typeof ProtocolType];

// プロトコル情報
export interface ProtocolInfo {
  type: ProtocolType;
  name: string;
  logo: string;
  url: string;
  features: string[];
  tvl?: number;
  volume24h?: number;
  apr?: number;
}

// ステーキング情報
export interface StakingInfo {
  protocol: ProtocolType;
  tokenSymbol: string;
  apy: number;
  tvl: number;
  minStake: number;
  lockPeriod?: number; // days
  rewards: RewardInfo[];
}

// 報酬情報
export interface RewardInfo {
  token: string;
  amount: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'epoch';
  apr: number;
}

// レンディング情報
export interface LendingInfo {
  protocol: ProtocolType;
  asset: string;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
  totalSupply: number;
  totalBorrow: number;
  availableLiquidity: number;
}

// ファーミング機会
export interface FarmingOpportunity {
  protocol: ProtocolType;
  poolName: string;
  tokenA: string;
  tokenB: string;
  apr: number;
  tvl: number;
  rewards: RewardInfo[];
  impermanentLossRisk: 'low' | 'medium' | 'high';
}

// アービトラージ機会
export interface ArbitrageOpportunity {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  protocols: Array<{
    protocol: ProtocolType;
    price: number;
    amountOut: number;
  }>;
  profitAmount: number;
  profitPercentage: number;
  gasEstimate: number;
  netProfit: number;
}

class DeFiProtocolService {
  private protocolsCache = new Map<ProtocolType, ProtocolInfo>();
  private lastUpdate = 0;
  private updateInterval = 300000; // 5分

  // 全プロトコル情報の取得
  public async getAllProtocols(): Promise<ProtocolInfo[]> {
    if (Date.now() - this.lastUpdate < this.updateInterval) {
      return Array.from(this.protocolsCache.values());
    }

    try {
      await performanceService.measureAsync('fetch_all_protocols', async () => {
        // モックデータ（実際のAPIに置き換える）
        const protocols: ProtocolInfo[] = [
          {
            type: ProtocolType.JUPITER,
            name: 'Jupiter',
            logo: '🪐',
            url: 'https://jup.ag',
            features: ['スワップ', 'リミットオーダー', 'DCA'],
            tvl: 1500000000,
            volume24h: 500000000,
          },
          {
            type: ProtocolType.ORCA,
            name: 'Orca',
            logo: '🐋',
            url: 'https://orca.so',
            features: ['スワップ', '流動性提供', 'ファーミング'],
            tvl: 800000000,
            volume24h: 200000000,
          },
          {
            type: ProtocolType.RAYDIUM,
            name: 'Raydium',
            logo: '☀️',
            url: 'https://raydium.io',
            features: ['スワップ', '流動性提供', 'ファーミング', 'ステーキング'],
            tvl: 1200000000,
            volume24h: 350000000,
          },
          {
            type: ProtocolType.MARINADE,
            name: 'Marinade Finance',
            logo: '🥩',
            url: 'https://marinade.finance',
            features: ['リキッドステーキング', 'mSOL'],
            tvl: 1000000000,
            apr: 7.5,
          },
          {
            type: ProtocolType.KAMINO,
            name: 'Kamino Finance',
            logo: '🏛️',
            url: 'https://kamino.finance',
            features: ['自動流動性管理', '集中流動性', 'レンディング'],
            tvl: 600000000,
            volume24h: 150000000,
          },
          {
            type: ProtocolType.METEORA,
            name: 'Meteora',
            logo: '☄️',
            url: 'https://meteora.ag',
            features: ['動的流動性', 'DLMM', '流動性プール'],
            tvl: 400000000,
            volume24h: 100000000,
          },
          {
            type: ProtocolType.LIFINITY,
            name: 'Lifinity',
            logo: '♾️',
            url: 'https://lifinity.io',
            features: ['集中流動性', 'オラクルベース価格'],
            tvl: 200000000,
            volume24h: 50000000,
          },
        ];

        // キャッシュに保存
        protocols.forEach(protocol => {
          this.protocolsCache.set(protocol.type, protocol);
        });

        this.lastUpdate = Date.now();
      });

      return Array.from(this.protocolsCache.values());
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getAllProtocols' }
      );
      return Array.from(this.protocolsCache.values());
    }
  }

  // ステーキング機会の取得
  public async getStakingOpportunities(): Promise<StakingInfo[]> {
    const cacheKey = 'staking_opportunities';
    const cached = await cacheService.get<StakingInfo[]>(cacheKey);
    if (cached) return cached;

    try {
      const opportunities = await performanceService.measureAsync('fetch_staking', async () => {
        // モックデータ（実際のAPIに置き換える）
        return [
          {
            protocol: ProtocolType.MARINADE,
            tokenSymbol: 'SOL',
            apy: 7.5,
            tvl: 1000000000,
            minStake: 0.01,
            rewards: [
              { token: 'MNDE', amount: 0.1, frequency: 'epoch' as const, apr: 2.5 },
            ],
          },
          {
            protocol: ProtocolType.RAYDIUM,
            tokenSymbol: 'RAY',
            apy: 15.2,
            tvl: 50000000,
            minStake: 1,
            lockPeriod: 7,
            rewards: [
              { token: 'RAY', amount: 0.05, frequency: 'daily' as const, apr: 15.2 },
            ],
          },
          {
            protocol: ProtocolType.KAMINO,
            tokenSymbol: 'USDC',
            apy: 8.5,
            tvl: 200000000,
            minStake: 10,
            rewards: [
              { token: 'KMNO', amount: 0.02, frequency: 'hourly' as const, apr: 3.5 },
              { token: 'USDC', amount: 0.005, frequency: 'daily' as const, apr: 5.0 },
            ],
          },
        ];
      });

      await cacheService.set(cacheKey, opportunities, 300000); // 5分キャッシュ
      return opportunities;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getStakingOpportunities' }
      );
      return [];
    }
  }

  // レンディング機会の取得
  public async getLendingOpportunities(): Promise<LendingInfo[]> {
    const cacheKey = 'lending_opportunities';
    const cached = await cacheService.get<LendingInfo[]>(cacheKey);
    if (cached) return cached;

    try {
      const opportunities = await performanceService.measureAsync('fetch_lending', async () => {
        // モックデータ（実際のAPIに置き換える）
        return [
          {
            protocol: ProtocolType.KAMINO,
            asset: 'USDC',
            supplyApy: 5.2,
            borrowApy: 7.8,
            utilization: 75,
            totalSupply: 150000000,
            totalBorrow: 112500000,
            availableLiquidity: 37500000,
          },
          {
            protocol: ProtocolType.KAMINO,
            asset: 'SOL',
            supplyApy: 3.8,
            borrowApy: 6.2,
            utilization: 68,
            totalSupply: 500000,
            totalBorrow: 340000,
            availableLiquidity: 160000,
          },
          {
            protocol: ProtocolType.KAMINO,
            asset: 'mSOL',
            supplyApy: 8.5,
            borrowApy: 10.2,
            utilization: 82,
            totalSupply: 200000,
            totalBorrow: 164000,
            availableLiquidity: 36000,
          },
        ];
      });

      await cacheService.set(cacheKey, opportunities, 300000); // 5分キャッシュ
      return opportunities;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getLendingOpportunities' }
      );
      return [];
    }
  }

  // ファーミング機会の取得
  public async getFarmingOpportunities(minApr: number = 0): Promise<FarmingOpportunity[]> {
    const cacheKey = `farming_opportunities_${minApr}`;
    const cached = await cacheService.get<FarmingOpportunity[]>(cacheKey);
    if (cached) return cached;

    try {
      const opportunities = await performanceService.measureAsync('fetch_farming', async () => {
        // モックデータ（実際のAPIに置き換える）
        const allOpportunities: FarmingOpportunity[] = [
          {
            protocol: ProtocolType.RAYDIUM,
            poolName: 'SOL-USDC',
            tokenA: 'SOL',
            tokenB: 'USDC',
            apr: 25.5,
            tvl: 50000000,
            rewards: [
              { token: 'RAY', amount: 0.1, frequency: 'daily' as const, apr: 20.5 },
              { token: 'SRM', amount: 0.05, frequency: 'daily' as const, apr: 5.0 },
            ],
            impermanentLossRisk: 'medium',
          },
          {
            protocol: ProtocolType.ORCA,
            poolName: 'mSOL-SOL',
            tokenA: 'mSOL',
            tokenB: 'SOL',
            apr: 8.2,
            tvl: 30000000,
            rewards: [
              { token: 'ORCA', amount: 0.02, frequency: 'daily' as const, apr: 8.2 },
            ],
            impermanentLossRisk: 'low',
          },
          {
            protocol: ProtocolType.METEORA,
            poolName: 'USDC-USDT',
            tokenA: 'USDC',
            tokenB: 'USDT',
            apr: 12.5,
            tvl: 20000000,
            rewards: [
              { token: 'MET', amount: 0.05, frequency: 'hourly' as const, apr: 12.5 },
            ],
            impermanentLossRisk: 'low',
          },
          {
            protocol: ProtocolType.KAMINO,
            poolName: 'ETH-SOL',
            tokenA: 'ETH',
            tokenB: 'SOL',
            apr: 35.8,
            tvl: 15000000,
            rewards: [
              { token: 'KMNO', amount: 0.15, frequency: 'daily' as const, apr: 30.8 },
              { token: 'SOL', amount: 0.001, frequency: 'daily' as const, apr: 5.0 },
            ],
            impermanentLossRisk: 'high',
          },
        ];

        return allOpportunities.filter(opp => opp.apr >= minApr);
      });

      await cacheService.set(cacheKey, opportunities, 300000); // 5分キャッシュ
      return opportunities;
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        { method: 'getFarmingOpportunities', minApr }
      );
      return [];
    }
  }

  // アービトラージ機会の検出
  public async detectArbitrageOpportunities(
    tokens: Token[],
    minProfit: number = 0.5 // 最小利益率（%）
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const opportunities: ArbitrageOpportunity[] = [];

      // 各トークンペアでアービトラージ機会をチェック
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const tokenA = tokens[i];
          const tokenB = tokens[j];

          // 各プロトコルでの価格を取得（モック）
          const prices = await this.getProtocolPrices(tokenA, tokenB);
          
          if (prices.length < 2) continue;

          // 価格差を計算
          prices.sort((a, b) => a.price - b.price);
          const lowestPrice = prices[0];
          const highestPrice = prices[prices.length - 1];
          
          const profitPercentage = ((highestPrice.price - lowestPrice.price) / lowestPrice.price) * 100;
          
          if (profitPercentage >= minProfit) {
            const amountIn = 1000; // $1000相当
            const amountOut = amountIn * (highestPrice.price / lowestPrice.price);
            const profitAmount = amountOut - amountIn;
            const gasEstimate = 0.05; // SOL
            const netProfit = profitAmount - (gasEstimate * 40); // SOL価格を$40と仮定

            if (netProfit > 0) {
              opportunities.push({
                tokenIn: tokenA.symbol,
                tokenOut: tokenB.symbol,
                amountIn,
                protocols: prices,
                profitAmount,
                profitPercentage,
                gasEstimate,
                netProfit,
              });
            }
          }
        }
      }

      return opportunities.sort((a, b) => b.netProfit - a.netProfit);
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.LOW,
        { method: 'detectArbitrageOpportunities' }
      );
      return [];
    }
  }

  // プロトコル別価格の取得（モック）
  private async getProtocolPrices(
    _tokenA: Token,
    _tokenB: Token
  ): Promise<Array<{ protocol: ProtocolType; price: number; amountOut: number }>> {
    // 実際にはAPIから価格を取得
    const basePrice = 1 + Math.random() * 0.1;
    
    return [
      {
        protocol: ProtocolType.JUPITER,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        amountOut: 1000,
      },
      {
        protocol: ProtocolType.ORCA,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        amountOut: 998,
      },
      {
        protocol: ProtocolType.RAYDIUM,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        amountOut: 1002,
      },
    ];
  }

  // 最適なイールド戦略の提案
  public async getOptimalYieldStrategy(
    amount: number,
    riskTolerance: 'low' | 'medium' | 'high'
  ): Promise<{
    strategies: Array<{
      type: 'staking' | 'lending' | 'farming';
      protocol: ProtocolType;
      details: StakingInfo | LendingInfo | FarmingOpportunity;
      allocation: number; // パーセント
      expectedApy: number;
    }>;
    totalExpectedApy: number;
  }> {
    try {
      const [staking, lending, farming] = await Promise.all([
        this.getStakingOpportunities(),
        this.getLendingOpportunities(),
        this.getFarmingOpportunities(),
      ]);

      const strategies: any[] = [];
      let remainingAllocation = 100;

      // リスク許容度に基づいて配分
      if (riskTolerance === 'low') {
        // 低リスク：主にステーキングとレンディング
        const bestStaking = staking.sort((a, b) => b.apy - a.apy)[0];
        const bestLending = lending.sort((a, b) => b.supplyApy - a.supplyApy)[0];

        if (bestStaking && remainingAllocation > 0) {
          const allocation = 60;
          strategies.push({
            type: 'staking',
            protocol: bestStaking.protocol,
            details: bestStaking,
            allocation,
            expectedApy: bestStaking.apy,
          });
          remainingAllocation -= allocation;
        }

        if (bestLending && remainingAllocation > 0) {
          strategies.push({
            type: 'lending',
            protocol: bestLending.protocol,
            details: bestLending,
            allocation: remainingAllocation,
            expectedApy: bestLending.supplyApy,
          });
        }
      } else if (riskTolerance === 'medium') {
        // 中リスク：バランス型
        const bestStaking = staking.sort((a, b) => b.apy - a.apy)[0];
        const bestLending = lending.sort((a, b) => b.supplyApy - a.supplyApy)[0];
        const bestFarming = farming
          .filter(f => f.impermanentLossRisk !== 'high')
          .sort((a, b) => b.apr - a.apr)[0];

        if (bestStaking) {
          strategies.push({
            type: 'staking',
            protocol: bestStaking.protocol,
            details: bestStaking,
            allocation: 30,
            expectedApy: bestStaking.apy,
          });
          remainingAllocation -= 30;
        }

        if (bestLending) {
          strategies.push({
            type: 'lending',
            protocol: bestLending.protocol,
            details: bestLending,
            allocation: 30,
            expectedApy: bestLending.supplyApy,
          });
          remainingAllocation -= 30;
        }

        if (bestFarming && remainingAllocation > 0) {
          strategies.push({
            type: 'farming',
            protocol: bestFarming.protocol,
            details: bestFarming,
            allocation: remainingAllocation,
            expectedApy: bestFarming.apr,
          });
        }
      } else {
        // 高リスク：主にファーミング
        const topFarming = farming.sort((a, b) => b.apr - a.apr).slice(0, 3);

        topFarming.forEach((farm, index) => {
          const allocation = index === 0 ? 50 : 25;
          if (remainingAllocation >= allocation) {
            strategies.push({
              type: 'farming',
              protocol: farm.protocol,
              details: farm,
              allocation,
              expectedApy: farm.apr,
            });
            remainingAllocation -= allocation;
          }
        });
      }

      // 加重平均APYを計算
      const totalExpectedApy = strategies.reduce(
        (sum, strategy) => sum + (strategy.expectedApy * strategy.allocation) / 100,
        0
      );

      return { strategies, totalExpectedApy };
    } catch (error) {
      await errorHandlingService.handleError(
        error as Error,
        ErrorType.SYSTEM,
        ErrorSeverity.MEDIUM,
        { method: 'getOptimalYieldStrategy', amount, riskTolerance }
      );
      return { strategies: [], totalExpectedApy: 0 };
    }
  }
}

// シングルトンインスタンス
export const defiProtocolService = new DeFiProtocolService();

export default DeFiProtocolService;