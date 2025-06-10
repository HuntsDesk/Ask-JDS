-- Create user_agreements table for tracking legal document acceptance
CREATE TABLE IF NOT EXISTS public.user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'disclaimer')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one acceptance per user per document version
  UNIQUE(user_id, document_type, version)
);

-- Enable Row Level Security
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agreements"
  ON public.user_agreements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agreements"
  ON public.user_agreements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all agreements for compliance
CREATE POLICY "Admins can view all agreements"
  ON public.user_agreements
  FOR SELECT
  USING (auth.is_admin());

-- Index for efficient lookups
CREATE INDEX idx_user_agreements_user_document ON public.user_agreements(user_id, document_type);
CREATE INDEX idx_user_agreements_version ON public.user_agreements(document_type, version);
CREATE INDEX idx_user_agreements_accepted_at ON public.user_agreements(accepted_at DESC); 