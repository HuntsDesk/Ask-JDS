# Sidebar Components Overview

This document provides an overview of the different sidebar implementations within the Ask-JDS project.

## Current Implementation

The application uses a persistent sidebar architecture with the following components:

1. **Persistent Layout (`src/components/layout/PersistentLayout.tsx`)**
   * **Purpose:** Provides a consistent, persistent sidebar across all authenticated routes (chat, flashcards, courses, settings).
   * **Features:** Preserves sidebar state (expanded/collapsed, pinned/unpinned) during navigation, manages thread operations, handles routing between sections.
   * **Implementation:** Uses the generic UI sidebar primitive, stores state in localStorage for persistence, and is wrapped around routes in `App.tsx`.
   * **Key Benefit:** Only the main content area changes during navigation, while the sidebar remains visible and maintains its state.

2. **Generic UI Sidebar (`jdsimplified/src/components/ui/sidebar.tsx`)**
   * **Purpose:** A reusable, generic UI primitive for creating sidebar layouts.
   * **Features:** Provides `SidebarProvider` and `Sidebar` components, supports different layout variants (`sidebar`, `floating`, `inset`), collapsible behaviors (`offcanvas`, `icon`), handles mobile responsiveness using `Sheet`.
   * **Implementation:** Built with class-variance-authority (cva), Radix UI Slot, and custom hooks (`useIsMobile`, `useSidebar`).
   * **Relationship:** This serves as the backbone for the persistent sidebar implemented in `PersistentLayout`.

## Content-Specific Sidebars 

While the basic sidebar structure is provided by the PersistentLayout, there are still content-specific sidebar components:

1. **Chat Sidebar Content**
   * Now integrated directly into the `PersistentLayout` component
   * Displays chat thread history (grouped by date), handles thread creation/renaming/deletion
   * Uses the `SelectedThreadContext` to track the active thread

2. **Course Sidebar (`jdsimplified/src/components/course/CourseSidebar.tsx`)**
   * **Purpose:** A specific sidebar for navigating course content (modules and lessons) within the "JDSimplified" section.
   * **Features:** Displays course structure, indicates lesson completion status, handles lesson selection, and includes mobile-specific toggle behavior.
   * **Implementation:** Custom implementation using Tailwind CSS and Lucide icons. It exists alongside the PersistentLayout.

## Fixed Issues

* **Thread Text Overflow**: Fixed by adding appropriate right padding (`pr-4`) and text truncation (`truncate` class) to thread items.
* **Inconsistent Behavior**: The sidebar now persists across route changes, eliminating the need to re-initialize it on each page.
* **State Preservation**: Sidebar expanded/collapsed and pinned/unpinned states are now preserved in localStorage between routes and page refreshes.

## Technical Implementation

The sidebar persistence is implemented through these mechanisms:

1. Wrapping routes with the `PersistentLayout` component in `App.tsx`
2. Using localStorage to persist expanded/collapsed and pinned/unpinned states
3. Using React Context to share state between the sidebar and content
4. Applying the generic UI sidebar primitive for consistent behavior

This approach improves both user experience (maintaining consistency during navigation) and code maintainability (centralizing sidebar logic in one component). 