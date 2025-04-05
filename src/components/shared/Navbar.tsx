import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OptimizedImage } from '@/components/ui/optimized-image';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavbarProps {
  siteName: 'jds' | 'askjds';
  navItems: NavItem[];
  showPromo?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
  className?: string;
  dashboardText?: string;
  dashboardHref?: string;
}

export function Navbar({
  siteName = 'jds',
  navItems,
  showPromo = false,
  logoSize = 'md',
  className,
  dashboardText = siteName === 'jds' ? 'Dashboard' : 'Chat',
  dashboardHref = siteName === 'jds' ? '/courses' : '/chat',
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };
  
  // Determine logo size class
  const logoSizeClass = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  }[logoSize];
  
  return (
    <nav 
      className={cn(
        "fixed w-full z-40",
        "bg-white/80 backdrop-blur-md",
        "border-b shadow-sm",
        showPromo && "top-10",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="transition-transform hover:scale-105">
              <OptimizedImage 
                src="/images/JDSimplified_Logo.png" 
                alt="JD Simplified Logo" 
                className={logoSizeClass}
                priority={true}
              />
            </Link>
          </div>
          
          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex md:flex-1 md:justify-center md:items-center">
            <div className="flex items-center space-x-10">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "nav-link",
                    location.pathname === item.href && "text-jdblue after:w-full after:bg-jdblue"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Auth Section */}
          <div className="hidden md:flex md:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to={dashboardHref}>
                  <Button variant="default" className="bg-jdblue hover:bg-jdblue-light">
                    {dashboardText}
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0 ml-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="default" className="bg-jdblue hover:bg-jdblue-light">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
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
                  "flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50",
                  location.pathname === item.href && "text-jdblue bg-gray-50"
                )}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            {user ? (
              <>
                <Link
                  to={dashboardHref}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white bg-jdblue hover:bg-jdblue/90"
                >
                  {dashboardText}
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
                <div className="px-3 py-2 text-sm text-gray-500">
                  Signed in as: {user.email}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-jdblue hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white bg-jdblue hover:bg-jdblue/90"
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