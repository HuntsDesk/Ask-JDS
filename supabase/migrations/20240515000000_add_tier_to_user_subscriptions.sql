-- Add tier column to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'premium';

-- Comment on the tier column
COMMENT ON COLUMN user_subscriptions.tier IS 'Subscription tier (premium or unlimited)';

-- Add notification columns to course_enrollments table
ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS notification_7day_sent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_1day_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Add an index on user_id and tier for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_tier ON user_subscriptions(user_id, tier);

-- Update function to check access based on subscription tier
CREATE OR REPLACE FUNCTION has_unlimited_subscription(user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE 
      user_id = has_unlimited_subscription.user_id
      AND tier = 'unlimited'
      AND status NOT IN ('canceled', 'incomplete_expired')
      AND (
        ended_at IS NULL 
        OR ended_at > now()
      )
  );
END;
$$;

-- Update function to check if a user has access to a course
CREATE OR REPLACE FUNCTION has_course_access(user_id UUID, course_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Users with unlimited subscription have access to all courses
  IF has_unlimited_subscription(user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if the user has an active enrollment for this course
  RETURN EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE 
      user_id = has_course_access.user_id
      AND course_id = has_course_access.course_id
      AND status = 'active'
      AND expires_at > now()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_unlimited_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_course_access(UUID, UUID) TO authenticated; 