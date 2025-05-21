#!/bin/bash

# Deploy the Stripe webhook function to Supabase
# This script deploys the Stripe webhook edge function for handling subscription and course enrollment events

echo "Deploying Stripe webhook function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Switch to the project root directory
cd "$(dirname "$0")/.." || exit 1

# Check if the function exists
if [ ! -d "./supabase/functions/stripe-webhook" ]; then
    echo "Error: stripe-webhook function not found in supabase/functions directory."
    exit 1
fi

# Deploy the function
echo "Deploying stripe-webhook function to Supabase..."
supabase functions deploy stripe-webhook

# Verify deployment
if [ $? -eq 0 ]; then
    echo "✅ stripe-webhook function deployed successfully!"
    
    # Get project details to show the webhook URL
    PROJECT_REF=$(supabase status | grep "Reference ID" | cut -d ':' -f 2 | tr -d ' ')
    
    if [ -n "$PROJECT_REF" ]; then
        echo ""
        echo "Webhook URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
        echo ""
        echo "Make sure to configure this URL in your Stripe dashboard:"
        echo "- Test mode: https://dashboard.stripe.com/test/webhooks"
        echo "- Live mode: https://dashboard.stripe.com/webhooks"
    fi
else
    echo "❌ Failed to deploy stripe-webhook function."
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Test the webhook with test events using the Stripe CLI:"
echo "   stripe trigger payment_intent.succeeded"
echo ""
echo "2. Monitor logs in the Supabase dashboard to verify event processing."
echo ""

exit 0 