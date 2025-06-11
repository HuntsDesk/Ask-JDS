#!/bin/bash

# Script to trigger GitHub Actions deployment after updating secrets

echo "🚀 Triggering deployment with updated secrets..."
echo ""
echo "⚠️  Before running this script, ensure you've updated these GitHub secrets:"
echo "   - VITE_SUPABASE_URL_DEV"
echo "   - VITE_SUPABASE_ANON_KEY_DEV"
echo ""
echo "Go to: https://github.com/HuntsDesk/Ask-JDS/settings/secrets/actions"
echo ""
read -p "Have you updated the secrets? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Creating empty commit to trigger deployment..."
    git commit --allow-empty -m "chore: Trigger deployment with updated Supabase secrets"
    
    echo "Pushing to trigger GitHub Actions..."
    git push
    
    echo ""
    echo "✅ Deployment triggered!"
    echo ""
    echo "Monitor progress at: https://github.com/HuntsDesk/Ask-JDS/actions"
    echo ""
    echo "After deployment completes, CloudFront invalidation will clear the cache."
else
    echo "❌ Deployment cancelled. Update the secrets first."
fi 