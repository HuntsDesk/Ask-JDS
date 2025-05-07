# Supabase

[
  {
    "json_agg": [
      {
        "type": "tables",
        "data": [
          {
            "table_name": "courses",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "system_prompts",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "system_prompts",
            "column_name": "is_active",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "system_prompts",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "system_prompts",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "query_logs",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "query_logs",
            "column_name": "duration",
            "data_type": "numeric",
            "is_nullable": "YES"
          },
          {
            "table_name": "query_logs",
            "column_name": "executed_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "models",
            "column_name": "is_active",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "api_key_required",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "max_tokens",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "is_public",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "collection_subjects",
            "column_name": "collection_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "collection_subjects",
            "column_name": "subject_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "collection_subjects",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "start_time",
            "data_type": "double precision",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "end_time",
            "data_type": "double precision",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "embedding",
            "data_type": "USER-DEFINED",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "clip",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "heading_level",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "messages",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "messages",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "messages",
            "column_name": "thread_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "messages",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_subjects",
            "column_name": "flashcard_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_subjects",
            "column_name": "subject_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_subjects",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "message_counts",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "count",
            "data_type": "integer",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "period_start",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "period_end",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "message_counts",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "schema_overview",
            "column_name": "columns",
            "data_type": "jsonb",
            "is_nullable": "YES"
          },
          {
            "table_name": "schema_overview",
            "column_name": "policies",
            "data_type": "jsonb",
            "is_nullable": "YES"
          },
          {
            "table_name": "schema_overview",
            "column_name": "constraints",
            "data_type": "jsonb",
            "is_nullable": "YES"
          },
          {
            "table_name": "threads",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "threads",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "threads",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "course_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "enrolled_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "expires_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "renewal_count",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "notification_7day_sent",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "notification_1day_sent",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "last_accessed",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "days_of_access",
            "data_type": "integer",
            "is_nullable": "NO"
          },
          {
            "table_name": "courses",
            "column_name": "is_featured",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "what_youll_learn",
            "data_type": "jsonb",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "status",
            "data_type": "USER-DEFINED",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "price",
            "data_type": "numeric",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "original_price",
            "data_type": "numeric",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "flashcard_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "is_mastered",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "last_reviewed",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_progress",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "collections",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "collections",
            "column_name": "is_official",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "collections",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "collections",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_collections_junction",
            "column_name": "flashcard_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_collections_junction",
            "column_name": "collection_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_collections_junction",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "exam_types",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "exam_types",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "exam_types",
            "column_name": "is_official",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "error_logs",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "error_logs",
            "column_name": "investigated",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "error_logs",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "error_logs",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcard_exam_types",
            "column_name": "flashcard_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_exam_types",
            "column_name": "exam_type_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcard_exam_types",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcards",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "last_reviewed",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "is_mastered",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "position",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "is_official",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "highly_tested",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "is_public_sample",
            "data_type": "boolean",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcards",
            "column_name": "is_common_pitfall",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "lesson_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "completed_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "lesson_progress",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "ai_settings",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "ai_settings",
            "column_name": "is_active",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "ai_settings",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "ai_settings",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_subjects",
            "column_name": "course_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "course_subjects",
            "column_name": "subject_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "course_subjects",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "lessons",
            "column_name": "module_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "lessons",
            "column_name": "position",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "status",
            "data_type": "USER-DEFINED",
            "is_nullable": "YES"
          },
          {
            "table_name": "modules",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "modules",
            "column_name": "course_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "modules",
            "column_name": "position",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "modules",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "modules",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "modules",
            "column_name": "created_by",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "subjects",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "subjects",
            "column_name": "is_official",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "subjects",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "profiles",
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "is_admin",
            "data_type": "boolean",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "lifetime_message_count",
            "data_type": "integer",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "current_period_end",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "cancel_at_period_end",
            "data_type": "boolean",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO"
          },
          {
            "table_name": "courses",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "courses",
            "column_name": "tile_description",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "overview",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "source",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "type",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "query_logs",
            "column_name": "query",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "subjects",
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "subjects",
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "speaker",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "threads",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "messages",
            "column_name": "content",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "profiles",
            "column_name": "full_name",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "stripe_price_id",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "courses",
            "column_name": "stripe_price_id_dev",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "avatar_url",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "ai_settings",
            "column_name": "provider",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "ai_settings",
            "column_name": "model",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "profiles",
            "column_name": "stripe_customer_id",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "text",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "messages",
            "column_name": "role",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "profiles",
            "column_name": "first_name",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "collections",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "collections",
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "last_name",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "course_enrollments",
            "column_name": "status",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "profiles",
            "column_name": "email",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "lessons",
            "column_name": "content",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "lessons",
            "column_name": "video_id",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "heading",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "exam_types",
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "exam_types",
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "outline_subject",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "status",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "models",
            "column_name": "model_version",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "error_logs",
            "column_name": "message",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "error_logs",
            "column_name": "stack_trace",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "models",
            "column_name": "provider",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "stripe_customer_id",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_subscriptions",
            "column_name": "stripe_subscription_id",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "modules",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "modules",
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "outline_source",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "schema_overview",
            "column_name": "table_name",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "question",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "flashcards",
            "column_name": "answer",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "heading_number",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "system_prompts",
            "column_name": "content",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "document_chunks",
            "column_name": "heading_text",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "document_chunks",
            "column_name": "heading_path",
            "data_type": "ARRAY",
            "is_nullable": "YES"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "feature",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "user_entitlements",
            "column_name": "status",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "difficulty_level",
            "data_type": "text",
            "is_nullable": "YES"
          }
        ]
      },
      {
        "type": "indexes",
        "data": [
          {
            "tablename": "courses",
            "indexname": "courses_pkey",
            "indexdef": "CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id)"
          },
          {
            "tablename": "courses",
            "indexname": "idx_courses_featured",
            "indexdef": "CREATE INDEX idx_courses_featured ON public.courses USING btree (is_featured) WHERE (is_featured = true)"
          },
          {
            "tablename": "courses",
            "indexname": "idx_courses_status",
            "indexdef": "CREATE INDEX idx_courses_status ON public.courses USING btree (status)"
          },
          {
            "tablename": "flashcard_progress",
            "indexname": "flashcard_progress_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_progress_pkey ON public.flashcard_progress USING btree (id)"
          },
          {
            "tablename": "flashcard_progress",
            "indexname": "flashcard_progress_user_id_flashcard_id_key",
            "indexdef": "CREATE UNIQUE INDEX flashcard_progress_user_id_flashcard_id_key ON public.flashcard_progress USING btree (user_id, flashcard_id)"
          },
          {
            "tablename": "collections",
            "indexname": "flashcard_collections_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_collections_pkey ON public.collections USING btree (id)"
          },
          {
            "tablename": "collections",
            "indexname": "idx_collections_created_at",
            "indexdef": "CREATE INDEX idx_collections_created_at ON public.collections USING btree (created_at DESC)"
          },
          {
            "tablename": "flashcard_collections_junction",
            "indexname": "flashcard_collections_junction_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_collections_junction_pkey ON public.flashcard_collections_junction USING btree (flashcard_id, collection_id)"
          },
          {
            "tablename": "exam_types",
            "indexname": "exam_types_name_key",
            "indexdef": "CREATE UNIQUE INDEX exam_types_name_key ON public.exam_types USING btree (name)"
          },
          {
            "tablename": "exam_types",
            "indexname": "exam_types_pkey",
            "indexdef": "CREATE UNIQUE INDEX exam_types_pkey ON public.exam_types USING btree (id)"
          },
          {
            "tablename": "error_logs",
            "indexname": "error_logs_pkey",
            "indexdef": "CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id)"
          },
          {
            "tablename": "flashcard_exam_types",
            "indexname": "flashcard_exam_types_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_exam_types_pkey ON public.flashcard_exam_types USING btree (flashcard_id, exam_type_id)"
          },
          {
            "tablename": "flashcards",
            "indexname": "flashcards_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcards_pkey ON public.flashcards USING btree (id)"
          },
          {
            "tablename": "flashcards",
            "indexname": "idx_flashcards_is_common_pitfall",
            "indexdef": "CREATE INDEX idx_flashcards_is_common_pitfall ON public.flashcards USING btree (is_common_pitfall)"
          },
          {
            "tablename": "flashcards",
            "indexname": "idx_flashcards_public_sample",
            "indexdef": "CREATE INDEX idx_flashcards_public_sample ON public.flashcards USING btree (is_public_sample) WHERE (is_public_sample = true)"
          },
          {
            "tablename": "flashcards",
            "indexname": "idx_flashcards_created_by",
            "indexdef": "CREATE INDEX idx_flashcards_created_by ON public.flashcards USING btree (created_by)"
          },
          {
            "tablename": "flashcards",
            "indexname": "idx_flashcards_is_official",
            "indexdef": "CREATE INDEX idx_flashcards_is_official ON public.flashcards USING btree (is_official)"
          },
          {
            "tablename": "flashcards",
            "indexname": "idx_flashcards_is_public_sample",
            "indexdef": "CREATE INDEX idx_flashcards_is_public_sample ON public.flashcards USING btree (is_public_sample)"
          },
          {
            "tablename": "lesson_progress",
            "indexname": "lesson_progress_pkey",
            "indexdef": "CREATE UNIQUE INDEX lesson_progress_pkey ON public.lesson_progress USING btree (id)"
          },
          {
            "tablename": "lesson_progress",
            "indexname": "lesson_progress_user_id_lesson_id_key",
            "indexdef": "CREATE UNIQUE INDEX lesson_progress_user_id_lesson_id_key ON public.lesson_progress USING btree (user_id, lesson_id)"
          },
          {
            "tablename": "lesson_progress",
            "indexname": "idx_lesson_progress_user",
            "indexdef": "CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id)"
          },
          {
            "tablename": "ai_settings",
            "indexname": "ai_settings_pkey",
            "indexdef": "CREATE UNIQUE INDEX ai_settings_pkey ON public.ai_settings USING btree (id)"
          },
          {
            "tablename": "course_subjects",
            "indexname": "course_subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX course_subjects_pkey ON public.course_subjects USING btree (course_id, subject_id)"
          },
          {
            "tablename": "lessons",
            "indexname": "lessons_pkey",
            "indexdef": "CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id)"
          },
          {
            "tablename": "lessons",
            "indexname": "idx_lessons_position",
            "indexdef": "CREATE INDEX idx_lessons_position ON public.lessons USING btree (\"position\")"
          },
          {
            "tablename": "modules",
            "indexname": "modules_pkey",
            "indexdef": "CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id)"
          },
          {
            "tablename": "modules",
            "indexname": "idx_modules_position",
            "indexdef": "CREATE INDEX idx_modules_position ON public.modules USING btree (\"position\")"
          },
          {
            "tablename": "user_entitlements",
            "indexname": "user_entitlements_pkey",
            "indexdef": "CREATE UNIQUE INDEX user_entitlements_pkey ON public.user_entitlements USING btree (id)"
          },
          {
            "tablename": "user_entitlements",
            "indexname": "user_entitlements_user_id_feature_key",
            "indexdef": "CREATE UNIQUE INDEX user_entitlements_user_id_feature_key ON public.user_entitlements USING btree (user_id, feature)"
          },
          {
            "tablename": "subjects",
            "indexname": "subjects_name_key",
            "indexdef": "CREATE UNIQUE INDEX subjects_name_key ON public.subjects USING btree (name)"
          },
          {
            "tablename": "subjects",
            "indexname": "subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id)"
          },
          {
            "tablename": "profiles",
            "indexname": "profiles_pkey",
            "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
          },
          {
            "tablename": "profiles",
            "indexname": "profiles_stripe_customer_id_key",
            "indexdef": "CREATE UNIQUE INDEX profiles_stripe_customer_id_key ON public.profiles USING btree (stripe_customer_id)"
          },
          {
            "tablename": "user_subscriptions",
            "indexname": "user_subscriptions_pkey",
            "indexdef": "CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id)"
          },
          {
            "tablename": "user_subscriptions",
            "indexname": "user_subscriptions_user_id_idx",
            "indexdef": "CREATE INDEX user_subscriptions_user_id_idx ON public.user_subscriptions USING btree (user_id)"
          },
          {
            "tablename": "system_prompts",
            "indexname": "system_prompts_pkey",
            "indexdef": "CREATE UNIQUE INDEX system_prompts_pkey ON public.system_prompts USING btree (id)"
          },
          {
            "tablename": "query_logs",
            "indexname": "query_logs_pkey",
            "indexdef": "CREATE UNIQUE INDEX query_logs_pkey ON public.query_logs USING btree (id)"
          },
          {
            "tablename": "models",
            "indexname": "models_pkey",
            "indexdef": "CREATE UNIQUE INDEX models_pkey ON public.models USING btree (id)"
          },
          {
            "tablename": "collection_subjects",
            "indexname": "collection_subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX collection_subjects_pkey ON public.collection_subjects USING btree (collection_id, subject_id)"
          },
          {
            "tablename": "document_chunks",
            "indexname": "document_chunks_pkey",
            "indexdef": "CREATE UNIQUE INDEX document_chunks_pkey ON public.document_chunks USING btree (id)"
          },
          {
            "tablename": "document_chunks",
            "indexname": "document_chunks_embedding_idx",
            "indexdef": "CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')"
          },
          {
            "tablename": "document_chunks",
            "indexname": "idx_document_chunks_embedding",
            "indexdef": "CREATE INDEX idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')"
          },
          {
            "tablename": "document_chunks",
            "indexname": "idx_document_chunks_heading_path",
            "indexdef": "CREATE INDEX idx_document_chunks_heading_path ON public.document_chunks USING gin (heading_path) WHERE (heading_path IS NOT NULL)"
          },
          {
            "tablename": "document_chunks",
            "indexname": "idx_document_chunks_outline_source",
            "indexdef": "CREATE INDEX idx_document_chunks_outline_source ON public.document_chunks USING btree (outline_source) WHERE (outline_source IS NOT NULL)"
          },
          {
            "tablename": "document_chunks",
            "indexname": "idx_document_chunks_outline_subject",
            "indexdef": "CREATE INDEX idx_document_chunks_outline_subject ON public.document_chunks USING btree (outline_subject) WHERE (outline_subject IS NOT NULL)"
          },
          {
            "tablename": "document_chunks",
            "indexname": "idx_document_chunks_type_subject",
            "indexdef": "CREATE INDEX idx_document_chunks_type_subject ON public.document_chunks USING btree (type, outline_subject) WHERE ((type IS NOT NULL) AND (outline_subject IS NOT NULL))"
          },
          {
            "tablename": "messages",
            "indexname": "messages_pkey",
            "indexdef": "CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)"
          },
          {
            "tablename": "flashcard_subjects",
            "indexname": "flashcard_subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_subjects_pkey ON public.flashcard_subjects USING btree (flashcard_id, subject_id)"
          },
          {
            "tablename": "message_counts",
            "indexname": "message_counts_pkey",
            "indexdef": "CREATE UNIQUE INDEX message_counts_pkey ON public.message_counts USING btree (id)"
          },
          {
            "tablename": "message_counts",
            "indexname": "message_counts_user_month",
            "indexdef": "CREATE UNIQUE INDEX message_counts_user_month ON public.message_counts USING btree (user_id, extract_year_month(period_start))"
          },
          {
            "tablename": "threads",
            "indexname": "threads_pkey",
            "indexdef": "CREATE UNIQUE INDEX threads_pkey ON public.threads USING btree (id)"
          },
          {
            "tablename": "threads",
            "indexname": "threads_created_at_idx",
            "indexdef": "CREATE INDEX threads_created_at_idx ON public.threads USING btree (created_at)"
          },
          {
            "tablename": "threads",
            "indexname": "threads_user_id_idx",
            "indexdef": "CREATE INDEX threads_user_id_idx ON public.threads USING btree (user_id)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "course_enrollments_pkey",
            "indexdef": "CREATE UNIQUE INDEX course_enrollments_pkey ON public.course_enrollments USING btree (id)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "course_enrollments_user_id_course_id_key",
            "indexdef": "CREATE UNIQUE INDEX course_enrollments_user_id_course_id_key ON public.course_enrollments USING btree (user_id, course_id)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "idx_course_enrollments_user",
            "indexdef": "CREATE INDEX idx_course_enrollments_user ON public.course_enrollments USING btree (user_id)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "idx_course_enrollments_expires_at",
            "indexdef": "CREATE INDEX idx_course_enrollments_expires_at ON public.course_enrollments USING btree (expires_at)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "idx_course_enrollments_enrolled_at",
            "indexdef": "CREATE INDEX idx_course_enrollments_enrolled_at ON public.course_enrollments USING btree (enrolled_at)"
          },
          {
            "tablename": "course_enrollments",
            "indexname": "idx_course_enrollments_status",
            "indexdef": "CREATE INDEX idx_course_enrollments_status ON public.course_enrollments USING btree (status)"
          }
        ]
      },
      {
        "type": "constraints",
        "data": [
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_provider_check",
            "constraint_type": "c"
          },
          {
            "table_name": "document_chunks",
            "constraint_name": "heading_level_check",
            "constraint_type": "c"
          },
          {
            "table_name": "document_chunks",
            "constraint_name": "outline_source_not_null",
            "constraint_type": "c"
          },
          {
            "table_name": "document_chunks",
            "constraint_name": "outline_subject_not_empty",
            "constraint_type": "c"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_difficulty_level_check",
            "constraint_type": "c"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_role_check",
            "constraint_type": "c"
          },
          {
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_status_check",
            "constraint_type": "c"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_status_check",
            "constraint_type": "c"
          },
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "collection_subjects",
            "constraint_name": "collection_subjects_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "course_enrollments",
            "constraint_name": "course_enrollments_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "course_enrollments",
            "constraint_name": "course_enrollments_user_id_course_id_key",
            "constraint_type": "u"
          },
          {
            "table_name": "course_subjects",
            "constraint_name": "course_subjects_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "courses",
            "constraint_name": "courses_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "document_chunks",
            "constraint_name": "document_chunks_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "error_logs",
            "constraint_name": "error_logs_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "exam_types",
            "constraint_name": "exam_types_name_key",
            "constraint_type": "u"
          },
          {
            "table_name": "exam_types",
            "constraint_name": "exam_types_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "collections",
            "constraint_name": "flashcard_collections_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_user_id_flashcard_id_key",
            "constraint_type": "u"
          },
          {
            "table_name": "flashcard_subjects",
            "constraint_name": "flashcard_subjects_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "lesson_progress",
            "constraint_name": "lesson_progress_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "lesson_progress",
            "constraint_name": "lesson_progress_user_id_lesson_id_key",
            "constraint_type": "u"
          },
          {
            "table_name": "lessons",
            "constraint_name": "lessons_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "message_counts",
            "constraint_name": "message_counts_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "models",
            "constraint_name": "models_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "modules",
            "constraint_name": "modules_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "profiles",
            "constraint_name": "profiles_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "profiles",
            "constraint_name": "profiles_stripe_customer_id_key",
            "constraint_type": "u"
          },
          {
            "table_name": "query_logs",
            "constraint_name": "query_logs_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "subjects",
            "constraint_name": "subjects_name_key",
            "constraint_type": "u"
          },
          {
            "table_name": "subjects",
            "constraint_name": "subjects_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "system_prompts",
            "constraint_name": "system_prompts_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "threads",
            "constraint_name": "threads_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_user_id_feature_key",
            "constraint_type": "u"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "collection_subjects",
            "constraint_name": "collection_subjects_collection_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "collection_subjects",
            "constraint_name": "collection_subjects_subject_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "course_enrollments",
            "constraint_name": "course_enrollments_course_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "course_enrollments",
            "constraint_name": "course_enrollments_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "course_subjects",
            "constraint_name": "course_subjects_course_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "course_subjects",
            "constraint_name": "course_subjects_subject_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "courses",
            "constraint_name": "courses_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "modules",
            "constraint_name": "courses_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "error_logs",
            "constraint_name": "error_logs_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "fk_flashcards_created_by",
            "constraint_type": "f"
          },
          {
            "table_name": "lessons",
            "constraint_name": "fk_lessons_created_by",
            "constraint_type": "f"
          },
          {
            "table_name": "modules",
            "constraint_name": "fk_modules_created_by",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_collection_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "collections",
            "constraint_name": "flashcard_collections_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_exam_type_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_subjects",
            "constraint_name": "flashcard_subjects_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_subjects",
            "constraint_name": "flashcard_subjects_subject_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "lesson_progress",
            "constraint_name": "lesson_progress_lesson_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "lesson_progress",
            "constraint_name": "lesson_progress_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "lessons",
            "constraint_name": "lessons_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "lessons",
            "constraint_name": "lessons_module_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "message_counts",
            "constraint_name": "message_counts_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_thread_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "modules",
            "constraint_name": "modules_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "profiles",
            "constraint_name": "profiles_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "system_prompts",
            "constraint_name": "system_prompts_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "threads",
            "constraint_name": "threads_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_user_id_fkey",
            "constraint_type": "f"
          }
        ]
      },
      {
        "type": "functions",
        "data": [
          {
            "proname": "is_admin",
            "prosrc": "\nbegin\n  return exists (\n    select 1\n    from auth.users\n    where id = user_id\n      and raw_user_meta_data ->> 'is_admin' = 'true'\n  );\nend;\n"
          },
          {
            "proname": "role",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.role', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n  )::text\n"
          },
          {
            "proname": "uid",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  );\nEND;\n"
          },
          {
            "proname": "ensure_single_active_prompt",
            "prosrc": "\nBEGIN\n  UPDATE prompts\n  SET is_active = false\n  WHERE user_id = NEW.user_id\n    AND id <> NEW.id\n    AND is_active = true;\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "ensure_profile_exists",
            "prosrc": "\nDECLARE\n  profile_exists boolean;\nBEGIN\n  -- Check if profile exists\n  SELECT EXISTS (\n    SELECT 1 FROM public.profiles \n    WHERE id = auth.uid()\n  ) INTO profile_exists;\n  \n  -- If profile doesn't exist, create it\n  IF NOT profile_exists THEN\n    INSERT INTO public.profiles (id, created_at)\n    VALUES (auth.uid(), now());\n  END IF;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "ensure_single_active_ai_setting",
            "prosrc": "\nBEGIN\n  UPDATE ai_settings\n  SET is_active = false\n  WHERE user_id = NEW.user_id\n    AND id <> NEW.id\n    AND is_active = true;\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "get_active_users_24h",
            "prosrc": "\nDECLARE\n  active_count bigint;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user statistics';\n  END IF;\n\n  SELECT COUNT(*) INTO active_count\n  FROM auth.users\n  WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours';\n  \n  RETURN active_count;\nEND;\n"
          },
          {
            "proname": "extract_year_month",
            "prosrc": "\n  SELECT (EXTRACT(YEAR FROM date_value) * 100 + EXTRACT(MONTH FROM date_value))::INTEGER;\n"
          },
          {
            "proname": "debug_auth_uid",
            "prosrc": "\nDECLARE\n  user_id UUID;\nBEGIN\n  SELECT auth.uid() INTO user_id;\n  RAISE NOTICE 'Current auth.uid(): %', user_id;\n  RETURN user_id;\nEND;\n"
          },
          {
            "proname": "get_lifetime_message_count",
            "prosrc": "\nDECLARE\n  lifetime_count INTEGER;\nBEGIN\n  -- Get current lifetime count\n  SELECT lifetime_message_count INTO lifetime_count\n  FROM public.profiles\n  WHERE id = user_id;\n  \n  RETURN COALESCE(lifetime_count, 0);\nEND;\n"
          },
          {
            "proname": "increment_lifetime_message_count",
            "prosrc": "\nDECLARE\n  current_count INTEGER;\n  new_count INTEGER;\nBEGIN\n  -- Get current lifetime count\n  SELECT lifetime_message_count INTO current_count\n  FROM public.profiles\n  WHERE id = user_id;\n  \n  -- If profile record doesn't exist yet, create it\n  IF current_count IS NULL THEN\n    INSERT INTO public.profiles (id, created_at, lifetime_message_count)\n    VALUES (user_id, now(), 1)\n    ON CONFLICT (id) DO UPDATE\n    SET lifetime_message_count = COALESCE(public.profiles.lifetime_message_count, 0) + 1;\n    \n    new_count := 1;\n  ELSE\n    -- Increment the count\n    new_count := current_count + 1;\n    \n    UPDATE public.profiles\n    SET lifetime_message_count = new_count\n    WHERE id = user_id;\n  END IF;\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "email",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.email', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n  )::text\n"
          },
          {
            "proname": "get_error_logs",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view error logs';\n  END IF;\n\n  RETURN QUERY\n  SELECT el.*\n  FROM error_logs el\n  ORDER BY el.created_at DESC;\nEND;\n"
          },
          {
            "proname": "get_total_users",
            "prosrc": "\nDECLARE\n  total bigint;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user statistics';\n  END IF;\n\n  SELECT COUNT(*) INTO total FROM auth.users;\n  RETURN total;\nEND;\n"
          },
          {
            "proname": "handle_updated_at",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "has_entitlement",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM user_entitlements\n    WHERE user_id = auth.uid()\n    AND feature = feature_name\n    AND status = 'active'\n  );\nEND;\n"
          },
          {
            "proname": "has_entitlement",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM user_entitlements\n    WHERE user_entitlements.user_id = has_entitlement.user_id\n      AND user_entitlements.entitlement = has_entitlement.entitlement_name\n      AND user_entitlements.is_active = true\n  );\nEND;\n"
          },
          {
            "proname": "jwt",
            "prosrc": "\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n"
          },
          {
            "proname": "handle_updated_at_profile",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "handle_new_user",
            "prosrc": "\nBEGIN\n  INSERT INTO public.users (id, email, is_admin)\n  VALUES (NEW.id, NEW.email, false)\n  ON CONFLICT (id) DO NOTHING;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "handle_new_user_subscription",
            "prosrc": "\nBEGIN\n  INSERT INTO public.user_subscriptions (\n    user_id,\n    status,\n    current_period_end,\n    cancel_at_period_end,\n    created_at,\n    updated_at\n  ) VALUES (\n    NEW.id,\n    'inactive',\n    NOW() + INTERVAL '30 days',\n    false,\n    NOW(),\n    NOW()\n  );\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "has_any_admin",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE raw_user_meta_data->>'is_admin' = 'true'\n  );\nEND;\n"
          },
          {
            "proname": "mark_error_investigated",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can update error logs';\n  END IF;\n\n  UPDATE error_logs\n  SET investigated = NOT investigated\n  WHERE id = error_id;\nEND;\n"
          },
          {
            "proname": "is_subscription_active",
            "prosrc": "\nDECLARE\n    active BOOLEAN;\nBEGIN\n    SELECT EXISTS (\n        SELECT 1 \n        FROM public.user_subscriptions \n        WHERE user_id = user_uuid \n        AND status IN ('active', 'trialing')\n        AND (current_period_end > NOW() OR current_period_end IS NULL)\n    ) INTO active;\n    \n    RETURN active;\nEND;\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nBEGIN\n  RETURN auth.is_admin();\nEND;\n"
          },
          {
            "proname": "log_slow_query",
            "prosrc": "\nBEGIN\n  -- Log slow queries to a table\n  INSERT INTO public.query_logs (query, duration, executed_at)\n  VALUES (current_query(), EXTRACT(EPOCH FROM now() - statement_timestamp()), now());\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "update_updated_at_column",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "test_increment_message_count",
            "prosrc": "\nDECLARE\n  result INTEGER;\nBEGIN\n  SELECT public.increment_user_message_count(user_id) INTO result;\n  RETURN result;\nEND;\n"
          },
          {
            "proname": "upgrade_to_admin",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT public.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can upgrade users to admin status';\n  END IF;\n\n  -- Update the profile to include admin status\n  UPDATE public.profiles\n  SET is_admin = true\n  WHERE id = user_id;\n  \n  -- Also update the auth.users metadata for backward compatibility\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = user_id;\nEND;\n"
          },
          {
            "proname": "set_flashcard_creator",
            "prosrc": "\nBEGIN\n  -- If created_by is not provided, set it to the current user\n  IF NEW.created_by IS NULL THEN\n    NEW.created_by := auth.uid();\n  END IF;\n  \n  -- We no longer inherit is_official from a collection since we can have multiple\n  -- For simplicity, if is_official isn't explicitly set, default to false\n  IF NEW.is_official IS NULL THEN\n    NEW.is_official := false;\n  END IF;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "create_first_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if any admin users already exist\n  IF EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Cannot create first admin: admin users already exist';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = admin_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', admin_email;\n  END IF;\n\n  -- Update the user's metadata to make them an admin\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "get_all_users",
            "prosrc": "\nBEGIN\n  -- Add debug logging\n  RAISE NOTICE 'Executing get_all_users for user: %', auth.uid();\n  RAISE NOTICE 'User is admin: %', auth.is_admin(auth.uid());\n\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user data. User: %, Is admin: %', \n      auth.uid(), \n      auth.is_admin(auth.uid());\n  END IF;\n\n  RETURN QUERY\n  SELECT \n    au.id,\n    au.email::varchar(255), -- Explicit cast to match return type\n    au.created_at,\n    au.last_sign_in_at,\n    au.raw_user_meta_data\n  FROM auth.users au\n  ORDER BY au.created_at DESC;\nEND;\n"
          },
          {
            "proname": "get_database_schema",
            "prosrc": "\nDECLARE\n    result jsonb;\nBEGIN\n    WITH schema_info AS (\n        -- Tables and Columns: Get structure of all public tables\n        SELECT \n            jsonb_build_object(\n                'tables',\n                (SELECT jsonb_object_agg(table_name, columns)\n                FROM (\n                    SELECT \n                        t.table_name,\n                        jsonb_agg(\n                            jsonb_build_object(\n                                'column_name', c.column_name,\n                                'data_type', c.data_type,\n                                'is_nullable', c.is_nullable,\n                                'column_default', c.column_default,\n                                'identity_generation', c.identity_generation\n                            ) ORDER BY c.ordinal_position\n                        ) as columns\n                    FROM information_schema.tables t\n                    JOIN information_schema.columns c \n                         ON t.table_name = c.table_name \n                         AND t.table_schema = c.table_schema\n                    WHERE t.table_schema = 'public' \n                    AND t.table_type = 'BASE TABLE'\n                    GROUP BY t.table_name\n                ) t),\n\n                -- Indexes: Get all indexes including their OIDs for uniqueness\n                'indexes',\n                (SELECT jsonb_object_agg(\n                    schemaname || '.' || tablename || '.' || indexname,\n                    jsonb_build_object(\n                        'definition', indexdef,\n                        'oid', i.oid::text\n                    )\n                )\n                FROM pg_indexes idx\n                JOIN pg_class i ON i.relname = idx.indexname\n                WHERE idx.schemaname = 'public'),\n\n                -- Constraints: Get all table constraints with their definitions\n                'constraints',\n                (SELECT jsonb_object_agg(\n                    table_name || '.' || constraint_name,\n                    jsonb_build_object(\n                        'constraint_type', constraint_type,\n                        'definition', pg_get_constraintdef(pg_constraint.oid)\n                    )\n                )\n                FROM (\n                    SELECT \n                        tc.table_name,\n                        tc.constraint_name,\n                        tc.constraint_type,\n                        c.oid\n                    FROM information_schema.table_constraints tc\n                    JOIN pg_constraint c ON tc.constraint_name = c.conname\n                    WHERE tc.table_schema = 'public'\n                ) sub),\n\n                -- RLS Policies: Get all row level security policies\n                'policies',\n                (SELECT jsonb_object_agg(\n                    tablename || '.' || policyname,\n                    jsonb_build_object(\n                        'permissive', permissive,\n                        'roles', roles,\n                        'command', cmd,\n                        'using', CASE WHEN qual IS NOT NULL \n                                    THEN pg_get_expr(qual, table_id::regclass) \n                                    ELSE null END,\n                        'with_check', CASE WHEN with_check IS NOT NULL \n                                         THEN pg_get_expr(with_check, table_id::regclass) \n                                         ELSE null END\n                    )\n                )\n                FROM pg_policies\n                WHERE schemaname = 'public'),\n\n                -- Functions: Get all functions with their properties and arguments\n                'functions',\n                (SELECT jsonb_object_agg(\n                    proname || '_' || p.oid::text,\n                    jsonb_build_object(\n                        'name', proname,\n                        'language', l.lanname,\n                        'security', CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,\n                        'volatility', CASE p.provolatile \n                                     WHEN 'i' THEN 'IMMUTABLE'\n                                     WHEN 's' THEN 'STABLE'\n                                     ELSE 'VOLATILE' END,\n                        'definition', pg_get_functiondef(p.oid),\n                        'argument_types', pg_get_function_arguments(p.oid)\n                    )\n                )\n                FROM pg_proc p\n                JOIN pg_namespace n ON p.pronamespace = n.oid\n                JOIN pg_language l ON p.prolang = l.oid\n                WHERE n.nspname = 'public'),\n\n                -- Triggers: Get all trigger definitions\n                'triggers',\n                (SELECT jsonb_object_agg(\n                    trigger_name,\n                    jsonb_build_object(\n                        'table', event_object_table,\n                        'timing', condition_timing,\n                        'event', event_manipulation,\n                        'definition', action_statement\n                    )\n                )\n                FROM information_schema.triggers\n                WHERE trigger_schema = 'public')\n            ) as schema_info\n    )\n    SELECT schema_info INTO result FROM schema_info;\n\n    RETURN result;\nEND;\n"
          },
          {
            "proname": "get_flashcard_stats",
            "prosrc": "\nDECLARE\n    total_count INTEGER;\n    official_count INTEGER;\n    user_count INTEGER;\n    pitfalls_count INTEGER;\n    samples_count INTEGER;\n    result JSON;\nBEGIN\n    -- Get total count\n    SELECT COUNT(*) INTO total_count FROM flashcards;\n    \n    -- Get official count\n    SELECT COUNT(*) INTO official_count \n    FROM flashcards \n    WHERE is_official = TRUE;\n    \n    -- Get user-generated count\n    SELECT COUNT(*) INTO user_count \n    FROM flashcards \n    WHERE is_official = FALSE;\n    \n    -- Get common pitfalls count\n    SELECT COUNT(*) INTO pitfalls_count \n    FROM flashcards \n    WHERE is_common_pitfall = TRUE;\n    \n    -- Get public samples count\n    SELECT COUNT(*) INTO samples_count \n    FROM flashcards \n    WHERE is_public_sample = TRUE;\n    \n    -- Construct JSON result\n    result := json_build_object(\n        'total', total_count,\n        'official', official_count,\n        'user', user_count,\n        'pitfalls', pitfalls_count,\n        'samples', samples_count\n    );\n    \n    RETURN result;\nEND;\n"
          },
          {
            "proname": "get_user_message_count",
            "prosrc": "\nDECLARE\n  user_id_internal UUID;\n  count_value INTEGER;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id_internal := COALESCE(input_user_id, auth.uid());\n  \n  -- Return 0 if no user is authenticated\n  IF user_id_internal IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month (in UTC)\n  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');\n  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';\n  \n  -- First try to get the message count from the message_counts table\n  SELECT count INTO count_value\n  FROM public.message_counts mc\n  WHERE mc.user_id = user_id_internal\n    AND mc.period_start >= first_day_of_month\n    AND mc.period_end <= last_day_of_month\n  ORDER BY count DESC\n  LIMIT 1;\n  \n  -- If found, return the count\n  IF count_value IS NOT NULL THEN\n    RETURN count_value;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO count_value\n  FROM public.messages m\n  WHERE m.user_id = user_id_internal\n    AND m.role = 'user'\n    AND m.created_at >= first_day_of_month\n    AND m.created_at <= last_day_of_month;\n  \n  -- Return the count or 0 if null\n  RETURN COALESCE(count_value, 0);\nEND;\n"
          },
          {
            "proname": "get_user_message_count",
            "prosrc": "\nDECLARE\n  user_id UUID;\n  count_value INTEGER;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id := auth.uid();\n  \n  -- Return 0 if no user is authenticated\n  IF user_id IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month\n  first_day_of_month := date_trunc('month', now());\n  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;\n  \n  -- First try to get from message_counts table\n  SELECT count INTO count_value\n  FROM public.message_counts\n  WHERE user_id = auth.uid()\n    AND period_start >= first_day_of_month\n    AND period_end <= last_day_of_month\n  ORDER BY updated_at DESC\n  LIMIT 1;\n  \n  -- If found, return the count\n  IF count_value IS NOT NULL THEN\n    RETURN count_value;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO count_value\n  FROM public.messages\n  WHERE user_id = auth.uid()\n    AND role = 'user'\n    AND created_at >= first_day_of_month\n    AND created_at <= last_day_of_month;\n  \n  -- Return the count or 0 if null\n  RETURN COALESCE(count_value, 0);\nEND;\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nDECLARE\n  target_user_id UUID;\nBEGIN\n  -- If no user_id provided, use the current user\n  IF user_id IS NULL THEN\n    target_user_id := auth.uid();\n  ELSE\n    target_user_id := user_id;\n  END IF;\n  \n  -- Return false if no user is authenticated or provided\n  IF target_user_id IS NULL THEN\n    RETURN false;\n  END IF;\n  \n  -- Check if the user is an admin in auth.users metadata\n  RETURN EXISTS (\n    SELECT 1\n    FROM auth.users\n    WHERE id = target_user_id\n    AND (raw_user_meta_data->>'is_admin')::boolean = true\n  );\nEND;\n"
          },
          {
            "proname": "increment_user_message_count",
            "prosrc": "\nDECLARE\n  user_id UUID;\n  current_count INTEGER;\n  new_count INTEGER;\n  record_id UUID;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id := auth.uid();\n  \n  -- Return 0 if no user is authenticated\n  IF user_id IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month\n  first_day_of_month := date_trunc('month', now());\n  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;\n  \n  -- First try to get from message_counts table\n  SELECT id, count INTO record_id, current_count\n  FROM public.message_counts\n  WHERE user_id = auth.uid()\n    AND period_start >= first_day_of_month\n    AND period_end <= last_day_of_month\n  ORDER BY updated_at DESC\n  LIMIT 1;\n  \n  -- If found, increment the count\n  IF record_id IS NOT NULL THEN\n    new_count := current_count + 1;\n    \n    UPDATE public.message_counts\n    SET count = new_count, updated_at = now()\n    WHERE id = record_id;\n    \n    RETURN new_count;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO current_count\n  FROM public.messages\n  WHERE user_id = auth.uid()\n    AND role = 'user'\n    AND created_at >= first_day_of_month\n    AND created_at <= last_day_of_month;\n  \n  -- Calculate new count\n  new_count := COALESCE(current_count, 0) + 1;\n  \n  -- Insert new record\n  INSERT INTO public.message_counts (\n    user_id,\n    count,\n    period_start,\n    period_end\n  ) VALUES (\n    auth.uid(),\n    new_count,\n    first_day_of_month,\n    last_day_of_month\n  );\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "increment_user_message_count",
            "prosrc": "\nDECLARE\n  user_id_internal UUID;\n  current_count INTEGER;\n  new_count INTEGER;\n  record_id UUID;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\n  debug_info TEXT;\nBEGIN\n  -- Add debug logging\n  RAISE LOG 'increment_user_message_count called for user: %', input_user_id;\n\n  -- Get the current user ID or use the provided one\n  user_id_internal := COALESCE(input_user_id, auth.uid());\n  \n  -- Return 0 if no user is authenticated\n  IF user_id_internal IS NULL THEN\n    RAISE LOG 'No user ID provided/available';\n    RETURN 0;\n  END IF;\n  \n  -- Also increment the lifetime message count\n  PERFORM public.increment_lifetime_message_count(user_id_internal);\n  \n  -- Calculate the first and last day of the current month (in UTC)\n  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');\n  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';\n  \n  RAISE LOG 'Checking for existing record for period: % to %', first_day_of_month, last_day_of_month;\n  \n  -- First check if we already have a record for this month\n  SELECT id, count INTO record_id, current_count\n  FROM public.message_counts mc\n  WHERE mc.user_id = user_id_internal\n    AND mc.period_start >= first_day_of_month\n    AND mc.period_end <= last_day_of_month\n  ORDER BY count DESC\n  LIMIT 1;\n  \n  -- Log what we found\n  IF record_id IS NOT NULL THEN\n    RAISE LOG 'Found existing record ID: % with count: %', record_id, current_count;\n  ELSE\n    RAISE LOG 'No existing record found for this month';\n  END IF;\n  \n  -- If found, increment the count\n  IF record_id IS NOT NULL THEN\n    new_count := current_count + 1;\n    \n    RAISE LOG 'Updating record % to new count: %', record_id, new_count;\n    \n    UPDATE public.message_counts\n    SET count = new_count, updated_at = now()\n    WHERE id = record_id;\n    \n    -- Check if the update was successful\n    IF NOT FOUND THEN\n      RAISE LOG 'Update failed - no rows affected';\n    ELSE\n      RAISE LOG 'Update successful';\n    END IF;\n    \n    RETURN new_count;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO current_count\n  FROM public.messages m\n  WHERE m.user_id = user_id_internal\n    AND m.role = 'user'\n    AND m.created_at >= first_day_of_month\n    AND m.created_at <= last_day_of_month;\n  \n  -- Calculate new count\n  new_count := COALESCE(current_count, 0) + 1;\n  \n  RAISE LOG 'Inserting new record with count: %', new_count;\n  \n  -- Insert new record - add a short delay to help avoid race conditions\n  PERFORM pg_sleep(0.1);\n  \n  -- Insert with ON CONFLICT handling to ensure it works even with simultaneous calls\n  INSERT INTO public.message_counts (\n    user_id,\n    count,\n    period_start,\n    period_end,\n    created_at,\n    updated_at\n  ) VALUES (\n    user_id_internal,\n    new_count,\n    first_day_of_month,\n    last_day_of_month,\n    now(),\n    now()\n  )\n  ON CONFLICT (user_id, (extract_year_month(period_start)))\n  DO UPDATE SET \n    count = EXCLUDED.count,\n    updated_at = now();\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "revoke_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Only administrators can revoke admin status';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = user_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', user_email;\n  END IF;\n\n  -- Update the user's metadata to remove admin status\n  UPDATE auth.users\n  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "revoke_admin",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT public.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can revoke admin status';\n  END IF;\n\n  -- Update the profile to remove admin status\n  UPDATE public.profiles\n  SET is_admin = false\n  WHERE id = user_id;\n  \n  -- Also update the auth.users metadata for backward compatibility\n  UPDATE auth.users\n  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'\n  WHERE id = user_id;\nEND;\n"
          },
          {
            "proname": "update_user_profile",
            "prosrc": "\nDECLARE\n  is_current_user BOOLEAN;\n  current_email TEXT;\nBEGIN\n  -- Verify that the user is updating their own profile\n  SELECT (user_id = auth.uid()) INTO is_current_user;\n  \n  IF NOT is_current_user THEN\n    RAISE EXCEPTION 'Cannot update another user''s profile';\n  END IF;\n  \n  -- If email is being updated, verify it's not already in use\n  IF new_email IS NOT NULL THEN\n    SELECT email INTO current_email FROM auth.users WHERE id = user_id;\n    \n    -- Only do this check if email is actually changing\n    IF new_email != current_email THEN\n      -- Check if email exists in auth.users\n      IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN\n        RAISE EXCEPTION 'Email address already in use';\n      END IF;\n      \n      -- Update email in auth.users - this will be handled by the application instead\n      -- to properly handle auth system requirements\n    END IF;\n  END IF;\n  \n  -- Update the user profile in public.profiles\n  UPDATE public.profiles\n  SET \n    first_name = COALESCE(new_first_name, first_name),\n    last_name = COALESCE(new_last_name, last_name),\n    updated_at = now()\n  WHERE id = user_id;\n  \n  RETURN TRUE;\nEXCEPTION\n  WHEN OTHERS THEN\n    RETURN FALSE;\nEND;\n"
          },
          {
            "proname": "upgrade_to_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Only administrators can upgrade users to admin status';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = user_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', user_email;\n  END IF;\n\n  -- Update the user's metadata to include admin status\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "has_course_access",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM public.course_enrollments \n    WHERE user_id = has_course_access.user_id \n      AND course_id = has_course_access.course_id\n      AND expires_at > NOW()\n  ) OR EXISTS (\n    SELECT 1 FROM public.user_subscriptions\n    WHERE user_id = has_course_access.user_id\n      AND status = 'active'\n      AND current_period_end > NOW()\n  );\nEND;\n"
          },
          {
            "proname": "create_course_enrollment",
            "prosrc": "\nDECLARE\n  new_id UUID;\nBEGIN\n  IF p_days_of_access <= 0 THEN\n    RAISE EXCEPTION 'Days of access must be greater than zero';\n  END IF;\n\n  IF EXISTS (\n    SELECT 1 FROM public.course_enrollments\n    WHERE user_id = p_user_id AND course_id = p_course_id\n      AND expires_at > NOW()\n  ) THEN\n    SELECT id INTO new_id\n    FROM public.course_enrollments\n    WHERE user_id = p_user_id AND course_id = p_course_id\n      AND expires_at > NOW();\n\n    RETURN new_id;\n  END IF;\n\n  INSERT INTO public.course_enrollments(\n    user_id,\n    course_id,\n    enrolled_at,\n    expires_at,\n    renewal_count,\n    notification_7day_sent,\n    notification_1day_sent,\n    created_at,\n    updated_at\n  )\n  VALUES (\n    p_user_id,\n    p_course_id,\n    NOW(),\n    NOW() + (p_days_of_access || ' days')::INTERVAL,\n    0,\n    FALSE,\n    FALSE,\n    NOW(),\n    NOW()\n  )\n  RETURNING id INTO new_id;\n\n  RETURN new_id;\nEND;\n"
          }
        ]
      },
      {
        "type": "policies",
        "data": [
          {
            "policyname": "Admin users can delete any collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can delete any flashcard_collections_junction",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can delete any flashcard_exam_types",
            "tablename": "flashcard_exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can delete any flashcard_subjects",
            "tablename": "flashcard_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can insert any collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
          },
          {
            "policyname": "Admin users can insert any flashcard_collections_junction",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
          },
          {
            "policyname": "Admins can manage all courses",
            "tablename": "courses",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admins can manage all enrollments",
            "tablename": "course_enrollments",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admin users can insert any flashcard_exam_types",
            "tablename": "flashcard_exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
          },
          {
            "policyname": "Admin users can update any collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can update any flashcard_collections_junction",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can update any flashcard_exam_types",
            "tablename": "flashcard_exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admin users can update any flashcard_subjects",
            "tablename": "flashcard_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
            "with_check": null
          },
          {
            "policyname": "Admins can create course-subject relationships",
            "tablename": "course_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admins can delete course-subject relationships",
            "tablename": "course_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "auth.is_admin()",
            "with_check": null
          },
          {
            "policyname": "Admins can manage AI settings",
            "tablename": "ai_settings",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": null,
            "with_check": null
          },
          {
            "policyname": "Enable read access for all users",
            "tablename": "document_chunks",
            "permissive": "PERMISSIVE",
            "roles": [
              "anon",
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Admins can manage all lessons",
            "tablename": "lessons",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admins can manage all modules",
            "tablename": "modules",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admins can manage system prompts",
            "tablename": "system_prompts",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": null
          },
          {
            "policyname": "Admins can update course-subject relationships",
            "tablename": "course_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "auth.is_admin()",
            "with_check": "auth.is_admin()"
          },
          {
            "policyname": "Admins can view all flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
            "with_check": null
          },
          {
            "policyname": "Admins can view all subscriptions",
            "tablename": "user_subscriptions",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text))::boolean = true))",
            "with_check": null
          },
          {
            "policyname": "All users can read active prompt",
            "tablename": "system_prompts",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_active = true)",
            "with_check": null
          },
          {
            "policyname": "All users can read active setting",
            "tablename": "ai_settings",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_active = true)",
            "with_check": null
          },
          {
            "policyname": "Anyone can read flashcard collections",
            "tablename": "collections",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Anyone can read subjects",
            "tablename": "subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Anyone can view official flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_official = true)",
            "with_check": null
          },
          {
            "policyname": "Only admins can manage exam types",
            "tablename": "exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "auth.is_admin()",
            "with_check": null
          },
          {
            "policyname": "Only admins can view error logs",
            "tablename": "error_logs",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "auth.is_admin()",
            "with_check": null
          },
          {
            "policyname": "Only admins can view query logs",
            "tablename": "query_logs",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "auth.is_admin()",
            "with_check": null
          },
          {
            "policyname": "Anyone can view official subjects",
            "tablename": "subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "anon"
            ],
            "qual": "((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)))",
            "with_check": null
          },
          {
            "policyname": "Anyone can view published course info",
            "tablename": "courses",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
            "with_check": null
          },
          {
            "policyname": "Anyone can view published lesson titles",
            "tablename": "lessons",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id\n   FROM modules m\n  WHERE (m.course_id IN ( SELECT c.id\n           FROM courses c\n          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
            "with_check": null
          },
          {
            "policyname": "Anyone can view published module titles",
            "tablename": "modules",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((course_id IN ( SELECT courses.id\n   FROM courses\n  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
            "with_check": null
          },
          {
            "policyname": "Anyone can view sample flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "anon"
            ],
            "qual": "((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)))",
            "with_check": null
          },
          {
            "policyname": "Only service role can insert/update/delete subscriptions",
            "tablename": "user_subscriptions",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((auth.jwt() ->> 'role'::text) = 'service_role'::text)",
            "with_check": null
          },
          {
            "policyname": "Service role can manage entitlements",
            "tablename": "user_entitlements",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "true",
            "with_check": "true"
          },
          {
            "policyname": "Users can access collection subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can access course subjects",
            "tablename": "course_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can access exam types",
            "tablename": "exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can access flashcard exam types",
            "tablename": "flashcard_exam_types",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can access flashcard subjects",
            "tablename": "flashcard_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can create error logs",
            "tablename": "error_logs",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can create flashcard collections",
            "tablename": "collections",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(is_official = false)"
          },
          {
            "policyname": "Users can create flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "true"
          },
          {
            "policyname": "Users can create messages in own threads",
            "tablename": "messages",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(EXISTS ( SELECT 1\n   FROM threads\n  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))))"
          },
          {
            "policyname": "Users can create own threads",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can create their own subjects",
            "tablename": "subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(is_official = false)"
          },
          {
            "policyname": "Users can delete non-official flashcard collections",
            "tablename": "collections",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_official = false)",
            "with_check": null
          },
          {
            "policyname": "Users can delete own threads",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can insert their own message counts",
            "tablename": "message_counts",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can delete their own collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))))",
            "with_check": null
          },
          {
            "policyname": "Users can delete their own flashcard_collections_junction",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = flashcard_collections_junction.collection_id) AND (c.user_id = auth.uid()))))",
            "with_check": null
          },
          {
            "policyname": "Users can delete their own flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "((auth.uid() = created_by) AND (is_official = false))",
            "with_check": null
          },
          {
            "policyname": "Users can delete their own non-official subjects",
            "tablename": "subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_official = false)",
            "with_check": null
          },
          {
            "policyname": "Users can insert their own collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))))"
          },
          {
            "policyname": "Users can insert their own flashcard progress",
            "tablename": "flashcard_progress",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can insert their own profile",
            "tablename": "profiles",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": null,
            "with_check": "(auth.uid() = id)"
          },
          {
            "policyname": "Users can read any collection_subjects",
            "tablename": "collection_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can read any flashcard_collections_junction",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": null
          },
          {
            "policyname": "Users can read their own entitlements",
            "tablename": "user_entitlements",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can see published or purchased courses",
            "tablename": "courses",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((status = 'Published'::lesson_status) OR (status = 'Coming Soon'::lesson_status) OR (EXISTS ( SELECT 1\n   FROM course_enrollments ce\n  WHERE ((ce.course_id = courses.id) AND (ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))",
            "with_check": null
          },
          {
            "policyname": "Users can update non-official flashcard collections",
            "tablename": "collections",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_official = false)",
            "with_check": "(is_official = false)"
          },
          {
            "policyname": "Users can update own threads",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can update their own enrollments",
            "tablename": "course_enrollments",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can update their own flashcard progress",
            "tablename": "flashcard_progress",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can update their own message counts",
            "tablename": "message_counts",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can update their own non-official subjects",
            "tablename": "subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(is_official = false)",
            "with_check": "(is_official = false)"
          },
          {
            "policyname": "Users can update their own profile",
            "tablename": "profiles",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = id)",
            "with_check": "(auth.uid() = id)"
          },
          {
            "policyname": "Users can view lessons for their enrolled courses",
            "tablename": "lessons",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "((EXISTS ( SELECT 1\n   FROM ((modules m\n     JOIN courses c ON ((c.id = m.course_id)))\n     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))\n  WHERE ((lessons.module_id = m.id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))) AND (status = 'Published'::lesson_status))",
            "with_check": null
          },
          {
            "policyname": "Users can view messages from own threads",
            "tablename": "messages",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM threads\n  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))))",
            "with_check": null
          },
          {
            "policyname": "Users can view modules for their enrolled courses",
            "tablename": "modules",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM (courses c\n     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))\n  WHERE ((c.id = modules.course_id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now()))))))",
            "with_check": null
          },
          {
            "policyname": "Users can view own threads",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own flashcard progress",
            "tablename": "flashcard_progress",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = created_by)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own lesson progress",
            "tablename": "lesson_progress",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can view their own message counts",
            "tablename": "message_counts",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own profile",
            "tablename": "profiles",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = id)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own subscriptions",
            "tablename": "user_subscriptions",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "models_access",
            "tablename": "models",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.is_admin() OR (is_public = true))",
            "with_check": null
          },
          {
            "policyname": "threads_delete_own",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "threads_delete_policy",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "threads_insert_own",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "threads_insert_policy",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(auth.uid() IS NOT NULL)"
          },
          {
            "policyname": "threads_select_policy",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "threads_update_own",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "threads_update_policy",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "threads_view_own",
            "tablename": "threads",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can view their own course enrollments",
            "tablename": "course_enrollments",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Authenticated users can view all courses",
            "tablename": "courses",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": "(auth.role() = 'authenticated'::text)",
            "with_check": null
          },
          {
            "policyname": "Users can create their own enrollments",
            "tablename": "course_enrollments",
            "permissive": "PERMISSIVE",
            "roles": [
              "public"
            ],
            "qual": null,
            "with_check": "(auth.uid() = user_id)"
          },
          {
            "policyname": "Users can delete their own flashcard progress",
            "tablename": "flashcard_progress",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = user_id)",
            "with_check": null
          },
          {
            "policyname": "Users can insert flashcard-collection associations",
            "tablename": "flashcard_collections_junction",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = flashcard_collections_junction.collection_id) AND ((c.user_id = auth.uid()) OR (c.is_official = true)))))"
          },
          {
            "policyname": "Users can insert flashcard-subject associations",
            "tablename": "flashcard_subjects",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text) OR (EXISTS ( SELECT 1\n   FROM flashcards f\n  WHERE ((f.id = flashcard_subjects.flashcard_id) AND (f.created_by = auth.uid())))))"
          },
          {
            "policyname": "Users can update their own flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(auth.uid() = created_by)",
            "with_check": "(auth.uid() = created_by)"
          },
          {
            "policyname": "Admins can update any flashcard",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
            "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))"
          },
          {
            "policyname": "Anyone can view public sample flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "anon",
              "authenticated"
            ],
            "qual": "((is_official = true) AND (is_public_sample = true))",
            "with_check": null
          }
        ]
      }
    ]
  }
]

