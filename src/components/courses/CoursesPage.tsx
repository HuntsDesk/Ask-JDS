import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import CourseNavbar from './CourseNavbar';

// Import page components
import AllCoursesPage from './pages/AllCoursesPage';
import AvailableCoursesPage from './AvailableCoursesPage';
import ExpiredCoursesPage from './ExpiredCoursesPage';

// Add Suspense wrapped components for lazy loading
const SuspenseDashboard = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <AllCoursesPage />
  </Suspense>
);

const SuspenseAvailableCourses = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <AvailableCoursesPage />
  </Suspense>
);

const SuspenseExpiredCourses = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <ExpiredCoursesPage />
  </Suspense>
);

export default function CoursesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar at the top */}
      <CourseNavbar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <PageContainer noOverflow className="pt-4" flexColumn disablePadding={false}>
          <div className="flex-1 overflow-auto">
            <Routes>
              {/* Course routes */}
              <Route path="/" element={<SuspenseDashboard />} />
              <Route path="expired-courses" element={<SuspenseExpiredCourses />} />
              <Route path="available-courses" element={<SuspenseAvailableCourses />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </PageContainer>
      </div>
    </div>
  );
} 