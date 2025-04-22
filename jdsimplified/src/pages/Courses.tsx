import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, ChevronDown } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import CourseCard from '@/components/courses/CourseCard';
import { getCourses, getModulesByCourseId, getLessonsByModuleId } from '../services/courseService';
import { Course } from '../types/course';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for courses data
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load courses with module and lesson counts
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        // Get all courses (which now includes module and lesson counts)
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, []);
  
  // Extract unique categories and levels from courses
  const categories = [...new Set(courses.map(course => course.category))];
  const levels = [...new Set(courses.map(course => course.level))];
  
  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === '' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === '' || course.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') {
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      } else if (sortBy === 'priceAsc') {
        return a.price - b.price;
      } else if (sortBy === 'priceDesc') {
        return b.price - a.price;
      } else if (sortBy === 'newest') {
        // Sort by date if available, otherwise by ID
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-jdblue text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Courses</h1>
            <p className="text-xl text-white/80 mb-8">
              Discover our comprehensive range of courses designed to help you master the law through strategic frameworks and practical applications.
            </p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-jdorange focus:border-transparent"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Courses Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Sorting */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <button 
                className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm text-gray-700 hover:bg-gray-100 mr-4"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="text-gray-600">
                Showing <span className="font-medium">{filteredCourses.length}</span> courses
              </div>
            </div>
            
            <div className="flex items-center w-full md:w-auto">
              <label htmlFor="sortBy" className="mr-2 text-gray-600">Sort by:</label>
              <select
                id="sortBy"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jdorange focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {/* Filters panel */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Category</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="category-all"
                      name="category"
                      className="h-4 w-4 text-jdorange focus:ring-jdorange"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                    />
                    <label htmlFor="category-all" className="ml-2 text-gray-700">All Categories</label>
                  </div>
                  
                  {categories.map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={`category-${category}`}
                        name="category"
                        className="h-4 w-4 text-jdorange focus:ring-jdorange"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                      />
                      <label htmlFor={`category-${category}`} className="ml-2 text-gray-700">{category}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Level</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="level-all"
                      name="level"
                      className="h-4 w-4 text-jdorange focus:ring-jdorange"
                      checked={selectedLevel === ''}
                      onChange={() => setSelectedLevel('')}
                    />
                    <label htmlFor="level-all" className="ml-2 text-gray-700">All Levels</label>
                  </div>
                  
                  {levels.map((level) => (
                    <div key={level} className="flex items-center">
                      <input
                        type="radio"
                        id={`level-${level}`}
                        name="level"
                        className="h-4 w-4 text-jdorange focus:ring-jdorange"
                        checked={selectedLevel === level}
                        onChange={() => setSelectedLevel(level)}
                      />
                      <label htmlFor={`level-${level}`} className="ml-2 text-gray-700">{level}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
              <p>{error}</p>
              <button 
                className="mt-2 text-sm font-medium underline"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner className="h-12 w-12 text-jdorange mb-4" />
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center shadow-sm">
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory || selectedLevel ? 
                  'Try adjusting your filters or search term' : 
                  'There are currently no courses available'}
              </p>
              {(searchTerm || selectedCategory || selectedLevel) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedLevel('');
                  }}
                  className="px-4 py-2 bg-jdorange text-white rounded-lg hover:bg-jdorange-dark transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || ''}
                  price={course.price}
                  originalPrice={course.originalPrice}
                  image={course.image}
                  duration={`${course._count?.modules || 0} modules, ${course._count?.lessons || 0} lessons`}
                  level={course.level}
                  featured={course.isFeatured}
                  _count={course._count}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-jdblue py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Not Sure Which Course Is Right For You?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-3xl mx-auto">
            Our team is here to help guide you to the perfect course based on your needs and goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact" className="btn-primary">
              Get Personalized Advice
            </Link>
            <Link to="/about" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
              Learn About Our Approach
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Courses;
