import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on a course detail page
  const isCourseDetail = location.pathname.match(/\/courses\/[^\/]+$/);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-1">
        {/* Sidebar - we can add a sidebar component here later */}
        <div className="w-64 bg-jdblue text-white p-6 hidden lg:block">
          <h2 className="text-xl font-bold mb-6">Navigation</h2>
          <nav className="space-y-2">
            <button 
              onClick={() => navigate('/courses')}
              className="w-full text-left px-4 py-2 rounded hover:bg-white/10 transition-colors"
            >
              All Courses
            </button>
            <button 
              onClick={() => navigate('/account')}
              className="w-full text-left px-4 py-2 rounded hover:bg-white/10 transition-colors"
            >
              My Account
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="w-full text-left px-4 py-2 rounded hover:bg-white/10 transition-colors"
            >
              Cart
            </button>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 bg-gray-50">
          {/* On course detail pages, don't add padding as the content has its own */}
          {isCourseDetail ? (
            <div className="w-full">{children}</div>
          ) : (
            <div className="max-w-6xl mx-auto p-6">
              {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
              {children}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout; 