# Eclipse DeFi Tools

Eclipse Blockchain上で動作するDeFi（分散型金融）ツールキット。スワップ比較、流動性計算、利回り追跡、損益計算などの機能を提供します。

## 🚧 開発進捗状況

### ✅ 完了済み（Production Ready）
- **プロジェクト基盤**: React + TypeScript + Vite環境構築
- **ビルドシステム**: 型チェック、Lint、テスト環境（18/18テスト成功）
- **コンポーネント構造**: 基本UI コンポーネント設計・実装
- **ユーティリティ関数**: 計算ロジック、フォーマット関数群
- **セキュリティ基盤**: 入力検証、XSS防御、セキュリティコンテキスト
- **デプロイ環境**: Docker、CI/CD、7つのプラットフォーム対応
- **ドキュメント**: README、デプロイガイド、環境設定

### 🔄 部分実装済み（機能追加・最適化が必要）
- **ウォレット接続**: Solana Wallet Adapter基盤（Eclipse Mainnet要テスト）
- **スワップ比較**: UI実装済み（実際のDEX API接続待ち）
- **流動性計算**: 計算ロジック実装済み（リアルタイムデータ接続待ち）
- **利回り追跡**: ポートフォリオUI実装済み（ファーミングプール接続待ち）
- **損益計算**: 基本機能実装済み（トランザクション履歴API接続待ち）

### ⏳ 未実装（今後の開発予定）
- **リアルタイム価格**: WebSocket接続最適化とエラーハンドリング
- **DEX統合**: Jupiter、Orca、Raydium の実際のAPI接続
- **トランザクション履歴**: Eclipse ブロックチェーン同期機能
- **高度な分析**: ポートフォリオ最適化、リスク分析
- **ユーザー設定**: カスタマイズ可能なダッシュボード

### 📊 開発完了度: 約70%

### 🗓️ 開発ロードマップ

#### Phase 1: Core API Integration (短期)
- [ ] Eclipse Mainnet RPC接続最適化
- [ ] Jupiter API統合（スワップ比較）
- [ ] Orca API統合（流動性プール）
- [ ] リアルタイム価格WebSocket安定化

#### Phase 2: Advanced Features (中期)
- [ ] トランザクション履歴同期
- [ ] Raydium API統合（ファーミング）
- [ ] ポートフォリオ分析強化
- [ ] 税務レポート詳細化

#### Phase 3: User Experience (長期)
- [ ] カスタマイズ可能ダッシュボード
- [ ] 高度なリスク分析
- [ ] 多言語対応
- [ ] モバイルアプリ検討

## 🚀 機能

- **スワップ比較** 🔄: 複数のDEX間でのトークンスワップレートを比較（UI実装済み・API接続待ち）
- **流動性計算** ✅: LP（流動性提供）のAPY、インパーマネントロス計算（完全実装）
- **利回り追跡** 🔄: ファーミングプールの利回り管理とポートフォリオ追跡（UI実装済み・データ接続待ち）
- **損益計算** 🔄: トランザクション履歴からP&L分析と税務レポート生成（基本機能実装済み）
- **リアルタイム価格** ⏳: WebSocketによるリアルタイム価格更新（最適化必要）
- **ウォレット接続** 🔄: Solana Wallet Adapterによる安全なウォレット接続（基盤実装済み・Eclipse対応要テスト）

**凡例**: ✅ 完了 | 🔄 部分実装 | ⏳ 未実装

## 📋 必要要件

- Node.js (v18以上)
- npm または yarn
- 現代的なWebブラウザ（Chrome, Firefox, Safari, Edge）
- Solanaウォレット（Phantom, Solflare等）

## ⚡ クイックスタート

### 開発環境の設定

```bash
# リポジトリをクローン
git clone <repository-url>
cd eclipse-defi-tools

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

開発サーバーは `http://localhost:5173` で起動します。

### 環境変数の設定

`.env.local` ファイルを作成して以下の環境変数を設定：

```bash
# Eclipse RPC エンドポイント
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz

# Eclipse WebSocket エンドポイント
REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz

# DEX API エンドポイント（本番環境では実際のAPIに変更）
REACT_APP_JUPITER_API_URL=https://quote-api.jup.ag/v6
REACT_APP_ORCA_API_URL=https://api.orca.so/v1
REACT_APP_RAYDIUM_API_URL=https://api.raydium.io/v2

# アプリケーション設定
REACT_APP_APP_NAME=\"Eclipse DeFi Tools\"
REACT_APP_VERSION=1.0.0
```

## 🏗️ ビルドとデプロイ

### 本番ビルド

```bash
# プロダクションビルドを作成
npm run build

# ビルド結果のプレビュー
npm run preview
```

ビルド結果は `dist/` フォルダに出力されます。

### 静的ホスティングサービスでのデプロイ

#### Vercel

```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

#### Netlify

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --dir=dist --prod
```

#### AWS S3 + CloudFront

```bash
# AWS CLIでS3バケットにアップロード
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFrontでキャッシュを無効化
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths \"/*\"
```

#### GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        REACT_APP_ECLIPSE_RPC_URL: ${{ secrets.ECLIPSE_RPC_URL }}
        REACT_APP_ECLIPSE_WS_URL: ${{ secrets.ECLIPSE_WS_URL }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Docker デプロイ

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD [\"nginx\", \"-g\", \"daemon off;\"]
```

```bash
# Dockerイメージをビルド
docker build -t eclipse-defi-tools .

# コンテナを実行
docker run -p 8080:80 eclipse-defi-tools
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# 型チェック
npm run typecheck

# Lint実行
npm run lint

# テスト実行
npm run test

# テストUI
npm run test:ui

# カバレッジ付きテスト
npm run test:coverage

# プレビューサーバー
npm run preview
```

## ⚙️ 設定ファイル

### TypeScript設定

- `tsconfig.json`: メインのTypeScript設定
- `tsconfig.app.json`: アプリケーション用設定
- `tsconfig.node.json`: Node.js用設定

### Vite設定

`vite.config.ts`でビルド最適化、チャンク分割、依存関係の事前バンドルを設定。

### ESLint設定

`eslint.config.js`でコード品質とスタイルルールを設定。

## 🌐 本番環境での設定

### HTTPS設定

本番環境では必ずHTTPSを使用してください：

```bash
# Let's Encryptを使用する場合
sudo certbot --nginx -d yourdomain.com
```

### セキュリティヘッダー

Nginx設定例：

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # セキュリティヘッダー
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'\";
    
    location / {
        root /var/www/eclipse-defi-tools;
        try_files $uri $uri/ /index.html;
    }
}
```

### 環境変数管理

本番環境では環境変数を安全に管理：

```bash
# サーバー環境での環境変数設定
export REACT_APP_ECLIPSE_RPC_URL=\"https://mainnetbeta-rpc.eclipse.xyz\"
export REACT_APP_ECLIPSE_WS_URL=\"wss://mainnetbeta-rpc.eclipse.xyz\"
```

## ⚠️ 重要な注意事項

### 現在の開発状況

このプロジェクトは**開発完了度70%**の段階です：

#### ✅ 本番利用可能な機能
- 流動性計算（APY、インパーマネントロス）
- 基本的なUI/UXコンポーネント
- セキュリティ基盤とエラーハンドリング

#### 🔄 限定的利用可能な機能（モックデータ使用）
- スワップ比較（UI動作確認のみ）
- 利回り追跡（計算ロジックのみ）
- 損益計算（基本機能のみ）

#### ⏳ 未完成の機能
- リアルタイム価格更新
- 実際のDEX API接続
- Eclipse Mainnetとの完全統合

### 本番環境での使用前に

1. **API接続設定**: Jupiter、Orca、Raydium の実際のAPIキー設定
2. **Eclipse Mainnet テスト**: ウォレット接続とトランザクション処理の検証
3. **セキュリティ監査**: スマートコントラクト接続部分の監査
4. **パフォーマンステスト**: 高負荷・リアルタイムデータでの動作確認
5. **ユーザーテスト**: 実際のユーザー環境での動作検証

## 🔍 トラブルシューティング

### よくある問題

#### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

#### ウォレット接続エラー

1. ブラウザでウォレット拡張機能が有効になっているか確認
2. HTTPSでアクセスしているか確認（ローカル開発はhttpでOK）
3. ネットワークがEclipse Mainnnetに設定されているか確認

#### 型エラー

```bash
# 型チェックを実行
npm run typecheck

# 型定義を再生成
rm -rf node_modules/@types
npm install
```

### パフォーマンス最適化

#### バンドルサイズ分析

```bash
# バンドル分析ツールをインストール
npm install --save-dev @rollup/plugin-visualizer

# 分析実行
npm run build
npx vite-bundle-analyzer dist
```

#### メモリ使用量監視

開発者ツールのPerformanceタブでメモリリークをチェック。

## 📖 API ドキュメント

### 環境変数

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `REACT_APP_ECLIPSE_RPC_URL` | Eclipse RPC エンドポイント | `https://mainnetbeta-rpc.eclipse.xyz` | ✅ |
| `REACT_APP_ECLIPSE_WS_URL` | Eclipse WebSocket エンドポイント | `wss://mainnetbeta-rpc.eclipse.xyz` | ✅ |
| `REACT_APP_JUPITER_API_URL` | Jupiter API エンドポイント | Mock API | ❌ |
| `REACT_APP_ORCA_API_URL` | Orca API エンドポイント | Mock API | ❌ |
| `REACT_APP_RAYDIUM_API_URL` | Raydium API エンドポイント | Mock API | ❌ |

### サポートされているウォレット

- Phantom
- Solflare
- Backpack
- その他のSolana Wallet Adapter対応ウォレット

## 🤝 貢献

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 🆘 サポート

- Issues: [GitHub Issues](https://github.com/your-repo/eclipse-defi-tools/issues)
- Discord: [Eclipse Community](https://discord.gg/eclipse)
- Documentation: [Eclipse Docs](https://docs.eclipse.xyz)

## 🔗 関連リンク

- [Eclipse Official Website](https://eclipse.xyz)
- [Solana Documentation](https://docs.solana.com)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)