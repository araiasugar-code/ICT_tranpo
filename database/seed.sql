-- 荷物ステータス管理システム 初期データ

-- 初期プロファイル作成（実際の運用では認証後に作成される）
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
--     ('admin-user-id', 'admin@company.com', '管理者', 'admin'),
--     ('editor-user-id', 'editor@company.com', '編集者', 'editor'),
--     ('viewer-user-id', 'viewer@company.com', '閲覧者', 'viewer');

-- サンプル荷物データ
-- INSERT INTO packages (tracking_number, sender_type, shipping_date, expected_arrival_date, description, priority_level, status, created_by, updated_by) VALUES 
--     ('CN001234567890', 'china_factory', '2024-01-15', '2024-01-25', '電子部品セット A', 'high', 'in_transit_international', 'admin-user-id', 'admin-user-id'),
--     ('JP987654321012', 'domestic_manufacturer', '2024-01-16', '2024-01-18', '包装材料', 'medium', 'arrived', 'editor-user-id', 'editor-user-id'),
--     ('CN567890123456', 'china_factory', '2024-01-17', '2024-01-27', '基板セット B', 'low', 'shipped', 'editor-user-id', 'editor-user-id');

-- デフォルトカスタムフィールド
INSERT INTO custom_fields (field_name, field_type, field_options, is_required, is_active, created_by) VALUES 
    ('商品カテゴリ', 'select', '["電子部品", "機械部品", "包装材", "工具", "その他"]', false, true, null),
    ('総重量(kg)', 'number', null, false, true, null),
    ('特記事項', 'text', null, false, true, null);

-- 関数: 監査ログ記録用トリガー関数
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 監査ログトリガーの設定
CREATE TRIGGER audit_packages_trigger
    AFTER INSERT OR UPDATE OR DELETE ON packages
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_package_processing_trigger
    AFTER INSERT OR UPDATE OR DELETE ON package_processing
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- パッケージ作成時の処理状況レコード自動作成
CREATE OR REPLACE FUNCTION create_package_processing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO package_processing (package_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_package_processing_trigger
    AFTER INSERT ON packages
    FOR EACH ROW EXECUTE FUNCTION create_package_processing();

-- ステータス変更時の履歴記録
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO package_status_history (package_id, status, changed_by, notes)
        VALUES (NEW.id, NEW.status, auth.uid(), 'Status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_change_trigger
    AFTER UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION log_status_change();