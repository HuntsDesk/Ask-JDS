import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  showPromo: boolean;
}

const Navbar = ({ showPromo }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(true);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const useLightText = false;

  return (
    <nav 
      className={cn(
        "fixed w-full z-40 transition-all duration-300",
        showPromo ? "top-[41px]" : "top-0",
        "bg-white/90 backdrop-blur-md shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link to="/" className="flex items-center transition-transform hover:scale-105">
            <img 
              src="/images/JDSimplified_Logo.png" 
              alt="JD Simplified Logo" 
              className="h-12 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={cn(
                  "nav-link",
                  useLightText ? "text-white hover:text-white/80 text-shadow-sm" : "text-foreground hover:text-jdorange",
                  location.pathname === link.path && (useLightText ? "text-white after:bg-white" : "text-jdorange after:bg-jdorange"),
                  location.pathname === link.path && "after:w-full"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/auth" 
              className={cn(
                "p-2 rounded-full transition-colors",
                useLightText ? "text-white hover:bg-white/10 text-shadow-sm" : "text-foreground hover:bg-gray-100"
              )}
              aria-label="User account"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link 
              to="/cart" 
              className={cn(
                "relative p-2 rounded-full transition-colors",
                useLightText ? "text-white hover:bg-white/10 text-shadow-sm" : "text-foreground hover:bg-gray-100"
              )}
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-jdorange text-white text-xs flex items-center justify-center">
                0
              </span>
            </Link>
            <Link 
              to="/auth" 
              className={cn(
                useLightText 
                  ? "border-2 border-white text-white hover:bg-white hover:text-jdblue text-shadow-sm" 
                  : "btn-outline",
                "py-2 px-4 rounded-lg transition-all font-medium"
              )}
            >
              Login
            </Link>
          </div>
          
          <div className="flex md:hidden">
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md focus:outline-none",
                useLightText ? "text-white hover:text-white/80 hover:bg-white/10 text-shadow-sm" : "text-gray-700 hover:text-jdorange hover:bg-gray-100"
              )}
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div
        className={cn(
          "md:hidden absolute w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "-translate-y-full"
        )}
        id="mobile-menu"
      >
        <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "block px-3 py-3 rounded-md text-base font-medium border-b border-gray-100",
                location.pathname === link.path ? "text-jdorange" : "text-gray-700 hover:text-jdorange"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-4">
            <Link to="/auth" className="btn-outline py-2 px-4">
              Login
            </Link>
            <div className="flex items-center space-x-2">
              <Link 
                to="/auth" 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="User account"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link 
                to="/cart" 
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-jdorange text-white text-xs flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
