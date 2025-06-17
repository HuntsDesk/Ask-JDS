import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '../ui/button';
import { Shield, Loader2, LayoutDashboard, BookOpen, Library, Users, Settings, LogOut, MessageSquare, Eye, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router-dom";
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ui/theme-toggle';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkStatus, setCheckStatus] = useState("Initializing...");
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Set up a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log("Admin check timeout occurred after 8 seconds");
          setTimeoutOccurred(true);
          setIsLoading(false);
        }, 8000);

        // Try multiple methods to determine admin status
        console.log("Checking admin status for user:", user);
        setCheckStatus("Checking user metadata...");
        
        // Method 1: Check user metadata
        if (user.user_metadata?.is_admin) {
          console.log("Admin found via user_metadata.is_admin");
          setIsAdmin(true);
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        // Method 2: Check for legacy admin field
        if (user.user_metadata?.admin) {
          console.log("Admin found via user_metadata.admin");
          setIsAdmin(true);
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        // Method 3: Check isAdmin property directly
        if (user.isAdmin) {
          console.log("Admin found via user.isAdmin property");
          setIsAdmin(true);
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        // Method 4: Check from the database profile
        setCheckStatus("Checking database profile...");
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error checking admin status from profiles:", error);
          setCheckStatus("Checking admin RPC function...");
          // Try the RPC function as a fallback
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('is_user_admin', { user_id: user.id });
            
          if (rpcError) {
            console.error("Error checking admin status via RPC:", rpcError);
            setIsAdmin(false);
          } else {
            console.log("Admin status via RPC:", rpcData);
            setIsAdmin(rpcData);
          }
        } else {
          console.log("Admin status from profiles table:", data?.is_admin);
          setIsAdmin(data?.is_admin || false);
        }
        
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="mb-4">Please log in to access the admin panel.</p>
          <Button onClick={() => navigate("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="mb-2">Checking admin privileges...</p>
          <p className="text-sm text-muted-foreground">{checkStatus}</p>
        </div>
      </div>
    );
  }

  // Show timeout error
  if (timeoutOccurred) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-amber-600 mb-4">Authorization Check Timeout</h1>
          <p className="mb-4">
            The admin status check took too long to complete. This might be due to connection issues.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-left mb-4">
            <h3 className="font-medium mb-2">User Information:</h3>
            <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
              {JSON.stringify({ email: user.email, userId: user.id, metadata: user.user_metadata }, null, 2)}
            </pre>
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-4">
            You don't have permission to access the admin panel.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-left mb-4">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
              {JSON.stringify({ 
                email: user.email, 
                userId: user.id, 
                isAdmin: user.isAdmin,
                metadata: user.user_metadata 
              }, null, 2)}
            </pre>
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/admin/set-admin")}>
              Set Admin Status
            </Button>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Home
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar navigation items
  const navItems = [
    { 
      path: "/admin/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/admin/courses", 
      label: "Courses", 
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      description: "Add, edit, delete courses, modules, and lessons"
    },
    { 
      path: "/admin/flashcards", 
      label: "Flashcards", 
      icon: <Library className="h-5 w-5 mr-3" />,
      description: "Manage subjects, collections, and flashcards" 
    },
    { 
      path: "/admin/askjds", 
      label: "AskJDS", 
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      description: "TBD" 
    },
    { 
      path: "/admin/users", 
      label: "Users", 
      icon: <Users className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/admin/security", 
      label: "Security", 
      icon: <Eye className="h-5 w-5 mr-3" />,
      description: "Security violations and monitoring dashboard"
    },
    { 
      path: "/admin/error-logs", 
      label: "Error Logs", 
      icon: <Shield className="h-5 w-5 mr-3" /> 
    },
    {
      path: "/admin/settings", 
      label: "Settings", 
      icon: <Settings className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/admin/price-mapping", 
      label: "Price Mapping", 
      icon: <DollarSign className="h-5 w-5 mr-3" />,
      description: "Manage Stripe price ID mappings for flexible pricing"
    }
  ];

  // Active item determination
  const getIsActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border flex-shrink-0 overflow-y-auto">
        <div className="h-16 border-b border-border flex items-center px-4">
          <h1 className="text-lg font-bold flex items-center">
            <Shield className="h-5 w-5 mr-2 text-orange-500" />
            JD Simplified Admin
          </h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-orange-500 text-white" 
                  : "hover:bg-accent"
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          <Separator className="my-4" />
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex justify-between items-center px-4 md:px-6">
          <h1 className="text-xl font-bold">{title || 'Admin Panel'}</h1>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </header>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 