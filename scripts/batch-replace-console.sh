#!/bin/bash

# Script to batch replace console statements with logger calls

echo "Starting batch console statement replacement..."

# Array of high-priority files to process
files=(
  "src/App.tsx"
  "src/lib/auth.tsx"
  "src/lib/auth-provider.tsx"
  "src/components/auth/AuthForm.tsx"
  "src/components/auth/CombinedAuthForm.tsx"
  "src/hooks/use-threads.ts"
  "src/hooks/use-messages.ts"
  "src/hooks/useSubscription.ts"
  "src/pages/Dashboard.tsx"
  "src/pages/PricingPage.tsx"
  "src/lib/supabase.ts"
  "src/lib/stripe/client.ts"
  "src/lib/stripe/checkout.ts"
  "src/components/stripe/StripeCheckoutDialog.tsx"
  "src/components/stripe/StripePaymentForm.tsx"
  "src/hooks/use-auth-timing.ts"
  "src/hooks/use-analytics.ts"
  "src/lib/analytics/usermaven.ts"
  "src/contexts/UsermavenContext.tsx"
  "src/components/admin/ErrorLogs.tsx"
  "src/components/admin/CreateModule.tsx"
  "src/components/admin/Courses.tsx"
  "src/components/admin/CreateCourse.tsx"
  "src/components/admin/SecurityDashboard.tsx"
  "src/components/admin/Users.tsx"
  "src/components/admin/SetAdmin.tsx"
  "src/components/admin/CreateLesson.tsx"
  "src/components/admin/DiagnosticTest.tsx"
  "src/components/admin/Dashboard.tsx"
  "src/components/admin/AdminLayout.tsx"
  "src/components/admin/Flashcards.tsx"
  "src/components/admin/CourseDetail.tsx"
  "src/components/courses/CourseEnrollmentCard.tsx"
  "src/components/courses/CourseContent.tsx"
  "src/components/courses/JDSCourseCard.tsx"
  "src/components/courses/CourseSearchBar.tsx"
  "src/components/courses/AvailableCoursesPage.tsx"
  "src/pages/SettingsPage.tsx"
  "src/pages/CheckoutConfirmationPage.tsx"
  # Additional high-priority files
  "src/components/flashcards/pages/AllFlashcards.tsx"
  "src/components/settings/SubscriptionSettings.tsx"
  "src/lib/realtime-manager.ts"
  "src/components/chat/Sidebar.tsx"
  "src/components/ProtectedRoute.tsx"
  "src/components/flashcards/pages/AddCard.tsx"
  "src/components/auth/AuthPage.tsx"
  "src/components/auth/CombinedAuthPage.tsx"
  "src/components/auth/SignInForm.tsx"
  "src/components/CourseCard.tsx"
  # Next batch of files
  "src/lib/env-utils.ts"
  "src/components/admin/utilities/DiagnosticTests.tsx"
  "src/lib/ai/relay-utils.ts"
  "src/components/flashcards/FlashcardSubjects.tsx"
  "src/components/admin/utilities/BrowserDebug.tsx"
  "src/lib/vector-search.ts"
  "src/components/VideoPlayer.tsx"
  "src/lib/debug-logger.ts"
  "src/components/courses/CourseDetail.tsx"
  "src/components/admin/utilities/UsermavenDebug.tsx"
  # Final batch
  "src/components/flashcards/FlashcardModal.tsx"
  "src/components/flashcards/pages/EditCard.tsx"
  "src/components/flashcards/pages/StudyMode.tsx"
  "src/components/flashcards/UnifiedStudyMode.tsx"
  "src/components/chat/MessageList.tsx"
  "src/components/courses/CoursePage.tsx"
  "src/components/courses/LessonContent.tsx"
  "src/hooks/use-realtime.ts"
  "src/hooks/use-subscription-status.ts"
  "src/lib/stripe/utils.ts"
)

# Process each file
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Check if logger is already imported
    if ! grep -q "import { logger }" "$file"; then
      # Add logger import at the beginning of the file
      echo "Adding logger import to $file..."
      # Create a temporary file with the import
      echo "import { logger } from '@/lib/logger';" > temp_import.txt
      cat "$file" >> temp_import.txt
      mv temp_import.txt "$file"
    fi
    
    # Replace console.log with logger.debug
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    
    # Replace console.warn with logger.warn  
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    
    # Replace console.error with logger.error (simple cases)
    sed -i '' 's/console\.error(\([^,)]*\));/logger.error(\1);/g' "$file"
    
    # Replace console.error with message and error object
    sed -i '' 's/console\.error(\([^,]*\), \(.*\));/logger.error(\1, \2);/g' "$file"
    
    # Replace console.info with logger.info
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    
    # Replace console.debug with logger.debug
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    echo "✅ Processed $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "Batch replacement complete!" 