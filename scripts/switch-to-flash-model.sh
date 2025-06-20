#!/bin/bash

# Script to switch between Gemini models for testing

echo "🚀 Switching AI models..."
echo ""
echo "Current models:"
echo "- Primary (chat): gemini-2.5-pro-preview-05-06"
echo "- Secondary (titles): gemini-1.5-flash-8b"
echo ""

if [ "$1" = "flash" ]; then
    echo "Switching to FLASH model for chat responses..."
    
    # Update local development environment
    supabase functions set-env AI_MODEL_PRIMARY_DEV=jds-flash
    
    echo "✅ Switched to gemini-1.5-flash-8b for chat responses"
    echo ""
    echo "This should significantly reduce response time (1-3 seconds instead of 15-20 seconds)"
    echo ""
    echo "To switch back to the premium model, run: ./scripts/switch-to-flash-model.sh premium"
    
elif [ "$1" = "premium" ]; then
    echo "Switching back to PREMIUM model for chat responses..."
    
    # Update local development environment
    supabase functions set-env AI_MODEL_PRIMARY_DEV=jds-titan
    
    echo "✅ Switched back to gemini-2.5-pro-preview-05-06 for chat responses"
    echo ""
    echo "This provides better quality responses but may have 15-20 second delays"
    
else
    echo "Usage: ./scripts/switch-to-flash-model.sh [flash|premium]"
    echo ""
    echo "Options:"
    echo "  flash    - Use gemini-1.5-flash-8b (fast, 1-3 second response)"
    echo "  premium  - Use gemini-2.5-pro-preview-05-06 (better quality, 15-20 second delay)"
fi 