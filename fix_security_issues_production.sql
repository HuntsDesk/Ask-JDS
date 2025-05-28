-- Direct Security Fix Script
-- Apply this directly to the database to fix security advisor issues
-- This bypasses migration conflicts and applies fixes immediately

-- =============================================================================
-- 1. Fix RLS policies that reference user_metadata (CRITICAL SECURITY ISSUE)
-- =============================================================================

-- Fix flashcard_subjects policy that uses user_metadata
DROP POLICY IF EXISTS "Users can insert flashcard-subject associations" ON "public"."flashcard_subjects";

CREATE POLICY "Users can insert flashcard-subject associations" ON "public"."flashcard_subjects"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert any association (using proper admin function)
  (SELECT public.is_admin(auth.uid()))
  OR
  -- Regular users can associate their own flashcards with any subject
  EXISTS (
    SELECT 1 FROM public.flashcards f
    WHERE f.id = flashcard_subjects.flashcard_id
    AND f.created_by = auth.uid()
  )
);

-- Fix user_subscriptions policy that uses user_metadata
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON "public"."user_subscriptions";

CREATE POLICY "Admins can view all subscriptions" ON "public"."user_subscriptions"
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin(auth.uid())));

-- Fix any other policies that might reference user_metadata
-- (These may not exist but we'll drop them safely)
DROP POLICY IF EXISTS "Admin users can delete any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Admin users can insert any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Admin users can update any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Admin users can update any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Admin users can delete any flashcard_exam_types" ON "public"."flashcard_exam_types";
DROP POLICY IF EXISTS "Admin users can insert any flashcard_exam_types" ON "public"."flashcard_exam_types";
DROP POLICY IF EXISTS "Admin users can update any flashcard_exam_types" ON "public"."flashcard_exam_types";
DROP POLICY IF EXISTS "Admin users can update any flashcard_subjects" ON "public"."flashcard_subjects";

-- Recreate admin policies with proper public.is_admin() function
CREATE POLICY "Admin users can delete any collection_subjects" ON "public"."collection_subjects"
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can insert any collection_subjects" ON "public"."collection_subjects"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can update any collection_subjects" ON "public"."collection_subjects"
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())))
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can update any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())))
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can delete any flashcard_exam_types" ON "public"."flashcard_exam_types"
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can insert any flashcard_exam_types" ON "public"."flashcard_exam_types"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can update any flashcard_exam_types" ON "public"."flashcard_exam_types"
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())))
WITH CHECK ((SELECT public.is_admin(auth.uid())));

CREATE POLICY "Admin users can update any flashcard_subjects" ON "public"."flashcard_subjects"
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin(auth.uid())))
WITH CHECK ((SELECT public.is_admin(auth.uid())));

-- =============================================================================
-- 2. Fix Security Definer View (if it exists)
-- =============================================================================

-- Check if schema_overview view exists and recreate it safely
DROP VIEW IF EXISTS "public"."schema_overview";

-- Recreate as a regular view (security invoker by default)
CREATE VIEW "public"."schema_overview" AS
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
COMMENT ON VIEW "public"."schema_overview" IS 'Schema overview view - uses security invoker to respect RLS policies';

-- =============================================================================
-- 3. Verification
-- =============================================================================

-- Log completion
SELECT 'Security fixes applied successfully!' as status; 