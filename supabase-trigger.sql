-- プロファイル自動作成トリガーの設定
-- これを別途実行してください

-- トリガー関数を作成/更新
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
EXCEPTION
  WHEN unique_violation THEN
    -- プロファイルが既に存在する場合は更新
    UPDATE public.profiles 
    SET 
      email = new.email,
      full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
      role = COALESCE(new.raw_user_meta_data->>'role', role),
      updated_at = now()
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- トリガーを作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

SELECT 'Trigger setup completed!' as message;