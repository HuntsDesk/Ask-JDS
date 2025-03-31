## Overview

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


----

INSERT INTO flashcard_collections_junction (flashcard_id, collection_id)
SELECT f.id, c.id
FROM flashcards f
JOIN collections c ON
       (f.question = 'How is an agency relationship created?' AND c.title = 'Creation & Termination of Agency')
    OR (f.question = 'How is an agency relationship terminated?' AND c.title = 'Creation & Termination of Agency')
    OR (f.question = 'What is the difference between express and implied actual authority?' AND c.title = 'Authority of Agents')
    OR (f.question = 'When does an agent act with apparent authority?' AND c.title = 'Authority of Agents')
    OR (f.question = 'How does principal liability differ for independent contractors?' AND c.title = 'Principal''s Liability')
    OR (f.question = 'How is a general partnership (GP) formed?' AND c.title = 'Formation of Partnerships')
    OR (f.question = 'What is required to form a limited partnership (LP)?' AND c.title = 'Formation of Partnerships')
    OR (f.question = 'What is the duty of loyalty owed by partners to the partnership?' AND c.title = 'Fiduciary Duties')
ON CONFLICT (flashcard_id, collection_id) DO NOTHING;

------

Match Flashcards to Subjects based on the Collection's relationship to subjects:

INSERT INTO flashcard_subjects (flashcard_id, subject_id)
SELECT DISTINCT fcj.flashcard_id, cs.subject_id
FROM flashcard_collections_junction AS fcj
JOIN collection_subjects          AS cs
  ON fcj.collection_id = cs.collection_id
ON CONFLICT (flashcard_id, subject_id) DO NOTHING;