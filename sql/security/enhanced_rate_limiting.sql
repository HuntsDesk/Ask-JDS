-- Enhanced rate limiting and security monitoring schema

-- Security violations tracking table
CREATE TABLE IF NOT EXISTS security_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL CHECK (violation_type IN ('csp', 'rate_limit', 'auth_failure', 'suspicious_activity')),
  document_uri TEXT,
  violated_directive TEXT,
  blocked_uri TEXT,
  source_file TEXT,
  line_number INTEGER,
  column_number INTEGER,
  client_ip INET,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  raw_report JSONB,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  investigated BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Rate limits tracking table with enhanced features
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Enhanced rate limit function with security monitoring
CREATE OR REPLACE FUNCTION check_rate_limit_enhanced(
  p_user_id UUID,
  p_endpoint TEXT,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  request_count INTEGER;
  rate_limit INTEGER;
  user_tier TEXT;
  is_suspicious BOOLEAN := FALSE;
  recent_violations INTEGER;
BEGIN
  -- Get user tier from existing subscription system
  SELECT CASE 
    WHEN sub.status = 'active' AND sub.current_period_end > NOW() THEN
      CASE 
        WHEN sub.stripe_price_id LIKE '%unlimited%' THEN 'unlimited'
        WHEN sub.stripe_price_id LIKE '%premium%' THEN 'premium'
        ELSE 'free'
      END
    ELSE 'free'
  END INTO user_tier
  FROM user_subscriptions sub 
  WHERE sub.user_id = p_user_id 
  ORDER BY sub.created_at DESC 
  LIMIT 1;
  
  -- Set endpoint-specific limits based on tier
  rate_limit := CASE 
    WHEN user_tier = 'unlimited' THEN
      CASE 
        WHEN p_endpoint = 'chat' THEN 10000
        WHEN p_endpoint = 'payment' THEN 20
        WHEN p_endpoint = 'admin' THEN 1000
        ELSE 5000
      END
    WHEN user_tier = 'premium' THEN
      CASE 
        WHEN p_endpoint = 'chat' THEN 1000
        WHEN p_endpoint = 'payment' THEN 10
        WHEN p_endpoint = 'admin' THEN 0  -- No admin access
        ELSE 500
      END
    ELSE -- free tier
      CASE 
        WHEN p_endpoint = 'chat' THEN 10  -- Monthly limit handled separately
        WHEN p_endpoint = 'payment' THEN 5
        WHEN p_endpoint = 'admin' THEN 0  -- No admin access
        ELSE 100
      END
  END;
  
  -- Calculate current window
  current_window := date_trunc('hour', NOW()) + 
    (EXTRACT(MINUTE FROM NOW())::INTEGER / p_window_minutes) * 
    (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check for recent violations from this IP/user
  SELECT COUNT(*) INTO recent_violations
  FROM security_violations
  WHERE (user_id = p_user_id OR client_ip = p_client_ip)
  AND violation_type = 'rate_limit'
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Flag as suspicious if multiple recent violations
  is_suspicious := recent_violations >= 3;
  
  -- Reduce limits for suspicious activity
  IF is_suspicious THEN
    rate_limit := GREATEST(1, rate_limit / 4);
  END IF;
  
  -- Upsert rate limit record
  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, client_ip, user_agent)
  VALUES (p_user_id, p_endpoint, 1, current_window, p_client_ip, p_user_agent)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = NOW(),
    client_ip = COALESCE(p_client_ip, rate_limits.client_ip),
    user_agent = COALESCE(p_user_agent, rate_limits.user_agent)
  RETURNING request_count INTO request_count;
  
  -- Log rate limit violation if exceeded
  IF request_count > rate_limit THEN
    INSERT INTO security_violations (
      violation_type, user_id, endpoint, client_ip, user_agent,
      raw_report, severity
    ) VALUES (
      'rate_limit', p_user_id, p_endpoint, p_client_ip, p_user_agent,
      jsonb_build_object(
        'request_count', request_count,
        'rate_limit', rate_limit,
        'tier', user_tier,
        'window_start', current_window,
        'is_suspicious', is_suspicious
      ),
      CASE WHEN request_count > rate_limit * 2 THEN 'high' ELSE 'medium' END
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', request_count <= rate_limit,
    'current_count', request_count,
    'limit', rate_limit,
    'tier', user_tier,
    'is_suspicious', is_suspicious,
    'reset_time', current_window + (p_window_minutes || ' minutes')::INTERVAL,
    'window_start', current_window
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_violations_type_created ON security_violations(violation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_violations_ip_created ON security_violations(client_ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_violations_user_created ON security_violations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint_window ON rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_created ON rate_limits(client_ip, created_at DESC);

-- Enable RLS
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage security violations" ON security_violations
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view security violations" ON security_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rate limits" ON rate_limits
  USING (auth.jwt() ->> 'role' = 'service_role'); 