import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import SettingsNavbar from './SettingsNavbar';

// Import page components
import { SubscriptionSettings } from './SubscriptionSettings';
import AccountPage from './AccountPage';
import AppearancePage from './AppearancePage';

// Create suspense wrapped components to ensure smooth loading experience
const SuspenseSubscription = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <SubscriptionSettings />
  </Suspense>
);

const SuspenseAccount = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <AccountPage />
  </Suspense>
);

const SuspenseAppearance = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <AppearancePage />
  </Suspense>
);

export function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar at the top */}
      <SettingsNavbar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto w-full">
        <PageContainer disablePadding={false} className="pt-4 pb-20 md:pb-12 mx-auto" maxWidth="default">
          <Routes>
            {/* Settings routes */}
            <Route path="/" element={<SuspenseSubscription />} />
            <Route path="account" element={<SuspenseAccount />} />
            <Route path="appearance" element={<SuspenseAppearance />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/settings" replace />} />
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
} 