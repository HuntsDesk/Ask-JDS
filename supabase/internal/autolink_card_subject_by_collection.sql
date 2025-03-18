INSERT INTO flashcard_subjects (flashcard_id, subject_id)
SELECT DISTINCT fcj.flashcard_id, cs.subject_id
FROM flashcard_collections_junction fcj
JOIN collection_subjects cs ON fcj.collection_id = cs.collection_id
ON CONFLICT (flashcard_id, subject_id) DO NOTHING;