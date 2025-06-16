import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { StripeCheckoutDialog } from '@/components/stripe/StripeCheckoutDialog';
import ForceSubscriptionRefresh from '@/components/subscription/ForceSubscriptionRefresh';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';

// Constants
const FREE_TIER_LIMIT = FREE_MESSAGE_LIMIT;
const SUBSCRIPTION_PRICE = '$10';

export function SubscriptionSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTierName, setCurrentTierName] = useState<string | null>(null);
  const { toast } = useToast();
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const messageCountCache = new Map<string | undefined, { count: number; timestamp: number }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the subscription hook for tier information
  const { 
    subscription, 
    isLoading: subscriptionLoading, 
    isActive, 
    tierName, 
    current_period_end,
    refreshSubscription 
  } = useSubscriptionWithTier();

  // Handle closing payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  useEffect(() => {
    async function loadMessageCount() {
      try {
        let count = 0;
        
        try {
          count = await getUserMessageCount(user?.id);
          console.log('Message count loaded:', count);
        } catch (countError) {
          console.error('Error loading message count:', countError);
        }
        
        setMessageCount(count);
      } catch (error) {
        console.error('Error loading message count:', error);
        toast({
          title: 'Error',
          description: 'Failed to load message count information. Please try again later.',
          variant: 'destructive',
        });
      }
    }
    
    // Only load message count, subscription is handled by useSubscription hook
    if (user?.id) {
      loadMessageCount();
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [toast, user?.id]);
  
  // Check for upgrade parameter in URL
  useEffect(() => {
    if (subscriptionLoading) return;
    
    const searchParams = new URLSearchParams(location.search);
    const upgradeParam = searchParams.get('upgrade');
    
    if (upgradeParam && user) {
      // Handle the upgrade request
      if (upgradeParam === 'premium' || upgradeParam === 'unlimited') {
        // Use window.history to remove the parameter without navigation
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('upgrade');
        window.history.replaceState({}, '', newUrl.toString());

        // Trigger the subscription flow for the requested tier AFTER modifying the URL
        initiateSubscription(upgradeParam);
      }
    }
  }, [subscriptionLoading, location.search, user, navigate]);

  // Handle subscribe button click
  const handleSubscribe = () => {
    if (!user) {
      navigate('/login?redirectTo=/pricing');
      return;
    }
    navigate('/pricing');
  };
  
  // Handle manage subscription button click
  const handleManageSubscription = async () => {
    try {
      setIsActionLoading(true);
      
      try {
        const portalUrl = await createCustomerPortalSession();
        
        if (!portalUrl) {
          console.error('No portal URL returned');
          toast({
            title: "Error",
            description: "Could not open subscription portal. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        // Open Stripe portal in new tab
        window.open(portalUrl, '_blank');
      } catch (err: any) {
        console.error('Error creating customer portal session:', err);
        
        // Show different error messages based on the error
        if (err.message?.includes('No subscription found')) {
          toast({
            title: "No Subscription Found",
            description: "You don't have an active subscription to manage. Please subscribe to a plan first.",
            variant: "destructive",
            action: <Button onClick={() => navigate('/pricing')}>Subscribe</Button>,
          });
        } else if (err.message?.includes('session has expired') || err.message?.includes('log in again')) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again to manage your subscription.",
            variant: "destructive",
            action: <Button onClick={() => {
              // Clear auth state and redirect to login
              supabase.auth.signOut().then(() => {
                navigate('/login');
              });
            }}>Log In</Button>,
          });
        } else {
          toast({
            title: "Error",
            description: err.message || "Could not open subscription portal. Please try again later or contact support.",
            variant: "destructive",
            action: <Button onClick={() => {
              window.location.href = 'mailto:support@jdsimplified.com?subject=Subscription Portal Error';
            }}>Contact Support</Button>,
          });
        }
      }
    } finally {
      setIsActionLoading(false);
    }
  };
  
  // Check if user is on free tier
  const isFreeTier = () => {
    return !isActive || tierName === 'Free';
  };
  
  // Helper function to format subscription end date
  const formatSubscriptionEndDate = () => {
    if (!current_period_end) {
      return 'N/A';
    }
    
    return format(new Date(current_period_end), 'MMM d, yyyy');
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

  // Function to initiate subscription
  const initiateSubscription = async (tierName: string) => {
    try {
      setIsActionLoading(true);
      setCurrentTierName(tierName);
      
      console.log(`Initiating subscription for tier: ${tierName}`);
      
      const redirectUrlOrClientSecret = await createCheckoutSession(user?.id, tierName.toLowerCase());
      console.log(`Response from createCheckoutSession:`, redirectUrlOrClientSecret);
      
      if (redirectUrlOrClientSecret) {
        // Check if the result is a URL or a client secret
        if (redirectUrlOrClientSecret.startsWith('/checkout-confirmation')) {
          console.log('Received checkout-confirmation URL, redirecting...');
          window.location.href = redirectUrlOrClientSecret;
        } else if (redirectUrlOrClientSecret.startsWith('http')) {
          console.log('Received direct URL, redirecting...');
          window.location.href = redirectUrlOrClientSecret;
        } else {
          console.log('Received client secret, showing payment modal...');
          setClientSecret(redirectUrlOrClientSecret);
          setShowPaymentModal(true);
        }
      } else {
        console.error('No response from createCheckoutSession');
        toast({
          title: 'Error',
          description: 'Failed to create checkout session. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Show more detailed error to the user
      let errorMessage = 'Failed to create checkout session. Please try again later.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Log additional diagnostic information
      console.log('Diagnostic information:', {
        tier: tierName.toLowerCase(),
        userId: user?.id,
        // Don't log any sensitive information
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Render loading state
  if (subscriptionLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="w-8 h-8 text-jdblue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Title */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="text-gray-500 dark:text-gray-300">
          You are currently on the {isFreeTier() ? 'free tier' : `${tierName?.toLowerCase()} plan`}
        </p>
      </div>
      
      {/* Subscription Section */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Current Plan</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            Your subscription details and status:
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/80 rounded-lg p-6 border border-gray-100 dark:border-gray-600">
            <p className="text-base text-gray-700 dark:text-gray-300 mb-1 font-medium">
              {isFreeTier() ? 'Free Tier' : tierName}
            </p>
            {!isFreeTier() && (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Active until: {formatSubscriptionEndDate()}
              </p>
            )}
          </div>
          
          {/* Upgrade Section - moved here */}
          <div className="pt-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Your Plan</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
              {isFreeTier() 
                ? `Get unlimited messages and priority support` 
                : `Ensure your pop-up blocker is disabled and click below to manage your subscription.`}
            </p>
            
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
              {isFreeTier() ? `Upgrade Your Account` : 'Manage Subscription'}
            </Button>
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
                : `Unlimited messages with your ${tierName?.toLowerCase()} subscription`}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Developer Tools Section */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Developer Tools</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-300">
              Testing tools for developers
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
              Warning: These tools are for development and debugging purposes only.
            </p>
            
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={incrementCount}
                  variant="outline"
                  size="sm"
                  disabled={isActionLoading}
                  className="flex items-center gap-1"
                >
                  {isActionLoading ? <LoadingSpinner className="w-4 h-4" /> : null}
                  Increment Message Count
                </Button>
                
                <Button
                  onClick={runDatabaseTest}
                  variant="outline"
                  size="sm"
                  disabled={isActionLoading}
                  className="flex items-center gap-1"
                >
                  {isActionLoading ? <LoadingSpinner className="w-4 h-4" /> : null}
                  Test Database Access
                </Button>
                
                <Button
                  onClick={resetMessageCount}
                  variant="outline"
                  size="sm"
                  disabled={isActionLoading}
                  className="flex items-center gap-1"
                >
                  {isActionLoading ? <LoadingSpinner className="w-4 h-4" /> : null}
                  Reset Count
                </Button>
              </div>
            </div>
            
            {diagnosticResult && (
              <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                {diagnosticResult}
              </pre>
            )}
            
            {/* Add the ForceSubscriptionRefresh component */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-2 text-gray-900 dark:text-white">Subscription Testing</h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <React.Suspense fallback={<div className="py-4 flex justify-center"><LoadingSpinner className="w-6 h-6" /></div>}>
                  <ForceSubscriptionRefresh />
                </React.Suspense>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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

      {/* Payment modal */}
      {clientSecret && (
        <StripeCheckoutDialog
          open={showPaymentModal}
          onClose={handleClosePaymentModal}
          clientSecret={clientSecret}
          title={`Complete your ${currentTierName} subscription`}
          description="This will give you unlimited access to Ask JDS features"
          onError={(error) => {
            console.error('Payment error:', error);
            toast({
              title: "Error",
              description: error.message || 'Payment failed',
              variant: "destructive",
            });
          }}
        />
      )}
    </div>
  );
} 