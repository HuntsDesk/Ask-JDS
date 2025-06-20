/**
 * Lazy imports for code splitting
 * This reduces the initial bundle size by loading components on demand
 */

import { lazy } from 'react';

// Admin components (only loaded for admin users)
export const AdminDashboard = lazy(() => import('@/components/admin/Dashboard'));
export const AdminCourses = lazy(() => import('@/components/admin/Courses'));
export const AdminFlashcards = lazy(() => import('@/components/admin/Flashcards'));
export const AdminUsers = lazy(() => import('@/components/admin/Users'));
export const AdminSettings = lazy(() => import('@/components/admin/Settings'));
export const AdminPriceMapping = lazy(() => import('@/components/admin/AdminPriceMapping'));
export const AdminUtilities = lazy(() => import('@/components/admin/Utilities'));

// Course components
export const CourseDetail = lazy(() => import('@/components/courses/CourseDetail'));
export const CourseContent = lazy(() => import('@/components/courses/CourseContent'));

// Flashcard components
export const FlashcardCollections = lazy(() => import('@/components/flashcards/CollectionsPage'));
export const FlashcardCreateCollection = lazy(() => import('@/components/flashcards/CreateCollectionPage'));

// Chat components - these need default exports
export const ChatContainer = lazy(() => import('@/components/chat/ChatContainer'));

// Utility function to preload a component
export const preloadComponent = (component: any) => {
  if (component && typeof component.preload === 'function') {
    component.preload();
  }
}; 