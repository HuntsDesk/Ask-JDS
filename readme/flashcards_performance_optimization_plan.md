# Flashcards Performance Optimization Plan

**Status**: 🔄 In Progress  
**Started**: January 2025  
**Target Completion**: TBD

## 📋 Executive Summary

The flashcards module currently has performance issues due to aggressive cache invalidation (30-second staleTime in FlashcardCollections). This plan implements a hybrid caching strategy that will reduce backend load by ~95% while maintaining real-time user experience through intelligent cache invalidation.

## 🎯 Key Performance Targets

- **240x fewer requests** from FlashcardCollections (30s → 1h cache)
- **48x fewer requests** from other components (30min → 72h cache)  
- **~95% cache hit rate** for most flashcard queries
- **Near-instant homepage demo** with build-time static content
- **Seamless study sessions** with minimal loading states

---

## 📈 Current Performance Issues

### Identified Problems
- ❌ FlashcardCollections: 30-second staleTime causing constant refetching
- ❌ Inconsistent cache durations across official content (24h vs 30min vs 10min)
- ❌ No background prefetching of static content
- ❌ Complex relationship queries without optimized caching
- ❌ No homepage demo causing missed conversion opportunities

### Expected Impact
- **Backend Load**: 95% reduction in flashcard API calls
- **User Experience**: Faster loading, smoother study sessions
- **Cost Savings**: Significant Supabase usage reduction
- **Conversion**: Interactive homepage demo

---

## 🏗️ Implementation Phases

### ✅ Phase 1: Cache Duration Optimization
**Target**: Fix immediate performance issues with standardized cache durations

**Status**: ⏳ Not Started

#### Files to Modify:
- [ ] `src/components/flashcards/FlashcardCollections.tsx`
- [ ] `src/hooks/use-query-flashcards.ts` 
- [ ] `src/components/flashcards/pages/AllFlashcards.tsx`

#### Specific Changes:
- [ ] FlashcardCollections: Change staleTime from `30 * 1000` to `60 * 60 * 1000` (1 hour)
- [ ] useFlashcardCollections: Update default staleTime to 72 hours for official content
- [ ] useSubjects: Update staleTime to 72 hours  
- [ ] AllFlashcards: Update subjects/collections queries to 72 hours
- [ ] AllFlashcards: Update main flashcards query to 1 hour for user content

#### Expected Outcome:
- 240x reduction in FlashcardCollections requests
- Consistent cache behavior across official content

---

### ✅ Phase 2: Cache Configuration Centralization  
**Target**: Create unified, maintainable cache configuration

**Status**: ⏳ Not Started

#### New File: `src/lib/cache-config.ts`
- [ ] Create cache duration constants
- [ ] Export CACHE_DURATIONS object with:
  - `OFFICIAL_CONTENT: 72 * 60 * 60 * 1000` (72 hours)
  - `USER_CONTENT: 60 * 60 * 1000` (1 hour)
  - `USER_PROGRESS: 5 * 60 * 1000` (5 minutes)

#### Files to Update:
- [ ] `src/hooks/use-query-flashcards.ts`
- [ ] `src/components/flashcards/pages/AllFlashcards.tsx`
- [ ] `src/components/flashcards/FlashcardCollections.tsx`
- [ ] Any other files using hardcoded cache durations

#### Expected Outcome:
- Single source of truth for cache configuration
- Easy to adjust cache strategy globally
- Consistent cache behavior across components

---

### ✅ Phase 3: Homepage Demo Implementation
**Target**: Add interactive flashcard demo with zero backend load

**Status**: ⏳ Not Started

#### New File: `src/data/demoFlashcards.ts`
- [ ] Create array of 8-10 curated sample flashcards
- [ ] Include variety of subjects (Contracts, Torts, Constitutional Law, etc.)
- [ ] Add difficulty levels and premium indicators
- [ ] Export as const assertion for type safety

#### Sample Structure:
```typescript
export const DEMO_FLASHCARDS = [
  {
    id: 'demo-contracts-1',
    question: 'What constitutes valid consideration in contract formation?',
    answer: 'Something of legal value exchanged between parties...',
    subject: 'Contracts',
    difficulty: 'intermediate',
    isPremium: false
  },
  // ... 7-9 more cards
] as const;
```

