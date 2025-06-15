import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '@/components/askjds/PageLayout';
import { HomepageFlashcardDemo } from '@/components/home/HomepageFlashcardDemo';
import { HomepagePricingSection } from '@/components/home/HomepagePricingSection';
import { TLDRSection } from '@/components/home/TLDRSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { SectionDivider } from '@/components/home/SectionDivider';
import { NonServicesSection } from '@/components/home/NonServicesSection';
import { AboutSection } from '@/components/home/AboutSection';

const Index = () => {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="light bg-white text-black">
      <PageLayout>
        <TLDRSection />
        <CoursesSection />
        <SectionDivider />
        <HomepageFlashcardDemo />
        <SectionDivider />
        <HomepagePricingSection />
        <SectionDivider />
        <NonServicesSection />
        <AboutSection />
      </PageLayout>
    </div>
  );
};

export default Index;
