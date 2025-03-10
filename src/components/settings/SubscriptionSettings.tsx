import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CreditCard, Info, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getUserSubscription,
  getUserMessageCount,
  FREE_MESSAGE_LIMIT,
  createCheckoutSession,
  createCustomerPortalSession,
  hasActiveSubscription,
  ensureMessageCountRecord,
  testDatabaseAccess,
  specialUpdateMessageCount,
  incrementUserMessageCount,
  getLifetimeMessageCount,
  forceUpdateMessageCount
} from '@/lib/subscription';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

// Constants
const FREE_TIER_LIMIT = FREE_MESSAGE_LIMIT;
const SUBSCRIPTION_PRICE = '$5';

export function SubscriptionSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const { toast } = useToast();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const messageCountCache = new Map<string | undefined, { count: number; timestamp: number }>();

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        setIsLoading(true);
        
        // Set a safety timeout to prevent infinite loading
        loadingTimeoutRef.current = setTimeout(() => {
          console.log('Safety timeout triggered for subscription data loading');
          setIsLoading(false);
          toast({
            title: 'Loading timeout',
            description: 'Subscription data is taking longer than expected to load. Some information may be incomplete.',
            variant: 'default',
          });
        }, 8000); // 8 second timeout
        
        // Try to load subscription data with error handling for each promise
        let subscriptionData = null;
        let count = 0;
        
        try {
          subscriptionData = await getUserSubscription(user?.id);
          console.log('Subscription data loaded:', subscriptionData);
        } catch (subError) {
          console.error('Error loading subscription:', subError);
        }
        
        try {
          count = await getUserMessageCount(user?.id);
          console.log('Message count loaded:', count);
        } catch (countError) {
          console.error('Error loading message count:', countError);
        }
        
        setSubscription(subscriptionData);
        setMessageCount(count);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription information. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }
    
    loadSubscriptionData();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [toast, user?.id]);
  
  // Handle subscribe button click
  const handleSubscribe = async () => {
    try {
      setIsActionLoading(true);
      
      const url = await createCheckoutSession(user?.id);
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create checkout session. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Handle manage subscription button click
  const handleManageSubscription = async () => {
    try {
      setIsActionLoading(true);
      
      const url = await createCustomerPortalSession(user?.id);
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to access customer portal. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to access customer portal. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Check if user is on free tier
  const isFreeTier = () => {
    return !subscription || subscription.status !== 'active';
  };
  
  // Helper function to format subscription end date
  const formatSubscriptionEndDate = () => {
    if (!subscription || !subscription.periodEnd) {
      return 'N/A';
    }
    
    return format(subscription.periodEnd, 'MMM d, yyyy');
  };

  // Function to refresh message count
  const refreshMessageCount = async () => {
    try {
      console.log('Refreshing message count');
      setIsActionLoading(true);
      
      // Always force refresh to get the latest count from the database
      const refreshedCount = await getUserMessageCount(user?.id, true);
      console.log('Message count refreshed to:', refreshedCount);
      
      setMessageCount(refreshedCount);
      toast({
        title: "Count Updated",
        description: `Your message count is now ${refreshedCount}`,
      });
      
      return refreshedCount;
    } catch (error) {
      console.error("Error refreshing message count:", error);
      toast({
        title: "Error",
        description: "Failed to refresh message count. See console for details.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Function to increment message count
  const incrementCount = async () => {
    try {
      setIsActionLoading(true);
      const newCount = await incrementUserMessageCount(user?.id);
      
      setMessageCount(newCount);
      toast({
        title: "Count Incremented",
        description: `Your message count is now ${newCount}`,
      });
    } catch (error) {
      console.error("Error incrementing count:", error);
      toast({
        title: "Error",
        description: "Failed to increment count. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Function to reset the message count to zero
  const resetMessageCount = async () => {
    try {
      setIsActionLoading(true);
      
      // Find the current month's record and update directly to 0
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      console.log('Resetting message count to 0...');
      
      // First get any records for this user
      const { data: records, error: fetchError } = await supabase
        .from('message_counts')
        .select('id, count')
        .eq('user_id', user?.id)
        .gte('period_start', firstDayOfMonth.toISOString())
        .lt('period_end', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching message count records:', fetchError);
        toast({
          title: "Error",
          description: "Failed to find message count records",
          variant: "destructive",
        });
        return;
      }
      
      if (records && records.length > 0) {
        console.log(`Found existing record with id ${records[0].id} and count ${records[0].count}. Updating to 0.`);
        
        // Update the most recent record to count=0
        const { error: updateError } = await supabase
          .from('message_counts')
          .update({ 
            count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', records[0].id);
        
        if (updateError) {
          console.error('Error resetting count:', updateError);
          toast({
            title: "Error",
            description: "Failed to reset message count",
            variant: "destructive",
          });
        } else {
          // Success - update the local UI and cache
          setMessageCount(0);
          
          // Clear cache in subscription.ts
          if (messageCountCache && typeof messageCountCache.delete === 'function') {
            messageCountCache.delete(user?.id);
          }
          
          // Set a fresh cache entry
          if (messageCountCache && typeof messageCountCache.set === 'function') {
            messageCountCache.set(user?.id!, {
              count: 0,
              timestamp: Date.now()
            });
          }
          
          toast({
            title: "Count Reset",
            description: "Your message count has been reset to 0",
          });
        }
      } else {
        console.log('No message count records found, creating a new one with count=0');
        
        // Create a record with count=0
        const monthStart = firstDayOfMonth.toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        
        const { error: insertError } = await supabase
          .from('message_counts')
          .insert({
            user_id: user?.id,
            count: 0,
            period_start: monthStart,
            period_end: monthEnd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating record with count=0:', insertError);
          
          // Try upsert if the insert failed (might be a unique constraint violation)
          if (insertError.code === '23505') {
            console.log('Unique constraint violation. Trying upsert instead.');
            
            const { error: upsertError } = await supabase
              .from('message_counts')
              .upsert({
                user_id: user?.id,
                count: 0, 
                period_start: monthStart,
                period_end: monthEnd,
                updated_at: new Date().toISOString()
              });
            
            if (upsertError) {
              console.error('Upsert also failed:', upsertError);
              toast({
                title: "Error",
                description: "Failed to reset message count",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to create message count record",
              variant: "destructive",
            });
            return;
          }
        }
        
        // Update UI and cache regardless of insert or upsert
        setMessageCount(0);
        
        // Clear and update cache
        if (messageCountCache && typeof messageCountCache.delete === 'function') {
          messageCountCache.delete(user?.id);
        }
        
        if (messageCountCache && typeof messageCountCache.set === 'function') {
          messageCountCache.set(user?.id!, {
            count: 0,
            timestamp: Date.now()
          });
        }
        
        toast({
          title: "Count Reset",
          description: "Your message count has been reset to 0",
        });
      }
    } catch (error) {
      console.error("Error resetting count:", error);
      toast({
        title: "Error",
        description: "Failed to reset message count. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Test database access
  const runDatabaseTest = async () => {
    try {
      setIsActionLoading(true);
      const result = await testDatabaseAccess();
      setDiagnosticResult(JSON.stringify(result, null, 2));
      
      toast({
        title: result.success ? "Test Passed" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error running database test:", error);
      setDiagnosticResult(String(error));
      toast({
        title: "Error",
        description: "Failed to run database test. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading your subscription information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner className="h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          {isFreeTier() 
            ? 'You are currently on the free tier' 
            : 'You have an active Ask JDS Premium subscription'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Current Plan</h3>
          <p className="text-sm text-muted-foreground">
            {isFreeTier() ? 'Free Tier' : 'Premium Plan'}
          </p>
          {!isFreeTier() && (
            <div className="mt-2 text-sm rounded-md bg-muted p-3">
              <p>Your subscription renews on <strong>{formatSubscriptionEndDate()}</strong></p>
              {subscription.cancelAtPeriodEnd && (
                <p className="mt-1 text-yellow-500">
                  Your subscription is set to cancel at the end of the current billing period.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Message Usage</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {isFreeTier() 
                ? `${messageCount}/${FREE_MESSAGE_LIMIT} messages this month`
                : `${messageCount} messages this month`}
            </p>
          </div>
          
          {isFreeTier() && messageCount >= FREE_MESSAGE_LIMIT && (
            <div className="mt-2 text-sm rounded-md bg-destructive/15 p-3 text-destructive">
              <p>You have reached your free message limit for this month. Upgrade to Premium for unlimited messages.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {isFreeTier() ? (
          <Button 
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubscribe}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={handleManageSubscription}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </>
            )}
          </Button>
        )}
        
        {/* Developer tools section - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Separator className="my-4" />
            <div className="w-full">
              <h3 className="text-lg font-medium flex items-center gap-2">
                Developer Tools
                <Badge variant="outline">Dev Only</Badge>
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={refreshMessageCount} 
                  disabled={isActionLoading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Count
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={incrementCount} 
                  disabled={isActionLoading}
                >
                  Increment Count
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={resetMessageCount} 
                  disabled={isActionLoading}
                >
                  Reset Count
                </Button>
              </div>
              {diagnosticResult && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Diagnostic Results:</h4>
                  <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {diagnosticResult}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
} 