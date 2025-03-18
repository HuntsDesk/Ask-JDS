BEGIN;

-- Insert the mappings using a VALUES list with multiple entries for multi-category flashcards
INSERT INTO flashcard_collections_junction (flashcard_id, collection_id)
WITH mappings AS (
    -- Multi-category flashcards (each appears in multiple rows)
    SELECT f.id AS flashcard_id, c.id AS collection_id
    FROM flashcards f
    CROSS JOIN collections c
    WHERE f.is_official = TRUE
    AND (
        (f.question = 'What is a fiduciary duty, and who typically owes it?' AND c.title IN ('Agency: Fiduciary Duties', 'Corporations: Director & Officer Duties'))
        OR (f.question = 'What is the duty of loyalty, and how does it apply to fiduciaries?' AND c.title IN ('Agency: Fiduciary Duties', 'Corporations: Director & Officer Duties'))
        OR (f.question = 'What is the business judgment rule (BJR)?' AND c.title IN ('Corporations: Director & Officer Duties', 'Corporations: Governance'))
    )

    UNION ALL

    -- Single-category flashcards (all the rest)
    SELECT f.id AS flashcard_id, c.id AS collection_id
    FROM flashcards f
    JOIN collections c ON
        (f.question = 'How is an agency relationship created?' AND c.title = 'Agency: Creation & Termination')
        OR (f.question = 'How is an agency relationship terminated?' AND c.title = 'Agency: Creation & Termination')
        OR (f.question = 'What is the difference between express and implied actual authority?' AND c.title = 'Agency: Authority')
        OR (f.question = 'When does an agent act with apparent authority?' AND c.title = 'Agency: Authority')
        OR (f.question = 'How does principal liability differ for independent contractors?' AND c.title = 'Agency: Liability')
        OR (f.question = 'How is a general partnership (GP) formed?' AND c.title = 'Partnerships: Formation')
        OR (f.question = 'What is required to form a limited partnership (LP)?' AND c.title = 'Partnerships: Formation')
        OR (f.question = 'What is the duty of loyalty owed by partners to the partnership?' AND c.title = 'Partnerships: Fiduciary Duties')
        OR (f.question = 'What is the difference between dissolution and "winding up" in a partnership?' AND c.title = 'Partnerships: Dissolution & Winding Up')
        OR (f.question = 'What are the main causes of dissolution in a partnership?' AND c.title = 'Partnerships: Dissolution & Winding Up')
        OR (f.question = 'How can the articles of incorporation be amended?' AND c.title = 'Corporations: Formation & Governance')
        OR (f.question = 'When can a court pierce the corporate veil?' AND c.title = 'Corporations: Shareholder Rights & Liabilities')
        OR (f.question = 'What is an easement, and what are the types of easements?' AND c.title = 'Property: Easements & Adverse Possession')
        OR (f.question = 'What is adverse possession, and what are its elements?' AND c.title = 'Property: Easements & Adverse Possession')
        OR (f.question = 'What is a life estate, and what rights does a life tenant have?' AND c.title = 'Property: Estates & Future Interests')
        OR (f.question = 'What is a variance in the context of zoning law?' AND c.title = 'Property: Land Use & Zoning')
        OR (f.question = 'What is procedural due process, and what protections does it offer?' AND c.title = 'Constitutional Law: Due Process & Equal Protection')
        OR (f.question = 'What is substantive due process, and what are the two levels of scrutiny applied?' AND c.title = 'Constitutional Law: Due Process & Equal Protection')
        OR (f.question = 'What is the Due Process Clause of the Fifth Amendment, and how does it apply to federal actions?' AND c.title = 'Constitutional Law: Due Process & Equal Protection')
        OR (f.question = 'What is the Due Process Clause of the Fourteenth Amendment, and how does it differ from the Fifth Amendment Due Process Clause?' AND c.title = 'Constitutional Law: Due Process & Equal Protection')
        OR (f.question = 'What is the Necessary and Proper Clause, and how does it expand Congressional power?' AND c.title = 'Constitutional Law: Federalism & Separation of Powers')
        OR (f.question = 'What is the Taxing and Spending Clause, and how does it empower Congress?' AND c.title = 'Constitutional Law: Federalism & Separation of Powers')
        OR (f.question = 'What is the Appointments Clause, and how does it regulate the appointment of federal officers?' AND c.title = 'Constitutional Law: Federalism & Separation of Powers')
        OR (f.question = 'What is the Impeachment Clause, and how does it govern the removal of federal officers?' AND c.title = 'Constitutional Law: Federalism & Separation of Powers')
        OR (f.question = 'What is the Ex Post Facto Clause, and what does it prohibit?' AND c.title = 'Constitutional Law: Individual Rights')
        OR (f.question = 'What is the Bill of Attainder Clause, and what does it prohibit?' AND c.title = 'Constitutional Law: Individual Rights')
        OR (f.question = 'What is the doctrine of incorporation, and how has it expanded the protection of individual rights?' AND c.title = 'Constitutional Law: Fourteenth Amendment')
        OR (f.question = 'What is the Fifth Amendment''s protection against self-incrimination, and when does it apply?' AND c.title = 'Constitutional Law: Fifth Amendment')
        OR (f.question = 'What is the Equal Protection Clause, and what does it require of state governments?' AND c.title = 'Constitutional Law: Due Process & Equal Protection')
        OR (f.question = 'What is the Commerce Clause, and how has it been used to expand federal regulatory power?' AND c.title = 'Constitutional Law: Federalism & Separation of Powers')
        OR (f.question = 'What are Miranda Rights, and when must law enforcement officers provide them?' AND c.title = 'Criminal Law & Procedure: Rights of the Accused')
        OR (f.question = 'What is the Sixth Amendment right to a speedy trial, and why is it important?' AND c.title = 'Criminal Law & Procedure: Rights of the Accused')
        OR (f.question = 'What is the Eighth Amendment protection against cruel and unusual punishment, and what does it prohibit?' AND c.title = 'Constitutional Law: Eighth Amendment')
    WHERE f.is_official = TRUE
    -- Exclude questions that are in the multi-category section
    AND f.question NOT IN (
        'What is a fiduciary duty, and who typically owes it?',
        'What is the duty of loyalty, and how does it apply to fiduciaries?',
        'What is the business judgment rule (BJR)?'
    )
)
SELECT * FROM mappings
ON CONFLICT (flashcard_id, collection_id) DO NOTHING;

COMMIT;