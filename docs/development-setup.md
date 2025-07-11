# Eclipse DeFi Tools - 開発環境セットアップ

## 前提条件

### システム要件
- **Node.js**: v18.0.0以上
- **npm**: v8.0.0以上
- **Git**: v2.0.0以上
- **Eclipse対応ウォレット**: Phantom、Solflare等

### 開発環境
- **VS Code** (推奨)
- **Chrome DevTools**
- **Eclipse RPC エンドポイント**

## プロジェクトセットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/eclipse-defi-tools.git
cd eclipse-defi-tools
```

### 2. 依存関係のインストール
```bash
cd eclipse-defi-tools
npm install
```

### 3. 環境変数の設定
```bash
cp .env.example .env
```

`.env`ファイルを編集：
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

### 4. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションが `http://localhost:5173` で起動します。

## プロジェクト構成

### ディレクトリ構造
```
eclipse-defi-tools/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── SwapComparison/  # スワップ価格比較
│   │   ├── LiquidityCalculator/  # 流動性プール計算機
│   │   ├── YieldTracker/    # Yield Farming Tracker
│   │   ├── PnLCalculator/   # PnL計算機
│   │   └── Common/          # 共通コンポーネント
│   ├── hooks/               # カスタムフック
│   ├── services/            # API・データ処理サービス
│   ├── utils/               # ユーティリティ関数
│   ├── types/               # TypeScript型定義
│   └── constants/           # 定数定義
├── docs/                    # プロジェクトドキュメント
├── public/                  # 静的ファイル
└── tests/                   # テストファイル
```

## 開発ワークフロー

### 1. 機能開発
```bash
# 新機能ブランチの作成
git checkout -b feature/new-feature

# 開発
npm run dev

# テスト実行
npm test

# ビルド確認
npm run build
```

### 2. コード品質チェック
```bash
# 型チェック
npm run type-check

# リンター実行
npm run lint

# フォーマット
npm run format
```

### 3. Git コミット
```bash
git add .
git commit -m "feat: 新機能の追加"
git push origin feature/new-feature
```

## 利用可能なスクリプト

### 開発用
- `npm run dev`: 開発サーバー起動
- `npm run build`: プロダクションビルド
- `npm run preview`: ビルド結果のプレビュー

### コード品質
- `npm run lint`: ESLint実行
- `npm run lint:fix`: ESLint自動修正
- `npm run type-check`: TypeScript型チェック
- `npm run format`: Prettier実行

### テスト
- `npm test`: テスト実行
- `npm run test:watch`: テストファイル監視
- `npm run test:coverage`: カバレッジレポート

## 推奨VS Code拡張機能

### 必須拡張機能
- **TypeScript**: 型チェックと補完
- **ESLint**: コードリンティング
- **Prettier**: コードフォーマット
- **Tailwind CSS IntelliSense**: CSS補完

### 推奨拡張機能
- **Thunder Client**: API テスト
- **GitLens**: Git統合
- **Auto Rename Tag**: HTMLタグ自動リネーム
- **Bracket Pair Colorizer**: 括弧カラー

## デバッグ設定

### VS Code launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### ブラウザ開発者ツール
- **React Developer Tools**: コンポーネント検査
- **Chrome DevTools**: ネットワーク・パフォーマンス分析

## トラブルシューティング

### よくある問題

#### 1. 依存関係エラー
```bash
# node_modules削除と再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. 型エラー
```bash
# 型定義確認
npm run type-check
```

#### 3. Eclipse RPC接続エラー
- 環境変数の確認
- エンドポイントの可用性確認
- ネットワーク接続確認

#### 4. ウォレット接続エラー
- ウォレット拡張機能の確認
- 接続許可の確認
- コンソールエラーの確認

## 本番環境デプロイ

### ビルド
```bash
npm run build
```

### 環境変数設定
本番環境用の環境変数を設定：
```env
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
# その他の本番環境用設定
```

### デプロイ
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# GitHub Pages
npm run deploy
```

## 開発ガイドライン

### コーディング規約
- TypeScript厳密モード使用
- ESLint・Prettier設定準拠
- 適切な型定義とコメント
- 関数・変数の命名規則

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
```

### プルリクエスト
- 詳細な説明
- 関連するissueの参照
- テスト結果の確認
- レビューの実施