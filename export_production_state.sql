-- Export current production database state
-- Run this first to capture what's currently in production

-- Current tables
SELECT 'TABLES' as section, json_agg(
    json_build_object(
        'table_name', tablename,
        'owner', tableowner
    )
) as data
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

-- Current functions  
SELECT 'FUNCTIONS' as section, json_agg(
    json_build_object(
        'function_name', proname,
        'args', pg_get_function_arguments(p.oid),
        'definition', pg_get_functiondef(p.oid)
    )
) as data
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'

UNION ALL

-- Current types
SELECT 'TYPES' as section, json_agg(
    json_build_object(
        'type_name', typname,
        'type_type', typtype
    )
) as data
FROM pg_type 
WHERE typnamespace = 'public'::regnamespace

UNION ALL

-- Current policies
SELECT 'POLICIES' as section, json_agg(
    json_build_object(
        'policy_name', policyname,
        'table_name', tablename,
        'command', cmd,
        'permissive', permissive
    )
) as data
FROM pg_policies
WHERE schemaname = 'public'; 