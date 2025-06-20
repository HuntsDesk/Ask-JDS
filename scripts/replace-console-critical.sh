#!/bin/bash

# Script to replace console statements in critical files that appear in production build

echo "Replacing console statements in critical files..."

# Critical files that are causing console statements in the build
critical_files=(
  # Hooks with many console statements
  "src/hooks/use-query-threads.ts"
  "src/hooks/use-query-flashcards.ts"
  "src/hooks/use-cached-data.ts"
  "src/hooks/usePricing.ts"
  "src/hooks/use-persisted-state.ts"
  "src/hooks/use-settings.ts"
  "src/hooks/useAuthErrorDetection.ts"
  "src/hooks/useFlashcardRelationships.ts"
  
  # Components that appear in build output
  "src/components/courses/CoursesPage.tsx"
  "src/components/flashcards/FlashcardsPage.tsx"
  
  # JDS simplified files
  "jdsimplified/src/pages/Courses.tsx"
  "jdsimplified/src/pages/Dashboard.tsx"
  "jdsimplified/src/pages/Account.tsx"
  "jdsimplified/src/hooks/useCourseData.ts"
)

# Process each file
for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Check if logger is already imported
    if ! grep -q "import { logger }" "$file"; then
      echo "Adding logger import to $file..."
      # Create a temporary file with the import
      echo "import { logger } from '@/lib/logger';" > temp_import.txt
      cat "$file" >> temp_import.txt
      mv temp_import.txt "$file"
    fi
    
    # Replace console statements
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    echo "✅ Processed $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "Critical file replacement complete!" 