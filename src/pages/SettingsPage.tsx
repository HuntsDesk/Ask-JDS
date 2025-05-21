import React from 'react';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { manuallyActivateSubscription } from '@/lib/subscription';
import { toast } from 'sonner';

export function SettingsPage() {
  const handleManualActivation = async () => {
    try {
      // Use the correct price ID for unlimited tier
      const success = await manuallyActivateSubscription('price_1RGYI5BAYVpTe3LyxrZuofBR');
      if (success) {
        toast.success('Subscription manually activated. Please refresh the page to see changes.');
      } else {
        toast.error('Failed to activate subscription');
      }
    } catch (error) {
      toast.error('Error activating subscription');
      console.error('Error activating subscription:', error);
    }
  };

  return (
    <Container className="pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      <div className="mb-6">
        <Button onClick={handleManualActivation} variant="outline">
          Fix Subscription (Manual Activation)
        </Button>
      </div>

      <SubscriptionSettings />
    </Container>
  );
} 