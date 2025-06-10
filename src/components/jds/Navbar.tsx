import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  showPromo?: boolean;
}

export default function Navbar({ showPromo = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];
  
  return (
    <nav className={cn(
      "fixed w-full bg-white/80 backdrop-blur-md z-40 border-b",
      showPromo && "top-10"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="transition-transform hover:scale-105">
              <img 
                src="/images/JDSimplified_Logo.png" 
                alt="JD Simplified Logo" 
                className="h-10 w-auto" 
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-gray-600 hover:text-jdblue transition-colors",
                  location.pathname === item.href && "text-jdblue font-medium"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/courses">
                  <Button variant="default">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Log In</Button>
                  </Link>
                  <Link to="/auth?tab=signup">
                    <Button variant="default">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-jdblue"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-b">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50",
                  location.pathname === item.href && "text-jdblue bg-gray-50"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            {user ? (
              <Link
                to="/courses"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-jdblue hover:bg-jdblue/90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-jdblue hover:bg-jdblue/90"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 