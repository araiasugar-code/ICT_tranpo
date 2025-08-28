-- ステータス履歴の自動記録トリガーを作成

-- ステータス履歴記録関数を作成
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- ステータスが変更された場合のみ履歴に記録
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO package_status_history (
      package_id,
      status,
      changed_at,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      NOW(),
      NEW.updated_by,
      'ステータスが ' || 
      CASE OLD.status
        WHEN 'shipped' THEN '発送済み'
        WHEN 'in_transit_international' THEN '配送中（国際輸送）'
        WHEN 'customs_processing' THEN '通関手続き中'
        WHEN 'in_transit_domestic' THEN '配送中（国内）'
        WHEN 'arrived' THEN '到着済み'
        WHEN 'received' THEN '受取確認済み'
        ELSE '不明'
      END || ' から ' ||
      CASE NEW.status
        WHEN 'shipped' THEN '発送済み'
        WHEN 'in_transit_international' THEN '配送中（国際輸送）'
        WHEN 'customs_processing' THEN '通関手続き中'
        WHEN 'in_transit_domestic' THEN '配送中（国内）'
        WHEN 'arrived' THEN '到着済み'
        WHEN 'received' THEN '受取確認済み'
        ELSE '不明'
      END || ' に変更されました'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成（既存の場合は削除してから再作成）
DROP TRIGGER IF EXISTS packages_status_change_trigger ON packages;

CREATE TRIGGER packages_status_change_trigger
  AFTER UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION record_status_change();

-- 初期データとして、既存のパッケージに初期ステータス履歴を作成
INSERT INTO package_status_history (package_id, status, changed_at, changed_by, notes)
SELECT 
  id,
  status,
  created_at,
  created_by,
  'パッケージが作成されました'
FROM packages
WHERE id NOT IN (SELECT DISTINCT package_id FROM package_status_history);

SELECT 'ステータス履歴トリガーが正常に作成されました' as result;