-- Rollback for URGENT SECURITY FIX: Subjects Table RLS Policies
-- Restores the original broken policies (for rollback purposes only)

BEGIN;

-- =============================================================================
-- RESTORE ORIGINAL BROKEN POLICIES (for rollback)
-- =============================================================================

-- Drop the fixed policies
DROP POLICY IF EXISTS "Users can create their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can delete their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can update their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Anonymous users can view official subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Admins can manage all subjects" ON "public"."subjects";

-- Restore original broken policies (THESE ARE INSECURE!)
CREATE POLICY "Users can create their own subjects" ON "public"."subjects"
FOR INSERT TO authenticated
WITH CHECK (is_official = false);

CREATE POLICY "Users can delete their own non-official subjects" ON "public"."subjects"
FOR DELETE TO authenticated
USING (is_official = false);

CREATE POLICY "Users can update their own non-official subjects" ON "public"."subjects"
FOR UPDATE TO authenticated
USING (is_official = false)
WITH CHECK (is_official = false);

-- Restore original SELECT policies with multiple permissive conflicts
CREATE POLICY "Anyone can read subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO anon
USING (
  (is_official = true) 
  AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))
);

COMMIT; 