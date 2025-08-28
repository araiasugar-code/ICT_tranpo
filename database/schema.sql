-- 荷物ステータス管理システム データベーススキーマ

-- ユーザー情報テーブル (Supabase Authを拡張)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- 荷物基本情報テーブル
CREATE TABLE packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_number TEXT NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('china_factory', 'domestic_manufacturer')) NOT NULL,
    shipping_date DATE NOT NULL,
    expected_arrival_date DATE,
    description TEXT,
    notes TEXT,
    priority_level TEXT CHECK (priority_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('shipped', 'in_transit_international', 'customs_processing', 'in_transit_domestic', 'arrived', 'received')) DEFAULT 'shipped',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- 荷物ステータス履歴テーブル
CREATE TABLE package_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    changed_by UUID REFERENCES profiles(id),
    notes TEXT
);

-- 社内データ処理状況テーブル
CREATE TABLE package_processing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE UNIQUE,
    tracking_number_confirmation TEXT CHECK (tracking_number_confirmation IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    reservation_confirmation TEXT CHECK (reservation_confirmation IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    assigned_to UUID REFERENCES profiles(id),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 書類管理テーブル
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    document_type TEXT CHECK (document_type IN ('invoice', 'delivery_note', 'shipping_label', 'other')) DEFAULT 'other',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    uploaded_by UUID REFERENCES profiles(id)
);

-- 操作履歴テーブル
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- カスタムフィールド定義テーブル
CREATE TABLE custom_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    field_type TEXT CHECK (field_type IN ('text', 'number', 'select', 'date')) NOT NULL,
    field_options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES profiles(id)
);

-- カスタムフィールド値テーブル
CREATE TABLE custom_field_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    custom_field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(package_id, custom_field_id)
);

-- インデックス作成
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_sender_type ON packages(sender_type);
CREATE INDEX idx_packages_priority_level ON packages(priority_level);
CREATE INDEX idx_packages_shipping_date ON packages(shipping_date);
CREATE INDEX idx_packages_expected_arrival_date ON packages(expected_arrival_date);
CREATE INDEX idx_package_status_history_package_id ON package_status_history(package_id);
CREATE INDEX idx_package_processing_package_id ON package_processing(package_id);
CREATE INDEX idx_documents_package_id ON documents(package_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_processing_updated_at BEFORE UPDATE ON package_processing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定

-- プロファイル：ユーザーは自分のプロファイルのみ編集可能、他は閲覧のみ
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 荷物情報：全ユーザー閲覧可能、編集者以上は編集可能
CREATE POLICY "All users can view packages" ON packages
    FOR SELECT USING (true);

CREATE POLICY "Editors can insert packages" ON packages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "Editors can update packages" ON packages
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "Admins can delete packages" ON packages
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- その他のテーブルも同様のポリシーを適用
CREATE POLICY "All users can view package status history" ON package_status_history
    FOR SELECT USING (true);

CREATE POLICY "Editors can insert package status history" ON package_status_history
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "All users can view package processing" ON package_processing
    FOR SELECT USING (true);

CREATE POLICY "Editors can manage package processing" ON package_processing
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "All users can view documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Editors can manage documents" ON documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage custom fields" ON custom_fields
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "All users can view custom fields" ON custom_fields
    FOR SELECT USING (true);

CREATE POLICY "All users can view custom field values" ON custom_field_values
    FOR SELECT USING (true);

CREATE POLICY "Editors can manage custom field values" ON custom_field_values
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );