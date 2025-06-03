-- Diagnostic Query: Current Flashcards Policies State
-- Check all policies on flashcards table to understand the remaining conflicts

-- Show all flashcards policies with details
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'flashcards'
ORDER BY cmd, policyname;

-- Check for multiple permissive policy conflicts specifically
SELECT 
    'FLASHCARDS CONFLICTS' as status,
    cmd,
    roles,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as conflicting_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'flashcards'
GROUP BY cmd, roles
HAVING COUNT(*) > 1
ORDER BY cmd;

-- Summary of flashcards policy counts by operation
SELECT 
    'FLASHCARDS SUMMARY' as status,
    cmd,
    COUNT(*) as policy_count,
    array_agg(DISTINCT roles::text) as roles_affected
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'flashcards'
GROUP BY cmd
ORDER BY cmd; 