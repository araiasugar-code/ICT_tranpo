# 荷物ステータス管理システム

中国工場・国内メーカーからの荷物の配送状況と社内データ処理進捗を一元管理するWebアプリケーションです。

## 技術スタック

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time, Storage)
- **UI**: Lucide React Icons
- **Authentication**: Supabase Auth

## 機能概要

### フェーズ1（基本機能）
- ✅ ユーザー認証・権限管理（管理者・編集者・閲覧者）
- ✅ 荷物基本情報管理
- ✅ 配送ステータス管理
- ✅ 社内データ処理ステータス管理

### フェーズ2（予定）
- 書類管理（ファイルアップロード・管理）
- 操作履歴・監査機能

### フェーズ3（予定）
- カスタマイズ機能
- レポート・分析機能

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. プロジェクトのURL と Anon Keyを取得
3. `.env.local` ファイルを更新:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. データベースのセットアップ

Supabaseのダッシュボードで以下のSQLファイルを実行:

1. `database/schema.sql` - テーブルとRLSポリシーの作成
2. `database/seed.sql` - 初期データとトリガーの設定

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## ユーザー権限

### 管理者 (admin)
- 全機能へのアクセス
- ユーザー管理
- システム設定の変更

### 編集者 (editor)
- 荷物情報の編集・ステータス更新
- 書類管理
- データの閲覧

### 閲覧者 (viewer)
- データの閲覧のみ

## データベース構造

### 主要テーブル
- `profiles` - ユーザープロファイル情報
- `packages` - 荷物基本情報
- `package_status_history` - ステータス変更履歴
- `package_processing` - 社内データ処理状況
- `documents` - 書類情報
- `audit_logs` - 操作履歴
- `custom_fields` - カスタムフィールド定義

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm run start

# リンター実行
npm run lint
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # ダッシュボード
│   ├── login/            # ログインページ
│   └── ...               # その他のページ
├── components/           # 再利用可能コンポーネント
├── contexts/            # React Context (認証等)
├── lib/                 # ユーティリティ・設定
└── types/              # TypeScript型定義

database/
├── schema.sql          # データベーススキーマ
└── seed.sql           # 初期データ・関数
```

## セキュリティ

- Supabase Row Level Security (RLS) による データアクセス制御
- 権限ベースの機能制限
- JWT認証によるセッション管理
- HTTPS通信の強制

## サポート

システムに関する問い合わせは、プロジェクト管理者までご連絡ください。
