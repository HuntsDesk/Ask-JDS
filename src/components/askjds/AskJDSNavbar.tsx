import { Navbar } from '../shared/Navbar';
import { Home, BookOpen, DollarSign, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function AskJDSNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Handle smooth scrolling to section IDs when hash links are clicked
  useEffect(() => {
    // Short delay to ensure the DOM has loaded
    const timeoutId = setTimeout(() => {
      if (location.hash) {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'top') {
          // Special case for #top if element not found
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.hash]);
  
  // Handle direct click on hash links
  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      
      const id = href.replace('/#', '');
      
      // If already on home page, just scroll to the element
      if (location.pathname === '/') {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Fallback if element not found
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Navigate to home with hash
        navigate(href);
      }
    }
  };

  const navItems = [
    { 
      label: 'Home', 
      href: '/#top', 
      icon: <Home size={18} />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        
        if (location.pathname === '/') {
          // If already on homepage, scroll to top section
          const topElement = document.getElementById('top');
          if (topElement) {
            topElement.scrollIntoView({ behavior: 'smooth' });
          } else {
            // Fallback if element not found
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          // Navigate to homepage with hash
          navigate('/#top');
        }
      }
    },
    { 
      label: 'Chat', 
      href: '/#how-it-works', 
      icon: <MessageSquare size={18} />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#how-it-works')
    },
    { 
      label: 'Flashcards', 
      href: '/#flashcards', 
      icon: <BookOpen size={18} />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#flashcards')
    },
    { 
      label: 'Pricing', 
      href: '/#pricing', 
      icon: <DollarSign size={18} />,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#pricing')
    },
  ];
  
  return (
    <Navbar
      siteName="askjds"
      navItems={navItems}
      logoSize="lg"
      dashboardText="Chat"
      dashboardHref="/chat"
    />
  );
} 