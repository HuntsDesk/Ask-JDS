

<think>The user wants me to update the README database file with the nuance related to the table naming mismatch they identified. I should add a section that specifically addresses this naming confusion and provides clarity on the correct table names to use.

In particular, I need to address:
1. The mismatch between `flashcard_collections` (used in SQL scripts) and `flashcard_collections_junction` (the actual table name)
2. Clarify that there is a separate table just called `collections` which stores the collection definitions

Let me update the README file to incorporate this information, likely in the "Important Notes for SQL Scripts" section since that's most relevant for people writing SQL.</think># JD Simplified Database Structure README

## Overview

This document outlines the database schema for JD Simplified, a legal flashcard and learning system. The database uses PostgreSQL with many-to-many relationships to organize content by subjects, collections, and exam types.

## Core Tables

### Primary Tables

1. **`flashcards`**
   - Primary storage for all flashcard content
   - Key fields: `id`, `question`, `answer`, `created_by`, `is_official`, `difficulty_level`, `highly_tested`
   - Constraints: `difficulty_level` has a check constraint (appears to validate specific values)

2. **`subjects`**
   - Stores subject areas (e.g., Constitutional Law, Contracts, Torts)
   - Key fields: `id`, `name`, `description`, `is_official`
   - Note: `name` has a unique constraint

3. **`collections`**
   - Stores thematic groupings of flashcards (e.g., First Amendment, Contract Performance)
   - Key fields: `id`, `title`, `description`, `is_official`, `user_id`
   - Note: This table has the primary key constraint named `flashcard_collections_pkey`

4. **`exam_types`**
   - Different exams flashcards might be applicable to
   - Key fields: `id`, `name`, `description`, `is_official`

### Junction Tables (Many-to-Many Relationships)

1. **`flashcard_subjects`**
   - Links flashcards to subjects (many-to-many)
   - Fields: `flashcard_id`, `subject_id`, `created_at`
   - Primary key: Composite of both IDs

2. **`flashcard_collections_junction`**
   - Links flashcards to collections (many-to-many)
   - Fields: `flashcard_id`, `collection_id`, `created_at`
   - Primary key: Composite of both IDs
   - Note: This is the correct name to use in your SQL scripts

3. **`collection_subjects`**
   - Links collections to subjects (many-to-many)
   - Fields: `collection_id`, `subject_id`, `created_at`
   - Primary key: Composite of both IDs

4. **`flashcard_exam_types`**
   - Links flashcards to exam types (many-to-many)
   - Fields: `flashcard_id`, `exam_type_id`, `created_at`

### User Progress Tracking

1. **`flashcard_progress`**
   - Tracks user interactions with flashcards
   - Key fields: `id`, `user_id`, `flashcard_id`, `is_mastered`, `last_reviewed`
   - Unique constraint on `(user_id, flashcard_id)` pair

## Entity Relationship Diagram (ERD)

```
┌──────────────┐     ┌─────────────────────────┐     ┌────────────┐
│              │     │                         │     │            │
│   subjects   │◄────┤   collection_subjects   ├────►│ collections│
│              │     │                         │     │            │
└──────┬───────┘     └─────────────────────────┘     └──────┬─────┘
       │                                                    │
       │                                                    │
       │           ┌─────────────────────────┐              │
       │           │                         │              │
       └──────────►│    flashcard_subjects   │              │
                   │                         │              │
                   └───────────┬─────────────┘              │
                               │                            │
                               ▼                            │
                       ┌───────────────┐                    │
                       │               │                    │
┌──────────────┐       │  flashcards   │       ┌───────────────────────────┐
│              │       │               │       │                           │
│  exam_types  │◄─────►│               │◄──────┤ flashcard_collections_    │
│              │       └───────┬───────┘       │        junction           │
└──────────────┘               │               │                           │
                               │               └───────────────────────────┘
                               │
                               │
                       ┌───────▼───────┐
                       │               │
                       │ flashcard_    │
                       │ progress      │
                       │               │
                       └───────────────┘
```

## Many-to-Many Relationship Summary

- A flashcard can belong to multiple subjects and collections
- A collection can contain multiple flashcards and be related to multiple subjects
- A subject can contain multiple flashcards and collections
- A flashcard can be relevant to multiple exam types
- User progress is tracked individually for each flashcard

## Important Notes for SQL Scripts

