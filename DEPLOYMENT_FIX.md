# Production Deployment Fix

## Problem
Production is serving old JavaScript bundles with an outdated Supabase anon key, causing authentication failures.

## Root Cause
- Local `.env` has correct key: `iat: 1748459362` (May 2025)
- Production bundles have old key: `iat: 1739466550` (January 2024)
- The deployment pipeline is not using the updated environment variables

## Fix Checklist

### 1. Verify Deployment Environment Variables
Ensure your deployment platform (Vercel, Netlify, etc.) has these environment variables:
```
VITE_SUPABASE_URL=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTkzNjIsImV4cCI6MjA2NDAzNTM2Mn0.WFvJN-61K6z7RHwjiybC7kq1zVIK6DgvhKlXWCzbnh8
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51Qzlw7BdYlmFidIZLER0X4zFUgPsxSYHjZy55rmq3QFBKATeIam0f21npAlF4evbfijTTUsjiJI2weV6tdMj5xZo00LHBEwH6x
```

### 2. Force a Fresh Build
- Clear build cache in your deployment platform
- Trigger a new deployment
- Ensure build logs show the environment variables being used

### 3. Clear CDN Caches
If using Cloudflare or another CDN:
- Purge all caches
- Or specifically purge JavaScript files: `*.js`

### 4. Verify After Deployment
Check that the new build is live:
```javascript
// In browser console on production site:
// Should show iat: 1748459362 (not 1739466550)
```

### 5. Common Deployment Platforms

#### GitHub Actions (YOUR SETUP)
Your deployment uses GitHub Actions with S3/CloudFront. The workflow uses these secrets:
- `VITE_SUPABASE_URL_DEV`
- `VITE_SUPABASE_ANON_KEY_DEV`

**To fix:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Update these secrets:
   - `VITE_SUPABASE_URL_DEV`: `https://prbbuxgirnecbkpdpgcb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY_DEV`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTkzNjIsImV4cCI6MjA2NDAzNTM2Mn0.WFvJN-61K6z7RHwjiybC7kq1zVIK6DgvhKlXWCzbnh8`
3. Trigger new deployment:
   ```bash
   git commit --allow-empty -m "chore: Trigger deployment with updated secrets"
   git push
   ```

#### Vercel
1. Go to Project Settings → Environment Variables
2. Update `VITE_SUPABASE_ANON_KEY` with the new value
3. Trigger redeploy from Deployments tab

#### Netlify
1. Go to Site Settings → Environment Variables
2. Update `VITE_SUPABASE_ANON_KEY` with the new value
3. Clear cache and deploy: Deploy Settings → Trigger Deploy → Clear cache and deploy site

## Testing
After deployment, check browser console for:
- No WebSocket errors with old key (iat: 1739466550)
- WebSocket URLs should use new key (iat: 1748459362)
- Successful authentication without "Invalid API key" errors
- `Initializing Supabase client` should show correct URL and key

## Quick Check
In browser console on production:
```javascript
// This will show which key is being used
console.log(window.location.href);
// Look at WebSocket URLs - they should NOT contain the old key 