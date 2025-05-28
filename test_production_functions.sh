#!/bin/bash

echo "Testing Production Functions"
echo "==========================="
echo ""

PROD_URL="https://yzlttnioypqmkhachfor.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bHR0bmlveXBxbWtoYWNoZm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM1OTgwNiwiZXhwIjoyMDYzOTM1ODA2fQ.mcugcjohcOVjIlI3KXGBImpPC9swMac1TUeEeqLHGFg"

echo "Testing is_admin function in production..."
echo ""

# Test the is_admin function without parameters
echo "1. Testing is_admin() without parameters:"
response1=$(curl -s \
    -H "apikey: $PROD_KEY" \
    -H "Authorization: Bearer $PROD_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$PROD_URL/rest/v1/rpc/is_admin")

echo "Response: $response1"
echo ""

# Test the is_admin function with a UUID parameter
echo "2. Testing is_admin(uuid) with null parameter:"
response2=$(curl -s \
    -H "apikey: $PROD_KEY" \
    -H "Authorization: Bearer $PROD_KEY" \
    -H "Content-Type: application/json" \
    -d '{"user_id": null}' \
    "$PROD_URL/rest/v1/rpc/is_admin")

echo "Response: $response2"
echo ""

# Test other functions that should exist
echo "3. Testing has_entitlement function:"
response3=$(curl -s \
    -H "apikey: $PROD_KEY" \
    -H "Authorization: Bearer $PROD_KEY" \
    -H "Content-Type: application/json" \
    -d '{"feature_name": "test"}' \
    "$PROD_URL/rest/v1/rpc/has_entitlement")

echo "Response: $response3"
echo ""

# Check if we can see available RPC functions
echo "4. Checking available RPC endpoints:"
rpc_response=$(curl -s \
    -H "apikey: $PROD_KEY" \
    -H "Authorization: Bearer $PROD_KEY" \
    "$PROD_URL/rest/v1/rpc")

echo "RPC endpoints response: $rpc_response"
echo ""

echo "Test complete!" 