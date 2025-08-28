-- Supabase Storage設定用SQL
-- このSQLはSupabaseダッシュボードのSQL Editorで実行してください

-- Storage バケット作成（documents）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents', 
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

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

-- RLSを有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;