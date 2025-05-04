-- Modify RLS policy for flashcard_subjects
-- This migration allows users to associate their flashcards with subjects
-- (including official subjects)

-- Drop the current policy for inserting flashcard-subject associations
DROP POLICY IF EXISTS "Admin users can insert any flashcard_subjects" ON "public"."flashcard_subjects";

-- Create new policy that allows:
-- 1. Admin users to insert any flashcard-subject association
-- 2. Regular users to associate their own flashcards with any subject
CREATE POLICY "Users can insert flashcard-subject associations" ON "public"."flashcard_subjects"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert any association
  ((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text
  OR
  -- Regular users can associate their own flashcards with any subject
  EXISTS (
    SELECT 1 FROM flashcards f
    WHERE f.id = flashcard_subjects.flashcard_id
    AND f.created_by = auth.uid()
  )
);

-- Note: The existing admin policies for update/delete remain in place 