-- リアルタイムで社内処理ステータスの問題をデバッグするSQL

-- 1. 全パッケージと処理ステータスの現状を確認
SELECT 
  p.id,
  p.tracking_number,
  p.created_at as package_created,
  pp.id as processing_id,
  pp.tracking_number_confirmation,
  pp.reservation_confirmation,
  pp.tracking_scheduled_date,
  pp.reservation_scheduled_date,
  pp.created_at as processing_created,
  pp.updated_at as processing_updated,
  CASE 
    WHEN pp.id IS NULL THEN 'NO_PROCESSING_RECORD'
    ELSE 'HAS_PROCESSING_RECORD'
  END as record_status
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
ORDER BY p.created_at DESC;

-- 2. Supabaseのクエリ形式でテスト（一覧ページで使用されているクエリと同じ）
SELECT 
  p.*,
  json_agg(
    json_build_object(
      'tracking_number_confirmation', pp.tracking_number_confirmation,
      'reservation_confirmation', pp.reservation_confirmation,
      'tracking_scheduled_date', pp.tracking_scheduled_date,
      'reservation_scheduled_date', pp.reservation_scheduled_date
    )
  ) FILTER (WHERE pp.id IS NOT NULL) as package_processing
FROM packages p
LEFT JOIN package_processing pp ON p.id = pp.package_id
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. 最新のpackage_processingレコードの状態を確認
SELECT 
  'Latest processing updates' as info,
  id,
  package_id,
  tracking_number_confirmation,
  reservation_confirmation,
  updated_at
FROM package_processing 
ORDER BY updated_at DESC 
LIMIT 10;

-- 4. 特定のパッケージIDの処理状況を確認（実際のIDに置き換えて使用）
-- SELECT * FROM package_processing WHERE package_id = 'YOUR_PACKAGE_ID_HERE';