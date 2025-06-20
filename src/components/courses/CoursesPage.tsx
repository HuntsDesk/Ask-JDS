import { logger } from '@/lib/logger';
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import CourseNavbar from './CourseNavbar';

// Import page components
import AllCoursesPage from './pages/AllCoursesPage';
import AvailableCoursesPage from './AvailableCoursesPage';
import CourseSearchResults from './pages/CourseSearchResults';

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

const SuspenseSearchResults = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <CourseSearchResults />
  </Suspense>
);

export default function CoursesPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Navbar at the top */}
      <CourseNavbar />
      
      {/* Main content - Using full maxWidth to push scrollbar to edge */}
      <div className="flex-1 overflow-auto w-full">
        <PageContainer disablePadding={false} className="pt-2 pb-32 md:pb-12 mx-auto px-4" maxWidth="6xl">
          <Routes>
            {/* Course routes */}
            <Route path="/" element={<SuspenseDashboard />} />
            <Route path="available-courses" element={<SuspenseAvailableCourses />} />
            <Route path="search" element={<SuspenseSearchResults />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
} 