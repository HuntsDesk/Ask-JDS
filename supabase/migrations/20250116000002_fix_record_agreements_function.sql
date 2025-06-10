-- Fix IP address type casting in record_user_agreements function
-- Addresses: column "ip_address" is of type inet but expression is of type text

CREATE OR REPLACE FUNCTION public.record_user_agreements(
  _user_id UUID,
  _agreements JSONB, -- Array of {document_type, version, ip_address, user_agent}
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agreement JSONB;
BEGIN
  -- Loop through each agreement and insert
  FOR agreement IN SELECT * FROM jsonb_array_elements(_agreements)
  LOOP
    INSERT INTO user_agreements (
      user_id, 
      document_type, 
      version, 
      ip_address, 
      user_agent, 
      accepted_at
    )
    VALUES (
      _user_id,
      (agreement->>'document_type')::TEXT,
      (agreement->>'version')::TEXT,
      CASE 
        WHEN COALESCE((agreement->>'ip_address')::TEXT, _ip_address) IS NOT NULL 
        THEN COALESCE((agreement->>'ip_address')::TEXT, _ip_address)::INET 
        ELSE NULL 
      END,
      COALESCE((agreement->>'user_agent')::TEXT, _user_agent),
      NOW()
    );
  END LOOP;
END;
$$; 