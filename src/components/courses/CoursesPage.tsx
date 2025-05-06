import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import CourseNavbar from './CourseNavbar';

// Import page components
import AllCoursesPage from './pages/AllCoursesPage';
import AvailableCoursesPage from './AvailableCoursesPage';
import ExpiredCoursesPage from './ExpiredCoursesPage';
import MyCoursesPage from './MyCoursesPage';

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

const SuspenseMyCourses = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <MyCoursesPage />
  </Suspense>
);

export default function CoursesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar at the top */}
      <CourseNavbar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto w-full">
        <PageContainer disablePadding={false} className="pt-2 pb-32 md:pb-12 mx-auto" maxWidth="default">
          <Routes>
            {/* Course routes */}
            <Route path="/" element={<SuspenseDashboard />} />
            <Route path="expired-courses" element={<SuspenseExpiredCourses />} />
            <Route path="available-courses" element={<SuspenseAvailableCourses />} />
            <Route path="my-courses" element={<SuspenseMyCourses />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
} 