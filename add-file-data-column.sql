-- documentsテーブルにfile_dataカラムを追加（Base64データ保存用）

-- 1. file_dataカラムを追加（TEXT型でBase64データを保存）
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_data TEXT;

-- 2. インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_documents_file_data_exists 
ON documents (id) WHERE file_data IS NOT NULL;

-- 3. 確認
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name = 'file_data'
  AND table_schema = 'public';

SELECT 'file_data column added to documents table' as result;