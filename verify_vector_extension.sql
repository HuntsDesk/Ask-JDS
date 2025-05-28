-- Verify Vector Extension Installation
-- Run this to check if the vector extension is properly installed

-- Check if vector extension is installed
SELECT 
    extname as extension_name,
    extversion as version,
    nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'vector';

-- Check if vector type is available
SELECT typname, typnamespace::regnamespace as schema
FROM pg_type 
WHERE typname = 'vector';

-- Test creating a simple vector column (this should work if extension is properly installed)
DO $$
BEGIN
    -- Try to create a test table with vector column
    CREATE TEMP TABLE test_vector_table (
        id serial PRIMARY KEY,
        test_embedding vector(3)
    );
    
    -- If we get here, vector extension is working
    RAISE NOTICE 'Vector extension is working correctly!';
    
    -- Clean up
    DROP TABLE test_vector_table;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector extension issue: %', SQLERRM;
END $$;

SELECT 'Vector extension verification completed' as status; 