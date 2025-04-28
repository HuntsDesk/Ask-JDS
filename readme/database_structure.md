# Overview

This document outlines the database schema for Ask JDS, a legal flashcard and learning system. The Supabase database uses PostgreSQL with many-to-many relationships to organize content by subjects, collections, and exam types.

## Official Subjects & Collections

1. Constitutional Law
   - Federalism & Separation of Powers (Judicial Review, Congressional Powers, Executive Powers)
   - Individual Rights: Due Process (Substantive & Procedural)
   - Individual Rights: Equal Protection
   - First Amendment: Speech, Press, and Association
   - First Amendment: Religion (Establishment Clause & Free Exercise Clause)
   - State Action & Government Regulation (Commerce Clause, Taxing & Spending Power)

2. Civil Procedure
   - Subject Matter Jurisdiction (Federal Question, Diversity, Supplemental)
   - Personal Jurisdiction & Venue
   - Pleadings & Motions (Rule 12, Joinder, Class Actions)
   - Discovery (Scope, Methods, Sanctions)
   - Pre-Trial & Trial (Summary Judgment, Jury Trials, Judgments)
   - Appeals & Preclusion (Final Judgment Rule, Res Judicata, Collateral Estoppel)
   - Erie Doctrine

3. Contracts
   - Formation (Offer, Acceptance, Consideration)
   - Defenses to Formation (Statute of Frauds, Mistake, Duress, etc.)
   - Contract Terms & Interpretation (Parol Evidence Rule, Conditions)
   - Performance & Breach (Substantial Performance, Anticipatory Repudiation, Impossibility/Frustration)
   - Remedies (Expectation Damages, Reliance, Restitution, Specific Performance)
   - UCC Article 2: Sales of Goods (Merchant Rules, Warranties, Perfect Tender)
   - Third Party Rights

4. Torts
   - Intentional Torts (Assault, Battery, False Imprisonment, IIED, Trespass)
   - Defenses to Intentional Torts (Consent, Self-Defense, Necessity)
   - Negligence: Duty & Breach (Standard of Care, Negligence Per Se)
   - Negligence: Causation (Actual & Proximate Cause)
   - Negligence: Damages & Defenses (Contributory/Comparative Negligence, Assumption of Risk)
   - Strict Liability (Abnormally Dangerous Activities, Animals)
   - Products Liability (Manufacturing Defects, Design Defects, Failure to Warn)
   - Defamation & Privacy Torts
   - Nuisance

5. Criminal Law
   - Elements of a Crime (Actus Reus, Mens Rea, Causation, Concurrence)
   - Homicide (Murder, Manslaughter)
   - Property Crimes (Larceny, Embezzlement, Robbery, Burglary)
   - Other Crimes Against Persons (Rape, Kidnapping)
   - Inchoate Offenses (Attempt, Solicitation, Conspiracy)
   - Defenses (Insanity, Self-Defense, Duress, Mistake)
   - Parties to Crime

6. Criminal Procedure
   - Fourth Amendment (Searches & Seizures, Warrant Requirement, Exceptions)
   - Fifth Amendment (Self-Incrimination, Due Process, Double Jeopardy)
   - Sixth Amendment (Right to Counsel, Speedy Trial, Confrontation)
   - Exclusionary Rule & Fruit of the Poisonous Tree
   - Arrest, Interrogation, & Confessions (Miranda)

7. Evidence
   - Relevance & Admissibility (Logical & Legal Relevance, Rule 403)
   - Hearsay: Definition & Exemptions (Non-Hearsay Uses)
   - Hearsay: Exceptions (Declarant Unavailable, Present Sense Impression, Excited Utterance, etc.)
   - Witnesses (Competency, Impeachment, Opinion Testimony)
   - Character Evidence (Propensity, Specific Acts, Reputation)
   - Privileges (Attorney-Client, Spousal, Doctor-Patient)
   - Writings

8. Real Property
   - Present Estates & Future Interests (Fee Simple, Life Estate, Reversions, Remainders)
   - Concurrent Ownership (Joint Tenancy, Tenancy in Common, Tenancy by the Entirety)
   - Landlord-Tenant Law (Lease Types, Rights & Duties, Eviction)
   - Easements, Covenants, & Servitudes
   - Land Transactions (Contracts, Deeds, Recording Statutes)
   - Mortgages & Foreclosure
   - Adverse Possession

