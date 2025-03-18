-- Drop existing foreign key constraints first
ALTER TABLE flashcard_progress
DROP CONSTRAINT IF EXISTS flashcard_progress_flashcard_id_fkey;

ALTER TABLE flashcard_exam_types
DROP CONSTRAINT IF EXISTS flashcard_exam_types_flashcard_id_fkey;

ALTER TABLE flashcard_collections_junction
DROP CONSTRAINT IF EXISTS flashcard_collections_junction_flashcard_id_fkey;

ALTER TABLE flashcard_subjects
DROP CONSTRAINT IF EXISTS flashcard_subjects_flashcard_id_fkey;

-- Recreate constraints with ON DELETE CASCADE
ALTER TABLE flashcard_progress
ADD CONSTRAINT flashcard_progress_flashcard_id_fkey
FOREIGN KEY (flashcard_id)
REFERENCES flashcards(id)
ON DELETE CASCADE;

ALTER TABLE flashcard_exam_types
ADD CONSTRAINT flashcard_exam_types_flashcard_id_fkey
FOREIGN KEY (flashcard_id)
REFERENCES flashcards(id)
ON DELETE CASCADE;

ALTER TABLE flashcard_collections_junction
ADD CONSTRAINT flashcard_collections_junction_flashcard_id_fkey
FOREIGN KEY (flashcard_id)
REFERENCES flashcards(id)
ON DELETE CASCADE;

ALTER TABLE flashcard_subjects
ADD CONSTRAINT flashcard_subjects_flashcard_id_fkey
FOREIGN KEY (flashcard_id)
REFERENCES flashcards(id)
ON DELETE CASCADE;

-- Also ensure there are proper RLS policies for flashcards deletion
-- Users should be able to delete their own non-official flashcards

-- First, check if policy exists and drop it if needed
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;

-- Create the policy for deleting flashcards
CREATE POLICY "Users can delete their own flashcards" 
ON flashcards
FOR DELETE
TO authenticated
USING (
  (auth.uid() = created_by) AND (is_official = false)
);

-- Also create a policy for admins to delete any flashcard
DROP POLICY IF EXISTS "Admins can delete any flashcard" ON flashcards;

CREATE POLICY "Admins can delete any flashcard" 
ON flashcards
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
); 