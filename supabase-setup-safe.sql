-- Supabase設定用SQL（安全版）
-- 警告を避けるため、段階的に実行してください

-- ステップ1: profilesテーブルのRLSポリシーを更新
CREATE POLICY IF NOT EXISTS "Admin can manage all profiles" ON profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'admin' AND is_active = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Public signup creates profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ステップ2: package_processingテーブルのRLSポリシーを更新
CREATE POLICY IF NOT EXISTS "Authenticated users can view processing" ON package_processing
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_active = true
        )
    );

CREATE POLICY IF NOT EXISTS "Editors and admins can manage processing" ON package_processing
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'editor') AND is_active = true
        )
    );

-- ステップ3: system_settingsテーブルを作成
CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY DEFAULT 'default',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin can manage system settings" ON system_settings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'admin' AND is_active = true
        )
    );

-- ステップ4: システム設定のデフォルト値を挿入
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

-- 完了メッセージ
SELECT 'Supabase setup completed successfully!' as message;