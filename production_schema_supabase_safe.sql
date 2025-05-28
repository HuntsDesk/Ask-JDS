-- SAFE PRODUCTION SCHEMA APPLICATION (SUPABASE COMPATIBLE)
-- This wraps the schema in a transaction that can be rolled back if anything fails

BEGIN;

-- Create a savepoint before starting
SAVEPOINT schema_start;

-- Log the start
DO $$
BEGIN
    RAISE NOTICE 'Starting production schema application at %', now();
END $$; 