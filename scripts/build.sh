#!/bin/bash

# Ask-JDS Production Build Script
# This script handles the complete build process for Ask-JDS, including:
# - Environment setup
# - Cache cleanup
# - Dependency optimization
# - Building for all domains

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Move to project root directory
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Display header
echo -e "${MAGENTA}==================================================${NC}"
echo -e "${MAGENTA}         Ask-JDS Production Build Script         ${NC}"
echo -e "${MAGENTA}==================================================${NC}"
echo -e "${BLUE}Running from:${NC} $PROJECT_ROOT"
echo ""

# Parse command line arguments
SKIP_CLEAN=false
SKIP_CHECK=false
SKIP_LINT=false
BUILD_DOMAINS=("askjds" "jds" "admin")

for arg in "$@"; do
  case $arg in
    --skip-clean)
      SKIP_CLEAN=true
      shift
      ;;
    --skip-check)
      SKIP_CHECK=true
      shift
      ;;
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    --only=*)
      domains_arg="${arg#*=}"
      # Split by comma
      IFS=',' read -ra BUILD_DOMAINS <<< "$domains_arg"
      shift
      ;;
    *)
      # unknown option
      ;;
  esac
done

# Display build configuration
echo -e "${BLUE}Build Configuration:${NC}"
echo -e "  Skip Clean: ${YELLOW}$SKIP_CLEAN${NC}"
echo -e "  Skip Type Check: ${YELLOW}$SKIP_CHECK${NC}" 
echo -e "  Skip Lint: ${YELLOW}$SKIP_LINT${NC}"
echo -e "  Domains: ${YELLOW}${BUILD_DOMAINS[*]}${NC}"
echo ""

# Step 1: Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${RED}Error: node_modules directory not found.${NC}"
  echo -e "Please run ${CYAN}npm install${NC} first."
  exit 1
fi

# Step 2: Clean cache if not skipped
if [ "$SKIP_CLEAN" = false ]; then
  echo -e "${BLUE}[1/6] Cleaning Vite cache...${NC}"
  node scripts/clean-vite-cache.js --dist
  echo -e "${GREEN}✓ Cache cleaned${NC}"
else
  echo -e "${YELLOW}[1/6] Skipping cache cleanup${NC}"
fi

# Step 3: Validate environment
echo -e "${BLUE}[2/6] Checking environment...${NC}"
if [ ! -f ".env" ]; then
  if [ -f ".env.template" ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.template .env
    echo -e "${GREEN}✓ Created .env from template${NC}"
  else
    echo -e "${RED}Error: No .env or .env.template file found.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Step 4: Type checking
if [ "$SKIP_CHECK" = false ]; then
  echo -e "${BLUE}[3/6] Running type check...${NC}"
  npm run type-check
  echo -e "${GREEN}✓ Type check passed${NC}"
else
  echo -e "${YELLOW}[3/6] Skipping type check${NC}"
fi

# Step 5: Lint check
if [ "$SKIP_LINT" = false ]; then
  echo -e "${BLUE}[4/6] Running linter...${NC}"
  npm run lint
  echo -e "${GREEN}✓ Lint check passed${NC}"
else
  echo -e "${YELLOW}[4/6] Skipping linter${NC}"
fi

# Step 6: Optimize dependencies
echo -e "${BLUE}[5/6] Optimizing dependencies...${NC}"
FORCE_OPTIMIZE=true npx vite optimize
echo -e "${GREEN}✓ Dependencies optimized${NC}"

# Step 7: Build for each domain
echo -e "${BLUE}[6/6] Building for domains: ${YELLOW}${BUILD_DOMAINS[*]}${NC}"

for domain in "${BUILD_DOMAINS[@]}"; do
  echo -e "${CYAN}Building for domain: $domain${NC}"
  # Set environment for this domain
  node scripts/env-manager.js set "$domain"
  
  # Run the build
  npm run "build:$domain"
  
  echo -e "${GREEN}✓ Build completed for $domain${NC}"
done

# Completion
echo -e "${MAGENTA}==================================================${NC}"
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${MAGENTA}==================================================${NC}"

# List output directories
echo -e "${BLUE}Build outputs:${NC}"
for domain in "${BUILD_DOMAINS[@]}"; do
  dist_dir="dist_${domain/jds/jdsimplified}"
  if [ -d "$dist_dir" ]; then
    size=$(du -sh "$dist_dir" | cut -f1)
    echo -e "  ${YELLOW}$dist_dir${NC} (${CYAN}$size${NC})"
  else
    echo -e "  ${RED}$dist_dir not found${NC}"
  fi
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Run ${CYAN}npm run preview${NC} to preview the builds"
echo -e "  2. Deploy to your hosting provider"

exit 0 