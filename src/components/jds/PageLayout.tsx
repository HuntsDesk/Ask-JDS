import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Footer from './Footer';

// Import Navbar from the JDSimplified app
import Navbar from '../../../jdsimplified/src/components/Navbar';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  const [showPromo, setShowPromo] = useState(true);
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Promo Banner */}
      {showPromo && (
        <div className="fixed top-0 left-0 right-0 bg-jdblue text-white py-3 px-4 text-center z-50">
          <p className="text-sm font-medium">
            🎓 Limited Time Offer: 25% off all courses with code <span className="font-bold">LAWSIMPLE25</span>
          </p>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
            onClick={() => setShowPromo(false)}
            aria-label="Close promotion"
          >
            <X size={18} />
          </button>
        </div>
      )}
      <Navbar showPromo={showPromo} />
      <main className="flex-grow">
        {showPromo && <div className="h-10"></div>}
        {children}
      </main>
      <Footer />
    </div>
  );
} 