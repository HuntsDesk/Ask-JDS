# Multiple Permissive Policies Analysis

## Summary
- **Total warnings:** 58
- **Strategy:** Start with simple cases (2 policies) and progress to complex (4-5 policies)
- **Approach:** Consolidate redundant policies into single optimized policies per role/action

## Tables by Complexity

### SIMPLE (2 policies each - Priority 1)
1. **ai_settings** - authenticated SELECT (2 policies)
2. **exam_types** - authenticated SELECT (2 policies) 
3. **subjects** - authenticated SELECT (2 policies)
4. **system_prompts** - authenticated SELECT (2 policies)

### MODERATE (2-3 policies each - Priority 2)
5. **collection_subjects** - authenticated DELETE, INSERT, SELECT (2 policies each = 3 warnings)
6. **flashcard_collections_junction** - authenticated DELETE, INSERT (2 policies each = 2 warnings)
7. **flashcards** - anon SELECT (2 policies), authenticated UPDATE (2 policies)
8. **user_entitlements** - multiple roles SELECT (2 policies each = 4 warnings)
9. **user_subscriptions** - multiple roles SELECT (2-3 policies each = 4 warnings)

### COMPLEX (4-5 policies each - Priority 3)
10. **courses** - multiple roles SELECT (4 policies each = 4 warnings)
11. **lessons** - multiple roles SELECT (3 policies each = 4 warnings)
12. **modules** - multiple roles SELECT (3 policies each = 4 warnings)
13. **flashcards** - authenticated SELECT (5 policies)

### VERY COMPLEX (many role/action combinations - Priority 4)
14. **course_enrollments** - multiple roles for INSERT, SELECT, UPDATE (2 policies each across many roles = 18 warnings)

## Phase 3.1: Simple Cases (8 warnings)
Target the 4 simple tables with 2 policies each to reduce 8 warnings quickly.

## Expected Impact
- **Phase 3.1:** 58 → 50 warnings (8 resolved)
- **Phase 3.2:** 50 → 35 warnings (15 resolved) 
- **Phase 3.3:** 35 → 19 warnings (16 resolved)
- **Phase 3.4:** 19 → 1 warnings (18 resolved)
- **Final:** ~95% reduction in Multiple Permissive Policies warnings 