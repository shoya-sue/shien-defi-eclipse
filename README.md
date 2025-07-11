# Eclipse DeFi Tools

Eclipse チェーン用のDeFi・取引支援ツール集です。分散型金融（DeFi）プロトコルでの効率的な取引と資産運用をサポートする包括的なツールセットを提供します。

## 🚀 プロジェクト概要

Eclipseチェーンのエコシステムで活動するDeFiユーザーと投資家に向けた4つの主要ツールを提供します：

1. **スワップ価格比較** - 複数DEXの価格比較とベストレート検索
2. **流動性プール計算機** - APYやimpermanent loss計算
3. **Yield Farming Tracker** - 利回り農業のポジション管理
4. **PnL計算機** - 損益計算と税務サポート

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Recharts / Chart.js** - データ可視化
- **React Query** - データフェッチング・キャッシング
- **React Hook Form** - フォーム管理

### Web3 Integration
- **@solana/web3.js** - Eclipse チェーンとの連携
- **@solana/spl-token** - トークン操作
- **@project-serum/anchor** - DEXプログラムとの連携
- **Jupiter API** - DEXアグリゲーション（Eclipse対応）

### データ・API
- **Eclipse RPC Endpoints** - チェーンデータ取得
- **DEX APIs** - 価格・流動性データ
- **WebSocket** - リアルタイム価格更新
- **IndexedDB** - 大容量ローカルストレージ

## 📋 機能詳細

### 1. スワップ価格比較
**目的**: 複数DEXの価格を比較し、最適な取引ルートを提案

**主要機能**:
- リアルタイム価格比較（複数DEX対応）
- 最適ルート自動検索・提案
- スリッページ計算・設定
- 取引手数料の比較表示
- 価格影響度の可視化
- 履歴・お気に入りペア保存
- アービトラージ機会の検出

**対応予定DEX**:
- Eclipse版Orca
- Eclipse版Raydium
- Eclipse版Jupiter
- その他Eclipse生態系DEX

**技術要件**:
- 複数DEX APIとの連携
- リアルタイム価格フィード
- ルーティングアルゴリズム
- スマートコントラクト呼び出し

### 2. 流動性プール計算機
**目的**: 流動性提供のリスクとリターンを詳細分析

**主要機能**:
- APY計算（手数料報酬 + トークン報酬）
- Impermanent Loss計算・シミュレーション
- 価格変動シナリオ分析
- 最適な流動性提供戦略提案
- 複数プール間の比較
- 過去データに基づく収益予測
- リスク指標の表示

**計算項目**:
- 年間利回り（APY/APR）
- Impermanent Loss率
- 手数料収入
- トークン報酬
- 総リターン予測

**技術要件**:
- 数学的計算ライブラリ
- 価格履歴データの取得・分析
- 複雑な金融計算の実装
- インタラクティブなシミュレーション

### 3. Yield Farming Tracker
**目的**: 複数のファーミングポジションを一元管理

**主要機能**:
- 全ポジションのダッシュボード表示
- リアルタイム収益追跡
- 自動複利計算
- 報酬トークンの価格追跡
- ポジション履歴・パフォーマンス分析
- アラート機能（目標達成、損失警告）
- 税務レポート出力

**管理対象**:
- 流動性プールポジション
- ステーキング報酬
- ファーミング報酬
- レンディング/ボローイング

**技術要件**:
- ウォレット接続・残高取得
- 複数プロトコルとの連携
- ポジションデータの永続化
- 複雑な収益計算

### 4. PnL計算機
**目的**: 包括的な損益計算と税務サポート

**主要機能**:
- 自動取引履歴インポート
- 実現/未実現損益計算
- FIFO/LIFO会計方式対応
- 税務レポート生成
- 取引手数料の自動計算
- 複数ウォレット対応
- CSV/PDF エクスポート
- 年次・月次サマリー

**対応取引タイプ**:
- スワップ取引
- 流動性提供/除去
- ステーキング報酬
- エアドロップ受領
- NFT取引

**技術要件**:
- トランザクション履歴の解析
- 複雑な会計ロジック
- 税務計算アルゴリズム
- データエクスポート機能

## 🏗️ プロジェクト構成

