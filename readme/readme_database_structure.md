# Database Information

## Schema Inspection Tools

This database includes built-in tools for inspecting and analyzing the schema structure. These tools provide a comprehensive view of the database objects and their relationships.

### 1. Main Function: `get_database_schema()`

Returns a complete JSONB object containing all database objects:

```sql
select get_database_schema();
```

The output includes:
- Tables and their columns
- Indexes and their definitions
- Constraints and their types
- RLS policies and their conditions
- Functions and their properties
- Triggers and their definitions

### 2. Simplified View: `schema_overview`

Provides a table-centric view of the database:

```sql
select * from schema_overview;
```

Columns:
- `table_name`: Name of the table
- `columns`: JSONB array of column definitions
- `policies`: Array of RLS policies for the table
- `constraints`: Array of constraints for the table

### Common Queries

1. View specific table structure:
```sql
select table_name, policies, constraints 
from schema_overview 
where table_name = 'your_table';
```

2. Find tables with RLS policies:
```sql
select table_name, policies 
from schema_overview 
where policies != '[]'::jsonb;
```

3. Check function definitions:
```sql
select get_database_schema()->'functions';
```

4. View table constraints:
```sql
select constraint_key, value->>'definition'
from jsonb_each(get_database_schema()->'constraints') as c(constraint_key, value)
where constraint_key like 'your_table.%';
```

## Database Structure

### Core Tables

1. **`flashcards`**
   - Primary storage for all flashcard content
   - Key fields: 
     - `id` (uuid, PK)
     - `question` (text, required)
     - `answer` (text, required)
     - `created_by` (uuid, FK to profiles)
     - `is_official` (boolean)
     - `is_public_sample` (boolean, required)
     - `difficulty_level` (text)
     - `highly_tested` (boolean)
     - `common_pitfalls` (text)
     - `position` (integer)
     - `created_at` (timestamp with time zone)

2. **`subjects`**
   - Stores subject areas (e.g., Constitutional Law, Contracts, Torts)
   - Key fields: 
     - `id` (uuid, PK)
     - `name` (text, required, unique)
     - `description` (text)
     - `is_official` (boolean)
     - `created_at` (timestamp with time zone)

3. **`collections`**
   - Stores thematic groupings of flashcards
   - Key fields: 
     - `id` (uuid, PK)
     - `title` (text, required)
     - `description` (text)
     - `is_official` (boolean)
     - `user_id` (uuid, FK to profiles)
     - `created_at` (timestamp with time zone)

4. **`exam_types`**
   - Different exams flashcards might be applicable to
   - Key fields: 
     - `id` (uuid, PK)
     - `name` (text, required, unique)
     - `description` (text)
     - `is_official` (boolean)
     - `created_at` (timestamp with time zone)

### User Management & Progress

1. **`profiles`**
   - User profiles and settings
   - Key fields:
     - `id` (uuid, PK)
     - `email` (text)
     - `full_name` (text)
     - `first_name` (text)
     - `last_name` (text)
     - `is_admin` (boolean)
     - `lifetime_message_count` (integer)
     - `stripe_customer_id` (text, unique)
     - `created_at` (timestamp without time zone)
     - `updated_at` (timestamp with time zone)

2. **`user_subscriptions`**
   - Tracks user subscription status
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `status` (text, required)
     - `stripe_subscription_id` (text)
     - `stripe_customer_id` (text)
     - `current_period_end` (timestamp with time zone)
     - `cancel_at_period_end` (boolean)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

3. **`user_entitlements`**
   - User feature access control
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `feature` (text, required)
     - `status` (text)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

### Learning Management

1. **`courses`**
   - Course content management
   - Key fields:
     - `id` (uuid, PK)
     - `title` (text, required)
     - `overview` (text)
     - `what_youll_learn` (jsonb)
     - `tile_description` (text)
     - `days_of_access` (integer, required)
     - `is_featured` (boolean)
     - `status` (text)
     - `created_by` (uuid, FK to profiles)
     - `created_at` (timestamp with time zone)

