-- Cleanup script for production database conflicts
-- Run this BEFORE running production_schema_final.sql

-- Drop existing types that might conflict
DROP TYPE IF EXISTS "public"."lesson_status" CASCADE;

-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS "public"."is_admin"() CASCADE;
DROP FUNCTION IF EXISTS "public"."is_admin"("uuid") CASCADE;

-- Drop any existing tables that might have been partially created
-- (Add more as needed based on errors)

-- Reset search path
SELECT pg_catalog.set_config('search_path', '', false); 