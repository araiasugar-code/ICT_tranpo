# Supabase Storage設定手順

ファイルアップロード機能を有効にするために、Supabase Storageの設定が必要です。

## 🚨 現在の状況

- ファイルアップロード機能は一時的にモック機能で動作中
- Supabase Storageバケットが未設定のため、実際のファイル保存は行われません
- ファイル情報（メタデータ）のみデータベースに保存されます

## 📋 設定手順

### 1. Supabaseダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `kdexhywdbpxwhoawabhx` を選択

### 2. Storageバケットを作成

1. 左サイドバーから **「Storage」** をクリック
2. **「New bucket」** ボタンをクリック
3. 以下の設定で作成：
   - **Name**: `documents`
   - **Public bucket**: ❌ **チェックを外す（プライベート）**
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png` 
     - `image/gif`
     - `image/webp`
     - `application/pdf`
4. **「Save」** をクリック

### 3. RLSポリシーを設定

1. 左サイドバーから **「SQL Editor」** をクリック
2. **「New query」** をクリック
3. 以下のSQLを実行：

```sql
-- Storage バケットのRLSポリシー設定

-- 認証されたユーザーのみアップロード可能
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- 認証されたユーザーのみダウンロード可能  
CREATE POLICY "Authenticated users can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- 自分がアップロードしたファイルのみ削除可能
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. 設定完了後の作業

設定完了後、以下の作業を行ってください：

1. **コードの更新**
   - `src/components/FileUpload.tsx`でモック機能を実際のSupabase Storage機能に戻す
   - モック警告メッセージを削除

2. **アプリケーションの再起動**
   - 開発サーバーを再起動してください

## 🔍 トラブルシューティング

### バケットが作成できない場合

- Supabaseプロジェクトの権限を確認してください
- プロジェクトオーナーまたはAdmin権限が必要です

### RLSポリシーエラーが発生する場合

1. Storage RLSが有効になっているか確認：
```sql
-- RLSを有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

2. バケットの設定を再確認してください

## 📞 サポート

設定でご不明な点がございましたら、Supabaseの公式ドキュメントをご参照ください：
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)