1. **Table Naming - CRITICAL**: There is a naming mismatch that can cause errors in SQL scripts:
   - `collections` - The table that stores collection definitions (has constraint named `flashcard_collections_pkey`)
   - `flashcard_collections_junction` - The junction table linking flashcards to collections
   - ⚠️ **COMMON ERROR**: Scripts often incorrectly use `flashcard_collections` instead of `flashcard_collections_junction`

   Always use:
   ```sql
   INSERT INTO flashcard_collections_junction (flashcard_id, collection_id)
   ```
   NOT:
   ```sql
   INSERT INTO flashcard_collections (flashcard_id, collection_id)
   ```

2. **Difficulty Level**: The `difficulty_level` column in the `flashcards` table has a check constraint. Valid values appear to be text values.

3. **Junction Table Operation Order**:
   - Insert subjects first
   - Insert collections second
   - Insert flashcards third
   - Insert junction table records last (to establish relationships)

## Common SQL Patterns

### Adding a Flashcard with Relationships

```sql
-- 1. Insert the flashcard
INSERT INTO flashcards (question, answer, is_official, difficulty_level, highly_tested)
VALUES ('Question text', 'Answer text', TRUE, 'intermediate', TRUE);

-- 2. Associate with subjects
INSERT INTO flashcard_subjects (flashcard_id, subject_id)
SELECT f.id, s.id
FROM flashcards f
JOIN subjects s ON s.name = 'Subject Name'
WHERE f.question = 'Question text';

-- 3. Associate with collections
INSERT INTO flashcard_collections_junction (flashcard_id, collection_id)
SELECT f.id, c.id
FROM flashcards f
JOIN collections c ON c.name = 'Collection Name'
WHERE f.question = 'Question text';
```

### Querying Related Entities

```sql
-- Get all flashcards for a subject
SELECT f.*
FROM flashcards f
JOIN flashcard_subjects fs ON f.id = fs.flashcard_id
JOIN subjects s ON s.id = fs.subject_id
WHERE s.name = 'Constitutional Law';

-- Get all collections for a flashcard
SELECT c.*
FROM collections c
JOIN flashcard_collections_junction fcj ON c.id = fcj.collection_id
JOIN flashcards f ON f.id = fcj.flashcard_id
WHERE f.question = 'Question text';
```

## Additional Tables

The database also includes user-related, AI/chat functionality, and administrative tables not detailed in this overview.

----
BEGIN;

INSERT INTO flashcards (question, answer, is_official, difficulty_level, highly_tested) VALUES
('How is an agency relationship created?', 'An agency relationship is created when the parties voluntarily consent to enter into an agency relationship, and the agent is subject to the principal’s control.', TRUE, 'EASY', TRUE),
('What is the role of the Vice President under the U.S. Constitution, and how does it relate to succession?', 'The Vice President serves as the President of the Senate, with the power to cast tie-breaking votes. The Vice President also assumes the presidency in the event of the President''s death, resignation, or inability to discharge the powers and duties of the office, as outlined in the Constitution and the Twenty-Fifth Amendment.', TRUE, 'EASY', FALSE);

COMMIT;












Here's everything about the database in JSON:

