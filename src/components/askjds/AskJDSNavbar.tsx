import React, { useState, useEffect } from 'react';
import { Navbar } from '../shared/Navbar';
import { Home, BookOpen, DollarSign, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function AskJDSNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('top');
  
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

  // Scroll-based section detection
  useEffect(() => {
    if (location.pathname !== '/') return;

    const sections = ['top', 'chat', 'flashcards', 'courses', 'pricing'];
    
    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.3; // Offset for better UX
      
      // Get all section elements and their positions
      const sectionElements = sections.map(id => ({
        id,
        element: document.getElementById(id),
      })).filter(item => item.element);

      // Calculate section boundaries
      const sectionBoundaries = sectionElements.map(({ id, element }) => {
        const rect = element!.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        
        // For the last section, extend to the bottom of the page
        const isLastSection = id === sections[sections.length - 1];
        const nextSectionElement = sectionElements.find(s => 
          sections.indexOf(s.id) === sections.indexOf(id) + 1
        )?.element;
        
        let absoluteBottom;
        if (isLastSection) {
          absoluteBottom = document.body.scrollHeight;
        } else if (nextSectionElement) {
          const nextRect = nextSectionElement.getBoundingClientRect();
          absoluteBottom = nextRect.top + window.scrollY;
        } else {
          // Fallback: use element's height
          absoluteBottom = absoluteTop + element!.offsetHeight;
        }

        return {
          id,
          top: absoluteTop,
          bottom: absoluteBottom,
        };
      });

      // Find which section contains the current scroll position
      let activeId = 'top'; // default
      
      for (const section of sectionBoundaries) {
        if (scrollPosition >= section.top && scrollPosition < section.bottom) {
          activeId = section.id;
          break;
        }
      }

      setActiveSection(activeId);
    };

    // Initial check
    updateActiveSection();

    // Add scroll listener with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [location.pathname]);
  
  // Handle direct click on hash links
  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Extract the hash from the href
    const hash = href.split('#')[1];
    
    if (location.pathname === '/') {
      // If already on homepage, scroll to section
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to homepage with hash
      navigate(`/#${hash}`);
    }
  };

  const isActive = (sectionId: string) => {
    if (location.pathname !== '/') {
      // Not on homepage, no active state
      return false;
    }
    
    // On homepage - check hash first (for direct navigation), then scroll detection
    if (location.hash) {
      const hashSection = location.hash.replace('#', '');
      return hashSection === sectionId;
    }
    
    // No hash, use scroll-based detection
    return activeSection === sectionId;
  };

  const navItems = [
    { 
      label: 'Home', 
      href: '/#top', 
      icon: <Home size={18} />,
      isActive: isActive('top'),
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
      href: '/#chat', 
      icon: <MessageSquare size={18} />,
      isActive: isActive('chat'),
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#chat')
    },
    { 
      label: 'Flashcards', 
      href: '/#flashcards', 
      icon: <BookOpen size={18} />,
      isActive: isActive('flashcards'),
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#flashcards')
    },
    { 
      label: 'Courses', 
      href: '/#courses', 
      icon: <BookOpen size={18} />,
      isActive: isActive('courses'),
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleHashLink(e, '/#courses')
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