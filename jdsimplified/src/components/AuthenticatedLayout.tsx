import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main content - removed sidebar */}
      <div className="min-h-screen transition-all duration-300">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
