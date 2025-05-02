# Instructions to Apply the Migration

## Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI set up:

```bash
supabase db push
```

## Option 2: Manual SQL Execution

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
-- 2. The collection is an official collection
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

5. Run the query
6. Verify the policy has been updated by checking the policies for the flashcard_collections_junction table 