-- Add the missing get_course_statistics function
CREATE OR REPLACE FUNCTION public.get_course_statistics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    course_count INTEGER;
    module_count INTEGER;
    lesson_count INTEGER;
    published_course_count INTEGER;
    draft_course_count INTEGER;
    result JSON;
BEGIN
    -- Check if the executing user is an admin
    IF NOT auth.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can view course statistics';
    END IF;

    -- Get course count
    SELECT COUNT(*) INTO course_count FROM courses;
    
    -- Get module count
    SELECT COUNT(*) INTO module_count FROM modules;
    
    -- Get lesson count
    SELECT COUNT(*) INTO lesson_count FROM lessons;
    
    -- Get published course count
    SELECT COUNT(*) INTO published_course_count 
    FROM courses 
    WHERE status = 'Published';
    
    -- Get draft course count
    SELECT COUNT(*) INTO draft_course_count 
    FROM courses 
    WHERE status = 'Draft';
    
    -- Construct JSON result
    result := json_build_object(
        'course_count', course_count,
        'module_count', module_count,
        'lesson_count', lesson_count,
        'published_count', published_course_count,
        'draft_count', draft_course_count
    );
    
    RETURN result;
END;
$$;

ALTER FUNCTION public.get_course_statistics() OWNER TO postgres;

COMMENT ON FUNCTION public.get_course_statistics() IS 'Returns statistics about courses, modules, and lessons for the admin dashboard'; 