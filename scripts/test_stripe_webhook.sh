#!/bin/bash

# Test the Stripe webhook function with various event types
# This script requires the Stripe CLI to be installed and configured

echo "Running Stripe webhook tests..."

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "Error: Stripe CLI is not installed."
    echo "Please install it first: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Function to trigger an event and wait
trigger_event() {
    local event_type=$1
    local additional_params=${2:-""}
    
    echo "Triggering $event_type event..."
    stripe trigger "$event_type" $additional_params
    
    echo "Waiting 5 seconds for event processing..."
    sleep 5
    echo "----------------------------------------"
}

# Main test sequence
echo "Starting test sequence..."

# Test course purchase via payment intent
# For now, without metadata since we're having issues with the flag format
echo "1. Testing course purchase flow..."
trigger_event "payment_intent.succeeded"

# Test subscription creation
echo "2. Testing subscription creation..."
trigger_event "customer.subscription.created"

# Test subscription update
echo "3. Testing subscription update..."
trigger_event "customer.subscription.updated"

# Test successful payment
echo "4. Testing successful payment..."
trigger_event "invoice.payment_succeeded"

# Test failed payment
echo "5. Testing failed payment..."
trigger_event "invoice.payment_failed"

# Test subscription cancellation
echo "6. Testing subscription cancellation..."
trigger_event "customer.subscription.deleted"

echo ""
echo "Test sequence completed!"
echo ""
echo "Next steps:"
echo "1. Check the Supabase logs to verify event processing"
echo "2. Check the database for updated records"
echo ""

exit 0 