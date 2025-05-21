#!/bin/bash

# Apply Phase 1 migrations for subscription and course enrollment system
# This script applies the database migrations for Phase 1 of the implementation plan

echo "Applying Phase 1 migrations for subscription and course enrollment system..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Switch to the project root directory
cd "$(dirname "$0")/.." || exit 1

# Apply the migrations
echo "Applying migrations to local development database..."
supabase migration up

# Run verification scripts
echo "Running verification scripts..."
supabase db query -f supabase/migrations/20240601000001_verify_columns_and_rls.sql

echo "Phase 1 migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure Stripe Products and Prices in the Stripe Dashboard (Phase 2)"
echo "2. Update .env file with your Stripe Price IDs"
echo "3. Implement the webhook handler (Phase 3)"
echo ""
echo "Required environment variables to add to your .env file:"
echo "STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID=price_live_xxxxx"
echo "STRIPE_LIVE_UNLIMITED_ANNUAL_PRICE_ID=price_live_xxxxx"
echo "STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID=price_live_xxxxx"
echo "STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID=price_live_xxxxx"
echo ""
echo "And for test mode:"
echo "STRIPE_UNLIMITED_MONTHLY_PRICE_ID=price_test_xxxxx"
echo "STRIPE_UNLIMITED_ANNUAL_PRICE_ID=price_test_xxxxx"
echo "STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID=price_test_xxxxx"
echo "STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID=price_test_xxxxx"
echo ""
echo "For courses, you'll need to add price IDs for each course:"
echo "STRIPE_LIVE_COURSE_[COURSE_NAME]_PRICE_ID=price_live_xxxxx"
echo "STRIPE_COURSE_[COURSE_NAME]_PRICE_ID=price_test_xxxxx" 