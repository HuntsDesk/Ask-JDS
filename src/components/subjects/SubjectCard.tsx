import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

type SubjectCardProps = {
  subject: {
    id: string;
    name: string;
    description: string;
    icon_url?: string;
  };
};

export default function SubjectCard({ subject }: SubjectCardProps) {
  // Truncate description to 100 characters
  const truncatedDescription = subject.description && subject.description.length > 100
    ? `${subject.description.substring(0, 100)}...`
    : subject.description;

  return (
    <Link 
      to={`/flashcards/subjects/${subject.id}`}
      className="block overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 h-full border border-gray-200 dark:border-gray-700"
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center mb-3">
          <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-2 mr-3">
            <BookOpen className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
            {subject.name}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow mb-3">
          {truncatedDescription || "No description provided."}
        </p>
        
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            View Collections
          </span>
        </div>
      </div>
    </Link>
  );
} 