#!/bin/bash

# Production Build Verification Script
# Ensures the build is production-ready

echo "🔍 Verifying Production Build..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if build is valid
BUILD_VALID=true

# Function to check for console statements in build
check_console_statements() {
  echo -e "\n🔍 Checking for console statements in build..."
  
  if [ -d "dist" ]; then
    # Count console statements in built files (excluding console.error and console.warn which may be legitimate)
    CONSOLE_COUNT=$(grep -r "console\.\(log\|debug\|info\|trace\)" dist/ --include="*.js" | wc -l)
    
    if [ $CONSOLE_COUNT -gt 10 ]; then
      echo -e "${RED}❌ Found $CONSOLE_COUNT console statements in production build!${NC}"
      echo "   This indicates debug code was not properly stripped."
      echo "   Showing first 5 occurrences:"
      grep -r "console\.\(log\|debug\|info\|trace\)" dist/ --include="*.js" | head -5
      BUILD_VALID=false
    elif [ $CONSOLE_COUNT -gt 0 ]; then
      echo -e "${YELLOW}⚠️  Found $CONSOLE_COUNT console statements in production build${NC}"
      echo "   Consider removing these for optimal production performance"
    else
      echo -e "${GREEN}✅ No console statements found in build${NC}"
    fi
  else
    echo -e "${RED}❌ Build directory 'dist' not found!${NC}"
    BUILD_VALID=false
  fi
}

# Function to check bundle sizes
check_bundle_sizes() {
  echo -e "\n📦 Checking bundle sizes..."
  
  if [ -d "dist/assets" ]; then
    # Find large JavaScript files (> 500KB)
    LARGE_FILES=$(find dist/assets -name "*.js" -size +500k)
    
    if [ ! -z "$LARGE_FILES" ]; then
      echo -e "${YELLOW}⚠️  Found large JavaScript files:${NC}"
      for file in $LARGE_FILES; do
        SIZE=$(du -h "$file" | cut -f1)
        echo "   $file ($SIZE)"
      done
      echo "   Consider code splitting or lazy loading"
    else
      echo -e "${GREEN}✅ All JavaScript bundles are reasonably sized${NC}"
    fi
    
    # Calculate total bundle size
    TOTAL_SIZE=$(du -sh dist/assets | cut -f1)
    echo "   Total assets size: $TOTAL_SIZE"
  fi
}

# Function to check for development dependencies
check_dev_dependencies() {
  echo -e "\n📚 Checking for development dependencies in bundle..."
  
  if [ -d "dist" ]; then
    # Look for common dev dependencies that shouldn't be in production
    DEV_DEPS=("react-devtools" "@testing-library" "enzyme" "jest" "webpack-dev-server")
    
    for dep in "${DEV_DEPS[@]}"; do
      if grep -r "$dep" dist/ --include="*.js" > /dev/null 2>&1; then
        echo -e "${RED}❌ Found development dependency '$dep' in production build!${NC}"
        BUILD_VALID=false
      fi
    done
    
    if [ "$BUILD_VALID" = true ]; then
      echo -e "${GREEN}✅ No development dependencies found in build${NC}"
    fi
  fi
}

# Function to check for exposed API keys
check_api_keys() {
  echo -e "\n🔑 Checking for exposed API keys..."
  
  KEYS_FOUND=false
  
  if [ -d "dist" ]; then
    # Look for real Stripe SECRET keys (not publishable keys or masked ones)
    if grep -r "sk_test_[A-Za-z0-9]\{20,\}\|sk_live_[A-Za-z0-9]\{20,\}" dist/ --include="*.js" > /dev/null 2>&1; then
      echo -e "${RED}❌ Found Stripe SECRET key in build!${NC}"
      KEYS_FOUND=true
      BUILD_VALID=false
    fi
    
    # Check for publishable keys (these are OK to have in the build)
    if grep -r "pk_test_[A-Za-z0-9]\{20,\}\|pk_live_[A-Za-z0-9]\{20,\}" dist/ --include="*.js" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Found Stripe publishable keys (this is OK)${NC}"
    fi
    
    # Look for Google API keys
    if grep -r "AIzaSy[A-Za-z0-9_-]\{33\}" dist/ --include="*.js" > /dev/null 2>&1; then
      echo -e "${RED}❌ Found potential Google API key in build!${NC}"
      KEYS_FOUND=true
      BUILD_VALID=false
    fi
    
    # Look for generic API key patterns (but not common property names)
    if grep -r "\(api_key\|apikey\|api-key\)[ ]*[:=][ ]*[\"'][A-Za-z0-9]\{20,\}[\"']" dist/ --include="*.js" > /dev/null 2>&1; then
      echo -e "${RED}❌ Found potential API key in build!${NC}"
      KEYS_FOUND=true
      BUILD_VALID=false
    fi
    
    if [ "$KEYS_FOUND" = false ]; then
      echo -e "${GREEN}✅ No exposed API keys found${NC}"
    fi
  fi
}

# Function to check source maps
check_source_maps() {
  echo -e "\n🗺️  Checking source maps..."
  
  if [ -d "dist" ]; then
    MAP_COUNT=$(find dist -name "*.map" | wc -l)
    
    if [ $MAP_COUNT -gt 0 ]; then
      echo -e "${YELLOW}⚠️  Found $MAP_COUNT source map files${NC}"
      echo "   Consider removing source maps for production or using external source map service"
    else
      echo -e "${GREEN}✅ No source maps in build${NC}"
    fi
  fi
}

# Function to check environment variables
check_env_vars() {
  echo -e "\n🌍 Checking environment configuration..."
  
  # Check if .env exists
  if [ -f ".env" ]; then
    # Check for debug mode
    if grep -q "VITE_DEBUG_MODE=true" .env; then
      echo -e "${RED}❌ Debug mode is enabled in .env!${NC}"
      BUILD_VALID=false
    fi
    
    # Check for development NODE_ENV
    if grep -q "NODE_ENV=development" .env; then
      echo -e "${RED}❌ NODE_ENV is set to development!${NC}"
      BUILD_VALID=false
    fi
    
    echo -e "${GREEN}✅ Environment configuration looks good${NC}"
  else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
  fi
}

# Run all checks
check_console_statements
check_bundle_sizes
check_dev_dependencies
check_api_keys
check_source_maps
check_env_vars

# Final verdict
echo -e "\n================================"
if [ "$BUILD_VALID" = true ]; then
  echo -e "${GREEN}✅ Production build verification PASSED!${NC}"
  exit 0
else
  echo -e "${RED}❌ Production build verification FAILED!${NC}"
  echo "Please fix the issues above before deploying to production."
  exit 1
fi 