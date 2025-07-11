# Eclipse チェーンテスト準備ガイド

最終更新日: 2024年12月

## 概要

Eclipse DeFi Toolsが実際のEclipseチェーン環境で正常に動作することを確認するための包括的なテストガイドです。

## 1. テスト環境の準備

### 1.1 Eclipse チェーンの設定

#### ネットワーク接続設定
```typescript
// .env.production
REACT_APP_ECLIPSE_RPC_URL=https://mainnetbeta-rpc.eclipse.xyz
REACT_APP_ECLIPSE_WS_URL=wss://mainnetbeta-rpc.eclipse.xyz

// テストネット用（利用可能な場合）
REACT_APP_ECLIPSE_TESTNET_RPC_URL=https://testnet-rpc.eclipse.xyz
REACT_APP_ECLIPSE_TESTNET_WS_URL=wss://testnet-rpc.eclipse.xyz
```

#### ウォレット設定
- **推奨ウォレット**: Phantom、Solflare
- **Eclipse対応**: 最新バージョンの使用を推奨
- **テスト用アカウント**: 専用のテストアカウントを作成

### 1.2 API エンドポイントの確認

#### 現在のステータス（2024年12月時点）
```typescript
// 実際のAPIエンドポイントの可用性確認が必要
const API_STATUS = {
  jupiter: {
    url: 'https://quote-api.eclipse.jup.ag',
    status: 'UNKNOWN', // 確認が必要
    fallback: 'mock-api',
  },
  orca: {
    url: 'https://api.orca.eclipse.so',
    status: 'UNKNOWN', // 確認が必要
    fallback: 'mock-api',
  },
  raydium: {
    url: 'https://api.raydium.eclipse.io',
    status: 'UNKNOWN', // 確認が必要
    fallback: 'mock-api',
  },
};
```

## 2. テスト計画

### 2.1 機能別テストスイート

#### A. ウォレット接続テスト
- [ ] Phantom ウォレット接続
- [ ] Solflare ウォレット接続
- [ ] アカウント切り替え
- [ ] 残高表示の正確性

#### B. 価格データテスト
- [ ] CoinGecko API 接続
- [ ] Eclipse トークン価格取得
- [ ] リアルタイム価格更新
- [ ] 価格履歴データ

#### C. DEX統合テスト
- [ ] Jupiter API 接続（利用可能時）
- [ ] Orca API 接続（利用可能時）
- [ ] Raydium API 接続（利用可能時）
- [ ] スワップ見積もり取得
- [ ] 最適ルート選択

#### D. トランザクションテスト
- [ ] スワップ実行
- [ ] 流動性提供
- [ ] 流動性除去
- [ ] ステーキング操作
- [ ] 報酬請求

#### E. セキュリティテスト
- [ ] CSP設定の動作
- [ ] XSS保護の確認
- [ ] CSRF保護の確認
- [ ] レート制限の動作
- [ ] セキュリティヘッダーの確認

### 2.2 パフォーマンステスト
- [ ] 初期ロード時間
- [ ] データ取得速度
- [ ] UI応答性
- [ ] メモリ使用量
- [ ] ネットワーク使用量

## 3. テストデータとシナリオ

### 3.1 テスト用トークン
```typescript
const TEST_TOKENS = [
  {
    symbol: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    amount: 1.0,
  },
  {
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: 100.0,
  },
  {
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    amount: 100.0,
  },
];
```

### 3.2 テストシナリオ

#### シナリオ1: 基本的なスワップ
1. ウォレット接続
2. SOL → USDC スワップ見積もり取得
3. スリッページ設定（0.5%）
4. スワップ実行
5. 結果の確認

#### シナリオ2: 流動性提供
1. 流動性プール選択（SOL/USDC）
2. 提供額の計算
3. 流動性提供実行
4. LP トークン受け取り確認

#### シナリオ3: PnL計算
1. 過去の取引履歴取得
2. 現在価格データ取得
3. PnL計算実行
4. 結果の正確性確認

## 4. テスト自動化

### 4.1 ユニットテスト
```bash
# テスト実行
npm run test

# カバレッジ確認
npm run test:coverage
```

