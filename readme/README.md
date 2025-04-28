## Future Enhancements

### Rich Text Editing for Lesson Content

Currently, lesson content uses a simple textarea that supports markdown. A future enhancement would be to add a rich text editor for lesson content, which would make it easier for content creators to format their lessons without needing to know markdown.

Potential implementations:
- [TipTap Editor](https://tiptap.dev/) - A headless rich text editor framework for React
- [React Quill](https://github.com/zenoamaro/react-quill) - A Quill.js wrapper for React
- [Draft.js](https://draftjs.org/) - A rich text editor framework for React

Implementation steps would include:
1. Install the required packages
2. Create a `RichTextEditor` component
3. Replace the textarea in the `CreateLesson` component with the new rich text editor
4. Update the storage/retrieval of content to handle rich text content 

## Recent Fixes

### Hook-Related Fixes
- Fixed incorrect usage of `useDebouncedValue` in `ChatContainer.tsx` - it was being incorrectly used as a state tuple [value, setValue] when it only returns a single value
- Ensured proper dependency arrays for all useEffect and useCallback hooks
- Added proper cleanup for system theme preference change listeners
- Fixed thread navigation stability issues

### Layout Fixes
- Fixed duplicate sidebar issue in Settings page by removing redundant `SidebarLayout` wrapper
- Settings page now correctly uses the sidebar provided by `PersistentLayout` from the router config

## React Hooks Coding Standard Cheatsheet

### 1. Rules of Hooks — Always
- Call all hooks (useState, useRef, useEffect, etc.) at the top of your function.
- Never call hooks inside if, for, while, switch, or after return.
- Never conditionally skip or reorder hooks.

### 2. Custom Hooks (e.g., useMessages)

✅ Always return an object with the same keys and structure.
✅ Always call all hooks first, then return early if needed.

Example Pattern:

```js
export function useX(someId?: string) {
  const [state, setState] = useState(defaultValue);
  const ref = useRef(null);
  const fetcher = useCallback(() => { /*...*/ }, []);

  if (!someId) {
    return { state: defaultValue, fetcher: async () => {} };
  }

  // normal hook logic here
  return { state, fetcher };
}
```

### 3. useCallback / useEffect Dependencies

✅ Dependency arrays must always have:
- Same length every render
- Same order every render
- Complete coverage (no missing variables)

Bad:
```js
useCallback(() => {...}, condition ? [a, b] : [a]);
```

Good:
```js
useCallback(() => {...}, [a, b, condition]);
```

### 4. Early Returns in Components

✅ Only return after all hooks have been called.

Good:
```js
const foo = useSomething();
const bar = useSomethingElse();

if (!ready) {
  return <Spinner />;
}
```

### 5. Real-Time Subscription Management

✅ Always unsubscribe on cleanup.

```js
useEffect(() => {
  const sub = supabase.channel(...).on(...).subscribe();
  return () => {
    sub.unsubscribe();
  };
}, [threadId]);
```

### 6. Debug Logging (Development Only)

✅ Guard all debug logs inside:

```js
if (process.env.NODE_ENV === 'development') {
  console.debug('...');
}
```

### 7. Testing Before Merge

Before any PR touching chat/message/session logic is merged:
- ✅ Switch threads manually → No infinite refresh
- ✅ Check DevTools → No runaway /messages or /threads API calls
- ✅ Ensure the app doesn't crash or reload infinitely

### Final Mantra

**"Every hook. Every time. Same order. Static dependencies. Full cleanup."** 