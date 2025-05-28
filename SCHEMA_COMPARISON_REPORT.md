# Schema Comparison Report: DEV vs PROD

**Date:** May 27, 2025  
**Databases Compared:**
- **DEV:** `prbbuxgirnecbkpdpgcb.supabase.co`
- **PROD:** `yzlttnioypqmkhachfor.supabase.co`

## 🎯 Executive Summary

The production database schema has been successfully applied and **all critical functions and tables exist**. However, there are **significant security differences** that need immediate attention.

### ✅ What's Working
- All major tables exist in both environments
- All critical functions are present and functional
- All trigger functions exist
- Basic application functionality should work

### ⚠️ Critical Issues Found
1. **RLS (Row Level Security) policies are disabled in PRODUCTION**
2. **Function overloading issue in DEVELOPMENT**
3. **Missing `prompts` table in both environments**

---

## 📊 Detailed Findings

### 1. Table Comparison
| Table | DEV | PROD | Status |
|-------|-----|------|--------|
| profiles | ✅ | ✅ | ✅ Identical |
| messages | ✅ | ✅ | ✅ Identical |
| threads | ✅ | ✅ | ✅ Identical |
| courses | ✅ | ✅ | ✅ Identical |
| lessons | ✅ | ✅ | ✅ Identical |
| user_subscriptions | ✅ | ✅ | ✅ Identical |
| course_enrollments | ✅ | ✅ | ✅ Identical |
| flashcards | ✅ | ✅ | ✅ Identical |
| collections | ✅ | ✅ | ✅ Identical |
| ai_settings | ✅ | ✅ | ✅ Identical |
| **prompts** | ❌ | ❌ | ⚠️ Missing in both |
| models | ✅ | ✅ | ✅ Identical |
| subjects | ✅ | ✅ | ✅ Identical |
| modules | ✅ | ✅ | ✅ Identical |
| lesson_progress | ✅ | ✅ | ✅ Identical |
| message_counts | ✅ | ✅ | ✅ Identical |
| user_entitlements | ✅ | ✅ | ✅ Identical |
| document_chunks | ✅ | ✅ | ✅ Identical |

### 2. Function Comparison
| Function | DEV | PROD | Notes |
|----------|-----|------|-------|
| is_admin | ⚠️ Overload conflict | ✅ Working | DEV has function overloading issue |
| has_entitlement | ✅ | ✅ | Both working |
| create_course_enrollment | ✅ | ✅ | Both working |
| increment_user_message_count | ✅ | ✅ | Both working |
| get_user_message_count | ✅ | ✅ | Both working |
| has_course_access | ✅ | ✅ | Both working |
| ensure_profile_exists | ✅ | ✅ | Both working |
| handle_new_user | ✅ | ✅ | Both working |
| update_updated_at_column | ✅ | ✅ | Both working |
| create_first_admin | ✅ | ✅ | Both working |
| upgrade_to_admin | ✅ | ✅ | Both working |
| get_flashcard_stats | ✅ | ✅ | Both working |
| get_total_users | ✅ | ✅ | Both working |
| get_active_users_24h | ✅ | ✅ | Both working |
| debug_auth_uid | ✅ | ✅ | Both working |
| has_any_admin | ✅ | ✅ | Both working |

**All other functions tested successfully in both environments.**

### 3. RLS (Row Level Security) Analysis

#### 🚨 **CRITICAL SECURITY ISSUE: RLS DISABLED IN PRODUCTION**

| Table | DEV RLS | PROD RLS | Security Impact |
|-------|---------|----------|-----------------|
| profiles | ✅ Enabled | ❌ **DISABLED** | 🔴 **HIGH RISK** - User data exposed |
| messages | ✅ Enabled | ❌ **DISABLED** | 🔴 **HIGH RISK** - Private messages exposed |
| threads | ✅ Enabled | ❌ **DISABLED** | 🔴 **HIGH RISK** - Conversation data exposed |
| user_subscriptions | ✅ Enabled | ❌ **DISABLED** | 🔴 **HIGH RISK** - Payment data exposed |
| flashcards | ✅ Enabled | ❌ **DISABLED** | 🟡 **MEDIUM RISK** - User content exposed |
| collections | ✅ Enabled | ❌ **DISABLED** | 🟡 **MEDIUM RISK** - User content exposed |
| subjects | ✅ Enabled | ❌ **DISABLED** | 🟡 **MEDIUM RISK** - User data exposed |
| lesson_progress | ✅ Enabled | ❌ **DISABLED** | 🟡 **MEDIUM RISK** - User progress exposed |
| user_entitlements | ✅ Enabled | ❌ **DISABLED** | 🔴 **HIGH RISK** - Access control bypassed |

#### Tables with RLS disabled in both environments (expected):
- courses (public data)
- lessons (public data)
- course_enrollments (public data)
- ai_settings (public data)
- models (public data)
- modules (public data)
- message_counts (public data)
- document_chunks (public data)

### 4. Trigger Functions
✅ **All trigger functions exist and are working in both environments:**
- ensure_profile_before_thread_insert
- set_flashcard_creator_trigger
- set_profiles_updated_at
- handle_new_user_trigger
- handle_updated_at_trigger
- increment_message_count_trigger
- log_slow_query_trigger
- ensure_single_active_ai_setting_trigger
- ensure_single_active_prompt_trigger
- handle_new_user_subscription_trigger
- handle_updated_at_profile_trigger

---

## 🚨 Immediate Action Required

### 1. **URGENT: Enable RLS Policies in Production**

The production database has **RLS policies disabled** for critical tables containing sensitive user data. This is a **major security vulnerability**.

**Tables needing RLS enabled:**
- `profiles`
- `messages`
- `threads`
- `user_subscriptions`
- `flashcards`
- `collections`
- `subjects`
- `lesson_progress`
- `user_entitlements`

### 2. **Fix Function Overloading in Development**

The `is_admin` function in development has an overloading conflict:
```
"Could not choose the best candidate function between: public.is_admin(), public.is_admin(user_id => uuid)"
```

### 3. **Create Missing `prompts` Table**

The `prompts` table is missing in both environments but may be referenced by functions.

---

## 📋 Recommended Next Steps

### Priority 1: Security (URGENT)
1. **Enable RLS on production tables** - Run RLS policy creation scripts
2. **Test RLS policies** - Verify they work correctly
3. **Audit access patterns** - Check if any unauthorized access occurred

### Priority 2: Function Issues
1. **Fix `is_admin` overloading** in development
2. **Create `prompts` table** if needed by the application

### Priority 3: Verification
1. **Run comprehensive tests** on production
2. **Monitor application logs** for any issues
3. **Verify all user flows** work correctly

---

## 📁 Supporting Files

Detailed analysis files have been saved to:
- `/tmp/schema_comparison_1748401233/` - Function and table analysis
- `/tmp/rls_comparison_1748401270/` - RLS policy testing results

---

## ✅ Conclusion

The production database schema migration was **successful** in terms of structure and functionality. However, **critical security policies (RLS) are disabled**, creating a significant security vulnerability that must be addressed immediately.

**Status:** 🟡 **FUNCTIONAL BUT INSECURE** - Immediate security fixes required. 