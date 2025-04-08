-- Add admin column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Function to set a user as admin
CREATE OR REPLACE FUNCTION public.set_user_as_admin(user_email TEXT, admin_status BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    success BOOLEAN := FALSE;
BEGIN
    -- Get user ID from auth.users table
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the user's admin status in profiles table
    UPDATE public.profiles
    SET is_admin = admin_status
    WHERE id = target_user_id;
    
    -- Check if update was successful
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_as_admin TO service_role;

-- Create RLS policy for is_admin column
CREATE POLICY "Users can view their own admin status" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Only admins can update admin status" 
ON public.profiles
FOR UPDATE
USING (
    (auth.uid() = id AND is_admin = OLD.is_admin) OR 
    (is_user_admin(auth.uid()) AND is_admin != OLD.is_admin)
);

-- Stats functions for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_total_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RETURN user_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_users_24h()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count 
    FROM auth.users 
    WHERE last_sign_in_at > NOW() - INTERVAL '24 hours';
    
    RETURN active_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_users_24h TO authenticated; 