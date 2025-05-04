import React from 'react';

interface SkeletonSubjectProps {
  className?: string;
}

export function SkeletonSubject({ className = '' }: SkeletonSubjectProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full animate-pulse ${className}`}>
      <div className="p-6 flex-grow">
        {/* Subject name placeholder */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        
        {/* Description placeholder */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        
        {/* Collection count placeholder */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-auto"></div>
      </div>
      
      {/* Footer actions placeholder */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonSubjectGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonSubject key={index} />
      ))}
    </div>
  );
} 