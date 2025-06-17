-- Populate display pricing data for existing records
-- This migration updates existing stripe_price_mappings records with display pricing

-- Update existing records with current display pricing based on tier
UPDATE stripe_price_mappings 
SET 
  display_price_cents = CASE 
    WHEN tier_name = 'Premium' THEN 1000  -- $10.00
    WHEN tier_name = 'Unlimited' THEN 3000 -- $30.00
    ELSE NULL
  END,
  display_currency = 'USD'
WHERE display_price_cents IS NULL;

-- Add a comment for documentation
COMMENT ON COLUMN stripe_price_mappings.display_price_cents IS 'Price in cents for frontend display (e.g., 1000 = $10.00)';
COMMENT ON COLUMN stripe_price_mappings.display_currency IS 'Currency code for display pricing (e.g., USD, EUR, GBP)'; 