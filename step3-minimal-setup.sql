-- ステップ3: 最小限の安全な設定
-- step2の結果を確認してから実行してください

-- system_settingsテーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY DEFAULT 'default',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLSを有効にする
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- システム設定のデフォルト値を挿入
INSERT INTO system_settings (id, settings) 
VALUES ('default', '{
  "notification_email": true,
  "notification_sms": false,
  "notification_in_app": true,
  "auto_backup": true,
  "backup_frequency": "daily",
  "data_retention_days": 365,
  "default_priority": "medium",
  "require_shipping_date": true,
  "require_expected_arrival": false,
  "allow_file_upload": true,
  "max_file_size_mb": 10
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 成功メッセージ
SELECT 'Step 3 completed: system_settings table created' as result;