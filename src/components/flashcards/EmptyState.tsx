import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionText,
  actionLink,
  onActionClick
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center dark:border dark:border-gray-700">
      <div className="inline-flex justify-center items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
        {icon}
      </div>
      
      <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">{title}</h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {actionText && (actionLink || onActionClick) && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center justify-center bg-[#F37022] text-white px-6 py-3 rounded-md hover:bg-[#E36012]"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onActionClick}
            className="inline-flex items-center justify-center bg-[#F37022] text-white px-6 py-3 rounded-md hover:bg-[#E36012]"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
} 