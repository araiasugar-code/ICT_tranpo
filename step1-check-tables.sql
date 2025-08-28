-- ステップ1: 既存のテーブル構造を確認
-- これを最初に実行してください

-- 既存のテーブルを確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;