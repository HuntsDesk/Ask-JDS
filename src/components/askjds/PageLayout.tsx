import { ReactNode } from 'react';
import { AskJDSNavbar } from './AskJDSNavbar';

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function PageLayout({ children, hideFooter = false }: PageLayoutProps) {
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