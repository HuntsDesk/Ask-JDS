-- Setup Production Database
-- This script prepares the production database with all required extensions and configurations

-- =============================================================================
-- 1. Enable Required Extensions
-- =============================================================================

-- Enable vector extension for embeddings (if using AI features)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable other commonly used extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. Verify Extensions
-- =============================================================================

-- List all enabled extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('vector', 'uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- =============================================================================
-- 3. Set up basic configuration
-- =============================================================================

-- Ensure public schema exists and has proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

SELECT 'Production database setup completed successfully!' as status; 