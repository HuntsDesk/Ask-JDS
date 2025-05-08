#!/bin/bash

# Phase 4 Frontend Deployment Script
# This script deploys the frontend components for Stripe integration

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Phase 4 Frontend Deployment...${NC}"

# Step 1: Make sure we have the required environment variables
echo -e "${YELLOW}Checking for required environment variables...${NC}"

required_vars=(
  "VITE_STRIPE_PUBLISHABLE_KEY"
  "VITE_STRIPE_LIVE_PUBLISHABLE_KEY"
  "VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID"
  "VITE_STRIPE_UNLIMITED_YEARLY_PRICE_ID"
  "VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID"
  "VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID"
)

missing_vars=0
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}Missing required environment variable: $var${NC}"
    missing_vars=1
  fi
done

if [ $missing_vars -eq 1 ]; then
  echo -e "${RED}Please set all required environment variables and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}All required environment variables are set.${NC}"

# Step 2: Deploy the Supabase Edge Functions for checkout and portal
echo -e "${YELLOW}Deploying Stripe checkout and customer portal Edge Functions...${NC}"

# Deploy create-checkout-session
echo -e "${YELLOW}Deploying create-checkout-session Edge Function...${NC}"
supabase functions deploy create-checkout-session --no-verify-jwt

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy create-checkout-session Edge Function.${NC}"
  exit 1
fi
echo -e "${GREEN}Successfully deployed create-checkout-session Edge Function.${NC}"

# Deploy create-customer-portal-session
echo -e "${YELLOW}Deploying create-customer-portal-session Edge Function...${NC}"
supabase functions deploy create-customer-portal-session --no-verify-jwt

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy create-customer-portal-session Edge Function.${NC}"
  exit 1
fi
echo -e "${GREEN}Successfully deployed create-customer-portal-session Edge Function.${NC}"

# Step 3: Build and deploy the frontend
echo -e "${YELLOW}Building and deploying the frontend...${NC}"

# Build the frontend
echo -e "${YELLOW}Building the frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to build the frontend.${NC}"
  exit 1
fi
echo -e "${GREEN}Successfully built the frontend.${NC}"

# Step 4: Run tests
echo -e "${YELLOW}Running tests to verify the deployment...${NC}"

# Test create-checkout-session
echo -e "${YELLOW}Testing create-checkout-session Edge Function...${NC}"
curl -i -X POST "${SUPABASE_URL}/functions/v1/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{"userId":"test", "priceId":"price_test", "mode":"subscription"}'

echo ""

# Test create-customer-portal-session
echo -e "${YELLOW}Testing create-customer-portal-session Edge Function...${NC}"
curl -i -X POST "${SUPABASE_URL}/functions/v1/create-customer-portal-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{"userId":"test"}'

echo ""

# Step 5: Final messages
echo -e "${GREEN}Phase 4 Frontend Deployment completed!${NC}"
echo -e "${YELLOW}Important Reminders:${NC}"
echo "1. Verify that the checkout flow is working correctly by making a test purchase"
echo "2. Make sure the 'userId' metadata is present in all Stripe payment related events"
echo "3. Test the customer portal functionality"
echo "4. Check that the subscription status is correctly reflected in the UI"
echo "5. Ensure that course access is properly controlled based on subscription tier"

echo -e "${GREEN}All done!${NC}"
exit 0 