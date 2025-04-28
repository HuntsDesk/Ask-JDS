import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-1 w-full">
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
