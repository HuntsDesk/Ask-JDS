
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, ChevronDown } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import CourseCard from '@/components/CourseCard';

// Sample courses data
const coursesData = [
  {
    id: '1',
    title: 'Constitutional Law Fundamentals',
    description: 'Master the essential principles and landmark cases of Constitutional Law with a strategic framework.',
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '24 Lessons',
    lessons: 24,
    level: 'Intermediate',
    featured: true,
    category: 'Constitutional Law'
  },
  {
    id: '2',
    title: 'Evidence Law Made Simple',
    description: 'Break down complex evidence rules into simple, applicable frameworks that will help you excel on exams.',
    price: 249,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1423592707957-3b212afa6733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
    duration: '18 Lessons',
    lessons: 18,
    level: 'Beginner',
    featured: false,
    category: 'Evidence'
  },
  {
    id: '3',
    title: 'Criminal Law: Essential Concepts',
    description: 'Understand criminal law concepts through a strategic approach that simplifies complex theories.',
    price: 279,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1593115057322-e94b77572f20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    duration: '21 Lessons',
    lessons: 21,
    level: 'Intermediate',
    featured: false,
    category: 'Criminal Law'
  },
  {
    id: '4',
    title: 'Contract Law Simplified',
    description: 'Master contract formation, performance, breach, and remedies through practical frameworks and examples.',
    price: 249,
    originalPrice: 349,
    image: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '18 Lessons',
    lessons: 18,
    level: 'Beginner',
    featured: false,
    category: 'Contract Law'
  },
  {
    id: '5',
    title: 'Torts in a Nutshell',
    description: 'Navigate negligence, intentional torts, and strict liability with clear strategies and frameworks.',
    price: 249,
    originalPrice: 329,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    duration: '15 Lessons',
    lessons: 15,
    level: 'Beginner',
    featured: false,
    category: 'Tort Law'
  },
  {
    id: '6',
    title: 'Property Law Essentials',
    description: 'Demystify estates in land, future interests, landlord-tenant relationships, and more.',
    price: 279,
    originalPrice: 379,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80',
    duration: '20 Lessons',
    lessons: 20,
    level: 'Intermediate',
    featured: false,
    category: 'Property Law'
  },
];

const categories = [...new Set(coursesData.map(course => course.category))];
const levels = [...new Set(coursesData.map(course => course.level))];

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort courses
  const filteredCourses = coursesData
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === '' || course.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      } else if (sortBy === 'priceAsc') {
        return a.price - b.price;
      } else if (sortBy === 'priceDesc') {
        return b.price - a.price;
      } else if (sortBy === 'newest') {
        // In a real app, this would sort by date added
        return a.id < b.id ? 1 : -1;
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
          
          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No courses found</h3>
              <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
              <button 
                className="mt-4 px-4 py-2 bg-jdorange text-white rounded-lg font-medium"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedLevel('');
                }}
              >
                Clear all filters
              </button>
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
