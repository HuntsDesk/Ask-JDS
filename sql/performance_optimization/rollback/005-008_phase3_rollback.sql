-- Comprehensive Rollback for Phase 3: Index Optimization
-- Removes all foreign key indexes created and restores unused indexes
-- Use this to completely revert Phase 3 changes if needed

BEGIN;

-- =============================================================================
-- ROLLBACK PHASE 3.1: HIGH-IMPACT FOREIGN KEY INDEXES
-- =============================================================================

-- Remove high-impact indexes created in Phase 3.1
DROP INDEX IF EXISTS "public"."idx_messages_thread_id";
DROP INDEX IF EXISTS "public"."idx_messages_user_id";
DROP INDEX IF EXISTS "public"."idx_course_enrollments_course_id";
DROP INDEX IF EXISTS "public"."idx_lessons_module_id";
DROP INDEX IF EXISTS "public"."idx_lesson_progress_lesson_id";
DROP INDEX IF EXISTS "public"."idx_flashcard_progress_flashcard_id";
DROP INDEX IF EXISTS "public"."idx_collections_user_id";

-- =============================================================================
-- ROLLBACK PHASE 3.2: MEDIUM-IMPACT FOREIGN KEY INDEXES
-- =============================================================================

-- Remove medium-impact indexes created in Phase 3.2
DROP INDEX IF EXISTS "public"."idx_flashcard_subjects_subject_id";
DROP INDEX IF EXISTS "public"."idx_flashcard_collections_junction_collection_id";
DROP INDEX IF EXISTS "public"."idx_flashcard_exam_types_exam_type_id";
DROP INDEX IF EXISTS "public"."idx_collection_subjects_subject_id";
DROP INDEX IF EXISTS "public"."idx_course_subjects_subject_id";
DROP INDEX IF EXISTS "public"."idx_modules_course_id";

-- =============================================================================
-- ROLLBACK PHASE 3.3: LOW-IMPACT FOREIGN KEY INDEXES
-- =============================================================================

-- Remove low-impact indexes created in Phase 3.3
DROP INDEX IF EXISTS "public"."idx_courses_created_by";
DROP INDEX IF EXISTS "public"."idx_lessons_created_by";
DROP INDEX IF EXISTS "public"."idx_modules_created_by";
DROP INDEX IF EXISTS "public"."idx_ai_settings_created_by";
DROP INDEX IF EXISTS "public"."idx_system_prompts_created_by";
DROP INDEX IF EXISTS "public"."idx_error_logs_user_id";

-- =============================================================================
-- ROLLBACK PHASE 3.4: RESTORE UNUSED INDEXES
-- =============================================================================

-- Restore document_chunks indexes (if needed for future features)
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_idx" 
ON "public"."document_chunks" USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "idx_document_chunks_heading_path" 
ON "public"."document_chunks" USING btree (heading_path);

CREATE INDEX IF NOT EXISTS "idx_document_chunks_outline_source" 
ON "public"."document_chunks" USING btree (outline_source);

CREATE INDEX IF NOT EXISTS "idx_document_chunks_outline_subject" 
ON "public"."document_chunks" USING btree (outline_subject);

CREATE INDEX IF NOT EXISTS "idx_document_chunks_type_subject" 
ON "public"."document_chunks" USING btree (type, subject);

-- Restore course system indexes
CREATE INDEX IF NOT EXISTS "idx_course_enrollments_enrolled_at" 
ON "public"."course_enrollments" USING btree (enrolled_at);

CREATE INDEX IF NOT EXISTS "idx_course_enrollments_status" 
ON "public"."course_enrollments" USING btree (status);

CREATE INDEX IF NOT EXISTS "idx_courses_featured" 
ON "public"."courses" USING btree (is_featured);

CREATE INDEX IF NOT EXISTS "idx_courses_status" 
ON "public"."courses" USING btree (status);

-- Restore flashcard system indexes
CREATE INDEX IF NOT EXISTS "idx_flashcards_is_common_pitfall" 
ON "public"."flashcards" USING btree (is_common_pitfall);

CREATE INDEX IF NOT EXISTS "idx_flashcards_is_official" 
ON "public"."flashcards" USING btree (is_official);

CREATE INDEX IF NOT EXISTS "idx_flashcards_is_public_sample" 
ON "public"."flashcards" USING btree (is_public_sample);

-- Restore lesson and progress indexes
CREATE INDEX IF NOT EXISTS "idx_lesson_progress_user" 
ON "public"."lesson_progress" USING btree (user_id);

CREATE INDEX IF NOT EXISTS "idx_lessons_position" 
ON "public"."lessons" USING btree (position);

-- Restore miscellaneous indexes
CREATE INDEX IF NOT EXISTS "threads_created_at_idx" 
ON "public"."threads" USING btree (created_at);

CREATE INDEX IF NOT EXISTS "subjects_user_id_idx" 
ON "public"."subjects" USING btree (user_id);

-- =============================================================================
-- ROLLBACK COMPLETION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 3 Index Optimization Rollback Completed';
    RAISE NOTICE 'All foreign key indexes removed';
    RAISE NOTICE 'All unused indexes restored to original state';
    RAISE NOTICE 'Database reverted to pre-Phase 3 configuration';
    RAISE NOTICE 'Performance improvements have been reversed';
END $$;

COMMIT; 