# RLS Policies

[
  {
    "schemaname": "public",
    "tablename": "ai_settings",
    "policyname": "Admins can manage AI settings",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "ai_settings",
    "policyname": "All users can read active setting",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_active = true)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Admin users can delete any collection_subjects",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Admin users can insert any collection_subjects",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Admin users can update any collection_subjects",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Users can access collection subjects",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Users can delete their own collection_subjects",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Users can insert their own collection_subjects",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "collection_subjects",
    "policyname": "Users can read any collection_subjects",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collections",
    "policyname": "Anyone can read flashcard collections",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collections",
    "policyname": "Users can create flashcard collections",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(is_official = false)"
  },
  {
    "schemaname": "public",
    "tablename": "collections",
    "policyname": "Users can delete non-official flashcard collections",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_official = false)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "collections",
    "policyname": "Users can update non-official flashcard collections",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_official = false)",
    "with_check_raw": "(is_official = false)"
  },
  {
    "schemaname": "public",
    "tablename": "course_enrollments",
    "policyname": "Admins can manage all enrollments",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "course_enrollments",
    "policyname": "Users can create their own enrollments",
    "roles": "{public}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "course_enrollments",
    "policyname": "Users can update their own enrollments",
    "roles": "{public}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "course_enrollments",
    "policyname": "Users can view their own course enrollments",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "course_subjects",
    "policyname": "Admins can create course-subject relationships",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "course_subjects",
    "policyname": "Admins can delete course-subject relationships",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "course_subjects",
    "policyname": "Admins can update course-subject relationships",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "course_subjects",
    "policyname": "Users can access course subjects",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "courses",
    "policyname": "Admins can manage all courses",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "courses",
    "policyname": "Anyone can view published course info",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "courses",
    "policyname": "Authenticated users can view all courses",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.role() = 'authenticated'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "courses",
    "policyname": "Users can see published or purchased courses",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((status = 'Published'::lesson_status) OR (status = 'Coming Soon'::lesson_status) OR (EXISTS ( SELECT 1\n   FROM course_enrollments ce\n  WHERE ((ce.course_id = courses.id) AND (ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "document_chunks",
    "policyname": "Enable read access for all users",
    "roles": "{anon,authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "Only admins can view error logs",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "error_logs",
    "policyname": "Users can create error logs",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "exam_types",
    "policyname": "Only admins can manage exam types",
    "roles": "{authenticated}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "exam_types",
    "policyname": "Users can access exam types",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Admin users can delete any flashcard_collections_junction",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Admin users can insert any flashcard_collections_junction",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Admin users can update any flashcard_collections_junction",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Users can delete their own flashcard_collections_junction",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = flashcard_collections_junction.collection_id) AND (c.user_id = auth.uid()))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Users can insert flashcard-collection associations",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(EXISTS ( SELECT 1\n   FROM collections c\n  WHERE ((c.id = flashcard_collections_junction.collection_id) AND ((c.user_id = auth.uid()) OR (c.is_official = true)))))"
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_collections_junction",
    "policyname": "Users can read any flashcard_collections_junction",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_exam_types",
    "policyname": "Admin users can delete any flashcard_exam_types",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_exam_types",
    "policyname": "Admin users can insert any flashcard_exam_types",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_exam_types",
    "policyname": "Admin users can update any flashcard_exam_types",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_exam_types",
    "policyname": "Users can access flashcard exam types",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_progress",
    "policyname": "Users can delete their own flashcard progress",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_progress",
    "policyname": "Users can insert their own flashcard progress",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_progress",
    "policyname": "Users can update their own flashcard progress",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_progress",
    "policyname": "Users can view their own flashcard progress",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_subjects",
    "policyname": "Admin users can delete any flashcard_subjects",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_subjects",
    "policyname": "Admin users can update any flashcard_subjects",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_subjects",
    "policyname": "Users can access flashcard subjects",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcard_subjects",
    "policyname": "Users can insert flashcard-subject associations",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text) OR (EXISTS ( SELECT 1\n   FROM flashcards f\n  WHERE ((f.id = flashcard_subjects.flashcard_id) AND (f.created_by = auth.uid())))))"
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Admins can update any flashcard",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "with_check_raw": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Admins can view all flashcards",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Anyone can view official flashcards",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_official = true)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Anyone can view public sample flashcards",
    "roles": "{anon,authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((is_official = true) AND (is_public_sample = true))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Anyone can view sample flashcards",
    "roles": "{anon}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Users can create flashcards",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "true"
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Users can delete their own flashcards",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "((auth.uid() = created_by) AND (is_official = false))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Users can update their own flashcards",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = created_by)",
    "with_check_raw": "(auth.uid() = created_by)"
  },
  {
    "schemaname": "public",
    "tablename": "flashcards",
    "policyname": "Users can view their own flashcards",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = created_by)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "lesson_progress",
    "policyname": "Users can view their own lesson progress",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "lessons",
    "policyname": "Admins can manage all lessons",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "lessons",
    "policyname": "Anyone can view published lesson titles",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id\n   FROM modules m\n  WHERE (m.course_id IN ( SELECT c.id\n           FROM courses c\n          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "lessons",
    "policyname": "Users can view lessons for their enrolled courses",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((EXISTS ( SELECT 1\n   FROM ((modules m\n     JOIN courses c ON ((c.id = m.course_id)))\n     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))\n  WHERE ((lessons.module_id = m.id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))) AND (status = 'Published'::lesson_status))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "message_counts",
    "policyname": "Users can insert their own message counts",
    "roles": "{public}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "message_counts",
    "policyname": "Users can update their own message counts",
    "roles": "{public}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "message_counts",
    "policyname": "Users can view their own message counts",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "messages",
    "policyname": "Users can create messages in own threads",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(EXISTS ( SELECT 1\n   FROM threads\n  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))))"
  },
  {
    "schemaname": "public",
    "tablename": "messages",
    "policyname": "Users can view messages from own threads",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM threads\n  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "models",
    "policyname": "models_access",
    "roles": "{authenticated}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.is_admin() OR (is_public = true))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "modules",
    "policyname": "Admins can manage all modules",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": "auth.is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "modules",
    "policyname": "Anyone can view published module titles",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((course_id IN ( SELECT courses.id\n   FROM courses\n  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "modules",
    "policyname": "Users can view modules for their enrolled courses",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(EXISTS ( SELECT 1\n   FROM (courses c\n     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))\n  WHERE ((c.id = modules.course_id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now()))))))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can insert their own profile",
    "roles": "{public}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update their own profile",
    "roles": "{public}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = id)",
    "with_check_raw": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view their own profile",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "query_logs",
    "policyname": "Only admins can view query logs",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "subjects",
    "policyname": "Anyone can read subjects",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "subjects",
    "policyname": "Anyone can view official subjects",
    "roles": "{anon}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "subjects",
    "policyname": "Users can create their own subjects",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(is_official = false)"
  },
  {
    "schemaname": "public",
    "tablename": "subjects",
    "policyname": "Users can delete their own non-official subjects",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_official = false)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "subjects",
    "policyname": "Users can update their own non-official subjects",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_official = false)",
    "with_check_raw": "(is_official = false)"
  },
  {
    "schemaname": "public",
    "tablename": "system_prompts",
    "policyname": "Admins can manage system prompts",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "auth.is_admin()",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "system_prompts",
    "policyname": "All users can read active prompt",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(is_active = true)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "Users can create own threads",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "Users can delete own threads",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "Users can update own threads",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "Users can view own threads",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_delete_own",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_delete_policy",
    "roles": "{authenticated}",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_insert_own",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_insert_policy",
    "roles": "{authenticated}",
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "using_raw": null,
    "with_check_raw": "(auth.uid() IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_select_policy",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_update_own",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_update_policy",
    "roles": "{authenticated}",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "threads",
    "policyname": "threads_view_own",
    "roles": "{authenticated}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "user_entitlements",
    "policyname": "Service role can manage entitlements",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "true",
    "with_check_raw": "true"
  },
  {
    "schemaname": "public",
    "tablename": "user_entitlements",
    "policyname": "Users can read their own entitlements",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "user_subscriptions",
    "policyname": "Admins can view all subscriptions",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text))::boolean = true))",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "user_subscriptions",
    "policyname": "Only service role can insert/update/delete subscriptions",
    "roles": "{public}",
    "command": "ALL",
    "permissive": "PERMISSIVE",
    "using_raw": "((auth.jwt() ->> 'role'::text) = 'service_role'::text)",
    "with_check_raw": null
  },
  {
    "schemaname": "public",
    "tablename": "user_subscriptions",
    "policyname": "Users can view their own subscriptions",
    "roles": "{public}",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "using_raw": "(auth.uid() = user_id)",
    "with_check_raw": null
  }
]