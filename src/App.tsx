import React, { useEffect, useState, Suspense, lazy, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { DomainProvider, useDomain } from '@/lib/domain-context';
import SimplifiedMode from '@/lib/SimplifiedMode';
import { NavbarProvider } from '@/contexts/NavbarContext';
import { CloseProvider } from '@/contexts/close-context';
import { PaywallProvider } from '@/contexts/paywall-context';
import { LayoutDebugger } from '@/components/LayoutDebugger';

// Direct imports for homepage components
import { HomePage } from '@/components/HomePage';
import { HomePage as JDSHomePage } from '@/components/jds/HomePage';

// Import our new Navbar components
import { JDSNavbar } from '@/components/jds/JDSNavbar';
import { AskJDSNavbar } from '@/components/askjds/AskJDSNavbar';

// Import the new PersistentLayout
import { PersistentLayout } from '@/components/layout/PersistentLayout';

// Lazy load large components
const ChatLayout = lazy(() => import('@/components/chat/ChatLayout').then(module => ({ default: module.ChatLayout })));
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const FlashcardsPage = lazy(() => import('@/components/flashcards/FlashcardsPage'));
const CoursesPage = lazy(() => import('@/components/courses/CoursesPage'));
const CourseDetail = lazy(() => import('./components/admin/CourseDetail').then(module => ({ default: module.CourseDetail })));
const PublicCourseDetail = lazy(() => import('@/components/courses/CourseDetail'));
const CourseContent = lazy(() => import('@/components/courses/CourseContent'));
const SubscriptionSuccess = lazy(() => import('@/components/SubscriptionSuccess').then(module => ({ default: module.SubscriptionSuccess })));

// Import ChatContainer instead of using ChatLayout
const ChatContainer = lazy(() => import('@/components/chat/ChatContainer').then(module => ({ default: module.default })));

// Import Dashboard directly to avoid lazy loading issues
import JDSDashboard from '@/pages/Dashboard';

// Import directly for debugging purposes
// import JDSDashboardDirect from '@/pages/Dashboard';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { 
  Routes, 
  Route, 
  Navigate,
  BrowserRouter
} from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/lib/theme-provider';

// Import the AuthenticatedLayout component
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CourseLayout } from './components/layout/CourseLayout';

// Import settings page directly to prevent lazy loading issues with sidebar
import { SettingsPage } from '@/components/settings/SettingsPage';

// Import our admin components
const AdminDashboard = lazy(() => import('@/components/admin/Dashboard').then(module => ({ default: module.default })));
const AdminUsers = lazy(() => import('@/components/admin/Users').then(module => ({ default: module.default })));
const AdminErrorLogs = lazy(() => import('@/components/admin/ErrorLogs').then(module => ({ default: module.default })));
const AdminCourses = lazy(() => import('@/components/admin/Courses').then(module => ({ default: module.default })));
const AdminFlashcards = lazy(() => import('@/components/admin/Flashcards').then(module => ({ default: module.default })));
const AdminAskJDS = lazy(() => import('@/components/admin/AskJDS').then(module => ({ default: module.default })));
const AdminSettings = lazy(() => import('@/components/admin/Settings').then(module => ({ default: module.default })));
const SetAdminStatus = lazy(() => import('@/components/admin/SetAdmin').then(module => ({ default: module.default })));

// Import SetAdminStatus directly for the setup route
import SetAdminSetup from './components/admin/SetAdmin';

// Import our wrapper instead of direct import
import { JDSDashboardWrapper } from '@/components/jds/JDSDashboardWrapper';

// Check if admin setup is allowed from environment variables
const allowSetupAdmin = import.meta.env.VITE_ALLOW_ADMIN_SETUP === 'true';

// Create sidebar context
export type SidebarContextType = {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isMobile: boolean;
};

export const SidebarContext = createContext<SidebarContextType>({
  isExpanded: true,
  setIsExpanded: () => {},
  isMobile: false
});

// Create thread context
export type SelectedThreadContextType = {
  selectedThreadId: string | null;
  setSelectedThreadId: (threadId: string | null) => void;
};

export const SelectedThreadContext = createContext<SelectedThreadContextType>({
  selectedThreadId: null,
  setSelectedThreadId: () => {}
});

// Add a simple redirect component that doesn't trigger authentication initialization
const SimpleRedirect = ({ to }: { to: string }) => {
  return <Navigate to={to} replace />;
};

