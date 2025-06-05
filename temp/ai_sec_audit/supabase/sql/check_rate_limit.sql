-- SQL function to enforce rate limits by tier and endpoint
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_tier TEXT DEFAULT 'free',
  p_window_minutes INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  request_count INTEGER;
  rate_limit INTEGER;
BEGIN
  current_window := date_trunc('hour', NOW()) + (EXTRACT(MINUTE FROM NOW())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
  rate_limit := CASE 
    WHEN p_tier = 'unlimited' THEN 10000
    WHEN p_tier = 'premium' THEN 1000
    WHEN p_endpoint = 'chat' AND p_tier = 'free' THEN 10
    ELSE 100
  END;
  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, current_window)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO request_count;
  RETURN jsonb_build_object(
    'allowed', request_count <= rate_limit,
    'current_count', request_count,
    'limit', rate_limit,
    'reset_time', current_window + (p_window_minutes || ' minutes')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
