import React from 'react';
import { Separator } from '@/components/ui/separator';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileInfo } from './UserProfileInfo';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-300">
          Manage your profile and account preferences
        </p>
      </div>
      
      {/* Profile Information Section */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfileForm />
        </CardContent>
      </Card>
      
      <Separator className="my-6 dark:bg-gray-700" />
      
      {/* Account Statistics Section */}
      <Card className="border dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Account Statistics</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            View your usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfileInfo />
        </CardContent>
      </Card>
    </div>
  );
} 