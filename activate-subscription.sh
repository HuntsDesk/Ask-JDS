#!/bin/bash

# Script to manually activate a subscription using the Supabase Edge Function

# Configuration
SUPABASE_URL=${SUPABASE_URL:-"https://vcijgzmgbpwvzprvrlrx.supabase.co"}
PRICE_ID=${1:-"price_1RGYI5BAYVpTe3LyxrZuofBR"} # Default to premium subscription

# Get auth token from local storage if running in browser environment
if [ -z "$JWT_TOKEN" ]; then
  echo "No JWT_TOKEN provided. You need to provide your authentication token."
  echo "Usage: JWT_TOKEN=your_auth_token ./activate-subscription.sh [price_id]"
  exit 1
fi

# Make the request to the Edge Function
echo "Activating subscription with price ID: $PRICE_ID"
echo "Using Supabase URL: $SUPABASE_URL"

curl -v "${SUPABASE_URL}/functions/v1/activate-subscription" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"priceId\":\"${PRICE_ID}\"}"

echo ""
echo "Subscription activation request sent. Check console for results." 