// Create router with domain-aware routes
function AppRoutes() {
  const { isJDSimplified, isAskJDS, isAdmin } = useDomain();
  
  console.log('Rendering routes with isJDSimplified:', isJDSimplified, 'isAdmin:', isAdmin);
  
  // Admin domain routes
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading admin dashboard..." />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading user management..." />}>
                <AdminUsers />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/error-logs" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading error logs..." />}>
                <AdminErrorLogs />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/courses" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading courses management..." />}>
                <AdminCourses />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/courses/:courseId" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading course details..." />}>
                <CourseDetail />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/flashcards" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading flashcards management..." />}>
                <AdminFlashcards />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/askjds" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading AskJDS management..." />}>
                <AdminAskJDS />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading admin settings..." />}>
                <AdminSettings />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route path="/auth" element={
          <AuthProvider>
            <AuthPage />
          </AuthProvider>
        } />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/error-logs" element={<AdminErrorLogs />} />
        <Route path="admin/courses" element={<AdminCourses />} />
        <Route path="admin/courses/:courseId" element={<CourseDetail />} />
        <Route path="admin/flashcards" element={<AdminFlashcards />} />
        <Route path="admin/askjds" element={<AdminAskJDS />} />
        <Route path="admin/settings" element={<AdminSettings />} />
        <Route path="admin/set-admin" element={<SetAdminStatus />} />
        {/* Special setup route that doesn't require admin auth */}
        {allowSetupAdmin && (
          <Route path="setup-admin" element={<SetAdminSetup />} />
        )}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }
  
  // Regular routes for Ask JDS and JD Simplified domains
  return (
    <Routes>
      <Route path="/" element={isJDSimplified ? <JDSHomePage /> : <HomePage />} />
      
      {/* Add back the login redirect without triggering auth initialization */}
      <Route path="/login" element={<SimpleRedirect to="/auth" />} />
      
      <Route path="/auth" element={
        <AuthProvider>
          <AuthPage />
        </AuthProvider>
      } />
      
      {/* Protected routes wrapped in PersistentLayout */}
      <Route element={
        <ProtectedRoute>
          <PersistentLayout />
        </ProtectedRoute>
      }>
        <Route path="/chat/:threadId?" element={<ChatContainer />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/flashcards/*" element={
          <Suspense fallback={<PageLoader message="Loading flashcards..." />}>
            <NavbarProvider>
              <FlashcardsPage />
            </NavbarProvider>
          </Suspense>
        } />
        <Route path="/courses" element={<JDSDashboardWrapper />} />
        <Route path="/courses/:id" element={
          <Suspense fallback={<PageLoader message="Loading course details..." />}>
            <PublicCourseDetail />
          </Suspense>
        } />
        <Route path="/course/:courseId/*" element={
          <Suspense fallback={<PageLoader message="Loading course content..." />}>
            <CourseContent />
          </Suspense>
        } />
        <Route path="/subscription/success" element={
          <Suspense fallback={<PageLoader message="Loading subscription details..." />}>
            <SubscriptionSuccess />
          </Suspense>
        } />
        
        {/* JDS Course Routes */}
        <Route path="/course/:courseId" element={
          <SimplifiedMode>
            <CourseLayout>
              <JDSDashboard />
            </CourseLayout>
          </SimplifiedMode>
        } />
        
        <Route path="/course/:courseId/module/:moduleId" element={
          <SimplifiedMode>
            <CourseLayout>
              <JDSDashboard />
            </CourseLayout>
          </SimplifiedMode>
        } />
        
        <Route path="/course/:courseId/module/:moduleId/lesson/:lessonId" element={
          <SimplifiedMode>
            <CourseLayout>
              <JDSDashboard />
            </CourseLayout>
          </SimplifiedMode>
        } />
      </Route>
    </Routes>
  );
}

// Page loader component for suspense fallbacks
function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900">
      <LoadingSpinner className="h-12 w-12 mb-4" />
      <p className="text-muted-foreground dark:text-gray-400">{message}</p>
    </div>
  );
}

// Wrapper function for the entire app
function App() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  
  // Development-only debug tools
  const showLayoutDebugger = process.env.NODE_ENV === 'development' && false; // Set to true to enable debugger
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="jds-ui-theme">
        <DomainProvider>
          <OfflineIndicator />
          <BrowserRouter>
            <PaywallProvider>
              <NavbarProvider>
                <CloseProvider>
                  <SelectedThreadContext.Provider value={{ selectedThreadId, setSelectedThreadId }}>
                    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isMobile }}>
                      <AppRoutes />
                      <Toaster />
                      {showLayoutDebugger && (
                        <LayoutDebugger />
                      )}
                    </SidebarContext.Provider>
                  </SelectedThreadContext.Provider>
                </CloseProvider>
              </NavbarProvider>
            </PaywallProvider>
          </BrowserRouter>
        </DomainProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;