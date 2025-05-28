-- Fix Remaining Security Issues
-- These are the issues that weren't fully resolved in the first security fix

-- =============================================================================
-- 1. Fix the remaining RLS policy that references user_metadata
-- =============================================================================

-- Fix the "Admin users can delete any flashcard_subjects" policy
DROP POLICY IF EXISTS "Admin users can delete any flashcard_subjects" ON "public"."flashcard_subjects";

CREATE POLICY "Admin users can delete any flashcard_subjects" ON "public"."flashcard_subjects"
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())));

-- =============================================================================
-- 2. Fix the Security Definer View (more thorough approach)
-- =============================================================================

-- First, check what the current view definition is
SELECT pg_get_viewdef('public.schema_overview'::regclass) as current_view_definition;

-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS "public"."schema_overview";

-- Create the view with explicit security invoker
CREATE VIEW "public"."schema_overview" 
WITH (security_invoker = true) AS
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Add comment explaining the security change
COMMENT ON VIEW "public"."schema_overview" IS 'Schema overview view - explicitly uses security invoker to respect RLS policies';

-- =============================================================================
-- 3. Verification
-- =============================================================================

-- Verify no policies reference user_metadata
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE qual LIKE '%user_metadata%' 
   OR with_check LIKE '%user_metadata%'
ORDER BY tablename, policyname;

-- Verify the view is not security definer
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'schema_overview' 
  AND schemaname = 'public';

SELECT 'Remaining security fixes applied successfully!' as status; 