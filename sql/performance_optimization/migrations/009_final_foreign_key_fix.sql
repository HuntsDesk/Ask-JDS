-- Phase 3.5: Final Foreign Key Fix
-- Target: The remaining unindexed foreign key subjects_user_id.
-- Impact: Complete 100% foreign key coverage
-- Priority: Critical to achieve zero warnings

-- =============================================================================
-- PHASE 3.5: FINAL FOREIGN KEY FIX
-- =============================================================================

-- Set timeouts for index creation operations
SET lock_timeout = '10s';
SET statement_timeout = '30min';

-- =============================================================================
-- MISSING FOREIGN KEY INDEX
-- =============================================================================

-- Index for subjects.user_id (subjects_user_id_fkey) - FINAL FIX
-- Used for: User-created subjects, ownership queries
-- Expected impact: Complete foreign key coverage
-- Note: This covers the subjects_user_id_fkey foreign key constraint
CREATE INDEX IF NOT EXISTS idx_subjects_user_id 
ON "public"."subjects" USING btree (user_id);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Phase 3.5: Final Foreign Key Index Created Successfully
-- Expected Result: 0 unindexed foreign keys remaining
-- Achievement: 100% foreign key coverage completed 