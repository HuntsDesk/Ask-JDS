-- Schema comparison query for Supabase databases
-- Run this on both databases and compare the output

-- Tables and their columns
SELECT 
  'TABLE' as object_type,
  schemaname,
  tablename as object_name,
  NULL as column_name,
  NULL as data_type,
  NULL as is_nullable
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

UNION ALL

-- Columns
SELECT 
  'COLUMN' as object_type,
  table_schema as schemaname,
  table_name as object_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

UNION ALL

-- Functions
SELECT 
  'FUNCTION' as object_type,
  n.nspname as schemaname,
  p.proname as object_name,
  NULL as column_name,
  pg_get_function_result(p.oid) as data_type,
  NULL as is_nullable
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

UNION ALL

-- RLS Policies
SELECT 
  'RLS_POLICY' as object_type,
  schemaname,
  tablename as object_name,
  policyname as column_name,
  cmd as data_type,
  permissive::text as is_nullable
FROM pg_policies
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'storage', 'realtime', 'supabase_functions', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault')

ORDER BY object_type, schemaname, object_name, column_name; 