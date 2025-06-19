import React, { useEffect, useState, Suspense, lazy, createContext, useContext, startTransition } from 'react';
import { useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import { DomainProvider, useDomain } from '@/lib/domain-context';
import SimplifiedMode from '@/lib/SimplifiedMode';
import { NavbarProvider } from '@/contexts/NavbarContext';
import { CloseProvider } from '@/contexts/close-context';
import { PaywallProvider } from '@/contexts/paywall-context';
import { LayoutDebugger } from '@/components/LayoutDebugger';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/lib/theme-provider';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { logEnvironmentInfo } from '@/lib/environment';

// Debugging utility
const debugLog = (message: string, data?: any) => {
  console.log(`[App Debug] ${message}`, data || '');
};

// Log environment information on app startup
if (import.meta.env.DEV) {
  logEnvironmentInfo();
}

// Direct imports for homepage components
import { HomePage } from '@/components/HomePage';

// Import legal pages
import { TermsOfService } from '@/pages/TermsOfService';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { Disclaimer } from '@/pages/Disclaimer';

// Import our new Navbar components
import { AskJDSNavbar } from '@/components/askjds/AskJDSNavbar';

// Import the new PersistentLayout
import { PersistentLayout } from '@/components/layout/PersistentLayout';

// Lazy load large components
// Note: The React.StrictMode in main.tsx causes components to mount twice in development
// This is normal and helps catch side effect bugs. It does NOT indicate duplicate components in production.
// IMPORTANT: AuthProvider is already present at the app root level. DO NOT add additional AuthProviders in route components.
const ChatLayout = lazy(() => import('@/components/chat/ChatLayout').then(module => ({ default: module.ChatLayout })));
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const FlashcardsPage = lazy(() => import('@/components/flashcards/FlashcardsPage'));
const CoursesPage = lazy(() => import('@/components/courses/CoursesPage'));
const CourseDetail = lazy(() => import('./components/admin/CourseDetail').then(module => ({ default: module.CourseDetail })));
const PublicCourseDetail = lazy(() => import('@/components/courses/CourseDetail'));
const CourseContent = lazy(() => import('@/components/courses/CourseContent'));
const SubscriptionSuccess = lazy(() => import('@/components/SubscriptionSuccess').then(module => ({ default: module.SubscriptionSuccess })));

// Import ChatContainer directly to avoid lazy loading flash
import ChatContainer from '@/components/chat/ChatContainer';

// Import Dashboard directly to avoid lazy loading issues
import JDSDashboard from '@/pages/Dashboard';

// Import directly for debugging purposes
// import JDSDashboardDirect from '@/pages/Dashboard';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { DebugTrigger } from '@/components/debug/DebugTrigger';
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
const AdminPriceMapping = lazy(() => import('@/components/admin/AdminPriceMapping').then(module => ({ default: module.default })));
const Utilities = lazy(() => import('@/components/admin/Utilities').then(module => ({ default: module.default })));
const SetAdminStatus = lazy(() => import('@/components/admin/SetAdmin').then(module => ({ default: module.default })));
const AdminSecurity = lazy(() => import('@/components/admin/SecurityDashboard').then(module => ({ default: module.SecurityDashboard })));

// Import debug components
const UsermavenDebug = lazy(() => import('@/components/debug/UsermavenDebug').then(module => ({ default: module.UsermavenDebug })));

// Import SetAdminStatus directly for the setup route
import SetAdminSetup from './components/admin/SetAdmin';

// Import the checkout confirmation page
const CheckoutConfirmationPage = lazy(() => import('@/pages/CheckoutConfirmationPage').then(module => ({ default: module.CheckoutConfirmationPage })));

// Import the pricing page
const PricingPage = lazy(() => import('@/pages/PricingPage').then(module => ({ default: module.PricingPage })));

// Import AuthCallback
import AuthCallback from './pages/auth/AuthCallback';
import ResendConfirmationPage from './pages/auth/ResendConfirmationPage';

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

// Add a wrapper component for debugging
const DebuggedCourseContent = () => {
  React.useEffect(() => {
    debugLog("Rendering CourseContent for /course/:courseId route");
  }, []);
  
  return <CourseContent />;
};

// Create a generic async wrapper for lazy-loaded components
const createAsyncWrapper = (Component: React.ComponentType, fallbackMessage: string = "Loading...") => {
  return () => {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
      // Use a small delay to ensure the route transition completes first
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          setIsReady(true);
        });
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }, []);
    
    if (!isReady) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <LoadingSpinner className="w-8 h-8" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{fallbackMessage}</p>
          </div>
        </div>
      );
    }
    
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <LoadingSpinner className="w-8 h-8" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{fallbackMessage}</p>
          </div>
        </div>
      }>
        <Component />
      </Suspense>
    );
  };
};

// Create a wrapper for CourseAccessGuard that uses startTransition
const AsyncCourseAccessGuard = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Use a small delay to ensure the route transition completes first
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        setIsReady(true);
      });
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  if (!isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    }>
      <CourseAccessGuard>{children}</CourseAccessGuard>
    </Suspense>
  );
};

// Create async wrappers for components that may cause suspense issues
const AsyncAuthPage = createAsyncWrapper(AuthPage, "Loading authentication...");
const AsyncCheckoutConfirmationPage = createAsyncWrapper(CheckoutConfirmationPage, "Loading confirmation...");
const AsyncPricingPage = createAsyncWrapper(PricingPage, "Loading pricing...");

