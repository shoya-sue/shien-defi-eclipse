# デプロイメントガイド

Eclipse DeFi Toolsを様々な環境にデプロイするための詳細ガイドです。

## 🏗️ ビルド準備

### 1. 環境変数の設定

`.env.local`ファイルを作成し、環境に応じた設定を行います：

```bash
cp .env.example .env.local
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. プロダクションビルド

```bash
npm run build
```

## 🌐 静的ホスティングサービス

### Vercel (推奨)

最も簡単なデプロイ方法：

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトをVercelに接続
vercel

# 環境変数を設定
vercel env add REACT_APP_ECLIPSE_RPC_URL
vercel env add REACT_APP_ECLIPSE_WS_URL

# 本番デプロイ
vercel --prod
```

#### Vercel設定ファイル (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "REACT_APP_ECLIPSE_RPC_URL": "@eclipse-rpc-url",
    "REACT_APP_ECLIPSE_WS_URL": "@eclipse-ws-url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Netlify

```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# ビルド
npm run build

# 手動デプロイ
netlify deploy --dir=dist --prod

# または自動デプロイ設定
netlify init
```

#### Netlify設定ファイル (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### AWS S3 + CloudFront

```bash
# AWS CLI設定
aws configure

# S3バケットを作成
aws s3 mb s3://eclipse-defi-tools-prod

# 静的ウェブサイトホスティングを有効化
aws s3 website s3://eclipse-defi-tools-prod --index-document index.html --error-document index.html

# ファイルをアップロード
aws s3 sync dist/ s3://eclipse-defi-tools-prod --delete

# CloudFrontディストリビューションを作成（任意）
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### GitHub Pages

`.github/workflows/deploy.yml`が既に設定済みです。GitHubリポジトリの設定で：

1. Settings → Pages
2. Source を "GitHub Actions" に設定
3. 必要な環境変数をSecretsに追加

## 🐳 Docker デプロイ

### ローカルでのDocker実行

```bash
# イメージをビルド
docker build -t eclipse-defi-tools .

# コンテナを実行
docker run -p 8080:8080 eclipse-defi-tools
```

### Docker Compose

`docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
      - REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

実行：

```bash
docker-compose up -d
```

## ☁️ クラウドプラットフォーム

### AWS ECS

1. ECRリポジトリを作成：

```bash
aws ecr create-repository --repository-name eclipse-defi-tools
```

2. イメージをプッシュ：

```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージをタグ付け
docker tag eclipse-defi-tools:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/eclipse-defi-tools:latest

# プッシュ
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/eclipse-defi-tools:latest
```

3. ECSタスク定義とサービスを作成

### Google Cloud Run

```bash
# Google Cloud SDKをインストール後
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# イメージをビルドしてプッシュ
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/eclipse-defi-tools

# Cloud Runにデプロイ
gcloud run deploy eclipse-defi-tools \
  --image gcr.io/YOUR_PROJECT_ID/eclipse-defi-tools \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz"
```

### Azure Container Instances

```bash
# Azure CLIでログイン
az login

# リソースグループを作成
az group create --name eclipse-defi-tools --location japaneast

# コンテナインスタンスを作成
az container create \
  --resource-group eclipse-defi-tools \
  --name eclipse-defi-tools \
  --image eclipse-defi-tools:latest \
  --ports 8080 \
  --ip-address public \
  --environment-variables REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
```

## 🔧 本番環境の最適化

### 1. セキュリティ強化

#### HTTPS設定

```bash
# Let's Encryptを使用
sudo certbot --nginx -d yourdomain.com
```

#### セキュリティヘッダー

Nginx設定例：

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:";
```

### 2. パフォーマンス最適化

#### Gzip圧縮

```nginx
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

#### キャッシュ設定

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 監視とログ

#### ヘルスチェック

アプリケーションは `/health` エンドポイントを提供します：

```bash
curl http://localhost:8080/health
# Response: healthy
```

#### ログ設定

Docker環境での構造化ログ：

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Application started",
  "environment": "production"
}
```

## 🔄 継続的デプロイ

### GitHub Actions (推奨)

既に設定済みの`.github/workflows/deploy.yml`を使用：

1. `main`ブランチへのプッシュで自動デプロイ
2. プルリクエストでビルドテスト
3. 環境変数はGitHub Secretsで管理

### GitLab CI/CD

`.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm run typecheck
    - npm run lint
    - npm run test -- --run

build:
  stage: build
  image: node:18-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - scp -r dist/* user@server:/var/www/eclipse-defi-tools/
  only:
    - main
```

## 🚨 トラブルシューティング

### よくある問題

#### ビルドエラー

```bash
# メモリ不足の場合
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 依存関係の問題
rm -rf node_modules package-lock.json
npm install
```

#### 環境変数が反映されない

- Viteでは `REACT_APP_` プレフィックスが必要
- ビルド時に環境変数を設定する必要がある
- クライアントサイドでのみ使用可能

#### CORS エラー

```javascript
// vite.config.ts に追加
server: {
  proxy: {
    '/api': {
      target: 'https://api.example.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

### ログの確認

```bash
# Docker コンテナのログ
docker logs eclipse-defi-tools

# Nginx ログ
tail -f /var/log/nginx/error.log

# アプリケーションログ
journalctl -u eclipse-defi-tools
```

## 📊 モニタリング

### パフォーマンス監視

Google Analytics、Sentry、New Relicなどの設定：

```javascript
// main.tsx
if (import.meta.env.REACT_APP_GA_TRACKING_ID) {
  // Google Analytics設定
}

if (import.meta.env.REACT_APP_SENTRY_DSN) {
  // Sentry設定
}
```

### アップタイム監視

Pingdom、UptimeRobot、Datadog等でヘルスチェック：

```bash
# ヘルスチェックURL
https://yourdomain.com/health
```

## 📋 デプロイチェックリスト

- [ ] 環境変数の設定確認
- [ ] HTTPS設定
- [ ] セキュリティヘッダーの設定
- [ ] Gzip圧縮の有効化
- [ ] キャッシュ設定
- [ ] ヘルスチェックの設定
- [ ] ログ設定
- [ ] 監視設定
- [ ] バックアップ設定
- [ ] CDN設定（必要に応じて）
- [ ] ドメイン設定
- [ ] DNS設定

このガイドに従って、適切な環境でEclipse DeFi Toolsをデプロイできます。