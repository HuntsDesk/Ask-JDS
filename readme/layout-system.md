# Layout System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ App.tsx                                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ SidebarContext                                              │    │
│  │                                                             │    │
│  │   ┌─────────────────┐          ┌─────────────────────────┐  │    │
│  │   │ PersistentLayout│          │ ChatLayout              │  │    │
│  │   │                 │          │                         │  │    │
│  │   │  ┌───────────┐  │          │  ┌───────────────────┐  │  │    │
│  │   │  │ Sidebar   │  │          │  │ ChatContainer     │  │  │    │
│  │   │  └───────────┘  │          │  └───────────────────┘  │  │    │
│  │   │                 │          │                         │  │    │
│  │   │  ┌───────────┐  │          └─────────────────────────┘  │    │
│  │   │  │ Outlet    │  │                                       │    │
│  │   │  │           │  │                                       │    │
│  │   │  │  ┌────────────┐  ┌───────────────┐  ┌────────────┐  │    │
│  │   │  │  │SettingsPage│  │ FlashcardsPage│  │ CoursesPage│  │    │
│  │   │  │  └────────────┘  └───────────────┘  └────────────┘  │    │
│  │   │  │           │  │                                       │    │
│  │   │  └───────────┘  │                                       │    │
│  │   │                 │                                       │    │
│  │   └─────────────────┘                                       │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## PageContainer Component

```
┌───────────────────────────────────────────────────────────────┐
│ PageContainer                                                  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Content area with dynamic padding based on:            │   │
│  │                                                        │   │
│  │  - Sidebar state (expanded/collapsed)                  │   │
│  │  - Sidebar pinned state (pinned/unpinned)              │   │
│  │  - Viewport size (desktop/mobile)                      │   │
│  │                                                        │   │
│  │ ┌─────────────────────────────────────────────────────┐│   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ │                 Page Content                        ││   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ │                                                     ││   │
│  │ └─────────────────────────────────────────────────────┘│   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

## Layout State Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│ SidebarContext  │─────▶│ useLayoutState  │─────▶│ useLayoutPadding│
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│ PersistentLayout│      │ PageContainer   │      │ Other Components│
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Padding Values

```
┌───────────────────────────────────────────┐
│ Sidebar State             │ Padding Value │
├────────────────────────────────────────── │
│ Pinned + Expanded         │ px-16        │
│ Pinned + Collapsed        │ px-12        │
│ Not Pinned + Expanded     │ px-6         │
│ Not Pinned + Collapsed    │ px-4         │
│ Mobile                    │ px-4         │
└───────────────────────────────────────────┘
```

## Developer Tools

### LayoutDebugger

The LayoutDebugger provides real-time visibility into layout state. Access it by pressing `Alt+D` in the application.

```
┌───────────────────────────────┐
│ Layout Debug                 x │
├───────────────────────────────┤
│ Desktop:   │ ✅               │
│ Pinned:    │ ✅               │
│ Expanded:  │ ✅               │
│ Padding:   │ px-16            │
│ Margin:    │ ml-16            │
│ Viewport:  │ 1280x800         │
├───────────────────────────────┤
│ Press Alt+D to toggle         │
└───────────────────────────────┘
```

## Usage Examples

### Basic Usage

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export const MyPage = () => {
  return (
    <PageContainer>
      <h1>My Content</h1>
      {/* Content automatically gets correct padding */}
    </PageContainer>
  );
};
```

### Chat Page (Special Case)

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export const ChatPage = () => {
  return (
    <PageContainer noOverflow>
      {/* Chat specific content with manual overflow control */}
    </PageContainer>
  );
};
```

### Custom Component Using Layout Values

```tsx
import { useLayoutPadding } from '@/hooks/useLayoutPadding';

export const FixedHeader = () => {
  const { contentMargin } = useLayoutPadding();
  
  return (
    <header className={`fixed top-0 ${contentMargin}`}>
      {/* Header content that adjusts with sidebar */}
    </header>
  );
};
```

### Special Cases

**Chat Page Exception**:
The chat page has unique layout requirements that need complete control over layout constraints:
```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export const ChatPage = () => {
  return (
    <PageContainer bare>
      {/* Chat content with complete layout control */}
    </PageContainer>
  );
};
```

**Chat-specific Features:**
- Uses the `bare` prop to bypass all layout constraints (maxWidth, padding, flex, overflow)
- Manages its own internal scrolling behavior
- Controls layout for fixed elements like input container

**Other Special Cases:**
```tsx
<PageContainer noOverflow>
  {/* Content that needs to manage its own overflow */}
</PageContainer>
``` 