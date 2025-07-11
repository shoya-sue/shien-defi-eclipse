# Eclipse DeFi Tools 技術仕様書

## 1. システム概要

### 1.1 アーキテクチャ
Eclipse DeFi Tools は、Eclipse ブロックチェーン上でのDeFi操作を効率化するWebアプリケーションです。モダンなフロントエンド技術を活用し、高性能かつセキュアなユーザー体験を提供します。

### 1.2 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **ブロックチェーン**: Solana Web3.js (Eclipse対応)
- **状態管理**: React Hooks + Context API
- **PWA**: Service Worker + Web App Manifest
- **セキュリティ**: CSP + 入力検証 + 暗号化

## 2. コンポーネント仕様

### 2.1 SwapInterface (`/src/components/Swap/SwapInterface.tsx`)
**目的**: 複数DEX間でのトークンスワップ機能

#### Props
```typescript
interface SwapInterfaceProps {
  onSwapComplete?: (result: SwapResult) => void;
}
```

#### 機能
- トークン選択とペア設定
- 複数DEXでの価格比較
- 最適ルーティングの提案
- スリッページ設定
- 取引実行とトランザクション追跡

#### 統合DEX
- **Jupiter**: Eclipse上のDEXアグリゲーター
- **Orca**: 自動マーケットメーカー
- **Raydium**: 高流動性DEX

#### API エンドポイント
```typescript
const DEX_ENDPOINTS = {
  jupiter: 'https://quote-api.eclipse.jup.ag',
  orca: 'https://api.orca.eclipse.so',
  raydium: 'https://api.raydium.eclipse.io'
};
```

### 2.2 LiquidityCalculator (`/src/components/Liquidity/LiquidityCalculator.tsx`)
**目的**: 流動性プール分析とリスク計算

#### 計算機能
- **APY計算**: `APY = (1 + r/n)^n - 1`
- **インパーマネントロス**: `IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1`
- **期待収益**: 手数料収益とトークン価格変動の総合評価

#### データ構造
```typescript
interface PoolData {
  poolId: string;
  tokenA: Token;
  tokenB: Token;
  tvl: number;
  apy: number;
  volume24h: number;
  fees: {
    tradingFee: number;
    protocolFee: number;
  };
}
```

### 2.3 YieldTracker (`/src/components/Yield/YieldTracker.tsx`)
**目的**: イールドファーミング収益追跡

#### 機能
- 複数ファーミングプールの管理
- 収益率の自動計算
- 複利効果の考慮
- 最適化戦略の提案

#### 計算アルゴリズム
```typescript
// 複利計算
const compoundYield = (principal: number, rate: number, time: number, frequency: number): number => {
  return principal * Math.pow(1 + rate / frequency, frequency * time);
};

// リスク調整収益
const riskAdjustedReturn = (returns: number[], volatility: number): number => {
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return meanReturn / volatility; // Sharpe ratio
};
```

### 2.4 PnLCalculator (`/src/components/PnL/PnLCalculator.tsx`)
**目的**: 損益計算と税務対応

#### 計算方法
- **FIFO (First In, First Out)**: 先入先出法
- **LIFO (Last In, First Out)**: 後入先出法
- **加重平均**: 全保有の平均価格

#### データ管理
```typescript
interface Transaction {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  token: Token;
  amount: number;
  price: number;
  fee: number;
  txHash: string;
}

interface PnLReport {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  taxableGains: number;
  transactions: Transaction[];
}
```

## 3. ユーティリティ仕様

### 3.1 価格取得 (`/src/utils/prices.ts`)
**目的**: 複数ソースからの価格データ統合

#### 機能
- CoinGecko API統合
- DEX価格データ取得
- 価格変動計算
- キャッシュ機能

#### 実装
```typescript
export const fetchTokenPrice = async (tokenAddress: string): Promise<PriceData> => {
  const cacheKey = `price_${tokenAddress}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const priceData = await Promise.all([
    fetchCoinGeckoPrice(tokenAddress),
    fetchDEXPrice(tokenAddress)
  ]);
  
  const consolidatedPrice = consolidatePrices(priceData);
  cache.set(cacheKey, { data: consolidatedPrice, timestamp: Date.now() });
  
  return consolidatedPrice;
};
```

### 3.2 計算ユーティリティ (`/src/utils/calculations.ts`)
**目的**: 金融計算の共通ロジック

#### 機能
- 複利計算
- 年利計算
- 価格変動率計算
- リスク指標計算

#### 実装例
```typescript
export const calculateAPY = (
  principal: number,
  finalValue: number,
  days: number
): number => {
  const rate = (finalValue / principal) - 1;
  const annualizedRate = Math.pow(1 + rate, 365 / days) - 1;
  return annualizedRate * 100;
};

