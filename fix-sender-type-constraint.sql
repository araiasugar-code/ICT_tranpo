-- sender_typeカラムの制約を確認・修正するSQL

-- 1. 現在のsender_typeカラムの制約を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'packages' 
  AND column_name = 'sender_type'
  AND table_schema = 'public';

-- 2. 制約の詳細確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.packages'::regclass
  AND conname LIKE '%sender_type%';

-- 3. sender_typeがENUM型の場合、制約を削除してTEXT型に変更
-- （以下は必要に応じて実行）

-- ENUMの制約がある場合は削除
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_sender_type_check;

-- sender_typeをTEXT型に変更（既存データも保持）
ALTER TABLE packages ALTER COLUMN sender_type TYPE TEXT;

-- 4. 処理予定日カラムも追加（まだ存在しない場合）
ALTER TABLE package_processing 
ADD COLUMN IF NOT EXISTS tracking_scheduled_date DATE;

ALTER TABLE package_processing 
ADD COLUMN IF NOT EXISTS reservation_scheduled_date DATE;

-- 5. 確認
SELECT 'sender_type constraint fixed and processing scheduled dates added' as result;