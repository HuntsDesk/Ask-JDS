# PageContainer Usage Examples

This document provides examples of how to use the PageContainer component in different scenarios.

## Basic Usage

For most standard pages, use PageContainer with default settings:

```tsx
import PageContainer from '@/components/layout/PageContainer';

export function MyPage() {
  return (
    <PageContainer>
      <h1>Page Content</h1>
      <p>This is a standard page that will have proper padding based on sidebar state.</p>
    </PageContainer>
  );
}
```

## Chat/Messaging UI (Complex Height Management)

For chat interfaces that need to control their own overflow/scrolling:

```tsx
import PageContainer from '@/components/layout/PageContainer';

export function ChatPage() {
  return (
    <PageContainer noOverflow>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Chat messages go here */}
          {messages.map(msg => (
            <div key={msg.id} className="p-4">
              {msg.content}
            </div>
          ))}
        </div>
        
        {/* Input area fixed at bottom */}
        <div className="border-t p-4">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </PageContainer>
  );
}
```

## Custom Max Width

For pages that need wider or narrower content:

```tsx
import PageContainer from '@/components/layout/PageContainer';

export function WideContentPage() {
  return (
    <PageContainer maxWidth="1600px">
      <h1>Wide Content Page</h1>
      <p>This page has a wider max-width than the default 1280px.</p>
    </PageContainer>
  );
}
```

## Disabling Padding

For pages that need to control their own padding:

```tsx
import PageContainer from '@/components/layout/PageContainer';

export function CustomPaddingPage() {
  return (
    <PageContainer disablePadding>
      <div className="px-8 md:px-16 lg:px-24">
        <h1>Custom Padding</h1>
        <p>This page handles its own padding rather than using the sidebar-based padding.</p>
      </div>
    </PageContainer>
  );
}
```

## Using with Additional Classes

Add your own classes to the container:

```tsx
import PageContainer from '@/components/layout/PageContainer';

export function StyledPage() {
  return (
    <PageContainer className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md">
      <h1>Styled Page</h1>
      <p>This page has additional styling applied to the container.</p>
    </PageContainer>
  );
}
```

## Using the useLayoutState Hook Directly

For components that need to access layout information:

```tsx
import { useLayoutState } from '@/hooks/useLayoutState';

export function ResponsiveComponent() {
  const { isDesktop, isPinned, isExpanded, contentPadding, contentMargin } = useLayoutState();
  
  return (
    <div>
      <p>Current Layout State:</p>
      <ul>
        <li>Is Desktop: {isDesktop ? 'Yes' : 'No'}</li>
        <li>Sidebar Pinned: {isPinned ? 'Yes' : 'No'}</li>
        <li>Sidebar Expanded: {isExpanded ? 'Yes' : 'No'}</li>
        <li>Content Padding: {contentPadding}</li>
        <li>Content Margin: {contentMargin}</li>
      </ul>
    </div>
  );
}
``` 