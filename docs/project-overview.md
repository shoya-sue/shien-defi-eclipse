# Eclipse DeFi Tools - プロジェクト概要

## プロジェクトの目的

Eclipse チェーンのエコシステムで活動するDeFiユーザーと投資家に向けた包括的なツールセットを提供する。分散型金融（DeFi）プロトコルでの効率的な取引と資産運用をサポートする。

## 主要機能

### 1. スワップ価格比較
- 複数DEXの価格を比較し、最適な取引ルートを提案
- リアルタイム価格更新とスリッページ計算
- アービトラージ機会の検出

### 2. 流動性プール計算機
- APY計算とImpermanent Loss計算
- 価格変動シナリオ分析
- リスク指標の表示

### 3. Yield Farming Tracker
- 複数のファーミングポジションを一元管理
- リアルタイム収益追跡
- 自動複利計算

### 4. PnL計算機
- 包括的な損益計算と税務サポート
- 実現/未実現損益計算
- 税務レポート生成

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS
- Vite (Build tool)
- Recharts (データ可視化)

### Web3 Integration
- @solana/web3.js (Eclipse チェーンとの連携)
- @solana/spl-token
- @project-serum/anchor

### 開発環境
- Node.js 18.0.0+
- npm
- Eclipse RPC エンドポイント

## 開発フェーズ

### Phase 1: 基盤構築
- [x] プロジェクトセットアップ
- [x] 開発環境構築
- [x] 基本的なUI/UXデザインシステム

### Phase 2: コア機能開発
- [ ] スワップ価格比較ツール
- [ ] 流動性プール計算機
- [ ] Yield Farming Tracker
- [ ] PnL計算機

### Phase 3: 高度な機能実装
- [ ] リアルタイムデータ更新
- [ ] 複雑な金融計算
- [ ] データ可視化
- [ ] エクスポート機能

## アーキテクチャ指針

1. **モジュラー設計**: 各機能を独立したモジュールとして実装
2. **型安全性**: TypeScriptによる厳密な型チェック
3. **パフォーマンス**: 効率的なデータフェッチとキャッシング
4. **ユーザビリティ**: 直感的で使いやすいインターフェース
5. **セキュリティ**: Web3接続とトランザクション処理の安全性

## 対象ユーザー

- DeFi初心者から上級者まで
- Eclipse チェーンでの取引を行うユーザー
- 効率的な資産運用を求める投資家
- 税務計算が必要な取引者