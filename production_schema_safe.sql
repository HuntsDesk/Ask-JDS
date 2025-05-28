-- SAFE PRODUCTION SCHEMA APPLICATION
-- This wraps the schema in a transaction that can be rolled back if anything fails

BEGIN;

-- Set up error handling
\set ON_ERROR_STOP on

-- Create a savepoint before starting
SAVEPOINT schema_start;

-- Log the start
DO $$
BEGIN
    RAISE NOTICE 'Starting production schema application at %', now();
END $$;

-- Include the schema content here (we'll append it)
-- The actual schema content from production_schema_final.sql will go here

-- Verify critical components exist after application
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check tables
    SELECT count(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    RAISE NOTICE 'Tables created: %', table_count;
    
    -- Check functions
    SELECT count(*) INTO function_count 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    RAISE NOTICE 'Functions created: %', function_count;
    
    -- Check policies
    SELECT count(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    RAISE NOTICE 'Policies created: %', policy_count;
    
    -- Verify critical functions exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'Critical function is_admin not found!';
    END IF;
    
    RAISE NOTICE 'Schema validation passed!';
END $$;

-- If we get here, everything worked
RAISE NOTICE 'Production schema application completed successfully at %', now();

-- Uncomment the next line to commit, or leave commented to test first
-- COMMIT; 