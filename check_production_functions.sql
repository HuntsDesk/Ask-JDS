-- Check if the is_admin functions exist in production
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'is_admin' 
AND pronamespace = 'public'::regnamespace;

-- Also check all public functions
SELECT 
    'All public functions:' as info,
    count(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'; 