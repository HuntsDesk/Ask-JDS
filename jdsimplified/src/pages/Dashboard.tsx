import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search,
  PlayCircle,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Card } from '../../src/components/ui/card';
import { Progress } from '../../src/components/ui/progress';
import { Badge } from '../../src/components/ui/badge';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '../components/course/LoadingSpinner';
import CourseCard from '../components/courses/CourseCard';

// Interface for course data
interface Course {
  id: string;
  title: string;
  overview: string;
  tile_description: string;
  days_of_access: number;
  is_featured: boolean;
  status: string;
  image?: string; // Optional image URL
  progress?: number; // Optional progress percentage
  purchased?: boolean; // Whether user has purchased this course
  expiresIn?: number | null; // Days until access expires
  lessons?: number; // Number of lessons in the course
  price?: number; // Optional price
  original_price?: number; // Optional original price
  _count: {
    modules: number;
    lessons: number;
  };
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  expires_at: string;
  enrolled_at?: string; // Make this optional
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch all courses without filtering by status first
        const { data: allCoursesData, error: allCoursesError } = await supabase
          .from('courses')
          .select('*')
          .order('title', { ascending: true });
        
        if (allCoursesError) throw allCoursesError;
        
        // Sort the results manually to ensure featured courses appear first
        const sortedCoursesData = [...(allCoursesData || [])].sort((a, b) => {
          // First sort by featured status
          if (Boolean(a.is_featured) !== Boolean(b.is_featured)) {
            return Boolean(a.is_featured) ? -1 : 1;
          }
          // Then by title
          return a.title.localeCompare(b.title);
        });
        
        // Filter the courses on the client-side
        // The RLS policy now allows both 'Published' and 'Coming Soon' courses
        // Only exclude those explicitly marked as 'archived'
        const coursesData = sortedCoursesData?.filter(course => 
          course.status?.toLowerCase() !== 'archived');
        