9. Business Associations (MEE Subject)
   - Agency (Creation, Authority, Liability)
   - Partnerships (Formation, Liability, Dissolution)
   - Corporations: Formation & Structure
   - Corporations: Shareholder Rights & Actions
   - Corporations: Directors & Officers (Duties, Liability)
   - Limited Liability Companies (LLCs)

10. Wills, Trusts, & Estates (MEE Subject)
   - Wills: Validity & Execution
   - Wills: Revocation & Interpretation
   - Intestate Succession
   - Trusts: Creation & Types (Express, Resulting, Constructive)
   - Trusts: Trustee Duties & Powers
   - Future Interests & Powers of Appointment

11. Family Law (MEE Subject)
   - Marriage & Divorce (Requirements, Grounds, Property Division, Spousal Support)
   - Child Custody & Support
   - Adoption & Parentage
   - Premarital Agreements

12. Professional Responsibility (MPRE Subject)
   - Client-Lawyer Relationship (Formation, Scope, Termination)
   - Confidentiality & Privilege
   - Conflicts of Interest (Current Clients, Former Clients, Imputed Conflicts)
   - Fees & Client Funds
   - Candor to the Tribunal & Fairness to Opposing Counsel
   - Advertising & Solicitation

13. Choice of Law / Conflict of Laws
   - Vested Rights
   - Most Significant Relationship
   - Governmental Interest
   - Areas of Law (e.g., Torts, Contracts, Property)

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
     - `name` (text, unique, required)
     - `description` (text)
     - `created_at` (timestamp with time zone)

3. **`courses`**
   - Stores course information for JD Simplified learning platform
   - Key fields:
     - `id` (uuid, PK)
     - `title` (text, required)
     - `overview` (text)
     - `tile_description` (text)
     - `days_of_access` (integer)
     - `is_featured` (boolean)
     - `status` (text) - Must be one of: 'Draft', 'Published', or 'Coming Soon'
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

4. **`course_enrollments`**
   - Tracks user enrollment in courses
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to auth.users)
     - `course_id` (uuid, FK to courses)
     - `enrolled_at` (timestamp with time zone)
     - `expires_at` (timestamp with time zone)

5. **`modules`**
   - Stores course module information
   - Key fields:
     - `id` (uuid, PK)
     - `course_id` (uuid, FK to courses)
     - `title` (text, required)
     - `description` (text)
     - `position` (integer)
     - `created_at` (timestamp with time zone)

6. **`lessons`**
   - Stores individual lesson content within modules
   - Key fields:
     - `id` (uuid, PK)
     - `module_id` (uuid, FK to modules)
     - `title` (text, required)
     - `content` (text)
     - `position` (integer)
     - `duration` (integer) - estimated duration in minutes
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
   - Many-to-many relationship between flashcards and subjects
   - Fields:
     - `id` (uuid, PK)
     - `flashcard_id` (uuid, FK to flashcards, required)
     - `subject_id` (uuid, FK to subjects, required)
     - Unique constraint on (flashcard_id, subject_id)

2. **`flashcard_exam_types`**
   - Many-to-many relationship between flashcards and exam types
   - Fields:
     - `id` (uuid, PK)
     - `flashcard_id` (uuid, FK to flashcards, required)
     - `exam_type_id` (uuid, FK to exam_types, required)
     - Unique constraint on (flashcard_id, exam_type_id)

3. **`flashcard_collections_junction`**
   - Many-to-many relationship between flashcards and collections
   - Fields:
     - `id` (uuid, PK)
     - `flashcard_id` (uuid, FK to flashcards, required)
     - `collection_id` (uuid, FK to collections, required)
     - Unique constraint on (flashcard_id, collection_id)

4. **`course_subjects`**
   - Many-to-many relationship between courses and subjects
   - Fields:
     - `course_id` (uuid, FK to courses, required)
     - `subject_id` (uuid, FK to subjects, required)
     - Unique constraint on (course_id, subject_id)
     - Composite primary key (course_id, subject_id)

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