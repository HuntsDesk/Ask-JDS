# Instructions to Apply the Migration

## Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI set up:

```bash
supabase db push
```

## Option 2: Manual SQL Execution

### First Migration: Allow users to associate flashcards with official collections

1. Log into the Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of the migration file:

```sql
-- Modify RLS policy for flashcard_collections_junction
-- This migration allows users to associate their flashcards with official collections
-- while maintaining security (they can't associate with other users' collections)

-- Drop the current policy for inserting flashcard-collection associations
DROP POLICY IF EXISTS "Users can insert their own flashcard_collections_junction" ON "public"."flashcard_collections_junction";

-- Create new policy that allows inserting when:
-- 1. The user owns the collection OR
-- 2. The collection is official
CREATE POLICY "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.id = flashcard_collections_junction.collection_id
    AND (
      -- User owns the collection
      c.user_id = auth.uid()
      OR 
      -- Collection is official
      c.is_official = true
    )
  )
);
```

### Second Migration: Allow users to associate their flashcards with subjects

Run this query after the first one:

```sql
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
```

5. Run each query separately
6. Verify the policies have been updated by checking the RLS policies for both tables 