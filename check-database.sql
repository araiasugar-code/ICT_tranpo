-- データベースの現状を確認するSQL

-- 1. 全テーブルの一覧を確認
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 2. packagesテーブルの構造
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'packages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. package_processingテーブルの構造
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'package_processing' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. profilesテーブルの構造
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 実際のデータサンプル
SELECT 'packages' as table_name, count(*) as row_count FROM packages
UNION ALL
SELECT 'package_processing', count(*) FROM package_processing
UNION ALL
SELECT 'profiles', count(*) FROM profiles
UNION ALL
SELECT 'documents', count(*) FROM documents;

-- 6. packages と package_processing の関連を確認
SELECT p.id, p.tracking_number, pp.id as processing_id, pp.tracking_number_confirmation, pp.reservation_confirmation
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
LIMIT 5;