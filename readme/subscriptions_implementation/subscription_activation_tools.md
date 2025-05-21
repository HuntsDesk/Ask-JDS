# Subscription Activation Tools (Development Only)

This directory contains tools specifically designed for development and testing of the subscription system. These tools bypass normal payment flows to directly activate subscriptions for testing purposes.

## ⚠️ WARNING: DEVELOPMENT USE ONLY

These tools are intended **ONLY** for local development environments and controlled testing. They:
- Use service role keys (admin access)
- Bypass payment processing
- May circumvent security measures
- Create database records directly

**DO NOT** deploy these tools to production environments or expose them publicly.

## Available Tools

### 1. Direct SQL Update

Run this SQL in the Supabase Dashboard SQL Editor to directly update a subscription:

```sql
UPDATE user_subscriptions
SET 
    status = 'active',
    stripe_price_id = 'price_1RGYI5BAYVpTe3LyxrZuofBR',
    current_period_end = NOW() + interval '30 days',
    updated_at = NOW()
WHERE user_id = 'a3a0fd64-7c2b-4f2f-968c-5fc91e73d576';
```

### 2. Standalone HTML+JS Tool

A self-contained HTML file (`quick-subscription-activator.html`) that makes REST API calls to update subscriptions. This requires:
- Authentication token from the user's local storage
- Supabase anon key access

### 3. Minimal Edge Function

The `activate-subscription-minimal` Edge Function:
- Path: `supabase/functions/activate-subscription-minimal/index.ts`
- Accepts a simple API key for protection
- Uses service role for database operations

#### Setup Instructions

```bash
# Create function directory
mkdir -p supabase/functions/activate-subscription-minimal

# Add function file from template provided
# Set API key secret
supabase secrets set ACTIVATION_API_KEY=your-secure-api-key-here

# Deploy locally for testing
supabase functions serve activate-subscription-minimal

# Or deploy to your development environment
supabase functions deploy activate-subscription-minimal
```

## Removing These Tools

When you're ready to move to production or no longer need these tools:

1. **SQL Script**: No action needed (not persistent)
2. **HTML Tool**: Delete the file
3. **Edge Function**:
   ```bash
   # Undeploy if deployed to Supabase
   supabase functions delete activate-subscription-minimal
   
   # Remove local files
   rm -rf supabase/functions/activate-subscription-minimal
   ```
4. **Remove API Key**:
   ```bash
   supabase secrets unset ACTIVATION_API_KEY
   ```

## Security Considerations

- Never commit API keys, service role keys, or auth tokens to version control
- The HTML tool should be used locally and never served from a public website
- Ensure all tools and references are completely removed before production deployment
- Review database logs for any unauthorized access attempts 