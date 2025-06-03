SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'collection_subjects',
    'courses', 
    'flashcard_collections_junction',
    'flashcards',
    'lessons',
    'modules',
    'user_entitlements',
    'user_subscriptions'
  )
ORDER BY tablename, cmd, policyname; 