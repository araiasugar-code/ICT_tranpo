-- Supabase Storageの設定SQL

-- 1. ストレージバケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

-- 2. RLSポリシーをストレージに適用
CREATE POLICY "ユーザーは自分がアップロードした書類を見ることができる" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "認証ユーザーは書類をアップロードできる" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ユーザーは自分がアップロードした書類を更新できる" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ユーザーは自分がアップロードした書類を削除できる" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- 確認
SELECT 'Storage bucket and policies created successfully' as result;