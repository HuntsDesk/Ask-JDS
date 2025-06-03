import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, User, Palette } from 'lucide-react';

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const MobileNavLink = ({ to, icon, text }: MobileNavLinkProps) => {
  const location = useLocation();
  const isActive = 
    (to === '/settings' && location.pathname === '/settings') || 
    (to === '/settings/account' && location.pathname.includes('/settings/account')) ||
    (to === '/settings/appearance' && location.pathname.includes('/settings/appearance'));
  
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
      <div className="grid grid-cols-3 gap-1 px-2 py-2">
        <MobileNavLink 
          to="/settings/account" 
          icon={<User className="h-5 w-5" />} 
          text="Account" 
        />
        <MobileNavLink 
          to="/settings" 
          icon={<CreditCard className="h-5 w-5" />} 
          text="Subscription" 
        />
        <MobileNavLink 
          to="/settings/appearance" 
          icon={<Palette className="h-5 w-5" />} 
          text="Appearance" 
        />
      </div>
    </div>
  );
} 