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
const PREMIUM_SUBSCRIPTION_PRICE = '$9.99';
const UNLIMITED_SUBSCRIPTION_PRICE = '$19.99';

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
  
  // Check if user has Unlimited tier
  const isUnlimitedTier = () => {
    return subscription?.tier === 'unlimited' && subscription.status === 'active';
  };
  
  // Check if user has Premium tier
  const isPremiumTier = () => {
    return subscription?.tier === 'premium' && subscription.status === 'active';
  };
  
  // Get current subscription tier name
  const getCurrentTierName = () => {
    if (isUnlimitedTier()) return 'Unlimited';
    if (isPremiumTier()) return 'Premium';
    return 'Free Tier';
  };
  
  // Helper function to format subscription end date
  const formatSubscriptionEndDate = () => {
    if (!subscription || !subscription.periodEnd) {
      return 'N/A';
    }
    
    return format(subscription.periodEnd, 'MMM d, yyyy');
  };

  // Handle upgrade to unlimited button click
  const handleUpgradeToUnlimited = () => {
    window.location.href = '/subscribe';
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
      <div className="flex justify-center py-8">
        <LoadingSpinner className="w-8 h-8 text-jdblue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Subscription Section */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Subscription</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            You are currently on the {getCurrentTierName()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/80 rounded-lg p-6 border border-gray-100 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Current Plan</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-1">
              {getCurrentTierName()}
              {!isFreeTier() && (
                <Badge className="ml-2 bg-green-500 text-white">Active</Badge>
              )}
            </p>
            {!isFreeTier() && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Active until: {formatSubscriptionEndDate()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  {isUnlimitedTier() 
                    ? 'Includes unlimited messages and access to all courses' 
                    : 'Includes unlimited messages, but no course access'}
                </p>
              </>
            )}
          </div>
          
          {/* Upgrade Section */}
          <div className="pt-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isFreeTier() 
                ? 'Upgrade Your Plan' 
                : (isPremiumTier() ? 'Manage Your Plan' : 'Manage Your Unlimited Plan')}
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
              {isFreeTier() 
                ? `Get unlimited messages and priority support` 
                : (isPremiumTier() 
                  ? `Manage your premium subscription or upgrade to Unlimited for course access` 
                  : `Manage your unlimited subscription or payment method`)}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={isFreeTier() ? handleSubscribe : handleManageSubscription}
                disabled={isActionLoading}
                className="w-full sm:w-auto bg-[#F37022] hover:bg-[#E36012] text-white"
              >
                {isActionLoading ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {isFreeTier() 
                  ? `Upgrade to Premium (${PREMIUM_SUBSCRIPTION_PRICE}/month)` 
                  : 'Manage Subscription'}
              </Button>
              
              {isPremiumTier() && (
                <Button
                  onClick={handleUpgradeToUnlimited}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Upgrade to Unlimited (${UNLIMITED_SUBSCRIPTION_PRICE}/month)
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Message Usage */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Message Usage</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            Track your monthly message usage
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-base text-gray-700 dark:text-gray-300">{messageCount} messages this month</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshMessageCount} 
              disabled={isActionLoading}
              className="flex items-center gap-1 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {isActionLoading ? <LoadingSpinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              <span>Refresh</span>
            </Button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/80 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#F37022]" 
                style={{ 
                  width: `${Math.min(100, (messageCount / (isFreeTier() ? FREE_TIER_LIMIT : Infinity)) * 100)}%` 
                }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              {isFreeTier() 
                ? `${messageCount}/${FREE_TIER_LIMIT} monthly limit` 
                : 'Unlimited messages with your subscription'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Course Access Section - only show if not on Unlimited tier */}
      {!isUnlimitedTier() && (
        <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Course Access</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-300">
              {isFreeTier() || isPremiumTier() 
                ? 'Upgrade to unlock access to all courses' 
                : 'Your current plan includes access to all courses'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/80 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
              <p className="text-gray-700 dark:text-gray-300">
                With the Unlimited plan, you get access to all courses, including:
              </p>
              <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Complete Constitutional Law course</li>
                <li>Detailed Evidence guides</li>
                <li>Federal Civil Procedure lessons</li>
                <li>And many more subject areas</li>
              </ul>
            </div>
            
            <Button
              onClick={handleUpgradeToUnlimited}
              className="w-full sm:w-auto bg-[#F37022] hover:bg-[#E36012] text-white"
            >
              Upgrade to Unlimited (${UNLIMITED_SUBSCRIPTION_PRICE}/month)
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Developer Tools Section */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            Developer Tools
            <Badge className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-normal" variant="outline">
              Dev Only
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={refreshMessageCount} variant="outline" size="sm" className="flex items-center dark:border-gray-600 dark:hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh Count
            </Button>
            <Button onClick={incrementCount} variant="outline" size="sm" className="flex items-center dark:border-gray-600 dark:hover:bg-gray-700">
              <span className="mr-1">+</span> Increment Count
            </Button>
            <Button onClick={resetMessageCount} variant="outline" size="sm" className="flex items-center dark:border-gray-600 dark:hover:bg-gray-700">
              <span className="mr-1">↺</span> Reset Count
            </Button>
            <Button onClick={runDatabaseTest} variant="outline" size="sm" className="flex items-center dark:border-gray-600 dark:hover:bg-gray-700">
              <span className="mr-1">⚙</span> Test DB Access
            </Button>
          </div>
          
          {diagnosticResult && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-xs text-gray-900 dark:text-gray-300">
              <pre>{diagnosticResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Optional - additional upgrade button at the bottom for quick access */}
      {isFreeTier() && (
        <div className="mt-4 text-center">
          <Button
            onClick={handleSubscribe}
            variant="default"
            className="bg-[#F37022] hover:bg-[#E36012] text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
} 