#### New Component: `src/components/home/HomepageFlashcardDemo.tsx`
- [ ] Interactive flashcard component for homepage
- [ ] Uses DEMO_FLASHCARDS array (no API calls)
- [ ] Flip animation and engaging UX
- [ ] Call-to-action for user registration

#### Integration:
- [ ] Add demo component to homepage/landing page
- [ ] Ensure responsive design
- [ ] Add conversion tracking

#### Expected Outcome:
- Zero API calls for homepage demo
- Instant loading demonstration
- Improved conversion rates

---

### ✅ Phase 4: Background Prefetching Implementation
**Target**: Preload official content after user login

**Status**: ⏳ Not Started

#### New File: `src/hooks/useFlashcardPrefetch.ts`
- [ ] Create prefetching hook for official content
- [ ] 2-second delay after login to avoid blocking UI
- [ ] Prefetch in priority order:
  1. Subjects (fastest)
  2. Collections (medium)
  3. Official flashcards relationships (heaviest)
- [ ] Use same cache durations as main queries

#### Integration Points:
- [ ] Add to `src/contexts/AuthProvider.tsx` or main App component
- [ ] Trigger only after successful authentication
- [ ] Ensure doesn't conflict with existing auth flow

#### Sample Implementation:
```typescript
export const useFlashcardPrefetch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        // Prefetch official content only
        queryClient.prefetchQuery({
          queryKey: flashcardKeys.subjects(),
          queryFn: fetchSubjects,
          staleTime: CACHE_DURATIONS.OFFICIAL_CONTENT
        });
        // ... other prefetch calls
      }, 2000);
    }
  }, [user, queryClient]);
};
```

#### Expected Outcome:
- Near-instant flashcard page loading after login
- Official content available before user navigation
- No impact on login performance

---

### ✅ Phase 5: Enhanced Invalidation Strategy
**Target**: Robust cache invalidation for user mutations

**Status**: ⏳ Not Started

#### New File: `src/hooks/useFlashcardMutations.ts`
- [ ] Create centralized invalidation utility
- [ ] Support granular invalidation by user ID
- [ ] Support invalidation by affected card IDs
- [ ] Preserve official content cache during user mutations

#### Files to Update:
- [ ] All flashcard create/edit/delete mutation hooks
- [ ] Edit/Create/Delete components
- [ ] Any components that modify user flashcard data

#### Sample Implementation:
```typescript
export const useFlashcardMutations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const invalidateUserContent = useCallback((affectedCardIds?: string[]) => {
    // Invalidate user-specific queries only
    queryClient.invalidateQueries(['flashcards', 'user', user?.id]);
    queryClient.invalidateQueries(['collections', 'user', user?.id]);
    queryClient.invalidateQueries(['progress', user?.id]);
    
    // Don't invalidate official content cache
  }, [user?.id, queryClient]);
  
  return { invalidateUserContent };
};
```

#### Cache Invalidation Example: User Flashcard Creation
```typescript
// In a flashcard creation component
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFlashcardMutations } from '@/hooks/useFlashcardMutations';

const CreateFlashcardComponent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateUserContent } = useFlashcardMutations();

  const createFlashcardMutation = useMutation({
    mutationFn: async (newFlashcard: CreateFlashcardData) => {
      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          question: newFlashcard.question,
          answer: newFlashcard.answer,
          created_by: user?.id,
          // ... other fields
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newCard) => {
      // 1. Immediately invalidate user's flashcard queries
      invalidateUserContent([newCard.id]);
      
      // 2. Specifically invalidate queries that show user's cards
      queryClient.invalidateQueries(['flashcards', 'filtered', 'my']);
      queryClient.invalidateQueries(['flashcards', 'user', user?.id]);
      
      // 3. If card was added to collections, invalidate those too
      if (newCard.collection_ids?.length) {
        newCard.collection_ids.forEach(collectionId => {
          queryClient.invalidateQueries(['collection', collectionId, 'cards']);
        });
      }
      
      // 4. Update user's total flashcard count in navbar
      queryClient.invalidateQueries(['user-stats', user?.id]);
      
      // 5. IMPORTANT: Don't invalidate official content
      // ❌ DON'T DO: queryClient.invalidateQueries(['flashcards', 'official']);
      // ❌ DON'T DO: queryClient.invalidateQueries(['subjects']);
      
      showToast('Flashcard created successfully!', 'success');
    },
    onError: (error) => {
      console.error('Failed to create flashcard:', error);
      showToast('Failed to create flashcard', 'error');
    }
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createFlashcardMutation.mutate(formData);
    }}>
      {/* Form UI */}
    </form>
  );
};
```

