import React from 'react';
import { Separator } from '@/components/ui/separator';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileInfo } from './UserProfileInfo';

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-300">
          Manage your profile and account preferences
        </p>
      </div>
      
      {/* Profile Information Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
        <p className="text-gray-500 dark:text-gray-300">
          Update your personal information
        </p>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <UserProfileForm />
        </div>
      </div>
      
      <Separator className="my-6" />
      
      {/* Account Statistics Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Statistics</h2>
        <p className="text-gray-500 dark:text-gray-300">
          View your usage statistics
        </p>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <UserProfileInfo />
        </div>
      </div>
    </div>
  );
} 