// Add import for CourseAccessGuard
import CourseAccessGuard from './components/guards/CourseAccessGuard';

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
          path="/admin/security" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading security dashboard..." />}>
                <AdminSecurity />
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
        <Route 
          path="/admin/price-mapping" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading price mapping..." />}>
                <AdminPriceMapping />
              </Suspense>
            </ProtectedRoute>
          } 
        />

        <Route path="/auth" element={
          <AsyncAuthPage />
        } />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/security" element={<AdminSecurity />} />
        <Route path="admin/error-logs" element={<AdminErrorLogs />} />
        <Route path="admin/courses" element={<AdminCourses />} />
        <Route path="admin/courses/:courseId" element={<CourseDetail />} />
        <Route path="admin/flashcards" element={<AdminFlashcards />} />
        <Route path="admin/askjds" element={<AdminAskJDS />} />
        <Route path="admin/settings" element={<AdminSettings />} />
                        <Route path="admin/price-mapping" element={<AdminPriceMapping />} />
                <Route path="admin/utilities" element={<Utilities />} />
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
      <Route path="/" element={<HomePage />} />
      
      {/* Add back the login redirect without triggering auth initialization */}
      <Route path="/login" element={<SimpleRedirect to="/auth" />} />
      
      <Route path="/auth" element={
        <AsyncAuthPage />
      } />
      
      {/* Auth callback route for email confirmation */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Resend confirmation email route */}
      <Route path="/auth/resend-confirmation" element={<ResendConfirmationPage />} />
      
      {/* Legal Pages - Public Access */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      
      {/* Debug Routes - Development Only */}
      {import.meta.env.DEV && (
        <Route 
          path="/debug/usermaven" 
          element={
            <Suspense fallback={<PageLoader message="Loading debug..." />}>
              <UsermavenDebug />
            </Suspense>
          } 
        />
      )}
      
      {/* Pricing Page */}
      <Route path="/pricing" element={
        <ProtectedRoute>
          <AsyncPricingPage />
        </ProtectedRoute>
      } />
      
      {/* Checkout Confirmation Page (Standalone) */}
      <Route path="/checkout-confirmation" element={
        <AsyncCheckoutConfirmationPage />
      } />
      
      {/* Protected routes wrapped in PersistentLayout */}
      <Route element={
        <ProtectedRoute>
          <PersistentLayout />
        </ProtectedRoute>
      }>
        <Route path="/chat/:threadId?" element={<ChatContainer />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/flashcards/*" element={
          <Suspense fallback={<PageLoader message="Loading flashcards..." />}>
            <NavbarProvider>
              <FlashcardsPage />
            </NavbarProvider>
          </Suspense>
        } />
        <Route path="/courses/*" element={
          <Suspense fallback={<PageLoader message="Loading courses..." />}>
            <CoursesPage />
          </Suspense>
        } />
        <Route path="/course-detail/:id" element={
          <Suspense fallback={<PageLoader message="Loading course details..." />}>
            <PublicCourseDetail />
          </Suspense>
        } />
        <Route path="/subscription/success" element={
          <Suspense fallback={<PageLoader message="Loading subscription details..." />}>
            <SubscriptionSuccess />
          </Suspense>
        } />
      </Route>
      
      {/* Course Routes (access controlled by entitlement) - Outside of PersistentLayout */}
      <Route path="/course/:courseId" element={
        <ProtectedRoute>
          <AsyncCourseAccessGuard>
            <CourseLayout>
              <React.Fragment>
                <DebuggedCourseContent />
              </React.Fragment>
            </CourseLayout>
          </AsyncCourseAccessGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/course/:courseId/module/:moduleId" element={
        <ProtectedRoute>
          <AsyncCourseAccessGuard>
            <CourseLayout>
              <CourseContent />
            </CourseLayout>
          </AsyncCourseAccessGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/course/:courseId/module/:moduleId/lesson/:lessonId" element={
        <ProtectedRoute>
          <AsyncCourseAccessGuard>
            <CourseLayout>
              <CourseContent />
            </CourseLayout>
          </AsyncCourseAccessGuard>
        </ProtectedRoute>
      } />
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
function AppWrapper() {
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
  
  useEffect(() => {
    // Clean up potential auth-related localStorage items that might cause issues
    const keysToReset = [
      'protected_redirect_attempts',
      'auth_redirect_attempts'
    ];
    
    keysToReset.forEach(key => {
      try {
        if (sessionStorage.getItem(key)) {
          console.log(`Cleaning up ${key} from sessionStorage`);
          sessionStorage.removeItem(key);
        }
      } catch (e) {
        console.warn(`Error cleaning up ${key}:`, e);
      }
    });
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <DomainProvider>
          <SubscriptionProvider>
            <PaywallProvider>
              <CloseProvider>
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
                        <HotToaster position="top-right" />
                        <OfflineIndicator />
                        <LayoutDebugger />
                        <DebugTrigger />
                      </BrowserRouter>
                    </ErrorBoundary>
                  </SelectedThreadContext.Provider>
                </SidebarContext.Provider>
              </CloseProvider>
            </PaywallProvider>
          </SubscriptionProvider>
        </DomainProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;