**Key Points in This Example**:
- ✅ **Immediate invalidation** after successful creation
- ✅ **Granular targeting** - only user's data, not official content
- ✅ **Related data updates** - collections, stats, filtered views
- ✅ **Preserved performance** - official content cache remains intact
- ✅ **User feedback** - toast notifications for success/error states

#### Expected Outcome:
- Instant UI updates after user actions
- Preserved official content cache
- Reduced unnecessary cache invalidation

---

### ✅ Phase 6: Query Key Structure Optimization
**Target**: Ensure hierarchical cache invalidation works properly

**Status**: ⏳ Not Started

#### Files to Review:
- [ ] `src/hooks/use-query-flashcards.ts` - Query key definitions
- [ ] `src/components/flashcards/pages/AllFlashcards.tsx` - Query key usage
- [ ] All flashcard-related components using React Query

#### Tasks:
- [ ] Audit all flashcard query keys for consistency
- [ ] Ensure hierarchical structure supports selective invalidation
- [ ] Verify user vs official content separation in keys
- [ ] Test that invalidation targets correct cache entries

#### Expected Structure:
```typescript
const flashcardKeys = {
  all: ['flashcards'] as const,
  official: () => [...flashcardKeys.all, 'official'] as const,
  user: (userId: string) => [...flashcardKeys.all, 'user', userId] as const,
  collections: (type: 'official' | 'user', userId?: string) => 
    type === 'official' 
      ? [...flashcardKeys.official(), 'collections']
      : [...flashcardKeys.user(userId!), 'collections'],
  // ... other keys
};
```

#### Expected Outcome:
- Precise cache invalidation without collateral damage
- Consistent naming patterns across components
- Easy debugging of cache behavior

---

### ✅ Phase 7: Performance Monitoring Setup
**Target**: Add observability for cache performance

**Status**: ⏳ Not Started

#### Development Logging:
- [ ] Add cache hit/miss logging to key hooks
- [ ] Monitor query frequency before/after changes
- [ ] Track cache invalidation events
- [ ] Add performance timing measurements

#### Production Monitoring:
- [ ] Add user experience metrics
- [ ] Track page load times for flashcard sections
- [ ] Monitor API call volume reduction
- [ ] Set up alerts for performance regressions

#### Sample Implementation:
```typescript
const { data, isLoading } = useQuery({
  queryKey: flashcardKeys.collections(),
  queryFn: fetchCollections,
  staleTime: CACHE_DURATIONS.OFFICIAL_CONTENT,
  onSuccess: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Cache hit: Collections loaded from cache');
    }
  }
});
```

#### Expected Outcome:
- Visibility into cache performance improvements
- Early detection of cache-related issues
- Data-driven cache strategy refinements

---

### ✅ Phase 8: Documentation Updates
**Target**: Update project documentation with new caching strategy

**Status**: ⏳ Not Started

#### Files to Update:
- [ ] `README.md` - Update flashcards performance section
- [ ] Add new caching strategy documentation
- [ ] Document invalidation patterns and best practices
- [ ] Update troubleshooting guide

#### New Documentation:
- [ ] Cache strategy explanation for developers
- [ ] How to add new flashcard features without breaking cache
- [ ] Performance optimization guidelines
- [ ] Monitoring and debugging cache issues

#### Expected Outcome:
- Clear guidance for future development
- Preserved institutional knowledge
- Easier onboarding for new developers

---

## 🧪 Testing Strategy

### Pre-Implementation Testing:
- [ ] Baseline performance measurements
- [ ] Current API call volume tracking
- [ ] User experience timing benchmarks

### During Implementation:
- [ ] Unit tests for cache configuration
- [ ] Integration tests for invalidation logic
- [ ] Performance regression tests

### Post-Implementation Testing:
- [ ] Cache invalidation after user creates flashcard
- [ ] Cache invalidation after user edits flashcard
- [ ] Cache invalidation after user deletes flashcard
- [ ] Homepage demo loads without API calls
- [ ] Prefetching doesn't block initial login
- [ ] Network tab shows reduced API calls
- [ ] Cross-tab cache sharing works
- [ ] Long study sessions remain smooth