2. **`modules`**
   - Course modules
   - Key fields:
     - `id` (uuid, PK)
     - `title` (text, required)
     - `description` (text)
     - `position` (integer)
     - `course_id` (uuid, FK to courses)
     - `created_by` (uuid, FK to profiles)
     - `created_at` (timestamp with time zone)

3. **`lessons`**
   - Individual lessons within modules
   - Key fields:
     - `id` (uuid, PK)
     - `title` (text, required)
     - `content` (text)
     - `video_url` (text)
     - `position` (integer)
     - `status` (text)
     - `module_id` (uuid, FK to modules)
     - `created_by` (uuid, FK to profiles)
     - `created_at` (timestamp with time zone)

### Junction Tables

1. **`flashcard_subjects`**
   - Links flashcards to subjects (many-to-many)
   - Fields: `flashcard_id`, `subject_id`, `created_at`
   - Primary key: Composite of both IDs

2. **`flashcard_collections_junction`**
   - Links flashcards to collections (many-to-many)
   - Fields: `flashcard_id`, `collection_id`, `created_at`
   - Primary key: Composite of both IDs

3. **`collection_subjects`**
   - Links collections to subjects (many-to-many)
   - Fields: `collection_id`, `subject_id`, `created_at`
   - Primary key: Composite of both IDs

4. **`flashcard_exam_types`**
   - Links flashcards to exam types (many-to-many)
   - Fields: `flashcard_id`, `exam_type_id`, `created_at`
   - Primary key: Composite of both IDs

5. **`course_subjects`**
   - Links courses to subjects (many-to-many)
   - Fields: `course_id`, `subject_id`, `created_at`
   - Primary key: Composite of both IDs

### Progress Tracking

1. **`flashcard_progress`**
   - Tracks user interactions with flashcards
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles, required)
     - `flashcard_id` (uuid, FK to flashcards, required)
     - `is_mastered` (boolean)
     - `last_reviewed` (timestamp with time zone)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)
   - Unique constraint on `(user_id, flashcard_id)` pair

2. **`course_enrollments`**
   - Tracks user course enrollments
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `course_id` (uuid, FK to courses)
     - `enrolled_at` (timestamp with time zone)
     - `expires_at` (timestamp with time zone)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

3. **`lesson_progress`**
   - Tracks user progress through lessons
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `lesson_id` (uuid, FK to lessons)
     - `completed_at` (timestamp with time zone)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

### System Tables

1. **`message_counts`**
   - Tracks user message usage
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `count` (integer, required)
     - `period_start` (timestamp with time zone)
     - `period_end` (timestamp with time zone)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

2. **`error_logs`**
   - System error tracking
   - Key fields:
     - `id` (uuid, PK)
     - `message` (text, required)
     - `stack_trace` (text)
     - `investigated` (boolean)
     - `user_id` (uuid, FK to profiles)
     - `created_at` (timestamp with time zone)

3. **`query_logs`**
   - Database query performance monitoring
   - Key fields:
     - `id` (uuid, PK)
     - `query` (text)
     - `duration` (numeric)
     - `executed_at` (timestamp with time zone)

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

2. **Cascade Deletes**: All junction tables have cascade delete configured:
   - When a flashcard is deleted, all related records in junction tables are automatically removed
   - When a collection is deleted, all junction records for that collection are removed
   - User progress records are also automatically cleaned up

3. **RLS Policies**: All tables have appropriate RLS policies configured:
   - Users can only access their own data
   - Official content has special access rules
   - Admin users have elevated privileges

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

## Schema Validation

To verify the database structure is correct, you can use the schema inspection tools:

```sql
-- Check all RLS policies are in place
select table_name, policies 
from schema_overview 
where policies = '[]'::jsonb;

-- Verify cascade deletes
select constraint_key, value->>'definition'
from jsonb_each(get_database_schema()->'constraints') as c(constraint_key, value)
where value->>'definition' like '%CASCADE%';

-- Check function security
select key, value->>'security'
from jsonb_each(get_database_schema()->'functions');
``` 