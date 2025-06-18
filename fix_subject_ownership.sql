-- Fix subject with null user_id
UPDATE subjects 
SET user_id = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576'
WHERE id = 'e9ed2635-84b0-401f-8f46-fad7c3111430' 
  AND user_id IS NULL 
  AND is_official = false; 