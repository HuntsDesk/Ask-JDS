import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileInfo } from './UserProfileInfo';

export default function AccountPage() {
  return (
    <div className="space-y-4">
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
    </div>
  );
} 