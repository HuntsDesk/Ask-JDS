import React, { useEffect, useState, useRef, useContext } from 'react';
import { SubscriptionSettings } from './SubscriptionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, MessageSquare, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/chat/Sidebar';
import { cn } from '@/lib/utils';
import { useThreads } from '@/hooks/use-threads';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileInfo } from './UserProfileInfo';
import { useTheme } from '@/lib/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPinnedSidebar, setIsPinnedSidebar] = useState(false);
  
  // Use the threads hook to fetch actual threads
  const { threads, loading: threadsLoading, deleteThread, updateThread } = useThreads();
  const { setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { theme, setTheme } = useTheme();

  // Handle sidebar expansion/collapse properly
  useEffect(() => {
    // Set CSS variables for sidebar width
    document.documentElement.style.setProperty('--sidebar-width', '280px');
    document.documentElement.style.setProperty('--sidebar-collapsed-width', '70px');
    
    // Get the sidebar element
    const sidebarElement = document.querySelector('.sidebar-container');
    if (sidebarElement) {
      if (isExpanded) {
        // Expanded state
        (sidebarElement as HTMLElement).style.width = '280px';
        sidebarElement.classList.add('expanded');
        sidebarElement.classList.remove('collapsed');
      } else {
        // Collapsed state
        (sidebarElement as HTMLElement).style.width = '70px';
        sidebarElement.classList.add('collapsed');
        sidebarElement.classList.remove('expanded');
      }
    }
  }, [isExpanded]);

  // IMPORTANT: Do NOT auto-expand sidebar on Settings page for mobile
  // This was likely causing the mobile sidebar to stay open when clicking Settings
  useEffect(() => {
    console.log('SettingsPage mounted, isMobile:', isMobile, 'isExpanded:', isExpanded);
    
    // Only auto-expand on desktop devices, NEVER on mobile
    if (!isMobile) {
      console.log('SettingsPage: Auto-expanding sidebar on desktop');
      // Use a setTimeout to ensure this happens AFTER any navigation-triggered state changes
      setTimeout(() => {
        setIsExpanded(true);
      }, 50);
    } else {
      console.log('SettingsPage: Preserving sidebar state on mobile:', isExpanded ? 'expanded' : 'collapsed');
      // DO NOT modify the sidebar state on mobile - this ensures handleNavLinkClick works properly
    }
  }, [isMobile, setIsExpanded, isExpanded]);

  // Sidebar functions
  const handleNewChat = () => {
    navigate('/chat');
  };
  
  const handleDeleteThread = async (id: string) => {
    await deleteThread(id);
  };
  
  const handleRenameThread = async (id: string, newTitle: string) => {
    await updateThread(id, { title: newTitle });
  };
  
  // Handle thread selection from sidebar
  const handleThreadSelect = (threadId: string) => {
    // First set the global selected thread ID
    console.log('SettingsPage: handleThreadSelect called with thread ID:', threadId);
    setSelectedThreadId(threadId);
    
    // Debug log
    console.log('SettingsPage: Set global thread ID, now preparing navigation');
    
    // Use setTimeout to ensure context update happens before navigation
    setTimeout(() => {
      // Then navigate to the chat page with the selected thread ID
      console.log('SettingsPage: Now navigating to thread:', threadId);
      navigate(`/chat/${threadId}`);
    }, 0);
  };

  useEffect(() => {
    // Set a safety timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('Safety timeout triggered for settings page loading');
      setIsLoading(false);
      toast({
        title: 'Loading timeout',
        description: 'Settings are taking longer than expected to load. You may need to refresh the page.',
        variant: 'default',
      });
    }, 8000); // 8 second timeout (increased from 5 seconds)

    // If auth is no longer loading, clear the timeout and update our loading state
    if (!loading) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setIsLoading(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, toast]);

  // If still loading, show spinner
  if (isLoading || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <LoadingSpinner className="h-12 w-12 mb-4" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  // If no user after loading completes, redirect to home
  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="bg-background min-h-screen flex">
      {/* Mobile backdrop - only show on mobile when sidebar is expanded */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => {
            console.log('Settings: Backdrop clicked, closing sidebar from expanded state:', isExpanded);
            // Ensure we're properly updating both state and context
            setIsExpanded(false);
            
            // Log the state change for debugging
            setTimeout(() => {
              console.log('Settings: Sidebar state after backdrop click: collapsed');
            }, 10);
          }}
        />
      )}
      
      {/* Chat Sidebar */}
      <Sidebar
        setActiveTab={handleThreadSelect}
        isDesktopExpanded={isExpanded}
        onDesktopExpandedChange={setIsExpanded}
        isPinned={isPinnedSidebar}
        onPinChange={setIsPinnedSidebar}
        onNewChat={handleNewChat}
        onSignOut={signOut}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        sessions={threads} // Use actual threads instead of empty array
        currentSession={null}
      />
      
      {/* Main Content */}
      <div 
        className="flex-1 transition-all duration-300 overflow-x-hidden w-full max-w-full"
        style={{ 
          marginLeft: isMobile 
            ? '0' // Don't apply margin on mobile, let sidebar overlay
            : (isExpanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed-width)')
        }}
      >
        {/* Mobile Header with Hamburger Menu */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
            <button
              onClick={() => {
                const newExpandedState = !isExpanded;
                console.log('Settings: Hamburger menu clicked! Toggling sidebar from', isExpanded, 'to', newExpandedState);
                
                // Update the state
                setIsExpanded(newExpandedState);
                
                // Log the state change for debugging
                setTimeout(() => {
                  console.log('Settings: Sidebar state after toggle:', newExpandedState ? 'expanded' : 'collapsed');
                }, 10);
              }}
              className="p-2 rounded-md bg-[#f37022] text-white hover:bg-[#e36012] flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h1>
            <div className="w-9"></div> {/* Spacer for alignment */}
          </header>
        )}
        
        <div className={`container py-6 max-w-4xl mx-auto ${isMobile ? 'pt-16' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            {/* Only show h1 title on desktop */}
            {!isMobile && <h1 className="text-3xl font-bold">Settings</h1>}
          </div>
          
          <Tabs defaultValue="subscription" className="space-y-4">
            <TabsList>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Settings</CardTitle>
                  <CardDescription>
                    Manage your subscription and message usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionSettings />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserProfileForm />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                  <CardDescription>
                    View your usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserProfileInfo />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Customize the application appearance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Color Theme</h3>
                      <RadioGroup 
                        value={theme} 
                        onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                        className="flex flex-col space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="light" id="light" />
                          <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer">
                            <Sun className="h-5 w-5" />
                            <span>Light</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="dark" id="dark" />
                          <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
                            <Moon className="h-5 w-5" />
                            <span>Dark</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="system" id="system" />
                          <Label htmlFor="system" className="flex items-center space-x-2 cursor-pointer">
                            <Monitor className="h-5 w-5" />
                            <span>System</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        System theme will automatically switch between light and dark themes based on your system preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 