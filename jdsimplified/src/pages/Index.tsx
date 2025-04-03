
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import NonServicesSection from '@/components/home/NonServicesSection';
import FeaturedCoursesSection from '@/components/home/FeaturedCoursesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import AboutSection from '@/components/home/AboutSection';
import FaqSection from '@/components/home/FaqSection';
import ContactSection from '@/components/home/ContactSection';
import CtaSection from '@/components/home/CtaSection';
import AppFeaturesSection from '@/components/home/AppFeaturesSection';

const Index = () => {
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
      <AppFeaturesSection />
      <FeaturedCoursesSection />
      <TestimonialsSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
      <CtaSection />
    </PageLayout>
  );
};

export default Index;
