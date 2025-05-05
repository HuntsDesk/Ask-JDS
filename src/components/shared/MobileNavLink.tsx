import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  activeCondition?: (pathname: string) => boolean;
}

/**
 * Reusable mobile navigation link component for bottom navigation bars
 */
export const MobileNavLink: React.FC<MobileNavLinkProps> = ({ 
  to, 
  icon, 
  text,
  activeCondition 
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Default active condition checks if current path matches the link path
  const isDefaultActive = to === pathname || pathname.startsWith(to + '/');
  
  // Use custom active condition if provided, otherwise use default
  const isActive = activeCondition ? activeCondition(pathname) : isDefaultActive;
  
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center space-y-1 py-1 ${
        isActive
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {icon}
      <span className="text-xs">{text}</span>
    </Link>
  );
};

export default MobileNavLink; 