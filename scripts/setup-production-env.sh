#!/bin/bash

# Production Environment Setup Script
# This script helps set up environment variables for production deployment

echo "🔧 Production Environment Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ No .env file found!"
  echo "Creating .env from .env.example..."
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ .env file created from template"
  else
    echo "❌ .env.example not found! Please create it first."
    exit 1
  fi
fi

# Function to prompt for environment variable
prompt_env_var() {
  local var_name=$1
  local description=$2
  local current_value=$(grep "^$var_name=" .env | cut -d '=' -f2-)
  
  echo ""
  echo "📝 $var_name"
  echo "   Description: $description"
  if [ -n "$current_value" ]; then
    echo "   Current value: [SET]"
    read -p "   Keep current value? (Y/n): " keep
    if [[ $keep =~ ^[Nn]$ ]]; then
      read -p "   New value: " new_value
      sed -i '' "s|^$var_name=.*|$var_name=$new_value|" .env
    fi
  else
    read -p "   Value: " new_value
    echo "$var_name=$new_value" >> .env
  fi
}

echo "Please provide values for the following environment variables:"
echo "(Press Enter to keep existing values)"

# Core Supabase Configuration
prompt_env_var "VITE_SUPABASE_URL" "Your Supabase project URL (https://xxx.supabase.co)"
prompt_env_var "VITE_SUPABASE_ANON_KEY" "Your Supabase anonymous/public key"

# Stripe Configuration
prompt_env_var "VITE_STRIPE_PUBLISHABLE_KEY" "Your Stripe publishable key (pk_live_xxx)"

# Analytics Configuration
prompt_env_var "VITE_USERMAVEN_KEY" "Your Usermaven analytics key (optional)"
prompt_env_var "VITE_GOOGLE_ANALYTICS_ID" "Your Google Analytics ID (optional)"

# Security Configuration
prompt_env_var "VITE_ENABLE_DEBUG_MODE" "Enable debug mode in production? (false recommended)"
prompt_env_var "VITE_CSP_REPORT_URI" "Content Security Policy report URI (optional)"

# Performance Configuration
prompt_env_var "VITE_ENABLE_SERVICE_WORKER" "Enable service worker? (true/false)"
prompt_env_var "VITE_ENABLE_PWA" "Enable Progressive Web App features? (true/false)"

echo ""
echo "🔍 Validating configuration..."

# Validate required variables
MISSING_VARS=()

check_required() {
  local var_name=$1
  if ! grep -q "^$var_name=.\\+" .env; then
    MISSING_VARS+=("$var_name")
  fi
}

check_required "VITE_SUPABASE_URL"
check_required "VITE_SUPABASE_ANON_KEY"
check_required "VITE_STRIPE_PUBLISHABLE_KEY"

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  exit 1
fi

echo "✅ All required environment variables are set"

# Add production-specific settings
echo ""
echo "📋 Adding production optimizations..."

# Ensure production mode is set
if ! grep -q "^NODE_ENV=" .env; then
  echo "NODE_ENV=production" >> .env
fi

# Disable debug mode in production
sed -i '' 's|^VITE_ENABLE_DEBUG_MODE=true|VITE_ENABLE_DEBUG_MODE=false|' .env

echo "✅ Production optimizations applied"

echo ""
echo "🎉 Production environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the .env file to ensure all values are correct"
echo "2. Run 'npm run build:production' to create optimized build"
echo "3. Run 'npm run verify-build' to check the production build"
echo "4. Deploy the contents of dist_askjds/ to your hosting provider"
echo ""
echo "⚠️  Remember to:"
echo "- Never commit .env to version control"
echo "- Set up environment variables in your hosting provider"
echo "- Enable HTTPS on your production domain"
echo "- Configure proper CORS headers"
echo "- Set up monitoring and error tracking" 