import React, { useEffect, useState, Suspense, lazy, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { DomainProvider, useDomain } from '@/lib/domain-context';
import SimplifiedMode from '@/lib/SimplifiedMode';
import { NavbarProvider } from '@/contexts/NavbarContext';

// Direct imports for homepage components
import { HomePage } from '@/components/HomePage';
import { HomePage as JDSHomePage } from '@/components/jds/HomePage';

// Import our new Navbar components
import { JDSNavbar } from '@/components/jds/JDSNavbar';
import { AskJDSNavbar } from '@/components/askjds/AskJDSNavbar';

// Lazy load large components
const ChatLayout = lazy(() => import('@/components/chat/ChatLayout').then(module => ({ default: module.ChatLayout })));
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const FlashcardsPage = lazy(() => import('@/components/flashcards/FlashcardsPage'));
const CoursesPage = lazy(() => import('@/components/courses/CoursesPage'));
const CourseDetail = lazy(() => import('./components/admin/CourseDetail').then(module => ({ default: module.CourseDetail })));
const PublicCourseDetail = lazy(() => import('@/components/courses/CourseDetail'));
const CourseContent = lazy(() => import('@/components/courses/CourseContent'));
const SubscriptionSuccess = lazy(() => import('@/components/SubscriptionSuccess').then(module => ({ default: module.SubscriptionSuccess })));

// Import Dashboard directly to avoid lazy loading issues
import JDSDashboard from '../jdsimplified/src/pages/Dashboard';

// Import directly for debugging purposes
// import JDSDashboardDirect from '../jdsimplified/src/pages/Dashboard';

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
import AuthenticatedLayout from '../jdsimplified/src/components/AuthenticatedLayout';
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
      <Route 
        path="/chat/:threadId?" 
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/flashcards/*" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader message="Loading flashcards..." />}>
              <NavbarProvider>
                <FlashcardsPage />
              </NavbarProvider>
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <JDSDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:id" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Suspense fallback={<PageLoader message="Loading course details..." />}>
                <PublicCourseDetail />
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/course/:courseId/*" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader message="Loading course content..." />}>
              <CourseContent />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscription/success" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader message="Loading subscription details..." />}>
              <SubscriptionSuccess />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* JDS Course Routes */}
      <Route 
        path="/course/:courseId" 
        element={
          <ProtectedRoute>
            <SimplifiedMode>
              <CourseLayout>
                <JDSDashboard />
              </CourseLayout>
            </SimplifiedMode>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/course/:courseId/module/:moduleId" 
        element={
          <ProtectedRoute>
            <SimplifiedMode>
              <CourseLayout>
                <JDSDashboard />
              </CourseLayout>
            </SimplifiedMode>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/course/:courseId/module/:moduleId/lesson/:lessonId" 
        element={
          <ProtectedRoute>
            <SimplifiedMode>
              <CourseLayout>
                <JDSDashboard />
              </CourseLayout>
            </SimplifiedMode>
          </ProtectedRoute>
        } 
      />
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add listener for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <DomainProvider>
          <AuthProvider>
            <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isMobile }}>
              <SelectedThreadContext.Provider value={{ selectedThreadId, setSelectedThreadId }}>
                <ErrorBoundary
                  fallback={
                    <div className="fixed inset-0 flex items-center justify-center bg-background">
                      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full text-center">
                        <h2 className="text-xl font-bold mb-4">Application Error</h2>
                        <p className="mb-4">
                          The application encountered an unexpected error. Please try refreshing the page.
                        </p>
                        <Button 
                          onClick={() => window.location.reload()}
                          className="w-full bg-orange-600 hover:bg-orange-500"
                        >
                          Reload Application
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <BrowserRouter>
                    <AppRoutes />
                    <Toaster />
                    <OfflineIndicator />
                  </BrowserRouter>
                </ErrorBoundary>
              </SelectedThreadContext.Provider>
            </SidebarContext.Provider>
          </AuthProvider>
        </DomainProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;