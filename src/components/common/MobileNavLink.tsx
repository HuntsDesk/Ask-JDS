import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  /**
   * Optional additional path patterns that should be considered active
   * For example, ['/flashcards/collections'] would make the link active when on the collections page
   */
  additionalActivePaths?: string[];
}

export const MobileNavLink: React.FC<MobileNavLinkProps> = ({ 
  to, 
  icon, 
  text, 
  additionalActivePaths = [] 
}) => {
  const location = useLocation();
  
  // Determine if the current location matches this link
  const isActive = 
    location.pathname === to || 
    additionalActivePaths.some(path => location.pathname.includes(path)) ||
    (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center space-y-1 py-1 ${
        isActive ? 'text-[#F37022]' : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {icon}
      <span className="text-xs">{text}</span>
    </Link>
  );
}; 