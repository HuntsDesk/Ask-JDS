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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CourseCard from '../components/CourseCard';

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
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  expires_at: string;
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
        
        // Fetch all published courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'Published');
        
        if (coursesError) throw coursesError;
        
        // Fetch user's course enrollments
        if (user) {
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', user.id);
          
          if (enrollmentsError) throw enrollmentsError;
          setEnrollments(enrollmentsData || []);
        }
        
        // Process the courses data to add UI-specific properties
        const processedCourses = (coursesData || []).map(course => {
          // Find user enrollment for this course if it exists
          const enrollment = enrollments.find(e => e.course_id === course.id);
          
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
          
          return {
            ...course,
            image,
            purchased,
            expiresIn,
            progress: 0, // For now, default to 0 until we implement progress tracking
            lessons: 15 // Default number until we fetch actual lesson counts
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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 bg-white dark:bg-gray-900">
      {/* Header section */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Learning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your progress and continue your learning journey</p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
        <Input 
          placeholder="Search courses..." 
          className="pl-10 focus-visible:ring-jdorange focus-visible:border-jdorange dark:bg-gray-800 dark:border-gray-700"
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
        ) : purchasedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {purchasedCourses.map(course => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.tile_description}
                price={29.99} // This would be the actual price they paid
                image={course.image}
                duration={`${course.expiresIn} days left`}
                lessons={course.lessons || 15}
                level="All Levels"
                featured={course.is_featured}
                isBlue={course.id % 2 === 0} // Alternate colors for variation
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
        ) : availableCourses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(searchQuery ? filteredCourses.filter(course => !course.purchased) : availableCourses).map(course => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.tile_description}
                price={29.99} // Temporary placeholder price
                image={course.image}
                duration={`${course.days_of_access} days access`}
                lessons={course.lessons || 15}
                level="All Levels"
                featured={course.is_featured}
                isBlue={course.id % 2 === 0} // Alternate colors for variation
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