### User Acceptance Testing:
- [ ] Study session performance feels improved
- [ ] Editing flashcards still feels instant
- [ ] Homepage demo is engaging and fast
- [ ] No perceived delays or stale data

---

## 🚨 Risk Mitigation

### Potential Issues:
1. **Cache invalidation failures** → Users see stale data
2. **Over-aggressive caching** → Cross-device sync issues  
3. **Prefetching impact** → Slower initial login
4. **Memory usage** → Browser performance degradation

### Mitigation Strategies:
1. **Robust testing** of invalidation logic before deployment
2. **Progressive rollout** starting with longer cache times
3. **Monitoring** for user-reported stale data issues
4. **Rollback plan** ready if performance degrades

### Rollback Plan:
1. Revert cache durations to previous values
2. Remove prefetching temporarily  
3. Fall back to simpler invalidation strategy
4. Monitor and adjust incrementally

---

## 📊 Success Metrics

### Technical Metrics:
- [ ] **API Call Reduction**: 95% fewer flashcard-related requests
- [ ] **Cache Hit Rate**: >90% for official content queries
- [ ] **Page Load Time**: <500ms for cached flashcard pages
- [ ] **Memory Usage**: No significant increase in browser memory

### User Experience Metrics:
- [ ] **Study Session Smoothness**: No loading interruptions during 30+ min sessions
- [ ] **Edit Responsiveness**: <100ms perceived delay after user actions
- [ ] **Homepage Engagement**: Increased demo interaction rates
- [ ] **User Satisfaction**: No complaints about stale or slow content

### Business Metrics:
- [ ] **Infrastructure Costs**: Measurable reduction in Supabase usage
- [ ] **Conversion Rate**: Improved homepage demo engagement
- [ ] **User Retention**: Better flashcard feature adoption
- [ ] **Support Tickets**: Reduced performance-related issues

---

## 📝 Implementation Log

### [Date] - Phase 1 Started
- [ ] Branch created: `feature/flashcards-cache-optimization`
- [ ] Initial cache duration changes implemented
- [ ] Testing begun

### [Date] - Phase 1 Completed
- [ ] All cache durations updated
- [ ] Performance improvements verified
- [ ] Ready for Phase 2

### [Date] - Phase 2 Started
- [ ] Cache configuration centralized
- [ ] All components updated to use new constants

### [Date] - Phase 2 Completed
- [ ] Single source of truth established
- [ ] All hardcoded durations eliminated

### [Date] - Phase 3 Started
- [ ] Homepage demo implementation begun
- [ ] Demo flashcards data created

### [Date] - Phase 3 Completed
- [ ] Interactive homepage demo live
- [ ] Zero API calls confirmed

### [Date] - Phase 4 Started
- [ ] Prefetching hook implemented
- [ ] Integration with auth flow completed

### [Date] - Phase 4 Completed
- [ ] Background prefetching working
- [ ] Login performance maintained

### [Date] - Phase 5 Started
- [ ] Enhanced invalidation strategy implemented
- [ ] All mutation hooks updated

### [Date] - Phase 5 Completed
- [ ] Robust invalidation working
- [ ] User actions remain instant

### [Date] - Phase 6 Started
- [ ] Query key structure audit completed
- [ ] Optimization implemented

### [Date] - Phase 6 Completed
- [ ] Consistent query key structure
- [ ] Selective invalidation working

### [Date] - Phase 7 Started
- [ ] Performance monitoring implemented
- [ ] Baseline measurements taken

### [Date] - Phase 7 Completed
- [ ] Monitoring dashboard ready
- [ ] Performance improvements confirmed

### [Date] - Phase 8 Started
- [ ] Documentation updates begun
- [ ] README sections updated

### [Date] - Phase 8 Completed
- [ ] All documentation updated
- [ ] Developer guides complete

### [Date] - Project Completed
- [ ] All phases implemented successfully
- [ ] Performance targets achieved
- [ ] Ready for production deployment

---

## 🔗 Related Documentation

- [Flashcards Module Architecture](../README.md#flashcards-module)
- [React Query Best Practices](../README.md#development-guidelines)
- [Performance Optimization Results](../README.md#database-performance-optimization)
- [Supabase Caching Strategy](../README.md#caching-strategy)

---

**Last Updated**: [Current Date]  
**Next Review**: After Phase 1 completion 