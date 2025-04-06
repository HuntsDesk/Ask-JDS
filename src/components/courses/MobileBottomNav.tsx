import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Bookmark, User, Home, PlusCircle } from 'lucide-react';

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const MobileNavLink = ({ to, icon, text }: MobileNavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
                  (to === '/courses' && location.pathname.includes('/course/')) ||
                  (to === '/account' && location.pathname.includes('/account/'));
  
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

export default function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        <MobileNavLink 
          to="/" 
          icon={<Home className="h-5 w-5" />} 
          text="Home" 
        />
        <MobileNavLink 
          to="/courses" 
          icon={<BookOpen className="h-5 w-5" />} 
          text="Courses" 
        />
        <Link
          to="/courses/new"
          className="flex flex-col items-center justify-center space-y-1 py-1 text-[#F37022]"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs">New</span>
        </Link>
        <MobileNavLink 
          to="/bookmarks" 
          icon={<Bookmark className="h-5 w-5" />} 
          text="Saved" 
        />
        <MobileNavLink 
          to="/account" 
          icon={<User className="h-5 w-5" />} 
          text="Account" 
        />
      </div>
    </div>
  );
} 