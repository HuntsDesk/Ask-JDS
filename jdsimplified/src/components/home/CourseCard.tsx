
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle } from 'lucide-react';

const CourseCard = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div 
        className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl transform transition-transform duration-500"
        style={{ 
          transform: `perspective(1000px) rotateY(${scrollY * 0.02}deg) rotateX(${-scrollY * 0.01}deg)`
        }}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm text-white/70">Featured Course</span>
              <h3 className="text-xl font-bold">Constitutional Law</h3>
            </div>
            <div className="bg-jdorange text-white text-xs font-bold px-3 py-1 rounded-full">
              25% OFF
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-jdorange mr-3" />
              <span className="text-white">24 comprehensive lessons</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-jdorange mr-3" />
              <span className="text-white">Strategic framework approach</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-jdorange mr-3" />
              <span className="text-white">Practical examples & applications</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-jdorange mr-3" />
              <span className="text-white">Lifetime access to materials</span>
            </div>
          </div>
          
          <div className="pt-4 mt-6 border-t border-white/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">$299</span>
                <span className="text-white/70 ml-2 line-through">$399</span>
              </div>
              <div className="flex items-center text-white/70">
                <BookOpen className="h-4 w-4 mr-1" />
                <span className="text-sm">24 Lessons</span>
              </div>
            </div>
            
            <Link 
              to="/courses/1" 
              className="block w-full py-3 bg-jdorange text-white text-center rounded-lg font-medium hover:bg-jdorange-dark transition-colors"
            >
              View Course Details
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-jdorange/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export default CourseCard;
