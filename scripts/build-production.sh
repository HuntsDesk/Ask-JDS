#!/bin/bash

# Production build script with all optimizations and sanitization

echo "🏗️  Starting production build process..."
echo "================================"

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist_askjds dist_jdsimplified dist_admin

# Step 2: Run type checking
echo "📝 Running type check..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed! Please fix TypeScript errors before building."
  exit 1
fi

# Step 3: Build all domains
echo "🔨 Building all domains..."
echo "  - Building Ask JDS..."
npm run build:askjds
if [ $? -ne 0 ]; then
  echo "❌ Ask JDS build failed!"
  exit 1
fi

echo "  - Building JD Simplified..."
npm run build:jds
if [ $? -ne 0 ]; then
  echo "❌ JD Simplified build failed!"
  exit 1
fi

echo "  - Building Admin..."
npm run build:admin
if [ $? -ne 0 ]; then
  echo "❌ Admin build failed!"
  exit 1
fi

# Step 4: Sanitize the build
echo "🔒 Sanitizing build output..."
chmod +x scripts/sanitize-build.sh
./scripts/sanitize-build.sh

# Step 5: Generate bundle analysis (optional)
if [ "$1" == "--analyze" ]; then
  echo "📊 Generating bundle analysis..."
  ANALYZE=true npm run build:askjds
fi

echo ""
echo "================================"
echo "✅ Production build complete!"
echo ""
echo "Build outputs:"
echo "  - Ask JDS: dist_askjds/"
echo "  - JD Simplified: dist_jdsimplified/"
echo "  - Admin: dist_admin/"
echo ""
echo "Next steps:"
echo "  1. Review the build verification output above"
echo "  2. Test the builds locally before deployment"
echo "  3. Deploy to your hosting provider" 