        // Fetch user's course enrollments
        let enrollmentsData = [];
        if (user) {
          const { data: fetchedEnrollments, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('id, user_id, course_id, expires_at')
            .eq('user_id', user.id);
          
          if (enrollmentsError) throw enrollmentsError;
          enrollmentsData = fetchedEnrollments || [];
          setEnrollments(enrollmentsData);
        }

        // Get all modules with their course_id and lessons
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            lessons(id)
          `);
        
        if (modulesError) throw modulesError;
        
        // Process the courses data to add UI-specific properties
        const processedCourses = (coursesData || []).map(course => {
          // Find user enrollment for this course if it exists
          const enrollment = enrollmentsData.find(e => e.course_id === course.id);
          
          // Calculate days until expiration if enrolled
          let expiresIn = null;
          let purchased = false;
          
          if (enrollment) {
            purchased = true;
            const now = new Date();
            const expirationDate = new Date(enrollment.expires_at);
            const diffTime = expirationDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            expiresIn = diffDays > 0 ? diffDays : 0;
          }
          
          // Get a placeholder image based on course title
          const imageKeyword = course.title.toLowerCase().includes('criminal') ? 'crime' : 
                             course.title.toLowerCase().includes('constitutional') ? 'constitution' :
                             'law';
          
          const image = `https://source.unsplash.com/featured/?${imageKeyword},legal`;

          // Calculate module and lesson counts
          const courseModules = modulesData?.filter(module => module.course_id === course.id) || [];
          const moduleCount = courseModules.length;
          const lessonCount = courseModules.reduce((total, module) => {
            return total + (module.lessons ? module.lessons.length : 0);
          }, 0);
          
          return {
            ...course,
            image,
            purchased,
            expiresIn,
            progress: 0, // For now, default to 0 until we implement progress tracking
            _count: {
              modules: moduleCount,
              lessons: lessonCount
            }
          };
        });
        
        setCourses(processedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Get purchased courses and available courses
  const purchasedCourses = courses.filter(course => course.purchased);
  const availableCourses = courses.filter(course => !course.purchased);
  
  // Filter courses based on search query
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.tile_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort helper function with correct priority order:
  // 1. Featured & NOT Coming Soon
  // 2. Featured & Coming Soon
  // 3. Coming Soon only (not featured)
  // 4. All other courses
  const sortByFeatured = (a, b) => {
    // First level: Featured non-coming-soon courses
    const aFeaturedNotComingSoon = a.is_featured && a.status !== 'Coming Soon';
    const bFeaturedNotComingSoon = b.is_featured && b.status !== 'Coming Soon';
    
    if (aFeaturedNotComingSoon && !bFeaturedNotComingSoon) return -1;
    if (!aFeaturedNotComingSoon && bFeaturedNotComingSoon) return 1;
    
    // Second level: Featured AND coming soon courses
    const aFeaturedAndComingSoon = a.is_featured && a.status === 'Coming Soon';
    const bFeaturedAndComingSoon = b.is_featured && b.status === 'Coming Soon';
    
    if (aFeaturedAndComingSoon && !bFeaturedAndComingSoon) return -1;
    if (!aFeaturedAndComingSoon && bFeaturedAndComingSoon) return 1;
    
    // Third level: Non-featured coming soon courses
    const aComingSoonNotFeatured = !a.is_featured && a.status === 'Coming Soon';
    const bComingSoonNotFeatured = !b.is_featured && b.status === 'Coming Soon';
    
    if (aComingSoonNotFeatured && !bComingSoonNotFeatured) return -1;
    if (!aComingSoonNotFeatured && bComingSoonNotFeatured) return 1;
    
    // If we get here, both courses are in the same category, sort by title
    return a.title.localeCompare(b.title);
  };

  // Sort the course lists
  const sortedPurchasedCourses = [...purchasedCourses].sort(sortByFeatured);
  const sortedAvailableCourses = [...availableCourses].sort(sortByFeatured);
  const sortedFilteredCourses = [...filteredCourses].sort(sortByFeatured);

  // Calculate access percentage remaining for burndown visualization
  const getAccessPercentage = (expiresIn) => {
    if (expiresIn === null) return 100;
    // Using the days_of_access field from the course
    return Math.min(100, Math.max(0, (expiresIn / 30) * 100));
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-lg font-medium text-red-500 mb-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-jdorange hover:bg-jdorange-dark">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 bg-white dark:bg-gray-900">
      {/* Header section */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse courses, review lessons, and continue your journey toward legal mastery.</p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
        <Input 
          placeholder="Search courses..." 
          className="pl-10 focus-visible:ring-jdorange focus-visible:border-jdorange dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* My Courses */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">My Courses</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : sortedPurchasedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedPurchasedCourses.map(course => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.tile_description}
                price={course.price || 0}
                originalPrice={course.original_price}
                image={course.image}
                duration={`${course.expiresIn} days left`}
                level="All Levels"
                featured={course.is_featured}
                isBlue={parseInt(course.id) % 2 === 0} // Alternate colors for variation
                _count={course._count}
                status={course.status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
            <div className="w-24 h-24 mb-0.5 flex items-center justify-center mx-auto">
              <img 
                src="/images/JD Simplified Favicon.svg" 
                alt="JD Simplified Logo" 
                className="w-full h-full object-contain dark:brightness-0 dark:invert"
              />
            </div>
            <h3 className="text-[1.35rem] font-bold text-jdorange mb-1">No Courses Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Get started by exploring our available courses.</p>
          </div>
        )}
      </div>
      
      {/* Available Courses for Purchase */}
      <div id="available-courses">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Available Courses</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedAvailableCourses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(searchQuery ? sortedFilteredCourses.filter(course => !course.purchased) : sortedAvailableCourses).map(course => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.tile_description}
                price={course.price || 0}
                originalPrice={course.original_price}
                image={course.image}
                duration={`${course.days_of_access} days access`}
                level="All Levels"
                featured={course.is_featured}
                isBlue={parseInt(course.id) % 2 === 0} // Alternate colors for variation
                _count={course._count}
                status={course.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
