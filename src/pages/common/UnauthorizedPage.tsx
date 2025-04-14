import React from 'react';
import { Link } from 'react-router-dom';
import { useDomain } from '@/lib/domain-context';
import { AlertTriangle } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const { isAdmin: isAdminDomain, isAskJDS, isJDSimplified } = useDomain();
  
  // Determine the appropriate home link based on domain
  const homeLink = isAdminDomain ? '/' : '/';
  const primaryDomain = isAskJDS 
    ? 'Ask JDS' 
    : isJDSimplified 
      ? 'JD Simplified' 
      : 'our platform';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Unauthorized Access
        </h1>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You don't have permission to access this area.
          </p>
          
          {isAdminDomain && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The admin dashboard requires administrator privileges.
            </p>
          )}
          
          <div className="space-y-4">
            <Link
              to={homeLink}
              className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              Return to {primaryDomain} Home
            </Link>
            
            {!isAdminDomain && (
              <a
                href="mailto:support@jdsimplified.com"
                className="block w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Contact Support
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 