```
eclipse-defi-tools/
├── src/
│   ├── components/
│   │   ├── SwapComparison/
│   │   │   ├── DEXComparison.tsx
│   │   │   ├── RouteOptimizer.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   └── SwapInterface.tsx
│   │   ├── LiquidityCalculator/
│   │   │   ├── APYCalculator.tsx
│   │   │   ├── ImpermanentLossSimulator.tsx
│   │   │   ├── PoolComparison.tsx
│   │   │   └── StrategyRecommendation.tsx
│   │   ├── YieldTracker/
│   │   │   ├── PortfolioDashboard.tsx
│   │   │   ├── PositionList.tsx
│   │   │   ├── RewardsTracker.tsx
│   │   │   └── PerformanceChart.tsx
│   │   ├── PnLCalculator/
│   │   │   ├── TransactionImporter.tsx
│   │   │   ├── PnLSummary.tsx
│   │   │   ├── TaxReport.tsx
│   │   │   └── TradeHistory.tsx
│   │   └── Common/
│   │       ├── WalletConnector.tsx
│   │       ├── TokenSelector.tsx
│   │       ├── PriceDisplay.tsx
│   │       └── LoadingStates.tsx
│   ├── hooks/
│   │   ├── useDEXPrices.ts
│   │   ├── usePoolData.ts
│   │   ├── useYieldPositions.ts
│   │   ├── usePnLCalculation.ts
│   │   └── useWalletBalance.ts
│   ├── services/
│   │   ├── dexAPI.ts
│   │   ├── priceOracle.ts
│   │   ├── poolAnalyzer.ts
│   │   ├── transactionParser.ts
│   │   └── taxCalculator.ts
│   ├── utils/
│   │   ├── defiMath.ts
│   │   ├── priceCalculations.ts
│   │   ├── dateHelpers.ts
│   │   └── formatters.ts
│   ├── types/
│   │   ├── dex.ts
│   │   ├── pool.ts
│   │   ├── position.ts
│   │   └── transaction.ts
│   └── constants/
│       ├── dexConfigs.ts
│       ├── tokenList.ts
│       └── protocolAddresses.ts
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🚀 開発計画

### Phase 1: 基盤構築（2-3週間）
- [ ] プロジェクトセットアップ・開発環境構築
- [ ] Eclipse チェーン連携の実装
- [ ] ウォレット接続機能
- [ ] 基本的なUI/UXデザインシステム
- [ ] トークン価格取得API連携

### Phase 2: コア機能開発（4-5週間）
- [ ] スワップ価格比較ツールの実装
- [ ] 流動性プール計算機の開発
- [ ] Yield Farming Trackerの構築
- [ ] PnL計算機の基本機能

### Phase 3: 高度な機能実装（3-4週間）
- [ ] リアルタイムデータ更新
- [ ] 複雑な金融計算の実装
- [ ] データ可視化の強化
- [ ] アラート・通知機能
- [ ] エクスポート機能

### Phase 4: 最適化・テスト（2-3週間）
- [ ] パフォーマンス最適化
- [ ] ユーザビリティテスト
- [ ] セキュリティ監査
- [ ] エラーハンドリング強化
- [ ] モバイル対応

### Phase 5: デプロイ・運用（継続）
- [ ] 本番環境デプロイ
- [ ] 監視・ログ設定
- [ ] ユーザーフィードバック収集
- [ ] 継続的な改善・機能追加

## 🔧 セットアップ方法

### 前提条件
- Node.js 18.0.0 以上
- npm または yarn
- Eclipse チェーン対応ウォレット
- Eclipse RPC エンドポイント

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/your-username/eclipse-defi-tools.git
cd eclipse-defi-tools
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
# .env ファイルを編集
```

4. 開発サーバーの起動
```bash
npm run dev
```

## 📝 設定

### 環境変数
```env
# Eclipse Chain Configuration
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz

# DEX API Endpoints
REACT_APP_JUPITER_API_URL=https://quote-api.eclipse.jup.ag
REACT_APP_ORCA_API_URL=https://api.orca.eclipse.so
REACT_APP_RAYDIUM_API_URL=https://api.raydium.eclipse.io

# Price Data APIs
REACT_APP_COINGECKO_API_KEY=your_coingecko_api_key
REACT_APP_PRICE_UPDATE_INTERVAL=5000

# Application Settings
REACT_APP_DEFAULT_SLIPPAGE=0.5
REACT_APP_MAX_TRANSACTION_SIZE=1000000
REACT_APP_CACHE_DURATION=300000
```

### DEX設定
```typescript
// src/constants/dexConfigs.ts
export const DEX_CONFIGS = {
  orca: {
    name: 'Orca',
    apiUrl: process.env.REACT_APP_ORCA_API_URL,
    programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    fee: 0.003, // 0.3%
  },
  raydium: {
    name: 'Raydium',
    apiUrl: process.env.REACT_APP_RAYDIUM_API_URL,
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    fee: 0.0025, // 0.25%
  },
  // 他のDEX設定...
};
```

## 🧮 金融計算ライブラリ

### APY計算
```typescript
// APY = (1 + r/n)^(n*t) - 1
export function calculateAPY(
  principal: number,
  rate: number,
  compoundFrequency: number,
  time: number
): number {
  return Math.pow(1 + rate / compoundFrequency, compoundFrequency * time) - 1;
}
```

### Impermanent Loss計算
```typescript
export function calculateImpermanentLoss(
  priceRatio: number
): number {
  const newRatio = Math.sqrt(priceRatio);
  const holdValue = priceRatio;
  const lpValue = 2 * newRatio;
  
  return (lpValue / holdValue - 1) * 100;
}
```

## 🔗 関連リンク

- [Eclipse Official Website](https://eclipse.xyz)
- [Eclipse Documentation](https://docs.eclipse.xyz)
- [Jupiter Aggregator](https://jup.ag)
- [Orca Protocol](https://orca.so)
- [Raydium Protocol](https://raydium.io)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

---

**Eclipse DeFi Tools** - Eclipseエコシステムでの効率的なDeFi取引を支援するツール集
