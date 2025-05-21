// ForceSubscriptionRefresh.tsx - A component to force refresh subscription status across the application

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { hasActiveSubscription, manuallyActivateSubscription, clearCachedSubscription } from '@/lib/subscription';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function ForceSubscriptionRefresh() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [forceEnabled, setForceEnabled] = useState(false);
  const queryClient = useQueryClient();

  // Check subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          const status = await hasActiveSubscription(user.id);
          setHasSubscription(status);
          
          // Check for dev mode localStorage setting
          if (process.env.NODE_ENV === 'development') {
            const forceSubscription = localStorage.getItem('forceSubscription');
            setForceEnabled(forceSubscription === 'true');
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(false);
        }
      }
    };
    
    checkSubscription();
  }, [user]);
  
  // Force refresh subscription status
  const refreshSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Clear the subscription cache
      clearCachedSubscription();
      
      // Invalidate all subscription-related queries
      queryClient.invalidateQueries(['user', user.id, 'subscription']);
      
      // Check subscription again
      const status = await hasActiveSubscription(user.id);
      setHasSubscription(status);
      
      toast({
        title: 'Subscription Refreshed',
        description: `Your subscription status: ${status ? 'Active' : 'Inactive'}`,
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh subscription status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Force activate subscription (premium tier)
  const activateSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await manuallyActivateSubscription('price_1RGYI5BAYVpTe3LyxrZuofBR');
      if (result) {
        toast({
          title: 'Subscription Activated',
          description: 'Your subscription has been manually activated',
        });
        
        // Refresh status after activation
        clearCachedSubscription();
        queryClient.invalidateQueries(['user', user.id, 'subscription']);
        const status = await hasActiveSubscription(user.id);
        setHasSubscription(status);
      } else {
        toast({
          title: 'Activation Failed',
          description: 'Failed to activate subscription. Check console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during subscription activation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle force subscription in dev mode
  const toggleForceSubscription = () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const newValue = !forceEnabled;
    localStorage.setItem('forceSubscription', newValue.toString());
    setForceEnabled(newValue);
    
    // Fire a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'forceSubscription',
      newValue: newValue.toString(),
      storageArea: localStorage
    }));
    
    toast({
      title: newValue ? 'Force Subscription Enabled' : 'Force Subscription Disabled',
      description: 'Refresh the page to see changes in all components',
    });
  };
  
  if (!user) return null;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        <CardDescription>
          Manage your subscription status for testing
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="p-3 bg-gray-100 rounded">
            <p className="text-sm font-medium">Current Status: </p>
            <p className={`text-base ${hasSubscription ? 'text-green-600' : 'text-red-600'}`}>
              {hasSubscription ? 'Active Subscription' : 'No Active Subscription'}
            </p>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 mt-2">
              <p className="text-sm font-medium">Development Mode:</p>
              <p className={`text-sm ${forceEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                Force Subscription: {forceEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex-col gap-2">
        <Button 
          onClick={refreshSubscription} 
          variant="outline" 
          disabled={loading}
          className="w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh Subscription Status
        </Button>
        
        <Button 
          onClick={activateSubscription} 
          variant="default" 
          disabled={loading || hasSubscription}
          className="w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Activate Subscription
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button 
            onClick={toggleForceSubscription} 
            variant={forceEnabled ? "destructive" : "secondary"}
            className="w-full mt-2"
          >
            {forceEnabled ? 'Disable' : 'Enable'} Force Subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 