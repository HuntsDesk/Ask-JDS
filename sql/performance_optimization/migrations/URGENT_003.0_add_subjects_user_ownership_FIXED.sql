-- URGENT: Add User Ownership to Subjects Table (FIXED)
-- ISSUE: subjects table lacks user_id column for ownership
-- FIX: Add user_id column + proper RLS policies
-- FIXED: Removed invalid "FOR ALL" syntax

BEGIN;

-- =============================================================================
-- STEP 1: ADD USER_ID COLUMN TO SUBJECTS TABLE
-- =============================================================================

-- Add user_id column (nullable initially to handle existing data)
ALTER TABLE "public"."subjects" 
ADD COLUMN "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance (RLS policies will filter by this)
CREATE INDEX IF NOT EXISTS "subjects_user_id_idx" ON "public"."subjects" ("user_id");

-- =============================================================================
-- STEP 2: HANDLE EXISTING DATA
-- =============================================================================

-- Set existing official subjects to NULL user_id (admin-managed)
UPDATE "public"."subjects" 
SET "user_id" = NULL 
WHERE "is_official" = true;

-- For existing non-official subjects, set to NULL (admin will reassign if needed)
UPDATE "public"."subjects" 
SET "user_id" = NULL 
WHERE "is_official" = false OR "is_official" IS NULL;

-- =============================================================================
-- STEP 3: FIX RLS POLICIES WITH PROPER OWNERSHIP
-- =============================================================================

-- DROP EXISTING BROKEN POLICIES
DROP POLICY IF EXISTS "Users can create their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can delete their own non-official subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can update their own non-official subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Anyone can read subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";

-- CREATE PROPER OWNERSHIP-BASED POLICIES

-- INSERT: Users can create their own non-official subjects
CREATE POLICY "Users can create their own subjects" ON "public"."subjects"
FOR INSERT TO authenticated
WITH CHECK (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- DELETE: Users can only delete their own non-official subjects
CREATE POLICY "Users can delete their own subjects" ON "public"."subjects"
FOR DELETE TO authenticated
USING (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- UPDATE: Users can only update their own non-official subjects
CREATE POLICY "Users can update their own subjects" ON "public"."subjects"
FOR UPDATE TO authenticated
USING (
  is_official = false 
  AND (select auth.uid()) = user_id
)
WITH CHECK (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- SELECT: Anonymous users can view official subjects
CREATE POLICY "Anonymous users can view official subjects" ON "public"."subjects"
FOR SELECT TO anon
USING (
  is_official = true 
  AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))
);

-- SELECT: Authenticated users can view their own subjects OR official subjects
CREATE POLICY "Authenticated users can view subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING (
  -- Users can view their own subjects
  ((select auth.uid()) = user_id)
  OR
  -- All authenticated users can view official subjects
  (is_official = true)
  OR
  -- Handle legacy subjects with NULL user_id (treat as public until reassigned)
  (user_id IS NULL AND is_official = false)
);

-- ADMIN POLICIES: Separate policies for each operation
CREATE POLICY "Admins can insert any subjects" ON "public"."subjects"
FOR INSERT TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can update any subjects" ON "public"."subjects"
FOR UPDATE TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can delete any subjects" ON "public"."subjects"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Admins can view all subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

-- =============================================================================
-- STEP 4: VALIDATION
-- =============================================================================

-- Check final schema
DO $$
DECLARE
    has_user_id boolean;
    policy_count integer;
BEGIN
    -- Verify user_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subjects' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    RAISE NOTICE 'SUBJECTS MIGRATION: user_id column exists: %', has_user_id;
    
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subjects';
    
    RAISE NOTICE 'SUBJECTS MIGRATION: % total policies after migration', policy_count;
    
    -- Check for multiple permissive policy conflicts
    SELECT COUNT(*) INTO policy_count
    FROM (
        SELECT cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'subjects'
        GROUP BY cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    RAISE NOTICE 'SUBJECTS MIGRATION: % remaining policy conflicts', policy_count;
END $$;

COMMIT; 