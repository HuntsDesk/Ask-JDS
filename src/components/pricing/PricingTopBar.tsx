import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';

export function PricingTopBar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="mx-auto">
        <div className="flex justify-between items-center h-[80px]">
          {/* Logo with precise positioning to match sidebar */}
          <div className="flex-shrink-0 flex items-center pl-[70px]">
            <Link to="/" className="transition-transform hover:scale-105">
              <OptimizedImage 
                src="/images/JDSimplified_Logo.png" 
                alt="JD Simplified Logo" 
                className="h-[48px] w-auto" 
                priority={true}
              />
            </Link>
          </div>
          
          {/* Return to App Button */}
          <div className="flex items-center pr-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Return to App</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 