export const calculateImpermanentLoss = (
  priceRatio: number
): number => {
  const sqrtRatio = Math.sqrt(priceRatio);
  const il = 2 * sqrtRatio / (1 + priceRatio) - 1;
  return il * 100;
};
```

### 3.3 セキュリティ (`/src/utils/security.ts`)
**目的**: アプリケーションの総合セキュリティ

#### CSP設定
```typescript
export const CSP_DIRECTIVES = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https: blob:",
  'connect-src': "'self' https://api.coingecko.com https://quote-api.eclipse.jup.ag https://api.orca.eclipse.so https://api.raydium.eclipse.io https://mainnetbeta-rpc.eclipse.xyz wss://mainnetbeta-rpc.eclipse.xyz",
  'worker-src': "'self' blob:",
  'frame-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'upgrade-insecure-requests': '',
};
```

#### 入力検証
```typescript
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    })
    .trim();
}
```

#### レート制限
```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}
```

## 4. 状態管理仕様

### 4.1 React Context構造
```typescript
// 価格データ管理
interface PriceContextType {
  prices: Map<string, PriceData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ユーザー設定管理
interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

// セキュリティ管理
interface SecurityContextType {
  auditInput: (input: string, context: string) => boolean;
  auditURL: (url: string) => boolean;
  auditRateLimit: (identifier: string) => boolean;
  getSecurityReport: () => SecurityReport;
}
```

### 4.2 カスタムフック仕様
```typescript
// 価格データフック
export const usePrices = (tokens: Token[]): {
  prices: PriceData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  // 実装省略
};

// ウォレット接続フック
export const useWallet = (): {
  connected: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
} => {
  // 実装省略
};

// オフライン状態フック
export const useOfflineStatus = (): {
  isOnline: boolean;
  isOffline: boolean;
  effectiveType: string | null;
} => {
  // 実装省略
};
```

## 5. PWA仕様

### 5.1 Service Worker (`/public/sw.js`)
**目的**: オフライン対応とキャッシュ管理

#### キャッシュ戦略
- **Static Assets**: Cache First
- **API Calls**: Network First with Fallback
- **User Data**: Cache First with Background Update

#### 実装
```javascript
const CACHE_NAME = 'eclipse-defi-tools-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // API requests: Network First
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Static assets: Cache First
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### 5.2 Web App Manifest (`/public/manifest.json`)
```json
{
  "name": "Eclipse DeFi Tools",
  "short_name": "Eclipse DeFi",
  "description": "Eclipse ブロックチェーン上でのDeFi操作ツール",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 6. パフォーマンス最適化

### 6.1 コードスプリッティング
```typescript
// 遅延読み込み
const LazySwapInterface = lazy(() => import('./components/Swap/SwapInterface'));
const LazyLiquidityCalculator = lazy(() => import('./components/Liquidity/LiquidityCalculator'));
const LazyYieldTracker = lazy(() => import('./components/Yield/YieldTracker'));
const LazyPnLCalculator = lazy(() => import('./components/PnL/PnLCalculator'));

// Suspense でラップ
<Suspense fallback={<ComponentLoader />}>
  <LazySwapInterface />
</Suspense>
```

### 6.2 メモ化戦略
```typescript
// 重い計算のメモ化
const expensiveCalculation = useMemo(() => {
  return calculateComplexMetrics(data);
}, [data]);

// コンポーネントのメモ化
const TokenSelector = React.memo(({ tokens, onSelect }) => {
  // 実装
});

// コールバックのメモ化
const handleTokenSelect = useCallback((token: Token) => {
  // 実装
}, []);
```

### 6.3 バンドル最適化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/wallet-adapter-react'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
        }
      }
    }
  }
});
```

## 7. セキュリティ仕様

### 7.1 脅威モデル
- **XSS攻撃**: 悪意のあるスクリプトの実行
- **CSRF攻撃**: 意図しない操作の実行
- **Man-in-the-Middle**: 通信の盗聴・改ざん
- **プライベートキーの漏洩**: ウォレット情報の窃取

### 7.2 対策実装
```typescript
// XSS対策
export function preventXSS(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// CSRF対策
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 秘密鍵検証
export function validatePrivateKey(privateKey: string): boolean {
  if (!privateKey || typeof privateKey !== 'string') return false;
  
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(privateKey)) return false;
  
  if (privateKey.length < 32 || privateKey.length > 128) return false;
  
  return true;
}
```

### 7.3 監査システム
```typescript
export class SecurityAuditor {
  private logger = new SecurityLogger();
  
  auditInput(input: string, context: string): boolean {
    if (this.detectXSS(input)) {
      this.logger.log({
        type: 'xss_attempt',
        severity: 'high',
        details: { input: input.substring(0, 100), context },
      });
      return false;
    }
    
    return true;
  }
  
  getSecurityReport(): SecurityReport {
    const events = this.logger.getEvents();
    return {
      totalEvents: events.length,
      eventsByType: this.groupEventsByType(events),
      eventsBySeverity: this.groupEventsBySeverity(events),
      recentEvents: this.getRecentEvents(events),
    };
  }
}
```

## 8. データ構造定義

### 8.1 トークン定義
```typescript
interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  chainId: number;
}
```

### 8.2 価格データ
```typescript
interface PriceData {
  token: Token;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: number;
}
```

### 8.3 ユーザー設定
```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  slippage: number;
  notifications: {
    priceAlerts: boolean;
    transactionComplete: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };
}
```

## 9. API仕様

### 9.1 価格取得API
```typescript
// CoinGecko API
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface CoinGeckoResponse {
  [tokenId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

// DEX API
const JUPITER_API = 'https://quote-api.eclipse.jup.ag/v1';

interface JupiterQuoteResponse {
  data: {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    marketInfos: MarketInfo[];
  };
}
```

### 9.2 RPC接続
```typescript
const RPC_ENDPOINTS = {
  mainnet: 'https://mainnetbeta-rpc.eclipse.xyz',
  testnet: 'https://testnet-rpc.eclipse.xyz',
  devnet: 'https://devnet-rpc.eclipse.xyz'
};

const connection = new Connection(RPC_ENDPOINTS.mainnet, {
  commitment: 'confirmed',
  wsEndpoint: 'wss://mainnetbeta-rpc.eclipse.xyz'
});
```

## 10. エラーハンドリング仕様

### 10.1 エラー分類
```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  WALLET_ERROR = 'wallet_error',
  TRANSACTION_ERROR = 'transaction_error',
  CALCULATION_ERROR = 'calculation_error',
  SECURITY_ERROR = 'security_error'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  stack?: string;
}
```

### 10.2 エラーバウンダリー
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // セキュリティ監査にエラーを記録
    securityAuditor.logError({
      type: 'application_error',
      message: error.message,
      details: errorInfo,
      timestamp: Date.now()
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## 11. テスト仕様

### 11.1 テスト戦略
- **Unit Tests**: 個別関数・コンポーネントのテスト
- **Integration Tests**: コンポーネント間の連携テスト
- **E2E Tests**: ユーザーシナリオのテスト
- **Security Tests**: セキュリティ機能のテスト

### 11.2 テストカバレッジ
- **計算ロジック**: 100%カバレッジ
- **セキュリティ機能**: 100%カバレッジ
- **UIコンポーネント**: 80%以上カバレッジ
- **API統合**: 90%以上カバレッジ

## 12. デプロイメント仕様

### 12.1 ビルド設定
```bash
# 開発環境
npm run dev

# 本番ビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run type-check

# セキュリティ監査
npm audit
```

### 12.2 環境変数
```env
VITE_APP_NAME=Eclipse DeFi Tools
VITE_RPC_ENDPOINT=https://mainnetbeta-rpc.eclipse.xyz
VITE_COINGECKO_API_KEY=your_api_key
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SECURITY_AUDIT=true
```

この技術仕様書は、Eclipse DeFi Tools の実装詳細を包括的に記載したものです。開発者が機能追加や保守作業を行う際の参考として活用できます。