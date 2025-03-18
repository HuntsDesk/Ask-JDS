SELECT f.*
FROM flashcards AS f
LEFT JOIN flashcard_collections_junction AS fcj
  ON f.id = fcj.flashcard_id
WHERE fcj.flashcard_id IS NULL;