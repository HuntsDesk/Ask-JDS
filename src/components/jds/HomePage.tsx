import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from './PageLayout';

// Import the original components from the JDSimplified app
import HeroSection from '../../../jdsimplified/src/components/home/HeroSection';
import FeaturesSection from '../../../jdsimplified/src/components/home/FeaturesSection';
import { NonServicesSection } from '../home/NonServicesSection';
import FeaturedCoursesSection from '../../../jdsimplified/src/components/home/FeaturedCoursesSection';
import TestimonialsSection from '../../../jdsimplified/src/components/home/TestimonialsSection';
import { AboutSection } from '../home/AboutSection';
import FaqSection from '../../../jdsimplified/src/components/home/FaqSection';
import ContactSection from '../../../jdsimplified/src/components/home/ContactSection';
import CtaSection from '../../../jdsimplified/src/components/home/CtaSection';

export function HomePage() {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <NonServicesSection />
      <FeaturedCoursesSection />
      <TestimonialsSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
      <CtaSection />
    </PageLayout>
  );
} 