import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, BookOpen, Clock, Calendar, Award, ChevronRight, ShoppingCart, 
  PlayCircle, Share2, Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Sample course data
const coursesData = [
  {
    id: '1',
    title: 'Constitutional Law Fundamentals',
    description: 'Master the essential principles and landmark cases of Constitutional Law with a strategic framework.',
    detailedDescription: `
      <p>Constitutional Law is often considered one of the most challenging subjects in law school, with its complex doctrines, evolving interpretations, and far-reaching implications. This comprehensive course breaks down these complexities into clear, strategic frameworks that will help you understand and apply constitutional principles with confidence.</p>
      
      <p>Through our structured approach, you'll master the fundamental concepts of Constitutional Law, analyze landmark Supreme Court cases, and develop the analytical skills needed to tackle even the most challenging constitutional issues.</p>
      
      <p>Whether you're preparing for law school exams, the bar exam, or simply seeking to deepen your understanding of constitutional principles, this course provides the tools and strategies you need to succeed.</p>
    `,
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '30 days access',
    lessons: 24,
    level: 'Intermediate',
    featured: true,
    category: 'Constitutional Law',
    objectives: [
      'Understand the structure and key provisions of the U.S. Constitution',
      'Master the analytical frameworks for constitutional interpretation',
      'Analyze landmark Supreme Court cases and their impact',
      'Apply constitutional principles to factual scenarios',
      'Develop strategies for answering Constitutional Law essay and multiple-choice questions'
    ],
    curriculum: [
      {
        title: 'Module 1: Introduction to Constitutional Law',
        lessons: [
          { title: 'The Structure of the Constitution', duration: '35 min' },
          { title: 'Constitutional Interpretation Methods', duration: '45 min' },
          { title: 'The Role of the Supreme Court', duration: '40 min' }
        ]
      },
      {
        title: 'Module 2: Federal Powers',
        lessons: [
          { title: 'Congressional Powers Overview', duration: '50 min' },
          { title: 'The Commerce Clause', duration: '65 min' },
          { title: 'Taxing and Spending Power', duration: '45 min' },
          { title: 'Treaty and War Powers', duration: '40 min' }
        ]
      },
      {
        title: 'Module 3: Separation of Powers',
        lessons: [
          { title: 'Executive Powers Framework', duration: '55 min' },
          { title: 'Legislative Powers and Limitations', duration: '50 min' },
          { title: 'Judicial Review and Limitations', duration: '45 min' },
          { title: 'Checks and Balances Analysis', duration: '40 min' }
        ]
      },
      {
        title: 'Module 4: Individual Rights',
        lessons: [
          { title: 'Due Process Analysis', duration: '60 min' },
          { title: 'Equal Protection Framework', duration: '65 min' },
          { title: 'First Amendment: Speech and Religion', duration: '70 min' },
          { title: 'Fourth Amendment Search and Seizure', duration: '55 min' }
        ]
      }
    ],
    includes: [
      '24 on-demand video lessons',
      'Downloadable study guides and frameworks',
      '120 practice questions with explanations',
      'Access on mobile and desktop',
      'Certificate of completion',
      '30 days of access'
    ]
  }
];

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<typeof coursesData[0] | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  useEffect(() => {
    // In a real app, this would fetch course data from an API
    const foundCourse = coursesData.find(c => c.id === id);
    if (foundCourse) {
      setCourse(foundCourse);
      // Expand the first module by default
      if (foundCourse.curriculum && foundCourse.curriculum.length > 0) {
        setExpandedModules([foundCourse.curriculum[0].title]);
      }
    }
    // Scroll to top when course changes
    window.scrollTo(0, 0);
  }, [id]);
  
  const toggleModule = (moduleTitle: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleTitle)
        ? prev.filter(title => title !== moduleTitle)
        : [...prev, moduleTitle]
    );
  };
  
  const handleAddToCart = () => {
    toast({
      title: "Course added to cart!",
      variant: "default"
    });
  };
  
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Link to="/courses" className="btn-primary">
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Course Header */}
      <section className="bg-jdblue text-white pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Course Info */}
            <div className="w-full md:w-3/5">
              <div className="flex items-center text-white/70 mb-4">
                <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link to={`/courses?category=${course.category}`} className="hover:text-white transition-colors">{course.category}</Link>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{course.title}</h1>
              
              <p className="text-white/80 text-lg mb-6">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-jdorange" />
                  <span>{course.duration}</span>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-jdorange" />
                  <span>{course.lessons} lessons</span>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center">
                  <Award className="h-5 w-5 mr-2 text-jdorange" />
                  <span>{course.level}</span>
                </div>
              </div>
            </div>
            
            {/* Course Card */}
            <div className="w-full md:w-2/5">
              <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                <div className="relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <button 
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                      aria-label="Play preview"
                    >
                      <PlayCircle className="h-10 w-10" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-jdblue">${course.price}</span>
                      {course.originalPrice && (
                        <span className="text-gray-400 line-through ml-2">${course.originalPrice}</span>
                      )}
                    </div>
                    
                    {course.originalPrice && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% off
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    className="w-full bg-jdorange hover:bg-jdorange-dark text-white py-3 rounded-lg font-medium flex items-center justify-center mb-4 transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </button>
                  
                  <button className="w-full border-2 border-jdblue text-jdblue hover:bg-jdblue hover:text-white py-3 rounded-lg font-medium mb-6 transition-colors">
                    Buy Now
                  </button>
                  
                  <div className="text-center text-gray-500 text-sm mb-6">
                    30-Day Money-Back Guarantee
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800">This course includes:</h3>
                    
                    <ul className="space-y-3">
                      {course.includes.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex justify-center mt-6 pt-6 border-t border-gray-200">
                    <button className="text-gray-500 hover:text-jdorange mr-6 flex items-center text-sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </button>
                    <button className="text-gray-500 hover:text-jdorange flex items-center text-sm">
                      <Download className="h-4 w-4 mr-1" />
                      Resources
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Course Tabs & Content */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 mb-8 pb-px hide-scrollbar">
            <button 
              className={cn(
                "whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors",
                activeTab === 'overview' 
                  ? "border-jdorange text-jdorange" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={cn(
                "whitespace-nowrap px-6 py-3 font-medium text-sm border-b-2 transition-colors",
                activeTab === 'curriculum' 
                  ? "border-jdorange text-jdorange" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Course Overview</h2>
                
                <div className="prose max-w-none mb-10" dangerouslySetInnerHTML={{ __html: course.detailedDescription }} />
                
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4">What You'll Learn</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">Requirements</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>No prior knowledge of {course.category} is required</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Basic understanding of legal terminology is helpful but not necessary</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Willingness to engage with the material and practice applying frameworks</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
                
                <div className="mb-4">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>{course.curriculum.reduce((acc, module) => acc + module.lessons.length, 0)} lessons</span>
                    <span>{course.duration}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {course.curriculum.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        onClick={() => toggleModule(module.title)}
                      >
                        <div className="font-medium">{module.title}</div>
                        <div className="flex items-center">
                          <span className="text-gray-500 text-sm mr-3">{module.lessons.length} lessons</span>
                          <ChevronDown className={cn(
                            "h-5 w-5 text-gray-500 transition-transform",
                            expandedModules.includes(module.title) && "transform rotate-180"
                          )} />
                        </div>
                      </button>
                      
                      {expandedModules.includes(module.title) && (
                        <div className="divide-y divide-gray-200">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center">
                                <PlayCircle className="h-5 w-5 text-gray-400 mr-3" />
                                <span>{lesson.title}</span>
                              </div>
                              <span className="text-gray-500 text-sm">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Related Courses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10">Related Courses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coursesData
              .filter(c => c.id !== course.id && c.category === course.category)
              .slice(0, 3)
              .map((relatedCourse) => (
                <CourseCard key={relatedCourse.id} {...relatedCourse} />
              ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-jdblue py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Master {course.category}?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-3xl mx-auto">
            Join thousands of successful students who have transformed their understanding through our strategic approach.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleAddToCart}
              className="btn-primary"
            >
              Enroll Now
            </button>
            <Link to="/courses" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
              Browse Other Courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default CourseDetail;
