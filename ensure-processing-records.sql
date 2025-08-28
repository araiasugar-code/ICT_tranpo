-- 既存のパッケージに対してpackage_processingレコードが存在することを保証するSQL

-- 1. 処理レコードが存在しないパッケージを特定
WITH missing_processing AS (
  SELECT p.id as package_id
  FROM packages p
  LEFT JOIN package_processing pp ON p.id = pp.package_id
  WHERE pp.id IS NULL
)
SELECT 
  count(*) as missing_processing_count,
  'packages without processing records found' as status
FROM missing_processing;

-- 2. 処理レコードが存在しないパッケージに対してデフォルトの処理レコードを作成
INSERT INTO package_processing (
  package_id,
  tracking_number_confirmation,
  reservation_confirmation,
  tracking_scheduled_date,
  reservation_scheduled_date
)
SELECT 
  p.id,
  'not_started',
  'not_started',
  NULL,
  NULL
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
WHERE pp.id IS NULL;

-- 3. 結果確認
SELECT 
  'Processing records created for all packages' as result,
  (SELECT count(*) FROM packages) as total_packages,
  (SELECT count(*) FROM package_processing) as total_processing_records;

-- 4. 各パッケージの処理状況を再確認
SELECT 
  p.tracking_number,
  pp.tracking_number_confirmation,
  pp.reservation_confirmation,
  CASE 
    WHEN pp.id IS NULL THEN 'NO_PROCESSING_RECORD'
    ELSE 'HAS_PROCESSING_RECORD'
  END as processing_status
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
ORDER BY p.created_at DESC
LIMIT 10;