### 4.2 インテグレーションテスト
```typescript
// 例: APIエンドポイントテスト
describe('Eclipse Chain Integration', () => {
  test('should connect to Eclipse RPC', async () => {
    const connection = new Connection(ECLIPSE_RPC_URL);
    const version = await connection.getVersion();
    expect(version).toBeDefined();
  });

  test('should fetch token prices', async () => {
    const prices = await priceService.getTokenPrice(SOL_TOKEN);
    expect(prices).toBeDefined();
    expect(prices.price).toBeGreaterThan(0);
  });
});
```

### 4.3 E2Eテスト
```typescript
// Playwright使用例
test('full swap flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="phantom-wallet"]');
  // ... スワップフローの確認
});
```

## 5. モニタリングとログ

### 5.1 ログ設定
```typescript
const LOG_CONFIG = {
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  transports: [
    'console',
    'file', // 本番環境のみ
  ],
  filters: {
    sensitive: ['privateKey', 'secretKey', 'apiKey'],
  },
};
```

### 5.2 メトリクス収集
- API応答時間
- トランザクション成功率
- エラー発生率
- ユーザーアクション

### 5.3 アラート設定
- API接続失敗
- 高いエラー率
- パフォーマンス劣化
- セキュリティインシデント

## 6. 本番環境デプロイ前チェックリスト

### 6.1 セキュリティチェック
- [ ] 全てのAPIキーが環境変数で管理されている
- [ ] CSP設定が正しく適用されている
- [ ] HTTPS接続が強制されている
- [ ] セキュリティヘッダーが設定されている
- [ ] 入力値サニタイズが機能している

### 6.2 パフォーマンスチェック
- [ ] バンドルサイズが適切
- [ ] 初期ロード時間が許容範囲内
- [ ] メモリリークがない
- [ ] ネットワーク使用量が最適化されている

### 6.3 機能チェック
- [ ] 全ての主要機能が動作する
- [ ] エラーハンドリングが適切
- [ ] ユーザビリティが良好
- [ ] アクセシビリティが確保されている

## 7. 問題発生時の対応

### 7.1 Eclipse チェーン接続問題
```typescript
// 接続確認とフォールバック
const CONNECTION_CHECK = {
  async verifyConnection() {
    try {
      const connection = new Connection(ECLIPSE_RPC_URL);
      await connection.getEpochInfo();
      return true;
    } catch (error) {
      console.error('Eclipse connection failed:', error);
      return false;
    }
  },
  
  async useBackupEndpoint() {
    // バックアップエンドポイントの使用
  }
};
```

### 7.2 API エンドポイント問題
```typescript
// API状態の確認
const API_HEALTH_CHECK = {
  async checkJupiterAPI() {
    try {
      const response = await fetch('https://quote-api.eclipse.jup.ag/health');
      return response.ok;
    } catch {
      return false;
    }
  },
  
  async enableMockMode() {
    // モックモードの有効化
    console.warn('API接続に失敗しました。モックモードを使用します。');
  }
};
```

### 7.3 ウォレット接続問題
- ウォレット拡張機能の確認
- Eclipse ネットワーク設定の確認
- 権限設定の確認
- 代替ウォレットの提案

## 8. 継続的改善

### 8.1 ユーザーフィードバック収集
- バグレポート機能
- フィードバックフォーム
- 使用統計の分析
- パフォーマンスメトリクス

### 8.2 定期的な更新
- Eclipse チェーンの更新対応
- 新しいAPIエンドポイントの追加
- セキュリティパッチの適用
- 機能改善とバグ修正

## 9. ドキュメント更新

### 9.1 技術仕様書
- API接続仕様
- セキュリティ要件
- パフォーマンス目標
- エラーハンドリング仕様

### 9.2 ユーザーガイド
- 使用方法の説明
- トラブルシューティング
- FAQ
- ベストプラクティス

## 10. 連絡先とサポート

### 10.1 開発チーム
- **技術責任者**: tech@eclipse-defi-tools.com
- **セキュリティ**: security@eclipse-defi-tools.com
- **サポート**: support@eclipse-defi-tools.com

### 10.2 緊急時連絡先
- **緊急対応**: emergency@eclipse-defi-tools.com
- **セキュリティインシデント**: incident@eclipse-defi-tools.com

---

**注意事項**

このガイドは現在の技術的制約と仮定に基づいています。実際のEclipse チェーンの仕様や利用可能なAPIが変更される可能性があるため、定期的な見直しと更新が必要です。

テスト実行前に最新の Eclipse チェーン仕様とAPIドキュメントを確認してください。