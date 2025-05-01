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
import { useThreads } from '@/hooks/use-threads';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileInfo } from './UserProfileInfo';
import { useTheme } from '@/lib/theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import PageContainer from '@/components/layout/PageContainer';

export function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the threads hook to fetch actual threads
  const { threads, loading: threadsLoading, deleteThread, updateThread } = useThreads();
  const { setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isMobile } = useContext(SidebarContext);
  const { theme, setTheme } = useTheme();

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
      <PageContainer>
        <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-900">
          <LoadingSpinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground dark:text-gray-400">Loading settings...</p>
        </div>
      </PageContainer>
    );
  }

  // If no user after loading completes, redirect to home
  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  // Configure sidebar props (keeping this for reference, but not using SidebarLayout)
  const sidebarProps = {
    onNewChat: handleNewChat,
    onSignOut: signOut,
    onDeleteThread: handleDeleteThread,
    onRenameThread: handleRenameThread,
    sessions: threads,
    currentSession: null,
    setActiveTab: handleThreadSelect,
  };

  return (
    <PageContainer className="pt-4" flexColumn>
      <div className="bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-6">
          {/* Only show h1 title on desktop */}
          {!isMobile && <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>}
        </div>
        
        <Tabs defaultValue="subscription" className="space-y-4">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="subscription" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              Subscription
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
            >
              Appearance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription" className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white">Subscription Settings</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-300">
                  Manage your subscription and message usage
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <SubscriptionSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-300">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <UserProfileForm />
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white">Account Statistics</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-300">
                  View your usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <UserProfileInfo />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-gray-900 dark:text-white">Theme Settings</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-300">
                  Customize the application appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Color Theme</h3>
                    <RadioGroup 
                      value={theme} 
                      onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem 
                          value="light" 
                          id="light" 
                          className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                        />
                        <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <Sun className="h-5 w-5 text-amber-500" />
                          <span>Light</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem 
                          value="dark" 
                          id="dark" 
                          className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                        />
                        <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <Moon className="h-5 w-5 text-indigo-500" />
                          <span>Dark</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem 
                          value="system" 
                          id="system" 
                          className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                        />
                        <Label htmlFor="system" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <Monitor className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <span>System</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      System theme will automatically switch between light and dark themes based on your system preferences.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </PageContainer>
  );
} 