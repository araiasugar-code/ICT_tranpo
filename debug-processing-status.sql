-- 社内処理ステータスのデバッグSQL

-- 1. packagesテーブルとpackage_processingテーブルの関連確認
SELECT 
  p.id as package_id,
  p.tracking_number,
  p.sender_type,
  pp.id as processing_id,
  pp.tracking_number_confirmation,
  pp.reservation_confirmation,
  pp.tracking_scheduled_date,
  pp.reservation_scheduled_date
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 2. package_processingテーブルの全データ確認
SELECT 
  id,
  package_id,
  tracking_number_confirmation,
  reservation_confirmation,
  tracking_scheduled_date,
  reservation_scheduled_date,
  created_at,
  updated_at
FROM package_processing
ORDER BY created_at DESC;

-- 3. packagesテーブルに対してpackage_processingが存在しないレコードを確認
SELECT 
  p.id,
  p.tracking_number,
  'NO PROCESSING RECORD' as status
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
WHERE pp.id IS NULL;

-- 4. 処理レコードが存在するが'not_started'のままのものを確認
SELECT 
  p.tracking_number,
  pp.tracking_number_confirmation,
  pp.reservation_confirmation,
  pp.updated_at
FROM packages p
JOIN package_processing pp ON p.id = pp.package_id
WHERE pp.tracking_number_confirmation = 'not_started' 
   OR pp.reservation_confirmation = 'not_started';

-- 5. Supabase RLSポリシーが社内処理データを適切に返しているか確認
-- （現在のユーザーでアクセス可能なpackage_processingデータ）
SELECT 'Processing data access check' as test_type, count(*) as accessible_records
FROM package_processing;