# Eclipse DeFi Tools - 技術仕様書

## システムアーキテクチャ

### フロントエンド構成
```
src/
├── components/          # UI コンポーネント
│   ├── SwapComparison/  # スワップ価格比較
│   ├── LiquidityCalculator/  # 流動性プール計算機
│   ├── YieldTracker/    # Yield Farming Tracker
│   ├── PnLCalculator/   # PnL計算機
│   └── Common/          # 共通コンポーネント
├── hooks/               # カスタムフック
├── services/            # API・データ処理
├── utils/               # ユーティリティ
├── types/               # 型定義
└── constants/           # 定数
```

## API設計

### DEX API連携
- **Jupiter API**: DEXアグリゲーション
- **Orca API**: 流動性プールデータ
- **Raydium API**: ファーミングプールデータ
- **Eclipse RPC**: チェーンデータ

### データフロー
1. ユーザーインタラクション
2. API呼び出し
3. データ処理・計算
4. UI更新
5. 状態管理

## 機能別技術仕様

### 1. スワップ価格比較

#### 必要なAPI
- Jupiter Quote API
- Orca Pools API
- Raydium Pools API
- Eclipse RPC for real-time data

#### 計算ロジック
```typescript
interface SwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route: string[];
  dex: string;
}
```

#### 実装要件
- WebSocket接続によるリアルタイム価格更新
- 複数DEXの価格比較アルゴリズム
- 最適ルート計算
- スリッページ計算

### 2. 流動性プール計算機

#### 計算式
```typescript
// APY計算
APY = (1 + r/n)^(n*t) - 1

// Impermanent Loss計算
IL = (2 * sqrt(priceRatio)) / (1 + priceRatio) - 1
```

#### データ構造
```typescript
interface PoolData {
  poolId: string;
  token0: Token;
  token1: Token;
  reserves: [number, number];
  fee: number;
  apy: number;
  volume24h: number;
  liquidity: number;
}
```

### 3. Yield Farming Tracker

#### 管理対象データ
```typescript
interface FarmingPosition {
  poolId: string;
  userAddress: string;
  stakedAmount: number;
  rewardTokens: Token[];
  pendingRewards: number[];
  startTime: number;
  lastHarvest: number;
  totalRewards: number;
}
```

#### 必要な機能
- ポジション追跡
- 報酬計算
- 自動複利シミュレーション
- パフォーマンス分析

### 4. PnL計算機

#### 取引データ構造
```typescript
interface Transaction {
  hash: string;
  timestamp: number;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake';
  tokens: TransactionToken[];
  fees: number;
  gasUsed: number;
}

interface TransactionToken {
  address: string;
  symbol: string;
  amount: number;
  price: number;
  isInput: boolean;
}
```

#### 計算ロジック
- FIFO/LIFO会計方式
- 実現/未実現損益
- 税務計算
- 手数料計算

## セキュリティ要件

### ウォレット接続
- 複数ウォレットサポート（Phantom、Solflare等）
- 署名検証
- セキュアなトランザクション処理

### データ保護
- 秘密鍵の非保存
- ローカルストレージの暗号化
- API通信の暗号化

## パフォーマンス要件

### 応答時間
- 価格データ取得: < 1秒
- 計算処理: < 500ms
- UI更新: < 100ms

### データ管理
- IndexedDBによる大容量データ保存
- 効率的なキャッシング戦略
- メモリ使用量の最適化

## 環境設定

### 必須環境変数
```env
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz
REACT_APP_JUPITER_API_URL=https://quote-api.eclipse.jup.ag
REACT_APP_ORCA_API_URL=https://api.orca.eclipse.so
REACT_APP_RAYDIUM_API_URL=https://api.raydium.eclipse.io
REACT_APP_COINGECKO_API_KEY=your_api_key
```

### 開発環境
- Node.js 18.0.0+
- npm 8.0.0+
- TypeScript 5.0+
- Vite 4.0+

## テスト戦略

### 単体テスト
- 計算ロジックのテスト
- ユーティリティ関数のテスト
- API呼び出しのモックテスト

### 統合テスト
- コンポーネント間連携テスト
- API連携テスト
- ウォレット接続テスト

### E2Eテスト
- ユーザーフローテスト
- 実際のブロックチェーンとの連携テスト