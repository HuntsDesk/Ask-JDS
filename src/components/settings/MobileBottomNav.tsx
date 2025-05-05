import React from 'react';
import { CreditCard, User, Palette } from 'lucide-react';
import { MobileNavLink } from '../common/MobileNavLink';

export default function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-3 gap-1 px-2 py-2">
        <MobileNavLink 
          to="/settings" 
          icon={<CreditCard className="h-5 w-5" />} 
          text="Subscription" 
          additionalActivePaths={[]}
        />
        <MobileNavLink 
          to="/settings/account" 
          icon={<User className="h-5 w-5" />} 
          text="Account" 
          additionalActivePaths={['/settings/account']}
        />
        <MobileNavLink 
          to="/settings/appearance" 
          icon={<Palette className="h-5 w-5" />} 
          text="Appearance" 
          additionalActivePaths={['/settings/appearance']}
        />
      </div>
    </div>
  );
} 