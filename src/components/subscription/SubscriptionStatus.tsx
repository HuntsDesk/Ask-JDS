/**
 * Component for displaying user subscription status and management options
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { createUnlimitedSubscriptionCheckout } from '@/lib/stripe/checkout';
import { useAnalytics } from '@/hooks/use-analytics';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SubscriptionStatusProps {
  hideManagement?: boolean;
  compact?: boolean;
}

interface Subscription {
  id: string;
  tier: string; 
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  hideManagement = false,
  compact = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  
  // Prefetch the upgrade page
  useEffect(() => {
    // Prefetch the upgrade page for faster navigation
    if (subscription?.tier !== 'unlimited') {
      navigate('/unlimited', { replace: false });
    }
  }, [subscription?.tier, navigate]);
  
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id, tier, status, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Couldn't load subscription data",
          description: "Please try again later",
          variant: "destructive",
        });
        return;
      }
      
      setSubscription(data);
      
      // Track view event for analytics
      if (data) {
        trackEvent('subscription_view', {
          subscription_id: data.id,
          subscription_tier: data.tier,
          subscription_status: data.status,
          cancel_at_period_end: data.cancel_at_period_end
        });
      }
    } catch (error) {
      console.error('Error in subscription fetch:', error);
      toast({
        title: "Error loading subscription",
        description: "Please refresh the page to try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);
  
  const handlePortalAccess = async () => {
    if (!subscription?.stripe_customer_id) {
      toast({
        title: "Unable to manage subscription",
        description: "Please contact support for assistance",
        variant: "destructive",
      });
      return;
    }
    
    setPortalLoading(true);
    
    try {
      trackEvent('customer_portal_access', {
        subscription_id: subscription.id,
        subscription_tier: subscription.tier
      });
      
      // Call the API to get the customer portal URL
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.href,
          customer_id: subscription.stripe_customer_id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get customer portal URL');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Unable to access billing portal",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };
  
  const handleUpgrade = () => {
    navigate('/unlimited');
    
    trackEvent('upgrade_initiated', {
      current_tier: subscription?.tier || 'none'
    });
  };
  
  // Show loading state
  if (loading) {
    return (
      <Card className={compact ? 'p-4' : undefined}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  // No subscription found
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don't have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {/* Localization-friendly format */}
            Subscribe to get access to all our courses and features.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpgrade} className="w-full">
            View Subscription Options
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Inactive subscription
  if (subscription.status !== 'active') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Inactive Subscription
            <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 bg-amber-50">
              {subscription.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {/* Localization-friendly format */}
            Your {subscription.tier} subscription is no longer active.
          </p>
          {subscription.status === 'past_due' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Your payment failed. Please update your payment method to reactivate your subscription.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full">
            Reactivate Subscription
          </Button>
          {subscription.stripe_customer_id && !hideManagement && (
            <Button 
              onClick={handlePortalAccess} 
              variant="outline" 
              className="w-full"
              disabled={portalLoading}
            >
              {portalLoading ? 'Loading...' : 'Update Payment Method'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }
  
  // Get days until expiration
  const daysRemaining = subscription.current_period_end
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const isExpiringSoon = daysRemaining <= 7;
  
  // Active subscription - compact version
  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${subscription.tier === 'unlimited' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
              {subscription.tier === 'unlimited' ? 'Unlimited' : 'Ask JDS'}
            </Badge>
            {subscription.cancel_at_period_end && (
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 bg-amber-50">
                Cancels soon
              </Badge>
            )}
          </div>
          {!hideManagement && (
            <Button 
              onClick={handlePortalAccess} 
              variant="ghost" 
              size="sm"
              disabled={portalLoading}
            >
              {portalLoading ? 'Loading...' : 'Manage'}
            </Button>
          )}
        </div>
      </Card>
    );
  }
  
  // Active subscription - full version
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Your Subscription</CardTitle>
          <Badge className={`${subscription.tier === 'unlimited' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
            {subscription.tier === 'unlimited' ? 'Unlimited' : 'Ask JDS'}
          </Badge>
        </div>
        <CardDescription>Active subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">
                {subscription.tier === 'unlimited' 
                  ? 'Unlimited access to all courses' 
                  : 'Access to AskJDS AI assistance'}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription.tier === 'unlimited' 
                  ? 'Including all future releases and updates' 
                  : 'Get help with your legal questions'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">
                {/* Localization-friendly date format */}
                Next billing date: {formatDate(subscription.current_period_end)}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end 
                  ? 'Your subscription will end on this date' 
                  : 'Your subscription will automatically renew'}
              </p>
            </div>
          </div>
          
          {subscription.cancel_at_period_end && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Your subscription is set to cancel on {formatDate(subscription.current_period_end)}.
                You can reactivate your subscription from the billing portal.
              </p>
            </div>
          )}
          
          {isExpiringSoon && !subscription.cancel_at_period_end && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {/* Localization-friendly plural format */}
                Your subscription will renew in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
          
          {subscription.tier !== 'unlimited' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-sm text-purple-800 font-medium mb-1">Upgrade to Unlimited</p>
              <p className="text-sm text-purple-700">
                Get access to all courses and future releases with our Unlimited plan.
              </p>
              <Button 
                onClick={handleUpgrade} 
                variant="link" 
                className="text-purple-700 p-0 h-auto mt-1"
              >
                View Unlimited Plan →
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      {!hideManagement && (
        <CardFooter>
          <Button 
            onClick={handlePortalAccess} 
            variant="outline" 
            className="w-full"
            disabled={portalLoading}
          >
            {portalLoading ? 'Loading...' : 'Manage Billing'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SubscriptionStatus; 