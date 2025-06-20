#!/bin/bash

# Script to find all remaining console statements and generate a report

echo "🔍 Finding remaining console statements..."
echo "================================"
echo ""

# Count total console statements by type
total_log=$(grep -r "console\.log" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
total_error=$(grep -r "console\.error" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
total_warn=$(grep -r "console\.warn" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
total_debug=$(grep -r "console\.debug" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
total_info=$(grep -r "console\.info" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)

total_all=$((total_log + total_error + total_warn + total_debug + total_info))

echo "📊 Console Statement Summary:"
echo "  console.log:   $total_log"
echo "  console.error: $total_error"
echo "  console.warn:  $total_warn"
echo "  console.debug: $total_debug"
echo "  console.info:  $total_info"
echo "  ---------------------"
echo "  TOTAL:         $total_all"
echo ""

# Find files with the most console statements
echo "📁 Top 10 files with most console statements:"
grep -r "console\." src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | 
  cut -d: -f1 | 
  sort | 
  uniq -c | 
  sort -rn | 
  head -10 | 
  awk '{printf "  %3d statements: %s\n", $1, $2}'
echo ""

# Generate a file list for batch processing
echo "📝 Generating file list for batch processing..."
grep -r "console\." src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | 
  cut -d: -f1 | 
  sort | 
  uniq > console-files.txt

file_count=$(wc -l < console-files.txt)
echo "Found $file_count files containing console statements"
echo "File list saved to: console-files.txt"
echo ""

# Show sample files for next batch
echo "🎯 Suggested files for next batch replacement:"
head -20 console-files.txt | while read -r file; do
  count=$(grep -c "console\." "$file")
  echo "  - $file ($count statements)"
done

echo ""
echo "================================"
echo "✅ Analysis complete!"
echo ""
echo "Next steps:"
echo "  1. Add high-priority files to scripts/batch-replace-console.sh"
echo "  2. Run: npm run replace-console"
echo "  3. Test the application after replacements"
echo "  4. Commit changes and repeat until all console statements are replaced" 