-- Define auth.is_admin() function before it's used in later migrations
-- This ensures the function exists when policies try to use it

CREATE OR REPLACE FUNCTION auth.is_admin(user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = COALESCE(user_id, auth.uid())
    AND raw_user_meta_data IS NOT NULL
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  );
$$;

COMMENT ON FUNCTION auth.is_admin(user_id uuid) IS 'Checks if a user has admin privileges';

-- Also define the public.is_admin function as it might be needed
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(user_id, auth.uid());

  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = target_user_id
    AND raw_user_meta_data IS NOT NULL
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin(user_id uuid) IS 'Checks if a user has admin privileges'; 