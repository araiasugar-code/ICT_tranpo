-- package_processingテーブルに処理予定日カラムを追加

-- 送り状確認の処理予定日
ALTER TABLE package_processing 
ADD COLUMN tracking_scheduled_date DATE;

-- 予約確認の処理予定日  
ALTER TABLE package_processing 
ADD COLUMN reservation_scheduled_date DATE;

-- カラム追加完了メッセージ
SELECT 'Processing scheduled date columns added successfully' as result;