-- Add RLS policies for the course_subjects table
-- This allows admins to manage course-subject relationships

-- Enable RLS on the course_subjects table if not already enabled
ALTER TABLE IF EXISTS course_subjects ENABLE ROW LEVEL SECURITY;

-- Policy for admins to select course_subjects (view all course-subject relationships)
CREATE POLICY "Admins can view all course-subject relationships" 
ON course_subjects
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Policy for admins to insert course_subjects (create new course-subject relationships)
CREATE POLICY "Admins can create course-subject relationships" 
ON course_subjects
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Policy for admins to update course_subjects (modify existing course-subject relationships)
CREATE POLICY "Admins can update course-subject relationships" 
ON course_subjects
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Policy for admins to delete course_subjects (remove course-subject relationships)
CREATE POLICY "Admins can delete course-subject relationships" 
ON course_subjects
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Additionally, add policy for users to view course subjects for published courses
CREATE POLICY "Users can view subjects for published courses" 
ON course_subjects
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_subjects.course_id
    AND c.status = 'Published'
  )
); 