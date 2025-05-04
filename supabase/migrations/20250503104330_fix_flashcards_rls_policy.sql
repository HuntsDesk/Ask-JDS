-- Fix the flashcards Update RLS policy
-- The current policy allows any authenticated user to update any flashcard, which is a security issue

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update flashcards" ON "flashcards";

-- Create a new restricted update policy
CREATE POLICY "Users can update their own flashcards" ON "flashcards"
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create admin update policy
CREATE POLICY "Admins can update any flashcard" ON "flashcards"
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Fix SELECT policies
-- Drop potentially ambiguous policies
DROP POLICY IF EXISTS "Users can view other users public flashcards" ON "flashcards";

-- Create a policy for public sample flashcards
DROP POLICY IF EXISTS "Anyone can view public sample flashcards" ON "flashcards";
CREATE POLICY "Anyone can view public sample flashcards" ON "flashcards"
FOR SELECT
TO anon, authenticated
USING (is_official = true AND is_public_sample = true);

-- Ensure the correct policies exist to restrict visibility
-- 1. Users can see their own flashcards
-- 2. Users can see official flashcards 
-- 3. Users can see public sample flashcards
-- 4. Admins can see all flashcards

-- Create a robust policy to prevent unauthorized access
-- Create an index to improve performance of the policy
CREATE INDEX IF NOT EXISTS idx_flashcards_created_by ON flashcards(created_by);
CREATE INDEX IF NOT EXISTS idx_flashcards_is_official ON flashcards(is_official);
CREATE INDEX IF NOT EXISTS idx_flashcards_is_public_sample ON flashcards(is_public_sample);

-- Log the policy changes for audit
SELECT format('Applied flashcards RLS policy fix at %s', now());
