import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll if the pathname actually changed
    if (prevPathname.current !== pathname) {
      // Find the closest scrollable parent
      const scrollContainers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-scroll, .overflow-y-scroll');
      
      // Scroll all scrollable containers to top
      scrollContainers.forEach(container => {
        container.scrollTo({ top: 0, behavior: 'instant' });
      });
      
      // Also scroll window as fallback
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Update the previous pathname
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}