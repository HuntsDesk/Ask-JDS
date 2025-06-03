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

### Phase 2: Policy Consolidation (High-Value Tables)
**Files**: 
- `migrations/002_threads_policy_consolidation.sql`
- `migrations/003_course_enrollments_consolidation.sql` (planned)
- `migrations/004_courses_lessons_modules_consolidation.sql` (planned)

**Impact**: Fixes 40+ warnings, improves maintainability  
**Risk**: Medium - requires careful testing  

Consolidates redundant permissive policies:
- **threads**: 12 policies → 4 policies (75% reduction)
- **course_enrollments**: 15 policies → 6 policies (60% reduction)  
- **courses/lessons/modules**: Significant reduction planned

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