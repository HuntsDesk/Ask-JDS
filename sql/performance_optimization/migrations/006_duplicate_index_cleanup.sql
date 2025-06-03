-- Phase 4: Duplicate Index Cleanup
-- Removes duplicate embedding indexes on document_chunks table
-- Fixes duplicate index performance warning

BEGIN;

-- =============================================================================
-- ANALYZE DUPLICATE INDEXES
-- =============================================================================

-- Check current indexes on document_chunks table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'document_chunks' 
  AND schemaname = 'public'
  AND indexname IN ('document_chunks_embedding_idx', 'idx_document_chunks_embedding');

-- =============================================================================
-- REMOVE DUPLICATE INDEX
-- =============================================================================

-- Remove the newer/redundant index, keep the original one
-- Based on naming convention, 'idx_document_chunks_embedding' appears to be the duplicate
DROP INDEX IF EXISTS "public"."idx_document_chunks_embedding";

-- Keep the original index: document_chunks_embedding_idx

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify only one embedding index remains
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'document_chunks' 
  AND schemaname = 'public'
  AND indexname LIKE '%embedding%';

-- Should show only: document_chunks_embedding_idx

-- Verify the remaining index is functional
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM document_chunks 
ORDER BY embedding <-> '[0,0,0]'::vector 
LIMIT 5;

COMMIT; 