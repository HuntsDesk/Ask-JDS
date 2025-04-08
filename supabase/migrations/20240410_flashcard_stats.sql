-- Function to get flashcard statistics for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_flashcard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_count INTEGER;
    official_count INTEGER;
    user_count INTEGER;
    pitfalls_count INTEGER;
    samples_count INTEGER;
    result JSON;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM flashcards;
    
    -- Get official count
    SELECT COUNT(*) INTO official_count 
    FROM flashcards 
    WHERE is_official = TRUE;
    
    -- Get user-generated count
    SELECT COUNT(*) INTO user_count 
    FROM flashcards 
    WHERE is_official = FALSE;
    
    -- Get common pitfalls count
    SELECT COUNT(*) INTO pitfalls_count 
    FROM flashcards 
    WHERE is_common_pitfall = TRUE;
    
    -- Get public samples count
    SELECT COUNT(*) INTO samples_count 
    FROM flashcards 
    WHERE is_public_sample = TRUE;
    
    -- Construct JSON result
    result := json_build_object(
        'total', total_count,
        'official', official_count,
        'user', user_count,
        'pitfalls', pitfalls_count,
        'samples', samples_count
    );
    
    RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_flashcard_stats TO authenticated; 