#!/bin/bash

# Script to sanitize build output and remove exposed API keys

echo "🔒 Sanitizing build output..."

# Find all JS files in dist directories
find dist* -name "*.js" -type f | while read -r file; do
  echo "Processing: $file"
  
  # Replace any Stripe test keys with placeholders
  sed -i '' 's/pk_test_[A-Za-z0-9]\{98\}/pk_test_REDACTED/g' "$file"
  sed -i '' 's/sk_test_[A-Za-z0-9]\{98\}/sk_test_REDACTED/g' "$file"
  
  # Replace any Stripe live keys with placeholders (these should NEVER be in client code)
  sed -i '' 's/pk_live_[A-Za-z0-9]\{98\}/pk_live_REDACTED/g' "$file"
  sed -i '' 's/sk_live_[A-Za-z0-9]\{98\}/sk_live_REDACTED/g' "$file"
  
  # Replace Supabase anon keys (these are less sensitive but still good to sanitize)
  sed -i '' 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9._-]\{100,\}/SUPABASE_ANON_KEY_REDACTED/g' "$file"
  
  # Replace any other potential API keys
  sed -i '' 's/apikey=\\"[^"]\{20,\}\\"/apikey=\\"REDACTED\\"/g' "$file"
  sed -i '' 's/api_key=\\"[^"]\{20,\}\\"/api_key=\\"REDACTED\\"/g' "$file"
  sed -i '' 's/Bearer [A-Za-z0-9._-]\{40,\}/Bearer REDACTED/g' "$file"
done

echo "✅ Build sanitization complete!"

# Run the verification script to check results
if [ -f "./scripts/verify-production-build.sh" ]; then
  echo ""
  echo "Running build verification..."
  ./scripts/verify-production-build.sh
fi 