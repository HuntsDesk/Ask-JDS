import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import SettingsNavbar from './SettingsNavbar';

// Import page components
import SubscriptionPage from './SubscriptionPage';
import AccountPage from './AccountPage';
import AppearancePage from './AppearancePage';

// Add Suspense wrapped components for lazy loading
const SuspenseSubscription = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <SubscriptionPage />
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
      <div className="flex-1 flex flex-col overflow-auto">
        <PageContainer noOverflow className="pt-4" flexColumn>
          <div className="flex-1 overflow-auto pb-8">
            <Routes>
              {/* Settings routes */}
              <Route path="/" element={<SuspenseSubscription />} />
              <Route path="account" element={<SuspenseAccount />} />
              <Route path="appearance" element={<SuspenseAppearance />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/settings" replace />} />
            </Routes>
          </div>
        </PageContainer>
      </div>
    </div>
  );
} 