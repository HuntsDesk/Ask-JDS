import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

export const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, icon, text }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
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