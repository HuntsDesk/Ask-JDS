import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, BookOpen, User } from 'lucide-react';

import { MobileNavLink } from '../common/MobileNavLink';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3 h-16">
          <MobileNavLink 
            to="/courses" 
            icon={<BookOpen className="h-5 w-5" />} 
            text="All Courses" 
          />
          <MobileNavLink 
            to="/courses/my-courses" 
            icon={<User className="h-5 w-5" />} 
            text="My Courses" 
          />
          <MobileNavLink 
            to="/courses/expired-courses" 
            icon={<Clock className="h-5 w-5" />} 
            text="Expired" 
          />
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav; 