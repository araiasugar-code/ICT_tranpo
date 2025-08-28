-- Supabase設定用SQL
-- これらのコマンドをSupabaseの SQL Editor で実行してください

-- 1. profilesテーブルのRLSポリシーを確認・更新
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Public signup creates profile" ON profiles;

-- 管理者がすべてのプロファイルを管理できるポリシー
CREATE POLICY "Admin can manage all profiles" ON profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'admin' AND is_active = true
        )
    );

-- ユーザーが自分のプロファイルを閲覧できるポリシー
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 新規サインアップ時にプロファイルを作成できるポリシー
CREATE POLICY "Public signup creates profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. package_processingテーブルのRLSポリシーを確認・更新
DROP POLICY IF EXISTS "Authenticated users can view processing" ON package_processing;
DROP POLICY IF EXISTS "Editors and admins can manage processing" ON package_processing;

-- 認証ユーザーが処理状況を閲覧できるポリシー
CREATE POLICY "Authenticated users can view processing" ON package_processing
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE is_active = true
        )
    );

-- 編集者と管理者が処理状況を管理できるポリシー
CREATE POLICY "Editors and admins can manage processing" ON package_processing
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'editor') AND is_active = true
        )
    );

-- 3. system_settingsテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS system_settings (
  id text PRIMARY KEY DEFAULT 'default',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- system_settingsのRLS設定
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage system settings" ON system_settings;
CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'admin' AND is_active = true
        )
    );

-- 4. トリガー関数を再作成（プロファイル自動作成用）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'viewer'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. デフォルト管理者ユーザーの権限設定（必要に応じて）
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';

-- 6. システム設定のデフォルト値を挿入
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