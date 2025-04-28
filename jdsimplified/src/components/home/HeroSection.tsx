import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // Set initial scroll position
    setScrollY(window.scrollY);
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <section className="bg-gradient-to-br from-[#00178E] via-[#001456] to-[#000c38] text-white relative overflow-hidden pt-0 box-border">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,107,24,0.3),transparent_70%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(0,33,113,0.4),transparent_70%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20 relative z-10">
        <div className="flex flex-col md:flex-row items-center pt-12 md:pt-16 lg:pt-20">
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h5 className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium mb-6 opacity-100">
              Thorough yet to the point
            </h5>
            <h1 className="heading-xl mb-6 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] opacity-100">
              The strategic approach to the study of law
            </h1>
            <p className="text-lg leading-relaxed text-white mb-8 max-w-xl drop-shadow-md opacity-100">
              A unique framework breaking down the complexities of law school and bar exam topics into simple, actionable strategies.
            </p>
            
            <div className="flex flex-wrap gap-4 opacity-100">
              <Link to="/courses" className="btn-primary">
                Explore Courses
              </Link>
              <Link to="/about" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
                Learn More
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 md:pl-12 flex justify-center md:justify-end">
            <img 
              src="/images/JD_Simplified_Hero.png" 
              alt="JD Simplified Hero" 
              className="max-w-full h-auto rounded-lg shadow-xl"
              style={{ 
                transition: 'transform 0.5s ease-out',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                transform: `perspective(1000px) rotateY(${scrollY * 0.02}deg) rotateX(${-scrollY * 0.01}deg)`
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
