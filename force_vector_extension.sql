-- Force Vector Extension Installation
-- Alternative methods to install vector extension

-- Method 1: Try installing from different schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Method 2: Check if extension exists in extensions schema
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Method 3: Try creating the type manually (if extension is partially installed)
DO $$
BEGIN
    -- Check if vector type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        RAISE NOTICE 'Vector type does not exist. Extension may not be properly installed.';
        RAISE NOTICE 'Please contact Supabase support to enable the vector extension for this project.';
    ELSE
        RAISE NOTICE 'Vector type exists and is available.';
    END IF;
END $$;

-- Test vector functionality
DO $$
BEGIN
    CREATE TEMP TABLE test_vector (
        id serial,
        embedding vector(3)
    );
    
    INSERT INTO test_vector (embedding) VALUES ('[1,2,3]');
    
    RAISE NOTICE 'Vector extension is working correctly!';
    
    DROP TABLE test_vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector extension error: %', SQLERRM;
        RAISE NOTICE 'Recommendation: Use the schema without vector features for now.';
END $$; 