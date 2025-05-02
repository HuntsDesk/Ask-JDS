import React from 'react';
import { SubscriptionSettings } from './SubscriptionSettings';

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Settings</h1>
        <p className="text-gray-500 dark:text-gray-300">
          Manage your subscription and message usage
        </p>
      </div>
      
      <SubscriptionSettings />
    </div>
  );
} 