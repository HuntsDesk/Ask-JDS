-- Add status column to course_enrollments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'course_enrollments'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.course_enrollments
        ADD COLUMN status text DEFAULT 'active' NOT NULL;

        -- Recreate the index
        CREATE INDEX IF NOT EXISTS idx_course_enrollments_status 
        ON public.course_enrollments USING btree (status);
    END IF;
END $$; 