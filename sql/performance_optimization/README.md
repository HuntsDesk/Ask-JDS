# Supabase RLS Performance Optimization

This directory contains SQL migrations to resolve 111 Performance Advisor warnings in Supabase by optimizing Row Level Security (RLS) policies and removing duplicate indexes.

## Problem Summary

The Supabase Performance Advisor identified:
- **67 Auth RLS Initialization Plan warnings**: Direct `auth.*()` function calls causing per-row re-evaluation
- **43 Multiple Permissive Policies warnings**: Redundant policies causing evaluation overhead  
- **1 Duplicate Index warning**: Identical embedding indexes on `document_chunks`

## Solution Strategy

### Phase 1: Auth Function Wrapping (Immediate High-Impact)
**File**: `migrations/001_auth_function_wrapping.sql`  
**Impact**: Fixes 67 warnings immediately  
**Risk**: Low - mechanical transformation  

Wraps all direct auth function calls with `(select ...)` syntax:
- `auth.uid()` → `(select auth.uid())`
- `auth.is_admin()` → `(select auth.is_admin())`  
- `auth.role()` → `(select auth.role())`
- `auth.jwt()` → `(select auth.jwt())`

This enables Postgres initPlan optimization, caching auth lookups per statement instead of per row.

### Phase 2: Policy Consolidation (NEW)

**Target:** Resolve all 29 remaining "Multiple Permissive Policies" warnings
**Impact:** 75-80% policy reduction, dramatic performance improvement on SELECT operations

### Phase 2.1: Critical Consolidation
**File:** `002_critical_policy_consolidation.sql`
- **Target:** `flashcards` table (5 SELECT policies → 1 policy)
- **Impact:** 60% reduction on highest-traffic flashcard queries
- **Strategy:** Consolidated admin, subscription, sample, and ownership access into single comprehensive policy

### Phase 2.2: High Impact Consolidation  
**File:** `003_high_impact_policy_consolidation.sql`
- **Targets:** `courses`, `lessons`, `modules`, `user_entitlements`, `user_subscriptions`
- **Impact:** Resolves 21 warnings across 5 tables
- **Strategy:** Role-based consolidation with optimized access patterns

### Phase 2.3: Moderate Impact Consolidation
**File:** `004_moderate_policy_consolidation.sql`
- **Targets:** `collection_subjects`, `flashcard_collections_junction`, remaining `flashcards` policies
- **Impact:** Resolves final 7 warnings
- **Strategy:** Operation-specific consolidation maintaining security boundaries

### Phase 3: Standardization (planned)
**File**: `migrations/005_admin_pattern_standardization.sql`  
Standardizes admin detection and role targeting patterns.

### Phase 4: Index Cleanup
**File**: `migrations/006_duplicate_index_cleanup.sql`  
**Impact**: Fixes 1 warning, reduces storage overhead  
**Risk**: Very low  

Removes duplicate `idx_document_chunks_embedding` index, keeping `document_chunks_embedding_idx`.

## Execution Plan

### Prerequisites
1. **Backup**: Export current database schema and policies
2. **Baseline**: Run performance tests and document current query plans
3. **Testing Environment**: Validate in staging before production

### Execution Order

```bash
# Phase 1 - Immediate high-impact fix
psql -f migrations/001_auth_function_wrapping.sql

# Validate Phase 1
psql -f testing/validate_phase_1.sql

# Phase 2 - Policy consolidation (start with threads)
psql -f migrations/002_threads_policy_consolidation.sql

# Phase 4 - Quick win
psql -f migrations/006_duplicate_index_cleanup.sql
```

### Rollback Strategy

Each migration has a corresponding rollback script in `rollback/`:
- `rollback/001_auth_function_wrapping_rollback.sql`
- `rollback/002_threads_policy_consolidation_rollback.sql`

## Testing

### Validation Scripts
- `testing/validate_phase_1.sql` - Comprehensive Phase 1 validation
- `testing/performance_baseline.sql` - Before/after performance comparison
- `testing/access_patterns_test.sql` - Functional access control testing

### Key Test Areas
1. **Auth Function Wrapping**: Verify all calls use `(select ...)` pattern
2. **Access Control**: Confirm user permissions unchanged
3. **Performance**: Measure query plan improvements
4. **Policy Count**: Validate expected policy reduction

