# Push Instructions for Supabase JS Upgrade

## Local Changes Ready

The changes to upgrade Supabase JS from 2.38.0 to 2.39.3 in Edge Functions are ready in the `supabase-js-upgrade` branch.

## Before Pushing

1. Ensure you've completed the testing outlined in the checklist:
   ```
   cat supabase-js-upgrade-checklist.md
   ```

2. Review the summary of changes:
   ```
   cat supabase-js-upgrade-summary.md
   ```

## Push to Remote

Once you're satisfied with the testing, push the branch to the remote repository:

```bash
git push origin supabase-js-upgrade
```

## Create Pull Request

1. Go to the repository on GitHub/GitLab
2. Create a new Pull Request from the `supabase-js-upgrade` branch
3. Include a summary of the changes from the upgrade summary document
4. Request a review from the team

## After Merge

After the PR is approved and merged:

1. Deploy the Edge Functions to production:
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy stripe-webhook
   supabase functions deploy create-checkout-session
   supabase functions deploy create-customer-portal-session
   supabase functions deploy delete-flashcard
   supabase functions deploy chat-google
   supabase functions deploy chat-openai
   ```

2. Verify production functionality using the test script:
   ```bash
   cd scripts
   npm install
   npm run test-edge-functions
   ``` 