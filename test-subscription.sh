#!/bin/bash

# Script to test the subscription functionality

echo "Subscription Testing Script"
echo "=========================="
echo ""

# Check for development mode
if [ "$NODE_ENV" != "development" ]; then
  echo "WARNING: This script is intended for development use only."
  echo "Current NODE_ENV: $NODE_ENV"
fi

echo "This script will help you test subscription functionality:"
echo ""
echo "1. Enable forced subscription for development (no server calls):"
echo "   Run this in your browser console: localStorage.setItem('forceSubscription', 'true')"
echo ""
echo "2. Disable forced subscription:"
echo "   Run this in your browser console: localStorage.setItem('forceSubscription', 'false')"
echo ""
echo "3. Check current subscription force status:"
echo "   Run this in your browser console: console.log(localStorage.getItem('forceSubscription'))"
echo ""
echo "4. Manually activate subscription (requires auth token):"
echo "   JWT_TOKEN=your_auth_token ./activate-subscription.sh"
echo ""
echo "5. For a UI-based approach, visit the subscription settings page:"
echo "   Navigate to /settings/subscription and use the Subscription Testing panel"
echo ""

# Check if activate-subscription.sh is executable
if [ ! -x "./activate-subscription.sh" ]; then
  echo "Making activate-subscription.sh executable..."
  chmod +x ./activate-subscription.sh
  echo "Done."
fi

echo ""
echo "Remember to refresh the page after changing localStorage values for the changes to take effect." 