## Expected Results

### Performance Improvements
- **Query Planning**: initPlan optimization for auth functions
- **Policy Evaluation**: Reduced overhead from fewer permissive policies
- **Storage**: Eliminated duplicate index overhead

### Warning Resolution
- **Phase 1**: ~67 warnings resolved (Auth RLS Initialization Plan)
- **Phase 2**: ~40 warnings resolved (Multiple Permissive Policies)  
- **Phase 4**: 1 warning resolved (Duplicate Index)
- **Total**: 108+ of 111 warnings resolved

### Maintainability Gains
- Consistent auth function usage patterns
- Cleaner policy architecture with less redundancy
- Standardized naming conventions
- Documented optimization standards

## Best Practices Established

### Auth Function Usage
```sql
-- ✅ Correct - wrapped for performance
USING ((select auth.uid()) = user_id)

-- ❌ Incorrect - direct call
USING (auth.uid() = user_id)
```

### Policy Design
- One policy per table/role/operation combination
- Descriptive naming: `{table}_{operation}_{scope}`
- Specific role targeting instead of `{public}`
- Consistent admin detection pattern

### Future Prevention
- Code review checklist for new policies
- Automated linting for auth function patterns
- Regular Performance Advisor monitoring

## Monitoring

Post-migration monitoring checklist:
- [ ] Performance Advisor warnings count
- [ ] Query execution times for affected tables
- [ ] Application functionality validation
- [ ] Error rate monitoring
- [ ] User access control verification

## Support

For issues or questions:
1. Check validation script results
2. Review rollback procedures
3. Consult Performance Advisor for remaining warnings
4. Test in staging environment first 

### Execution Plan for Phase 2

```bash
# Phase 2.1 - Critical (Required First)
psql -f migrations/002_critical_policy_consolidation.sql

# Phase 2.2 - High Impact (Can run after 2.1)
psql -f migrations/003_high_impact_policy_consolidation.sql

# Phase 2.3 - Moderate Impact (Can run after 2.2)
psql -f migrations/004_moderate_policy_consolidation.sql

# Validation (Run after all phases)
psql -f testing/validate_phase_2_complete.sql
```

### Expected Results - Phase 2

**Quantitative Impact:**
- **Multiple Permissive Policy Warnings:** 29 → 0 (100% resolution)
- **Total Policy Count:** ~67 → ~35 policies (48% reduction)  
- **Query Performance:** 2-5x faster SELECT operations on affected tables
- **Database Load:** Significantly reduced RLS evaluation overhead

**Tables Optimized:**
- `flashcards`: 8 policies → 3 policies (63% reduction)
- `courses`: 8 policies → 2 policies (75% reduction)
- `lessons`: 12 policies → 3 policies (75% reduction)
- `modules`: 12 policies → 3 policies (75% reduction)
- `user_entitlements`: 8 policies → 2 policies (75% reduction)
- `user_subscriptions`: 10 policies → 2 policies (80% reduction)
- `collection_subjects`: 6 policies → 3 policies (50% reduction)
- `flashcard_collections_junction`: 4 policies → 2 policies (50% reduction)

### Rollback Procedures - Phase 2

```bash
# Rollback Phase 2.1 (Critical)
psql -f rollback/002_critical_policy_consolidation_rollback.sql

# Rollback Phase 2.2 & 2.3 (High/Moderate Impact)
psql -f rollback/003-004_policy_consolidation_rollback.sql
```

### Validation Procedures - Phase 2

The `validate_phase_2_complete.sql` script provides comprehensive validation including:

1. **Conflict Detection:** Identifies any remaining multiple permissive policy conflicts
2. **Policy Count Analysis:** Tracks reduction across all target tables  
3. **Access Pattern Validation:** Ensures all access patterns are preserved
4. **Performance Validation:** Confirms auth function wrapping is maintained
5. **Functional Testing Setup:** Provides framework for application-level testing

**Success Criteria:**
- Zero multiple permissive policy conflicts remaining
- All existing functionality preserved  
- Measurable query performance improvement
- Clean rollback capability maintained 