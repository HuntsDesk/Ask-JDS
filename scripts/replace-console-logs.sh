#!/bin/bash

# Script to find all console statements in the codebase
# This helps identify files that need logger replacement

echo "Finding all console statements in src/ directory..."
echo "================================================="

# Find all TypeScript/JavaScript files with console statements
echo -e "\n🔍 Files with console.log statements:"
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | head -20

echo -e "\n🔍 Files with console.error statements:"
grep -r "console\.error" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | head -20

echo -e "\n🔍 Files with console.warn statements:"
grep -r "console\.warn" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | head -20

echo -e "\n🔍 Files with console.debug statements:"
grep -r "console\.debug" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | head -20

echo -e "\n🔍 Files with console.info statements:"
grep -r "console\.info" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | head -20

# Count total occurrences
echo -e "\n📊 Summary:"
echo "Total console.log: $(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | wc -l)"
echo "Total console.error: $(grep -r "console\.error" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | wc -l)"
echo "Total console.warn: $(grep -r "console\.warn" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | wc -l)"
echo "Total console.debug: $(grep -r "console\.debug" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | wc -l)"
echo "Total console.info: $(grep -r "console\.info" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | wc -l)"

# List unique files that need updating
echo -e "\n📁 Unique files that need updating:"
grep -rl "console\.\(log\|error\|warn\|debug\|info\)" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "src/lib/logger.ts" | sort | uniq 