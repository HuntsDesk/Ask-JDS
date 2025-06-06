# Stripe.js Loading Fix Guide

## 🚨 Issue Identified

**Problem**: Stripe.js failing to load due to overly restrictive `Cross-Origin-Embedder-Policy: require-corp` header.

**Error**: 
```
GET https://js.stripe.com/acacia/stripe.js net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep 200 (OK)
Error: Failed to load Stripe.js
```

## 🎯 Root Cause

The CloudFront security headers policy has:
```json
"CrossOriginEmbedderPolicy": {
  "Override": true,
  "Policy": "require-corp"
}
```

This blocks Stripe.js because it doesn't include the required `Cross-Origin-Resource-Policy` header.

## 🔧 Solution Options

### Option 1: Remove COEP Header (Recommended)
- **File**: `temp/ai_sec_audit/cloudfront/enhanced_security_headers_policy.json`
- **Change**: Remove the `CrossOriginEmbedderPolicy` section entirely
- **Impact**: Maintains security while allowing Stripe.js to load

### Option 2: Use Less Restrictive COEP
- **File**: `temp/ai_sec_audit/cloudfront/enhanced_security_headers_policy_stripe_compatible.json` 
- **Change**: Use `"Policy": "credentialless"` instead of `"require-corp"`
- **Impact**: Provides some COEP protection while allowing third-party scripts

## 📋 Deployment Steps

### Step 1: Update CloudFront Policy
1. Go to AWS CloudFront console
2. Navigate to "Response headers policies"
3. Find policy: `AskJDS-SecurityPolicy-Enhanced`
4. Replace with the corrected JSON from Option 1 or 2

### Step 2: Apply to Distributions
Update the policy for all three distributions:
- **askjds.com**
- **jdsimplified.com** 
- **admin.jdsimplified.com**

### Step 3: Test
1. Clear browser cache
2. Navigate to https://askjds.com
3. Check browser console - Stripe errors should be gone
4. Test payment functionality

## 🧪 Testing Commands

```bash
# Check current headers
curl -I https://askjds.com

# Verify COEP header is removed or changed
curl -I https://askjds.com | grep -i "cross-origin-embedder-policy"

# Test Stripe.js loading directly
curl -I https://js.stripe.com/acacia/stripe.js
```

## 🔍 Verification Checklist

- [ ] CloudFront policy updated
- [ ] Policy applied to all distributions  
- [ ] Browser cache cleared
- [ ] Stripe.js loads without errors
- [ ] Payment flows work correctly
- [ ] Security headers still present (except COEP)

## 💡 Technical Explanation

**COEP `require-corp`**: Requires all cross-origin resources to explicitly opt-in with `Cross-Origin-Resource-Policy` header. Stripe.js doesn't provide this header.

**COEP `credentialless`**: Allows cross-origin resources without credentials, more compatible with third-party scripts like Stripe.js.

**No COEP**: Provides maximum compatibility while maintaining other security headers.

## 🎯 Recommended Action

**Use Option 1** (remove COEP entirely) because:
1. ✅ Fixes Stripe.js immediately
2. ✅ Maintains other security headers (CSP, HSTS, etc.)
3. ✅ Avoids future compatibility issues
4. ✅ COEP is not critical for most web applications

The CSP policy already provides strong protection against XSS and other attacks, making COEP less critical for this use case. 