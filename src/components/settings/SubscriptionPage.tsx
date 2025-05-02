import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionSettings } from './SubscriptionSettings';

export default function SubscriptionPage() {
  return (
    <div className="space-y-4">
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
    </div>
  );
} 