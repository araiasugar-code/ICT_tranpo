-- ステップ2: 既存のRLSポリシーを確認
-- step1の後に実行してください

-- profilesテーブルのポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- package_processingテーブルのポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'package_processing';