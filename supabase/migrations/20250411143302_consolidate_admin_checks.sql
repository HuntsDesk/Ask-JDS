-- Replace existing definitions safely without DROP (prevents dependency issues)
-- We'll redefine public.is_admin() and ensure auth.is_admin(auth.uid()) forwards to it

-- Consolidated admin check function (public)
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

-- Compatibility function (auth schema)
CREATE OR REPLACE FUNCTION auth.is_admin(user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT public.is_admin(user_id);
$$;

COMMENT ON FUNCTION public.is_admin(user_id uuid) IS 'Consolidated admin check supporting current or explicit user ID';
COMMENT ON FUNCTION auth.is_admin(user_id uuid) IS 'Alias to public.is_admin() for backward compatibility';