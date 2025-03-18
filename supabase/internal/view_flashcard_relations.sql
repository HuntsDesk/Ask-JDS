SELECT 
    f.id AS flashcard_id,
    f.question,
    s.name AS subject_name,
    c.title AS collection_title
FROM flashcards f
LEFT JOIN flashcard_collections_junction fcj ON f.id = fcj.flashcard_id
LEFT JOIN collections c ON fcj.collection_id = c.id
LEFT JOIN collection_subjects cs ON c.id = cs.collection_id
LEFT JOIN subjects s ON cs.subject_id = s.id
WHERE f.question ILIKE '%How does principal liability d%';