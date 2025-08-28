# ローカル完全動作セットアップ手順

## 無料のSupabaseプロジェクトで完全動作させる方法

### ステップ1: Supabaseアカウント作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（無料）

### ステップ2: 新規プロジェクト作成
1. 「New Project」をクリック
2. プロジェクト名: `package-status-management`
3. データベースパスワードを設定（覚えておく）
4. リージョン: 「Northeast Asia (Tokyo)」を選択
5. 「Create new project」をクリック（2-3分待機）

### ステップ3: API設定取得
1. プロジェクトダッシュボード > Settings > API
2. 以下の値をコピー：
   - Project URL
   - Project API keys > anon public

### ステップ4: 環境変数更新
`.env.local`ファイルを以下に変更：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### ステップ5: データベース初期化
1. Supabaseダッシュボード > SQL Editor
2. `database/schema.sql` の内容をコピー&ペーストして実行
3. `database/seed.sql` の内容をコピー&ペーストして実行

### ステップ6: 初期ユーザー作成
1. Supabaseダッシュボード > Authentication > Users
2. 「Add user」をクリック
3. メールアドレスとパスワードを入力して作成
4. ユーザーIDをコピー

### ステップ7: 管理者権限付与
SQL Editorで以下を実行（user_idを実際のものに変更）：
```sql
INSERT INTO profiles (id, email, full_name, role, is_active) 
VALUES (
  'user-uuid-here',  -- ステップ6でコピーしたID
  'your-email@example.com', 
  '管理者', 
  'admin', 
  true
);
```

### ステップ8: アプリケーション再起動
```bash
# 開発サーバーを再起動
npm run dev
```

これで完全に動作するシステムになります！

### 完了後に使える機能
✅ 実際の荷物登録・編集・削除
✅ ステータス更新と履歴記録
✅ 処理状況管理
✅ ユーザー認証・権限管理
✅ リアルタイム更新
✅ 操作履歴自動記録