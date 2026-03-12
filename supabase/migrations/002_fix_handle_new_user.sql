-- Fix: handle_new_user trigger was blocked by profiles_insert RLS policy.
-- In Supabase, postgres role is subject to RLS (SET row_security = on by default).
-- The profiles_insert policy uses WITH CHECK (id = auth.uid()), but during
-- signup auth.uid() is NULL, so the trigger insert was blocked → 500 on signup.
-- Fix: add SET LOCAL row_security = off inside the function body.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL row_security = off;
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
