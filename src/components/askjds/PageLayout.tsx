import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AskJDSNavbar } from './AskJDSNavbar';

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function PageLayout({ children, hideFooter = false }: PageLayoutProps) {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <AskJDSNavbar />
      <main className="flex-grow pt-16">
        {children}
      </main>
      {!hideFooter && (
        <footer className="bg-gray-50 py-8 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} JD Simplified. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
} 