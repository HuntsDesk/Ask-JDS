import React from 'react';

const SkeletonFlashcard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full animate-pulse">
    <div className="p-6 flex-grow">
      {/* Question placeholder */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      
      {/* Answer placeholder */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
      
      {/* Collection placeholder */}
      <div className="flex items-center gap-2 mt-4">
        <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
      </div>
    </div>
    
    {/* Footer actions placeholder */}
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
      <div className="flex gap-2">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Export a grid of skeleton flashcards
export const SkeletonFlashcardGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonFlashcard key={index} />
    ))}
  </div>
);

// Add a skeleton component for the study page
export const SkeletonStudyCard = () => (
  <div>
    {/* Main flashcard placeholder */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative mb-16 md:mb-4">
      <div className="p-8 flex flex-col">
        {/* Card content */}
        <div className="min-h-[250px] flex items-center justify-center">
          <div className="text-center w-full">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-3 mt-4 max-w-md mx-auto">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 mx-auto"></div>
            </div>
          </div>
        </div>
        
        {/* Flip button placeholder */}
        <div className="text-center mt-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
      </div>
      
      {/* Card footer */}
      <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 flex justify-between items-center">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

export default SkeletonFlashcard; 