[
  {
    "json_agg": [
      {
        "type": "tables",
        "data": [
          {
            "table_name": "exam_types",
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
            "table_name": "exam_types",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "error_logs",
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO"
          },
          {
            "table_name": "exam_types",
            "column_name": "is_official",
            "data_type": "boolean",
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
            "column_name": "model_version",
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
            "table_name": "profiles",
            "column_name": "last_name",
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
            "table_name": "threads",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "collections",
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "system_prompts",
            "column_name": "content",
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
            "table_name": "messages",
            "column_name": "content",
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
            "table_name": "flashcards",
            "column_name": "difficulty_level",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "flashcards",
            "column_name": "common_pitfalls",
            "data_type": "text",
            "is_nullable": "YES"
          },
          {
            "table_name": "profiles",
            "column_name": "full_name",
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
            "table_name": "profiles",
            "column_name": "email",
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
            "table_name": "flashcards",
            "column_name": "question",
            "data_type": "text",
            "is_nullable": "NO"
          },
          {
            "table_name": "models",
            "column_name": "name",
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
            "table_name": "user_subscriptions",
            "column_name": "stripe_subscription_id",
            "data_type": "text",
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
            "table_name": "profiles",
            "column_name": "first_name",
            "data_type": "text",
            "is_nullable": "YES"
          }
        ]
      },
      {
        "type": "indexes",
        "data": [
          {
            "tablename": "error_logs",
            "indexname": "error_logs_pkey",
            "indexdef": "CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id)"
          },
          {
            "tablename": "threads",
            "indexname": "threads_pkey",
            "indexdef": "CREATE UNIQUE INDEX threads_pkey ON public.threads USING btree (id)"
          },
          {
            "tablename": "threads",
            "indexname": "threads_user_id_idx",
            "indexdef": "CREATE INDEX threads_user_id_idx ON public.threads USING btree (user_id)"
          },
          {
            "tablename": "threads",
            "indexname": "threads_created_at_idx",
            "indexdef": "CREATE INDEX threads_created_at_idx ON public.threads USING btree (created_at)"
          },
          {
            "tablename": "messages",
            "indexname": "messages_pkey",
            "indexdef": "CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)"
          },
          {
            "tablename": "query_logs",
            "indexname": "query_logs_pkey",
            "indexdef": "CREATE UNIQUE INDEX query_logs_pkey ON public.query_logs USING btree (id)"
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
            "tablename": "exam_types",
            "indexname": "exam_types_pkey",
            "indexdef": "CREATE UNIQUE INDEX exam_types_pkey ON public.exam_types USING btree (id)"
          },
          {
            "tablename": "exam_types",
            "indexname": "exam_types_name_key",
            "indexdef": "CREATE UNIQUE INDEX exam_types_name_key ON public.exam_types USING btree (name)"
          },
          {
            "tablename": "flashcard_collections_junction",
            "indexname": "flashcard_collections_junction_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_collections_junction_pkey ON public.flashcard_collections_junction USING btree (flashcard_id, collection_id)"
          },
          {
            "tablename": "collection_subjects",
            "indexname": "collection_subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX collection_subjects_pkey ON public.collection_subjects USING btree (collection_id, subject_id)"
          },
          {
            "tablename": "system_prompts",
            "indexname": "system_prompts_pkey",
            "indexdef": "CREATE UNIQUE INDEX system_prompts_pkey ON public.system_prompts USING btree (id)"
          },
          {
            "tablename": "flashcard_exam_types",
            "indexname": "flashcard_exam_types_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_exam_types_pkey ON public.flashcard_exam_types USING btree (flashcard_id, exam_type_id)"
          },
          {
            "tablename": "ai_settings",
            "indexname": "ai_settings_pkey",
            "indexdef": "CREATE UNIQUE INDEX ai_settings_pkey ON public.ai_settings USING btree (id)"
          },
          {
            "tablename": "models",
            "indexname": "models_pkey",
            "indexdef": "CREATE UNIQUE INDEX models_pkey ON public.models USING btree (id)"
          },
          {
            "tablename": "collections",
            "indexname": "flashcard_collections_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_collections_pkey ON public.collections USING btree (id)"
          },
          {
            "tablename": "subjects",
            "indexname": "subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id)"
          },
          {
            "tablename": "subjects",
            "indexname": "subjects_name_key",
            "indexdef": "CREATE UNIQUE INDEX subjects_name_key ON public.subjects USING btree (name)"
          },
          {
            "tablename": "flashcards",
            "indexname": "flashcards_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcards_pkey ON public.flashcards USING btree (id)"
          },
          {
            "tablename": "flashcard_subjects",
            "indexname": "flashcard_subjects_pkey",
            "indexdef": "CREATE UNIQUE INDEX flashcard_subjects_pkey ON public.flashcard_subjects USING btree (flashcard_id, subject_id)"
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
            "tablename": "message_counts",
            "indexname": "message_counts_user_month",
            "indexdef": "CREATE UNIQUE INDEX message_counts_user_month ON public.message_counts USING btree (user_id, extract_year_month(period_start))"
          },
          {
            "tablename": "message_counts",
            "indexname": "message_counts_pkey",
            "indexdef": "CREATE UNIQUE INDEX message_counts_pkey ON public.message_counts USING btree (id)"
          }
        ]
      },
      {
        "type": "constraints",
        "data": [
          {
            "table_name": "threads",
            "constraint_name": "threads_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_role_check",
            "constraint_type": "c"
          },
          {
            "table_name": "messages",
            "constraint_name": "messages_pkey",
            "constraint_type": "p"
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
            "table_name": "error_logs",
            "constraint_name": "error_logs_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "error_logs",
            "constraint_name": "error_logs_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_status_check",
            "constraint_type": "c"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "user_subscriptions",
            "constraint_name": "user_subscriptions_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "message_counts",
            "constraint_name": "message_counts_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "message_counts",
            "constraint_name": "message_counts_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "exam_types",
            "constraint_name": "exam_types_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "exam_types",
            "constraint_name": "exam_types_name_key",
            "constraint_type": "u"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_difficulty_level_check",
            "constraint_type": "c"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_collections_junction",
            "constraint_name": "flashcard_collections_junction_collection_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "subjects",
            "constraint_name": "subjects_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "subjects",
            "constraint_name": "subjects_name_key",
            "constraint_type": "u"
          },
          {
            "table_name": "collections",
            "constraint_name": "flashcard_collections_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "collections",
            "constraint_name": "flashcard_collections_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "collection_subjects",
            "constraint_name": "collection_subjects_pkey",
            "constraint_type": "p"
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
            "table_name": "system_prompts",
            "constraint_name": "system_prompts_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "system_prompts",
            "constraint_name": "system_prompts_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "query_logs",
            "constraint_name": "query_logs_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_flashcard_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_exam_types",
            "constraint_name": "flashcard_exam_types_exam_type_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "threads",
            "constraint_name": "threads_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_subjects",
            "constraint_name": "flashcard_subjects_pkey",
            "constraint_type": "p"
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
            "table_name": "models",
            "constraint_name": "models_pkey",
            "constraint_type": "p"
          },
          {
            "table_name": "flashcards",
            "constraint_name": "flashcards_created_by_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_status_check",
            "constraint_type": "c"
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
            "table_name": "user_entitlements",
            "constraint_name": "user_entitlements_user_id_fkey",
            "constraint_type": "f"
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
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_user_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "flashcard_progress",
            "constraint_name": "flashcard_progress_flashcard_id_fkey",
            "constraint_type": "f"
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
            "table_name": "profiles",
            "constraint_name": "profiles_id_fkey",
            "constraint_type": "f"
          },
          {
            "table_name": "ai_settings",
            "constraint_name": "ai_settings_provider_check",
            "constraint_type": "c"
          }
        ]
      },
      {
        "type": "functions",
        "data": [
          {
            "proname": "upgrade_to_admin",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT public.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can upgrade users to admin status';\n  END IF;\n\n  -- Update the profile to include admin status\n  UPDATE public.profiles\n  SET is_admin = true\n  WHERE id = user_id;\n  \n  -- Also update the auth.users metadata for backward compatibility\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = user_id;\nEND;\n"
          },
          {
            "proname": "revoke_admin",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT public.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can revoke admin status';\n  END IF;\n\n  -- Update the profile to remove admin status\n  UPDATE public.profiles\n  SET is_admin = false\n  WHERE id = user_id;\n  \n  -- Also update the auth.users metadata for backward compatibility\n  UPDATE auth.users\n  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'\n  WHERE id = user_id;\nEND;\n"
          },
          {
            "proname": "get_user_message_count",
            "prosrc": "\nDECLARE\n  user_id UUID;\n  count_value INTEGER;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id := auth.uid();\n  \n  -- Return 0 if no user is authenticated\n  IF user_id IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month\n  first_day_of_month := date_trunc('month', now());\n  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;\n  \n  -- First try to get from message_counts table\n  SELECT count INTO count_value\n  FROM public.message_counts\n  WHERE user_id = auth.uid()\n    AND period_start >= first_day_of_month\n    AND period_end <= last_day_of_month\n  ORDER BY updated_at DESC\n  LIMIT 1;\n  \n  -- If found, return the count\n  IF count_value IS NOT NULL THEN\n    RETURN count_value;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO count_value\n  FROM public.messages\n  WHERE user_id = auth.uid()\n    AND role = 'user'\n    AND created_at >= first_day_of_month\n    AND created_at <= last_day_of_month;\n  \n  -- Return the count or 0 if null\n  RETURN COALESCE(count_value, 0);\nEND;\n"
          },
          {
            "proname": "increment_user_message_count",
            "prosrc": "\nDECLARE\n  user_id UUID;\n  current_count INTEGER;\n  new_count INTEGER;\n  record_id UUID;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id := auth.uid();\n  \n  -- Return 0 if no user is authenticated\n  IF user_id IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month\n  first_day_of_month := date_trunc('month', now());\n  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;\n  \n  -- First try to get from message_counts table\n  SELECT id, count INTO record_id, current_count\n  FROM public.message_counts\n  WHERE user_id = auth.uid()\n    AND period_start >= first_day_of_month\n    AND period_end <= last_day_of_month\n  ORDER BY updated_at DESC\n  LIMIT 1;\n  \n  -- If found, increment the count\n  IF record_id IS NOT NULL THEN\n    new_count := current_count + 1;\n    \n    UPDATE public.message_counts\n    SET count = new_count, updated_at = now()\n    WHERE id = record_id;\n    \n    RETURN new_count;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO current_count\n  FROM public.messages\n  WHERE user_id = auth.uid()\n    AND role = 'user'\n    AND created_at >= first_day_of_month\n    AND created_at <= last_day_of_month;\n  \n  -- Calculate new count\n  new_count := COALESCE(current_count, 0) + 1;\n  \n  -- Insert new record\n  INSERT INTO public.message_counts (\n    user_id,\n    count,\n    period_start,\n    period_end\n  ) VALUES (\n    auth.uid(),\n    new_count,\n    first_day_of_month,\n    last_day_of_month\n  );\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "get_total_users",
            "prosrc": "\nDECLARE\n  total bigint;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user statistics';\n  END IF;\n\n  SELECT COUNT(*) INTO total FROM auth.users;\n  RETURN total;\nEND;\n"
          },
          {
            "proname": "get_active_users_24h",
            "prosrc": "\nDECLARE\n  active_count bigint;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user statistics';\n  END IF;\n\n  SELECT COUNT(*) INTO active_count\n  FROM auth.users\n  WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours';\n  \n  RETURN active_count;\nEND;\n"
          },
          {
            "proname": "get_error_logs",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view error logs';\n  END IF;\n\n  RETURN QUERY\n  SELECT el.*\n  FROM error_logs el\n  ORDER BY el.created_at DESC;\nEND;\n"
          },
          {
            "proname": "mark_error_investigated",
            "prosrc": "\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can update error logs';\n  END IF;\n\n  UPDATE error_logs\n  SET investigated = NOT investigated\n  WHERE id = error_id;\nEND;\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nBEGIN\n  RETURN auth.is_admin();\nEND;\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nDECLARE\n  target_user_id UUID;\n  is_admin_value BOOLEAN;\nBEGIN\n  -- If no user_id provided, use the current user\n  IF user_id IS NULL THEN\n    target_user_id := auth.uid();\n  ELSE\n    target_user_id := user_id;\n  END IF;\n  \n  -- Return false if no user is authenticated or provided\n  IF target_user_id IS NULL THEN\n    RETURN false;\n  END IF;\n  \n  -- Check if the user is an admin in profiles table\n  SELECT p.is_admin INTO is_admin_value\n  FROM public.profiles p\n  WHERE p.id = target_user_id;\n  \n  -- Return the result or false if null\n  RETURN COALESCE(is_admin_value, false);\nEND;\n"
          },
          {
            "proname": "handle_new_user_subscription",
            "prosrc": "\nBEGIN\n  INSERT INTO public.user_subscriptions (\n    user_id,\n    status,\n    current_period_end,\n    cancel_at_period_end,\n    created_at,\n    updated_at\n  ) VALUES (\n    NEW.id,\n    'inactive',\n    NOW() + INTERVAL '30 days',\n    false,\n    NOW(),\n    NOW()\n  );\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "get_all_users",
            "prosrc": "\nBEGIN\n  -- Add debug logging\n  RAISE NOTICE 'Executing get_all_users for user: %', auth.uid();\n  RAISE NOTICE 'User is admin: %', auth.is_admin(auth.uid());\n\n  -- Check if the executing user is an admin\n  IF NOT auth.is_admin(auth.uid()) THEN\n    RAISE EXCEPTION 'Only administrators can view user data. User: %, Is admin: %', \n      auth.uid(), \n      auth.is_admin(auth.uid());\n  END IF;\n\n  RETURN QUERY\n  SELECT \n    au.id,\n    au.email::varchar(255), -- Explicit cast to match return type\n    au.created_at,\n    au.last_sign_in_at,\n    au.raw_user_meta_data\n  FROM auth.users au\n  ORDER BY au.created_at DESC;\nEND;\n"
          },
          {
            "proname": "extract_year_month",
            "prosrc": "\n  SELECT (EXTRACT(YEAR FROM date_value) * 100 + EXTRACT(MONTH FROM date_value))::INTEGER;\n"
          },
          {
            "proname": "get_user_message_count",
            "prosrc": "\nDECLARE\n  user_id_internal UUID;\n  count_value INTEGER;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\nBEGIN\n  -- Get the current user ID\n  user_id_internal := COALESCE(input_user_id, auth.uid());\n  \n  -- Return 0 if no user is authenticated\n  IF user_id_internal IS NULL THEN\n    RETURN 0;\n  END IF;\n  \n  -- Calculate the first and last day of the current month (in UTC)\n  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');\n  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';\n  \n  -- First try to get the message count from the message_counts table\n  SELECT count INTO count_value\n  FROM public.message_counts mc\n  WHERE mc.user_id = user_id_internal\n    AND mc.period_start >= first_day_of_month\n    AND mc.period_end <= last_day_of_month\n  ORDER BY count DESC\n  LIMIT 1;\n  \n  -- If found, return the count\n  IF count_value IS NOT NULL THEN\n    RETURN count_value;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO count_value\n  FROM public.messages m\n  WHERE m.user_id = user_id_internal\n    AND m.role = 'user'\n    AND m.created_at >= first_day_of_month\n    AND m.created_at <= last_day_of_month;\n  \n  -- Return the count or 0 if null\n  RETURN COALESCE(count_value, 0);\nEND;\n"
          },
          {
            "proname": "increment_user_message_count",
            "prosrc": "\nDECLARE\n  user_id_internal UUID;\n  current_count INTEGER;\n  new_count INTEGER;\n  record_id UUID;\n  first_day_of_month TIMESTAMPTZ;\n  last_day_of_month TIMESTAMPTZ;\n  debug_info TEXT;\nBEGIN\n  -- Add debug logging\n  RAISE LOG 'increment_user_message_count called for user: %', input_user_id;\n\n  -- Get the current user ID or use the provided one\n  user_id_internal := COALESCE(input_user_id, auth.uid());\n  \n  -- Return 0 if no user is authenticated\n  IF user_id_internal IS NULL THEN\n    RAISE LOG 'No user ID provided/available';\n    RETURN 0;\n  END IF;\n  \n  -- Also increment the lifetime message count\n  PERFORM public.increment_lifetime_message_count(user_id_internal);\n  \n  -- Calculate the first and last day of the current month (in UTC)\n  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');\n  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';\n  \n  RAISE LOG 'Checking for existing record for period: % to %', first_day_of_month, last_day_of_month;\n  \n  -- First check if we already have a record for this month\n  SELECT id, count INTO record_id, current_count\n  FROM public.message_counts mc\n  WHERE mc.user_id = user_id_internal\n    AND mc.period_start >= first_day_of_month\n    AND mc.period_end <= last_day_of_month\n  ORDER BY count DESC\n  LIMIT 1;\n  \n  -- Log what we found\n  IF record_id IS NOT NULL THEN\n    RAISE LOG 'Found existing record ID: % with count: %', record_id, current_count;\n  ELSE\n    RAISE LOG 'No existing record found for this month';\n  END IF;\n  \n  -- If found, increment the count\n  IF record_id IS NOT NULL THEN\n    new_count := current_count + 1;\n    \n    RAISE LOG 'Updating record % to new count: %', record_id, new_count;\n    \n    UPDATE public.message_counts\n    SET count = new_count, updated_at = now()\n    WHERE id = record_id;\n    \n    -- Check if the update was successful\n    IF NOT FOUND THEN\n      RAISE LOG 'Update failed - no rows affected';\n    ELSE\n      RAISE LOG 'Update successful';\n    END IF;\n    \n    RETURN new_count;\n  END IF;\n  \n  -- Otherwise, count messages directly\n  SELECT COUNT(*)::INTEGER INTO current_count\n  FROM public.messages m\n  WHERE m.user_id = user_id_internal\n    AND m.role = 'user'\n    AND m.created_at >= first_day_of_month\n    AND m.created_at <= last_day_of_month;\n  \n  -- Calculate new count\n  new_count := COALESCE(current_count, 0) + 1;\n  \n  RAISE LOG 'Inserting new record with count: %', new_count;\n  \n  -- Insert new record - add a short delay to help avoid race conditions\n  PERFORM pg_sleep(0.1);\n  \n  -- Insert with ON CONFLICT handling to ensure it works even with simultaneous calls\n  INSERT INTO public.message_counts (\n    user_id,\n    count,\n    period_start,\n    period_end,\n    created_at,\n    updated_at\n  ) VALUES (\n    user_id_internal,\n    new_count,\n    first_day_of_month,\n    last_day_of_month,\n    now(),\n    now()\n  )\n  ON CONFLICT (user_id, (extract_year_month(period_start)))\n  DO UPDATE SET \n    count = EXCLUDED.count,\n    updated_at = now();\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "test_increment_message_count",
            "prosrc": "\nDECLARE\n  result INTEGER;\nBEGIN\n  SELECT public.increment_user_message_count(user_id) INTO result;\n  RETURN result;\nEND;\n"
          },
          {
            "proname": "set_flashcard_creator",
            "prosrc": "\nBEGIN\n  -- If created_by is not provided, set it to the current user\n  IF NEW.created_by IS NULL THEN\n    NEW.created_by := auth.uid();\n  END IF;\n  \n  -- We no longer inherit is_official from a collection since we can have multiple\n  -- For simplicity, if is_official isn't explicitly set, default to false\n  IF NEW.is_official IS NULL THEN\n    NEW.is_official := false;\n  END IF;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "handle_new_user",
            "prosrc": "\nBEGIN\n  INSERT INTO public.users (id, email, is_admin)\n  VALUES (NEW.id, NEW.email, false)\n  ON CONFLICT (id) DO NOTHING;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "handle_updated_at",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "ensure_single_active_prompt",
            "prosrc": "\nBEGIN\n  UPDATE prompts\n  SET is_active = false\n  WHERE user_id = NEW.user_id\n    AND id <> NEW.id\n    AND is_active = true;\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "has_entitlement",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM user_entitlements\n    WHERE user_entitlements.user_id = has_entitlement.user_id\n      AND user_entitlements.entitlement = has_entitlement.entitlement_name\n      AND user_entitlements.is_active = true\n  );\nEND;\n"
          },
          {
            "proname": "ensure_single_active_ai_setting",
            "prosrc": "\nBEGIN\n  UPDATE ai_settings\n  SET is_active = false\n  WHERE user_id = NEW.user_id\n    AND id <> NEW.id\n    AND is_active = true;\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "update_updated_at_column",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "update_user_profile",
            "prosrc": "\nDECLARE\n  is_current_user BOOLEAN;\n  current_email TEXT;\nBEGIN\n  -- Verify that the user is updating their own profile\n  SELECT (user_id = auth.uid()) INTO is_current_user;\n  \n  IF NOT is_current_user THEN\n    RAISE EXCEPTION 'Cannot update another user''s profile';\n  END IF;\n  \n  -- If email is being updated, verify it's not already in use\n  IF new_email IS NOT NULL THEN\n    SELECT email INTO current_email FROM auth.users WHERE id = user_id;\n    \n    -- Only do this check if email is actually changing\n    IF new_email != current_email THEN\n      -- Check if email exists in auth.users\n      IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN\n        RAISE EXCEPTION 'Email address already in use';\n      END IF;\n      \n      -- Update email in auth.users - this will be handled by the application instead\n      -- to properly handle auth system requirements\n    END IF;\n  END IF;\n  \n  -- Update the user profile in public.profiles\n  UPDATE public.profiles\n  SET \n    first_name = COALESCE(new_first_name, first_name),\n    last_name = COALESCE(new_last_name, last_name),\n    updated_at = now()\n  WHERE id = user_id;\n  \n  RETURN TRUE;\nEXCEPTION\n  WHEN OTHERS THEN\n    RETURN FALSE;\nEND;\n"
          },
          {
            "proname": "increment_lifetime_message_count",
            "prosrc": "\nDECLARE\n  current_count INTEGER;\n  new_count INTEGER;\nBEGIN\n  -- Get current lifetime count\n  SELECT lifetime_message_count INTO current_count\n  FROM public.profiles\n  WHERE id = user_id;\n  \n  -- If profile record doesn't exist yet, create it\n  IF current_count IS NULL THEN\n    INSERT INTO public.profiles (id, created_at, lifetime_message_count)\n    VALUES (user_id, now(), 1)\n    ON CONFLICT (id) DO UPDATE\n    SET lifetime_message_count = COALESCE(public.profiles.lifetime_message_count, 0) + 1;\n    \n    new_count := 1;\n  ELSE\n    -- Increment the count\n    new_count := current_count + 1;\n    \n    UPDATE public.profiles\n    SET lifetime_message_count = new_count\n    WHERE id = user_id;\n  END IF;\n  \n  RETURN new_count;\nEND;\n"
          },
          {
            "proname": "get_lifetime_message_count",
            "prosrc": "\nDECLARE\n  lifetime_count INTEGER;\nBEGIN\n  -- Get current lifetime count\n  SELECT lifetime_message_count INTO lifetime_count\n  FROM public.profiles\n  WHERE id = user_id;\n  \n  RETURN COALESCE(lifetime_count, 0);\nEND;\n"
          },
          {
            "proname": "has_entitlement",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM user_entitlements\n    WHERE user_id = auth.uid()\n    AND feature = feature_name\n    AND status = 'active'\n  );\nEND;\n"
          },
          {
            "proname": "handle_updated_at_profile",
            "prosrc": "\nBEGIN\n  NEW.updated_at = now();\n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "debug_auth_uid",
            "prosrc": "\nDECLARE\n  user_id UUID;\nBEGIN\n  SELECT auth.uid() INTO user_id;\n  RAISE NOTICE 'Current auth.uid(): %', user_id;\n  RETURN user_id;\nEND;\n"
          },
          {
            "proname": "log_slow_query",
            "prosrc": "\nBEGIN\n  -- Log slow queries to a table\n  INSERT INTO public.query_logs (query, duration, executed_at)\n  VALUES (current_query(), EXTRACT(EPOCH FROM now() - statement_timestamp()), now());\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "ensure_profile_exists",
            "prosrc": "\nDECLARE\n  profile_exists boolean;\nBEGIN\n  -- Check if profile exists\n  SELECT EXISTS (\n    SELECT 1 FROM public.profiles \n    WHERE id = auth.uid()\n  ) INTO profile_exists;\n  \n  -- If profile doesn't exist, create it\n  IF NOT profile_exists THEN\n    INSERT INTO public.profiles (id, created_at)\n    VALUES (auth.uid(), now());\n  END IF;\n  \n  RETURN NEW;\nEND;\n"
          },
          {
            "proname": "upgrade_to_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Only administrators can upgrade users to admin status';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = user_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', user_email;\n  END IF;\n\n  -- Update the user's metadata to include admin status\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "create_first_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if any admin users already exist\n  IF EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Cannot create first admin: admin users already exist';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = admin_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', admin_email;\n  END IF;\n\n  -- Update the user's metadata to make them an admin\n  UPDATE auth.users\n  SET raw_user_meta_data = \n    CASE \n      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)\n      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)\n    END\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "has_any_admin",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE raw_user_meta_data->>'is_admin' = 'true'\n  );\nEND;\n"
          },
          {
            "proname": "revoke_admin",
            "prosrc": "\nDECLARE\n  target_user_id uuid;\nBEGIN\n  -- Check if the executing user is an admin\n  IF NOT EXISTS (\n    SELECT 1 FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  ) THEN\n    RAISE EXCEPTION 'Only administrators can revoke admin status';\n  END IF;\n\n  -- Get the user ID for the target email\n  SELECT id INTO target_user_id\n  FROM auth.users\n  WHERE email = user_email;\n\n  IF target_user_id IS NULL THEN\n    RAISE EXCEPTION 'User with email % not found', user_email;\n  END IF;\n\n  -- Update the user's metadata to remove admin status\n  UPDATE auth.users\n  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'\n  WHERE id = target_user_id;\nEND;\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM auth.users\n    WHERE id = auth.uid()\n    AND raw_user_meta_data->>'is_admin' = 'true'\n  );\nEND;\n"
          },
          {
            "proname": "uid",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n"
          },
          {
            "proname": "role",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.role', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n  )::text\n"
          },
          {
            "proname": "email",
            "prosrc": "\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.email', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n  )::text\n"
          },
          {
            "proname": "is_admin",
            "prosrc": "\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM auth.users\n    WHERE id = user_id\n    AND (raw_user_meta_data->>'is_admin')::boolean = true\n  );\nEND;\n"
          },
          {
            "proname": "jwt",
            "prosrc": "\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n"
          }
        ]
      },
      {
        "type": "policies",
        "data": [
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
            "policyname": "Users can update flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
            "with_check": "true"
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
            "policyname": "Users can delete flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": "true",
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
            "policyname": "Users can create flashcards",
            "tablename": "flashcards",
            "permissive": "PERMISSIVE",
            "roles": [
              "authenticated"
            ],
            "qual": null,
            "with_check": "true"
          }
        ]
      }
    ]
  }
]