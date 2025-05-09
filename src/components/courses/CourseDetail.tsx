import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ChevronDown, ChevronRight, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { StripeCheckoutDialog } from '@/components/stripe/StripeCheckoutDialog';
import CourseNavbar from './CourseNavbar';

interface Course {
  id: string;
  title: string;
  overview: string;
  what_youll_learn: string[];
  days_of_access: number;
  is_featured: boolean;
  status: string;
  stripe_price_id?: string;
}

interface Lesson {
  id: string;
  title: string;
  position: number;
  video_id?: string;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: Lesson[];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  useEffect(() => {
    async function fetchCourseData() {
      try {
        // Fetch course details - avoid using .single() to prevent 406 errors
        const { data: courseDataArray, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id);

        if (courseError) throw courseError;
        
        // Get the first item if it exists
        const courseData = courseDataArray?.[0];
        if (!courseData) throw new Error('Course not found');
        
        setCourse(courseData);

        // Fetch course modules
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', id)
          .order('position', { ascending: true });

        if (moduleError) throw moduleError;

        // Fetch all lessons for this course's modules
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleData?.map(m => m.id) || [])
          .order('position', { ascending: true });

        if (lessonError) throw lessonError;

        // Group lessons by module
        const modulesWithLessons = moduleData?.map(module => ({
          ...module,
          lessons: lessonData?.filter(lesson => lesson.module_id === module.id) || []
        })) || [];

        setModules(modulesWithLessons);
        
        // Initially expand the first module
        if (modulesWithLessons.length > 0) {
          setExpandedModules({ [modulesWithLessons[0].id]: true });
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  // Function to handle enrollment
  const handleEnroll = async () => {
    try {
      console.log('Course data:', course); // Debug course data
      
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/login?redirectTo=${encodeURIComponent(`/course-detail/${id}`)}`;
        return;
      }
      
      // Call the Edge Function with the correct parameter names
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-handler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          purchaseType: 'course_purchase',
          courseId: id,
          userId: session.user.id,
          // Don't send the price ID directly - let the server determine it based on environment
          coursePurchaseType: 'standard' // Add hint for server to determine price
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Checkout error:', error);
        toast.error(error.error || 'Failed to create checkout session');
        setIsProcessing(false);
        return;
      }
      
      const data = await response.json();
      
      // Handle Payment Elements Flow (client_secret response)
      if (data.client_secret) {
        console.log(`Got client_secret, showing payment form`);
        setClientSecret(data.client_secret);
        setShowPaymentModal(true);
        setIsProcessing(false);
        return;
      }
      
      // Legacy handling for URL response
      if (data.url) {
        console.log(`Redirecting to checkout: ${data.url}`);
        window.location.href = data.url;
        return;
      }
      
      // If we get here, we didn't get a valid response
      console.error('No client_secret or URL returned');
      toast.error('Failed to create checkout session');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast.error('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle close of payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{error || 'Course not found'}</p>
        <Link to="/courses">
          <Button className="bg-jdorange hover:bg-jdorange/90">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <CourseNavbar />
        
        <div className="flex-1 overflow-auto w-full pb-32 md:pb-12">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            {/* Course Header */}
            <div className="mb-8 pt-6">
              <h1 className="text-4xl font-bold mb-4 dark:text-white">{course.title}</h1>
              <p className="text-gray-600 text-lg dark:text-gray-300">{course.overview}</p>
            </div>

            {/* What You'll Learn */}
            <Card className="mb-8 border dark:border-gray-700 dark:bg-gray-800/50">
              <CardHeader className="dark:border-gray-700">
                <CardTitle className="dark:text-white">What You'll Learn</CardTitle>
                <CardDescription className="dark:text-gray-400">Key outcomes of this course</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.what_youll_learn?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="dark:text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="mb-8 border dark:border-gray-700 dark:bg-gray-800/50">
              <CardHeader className="dark:border-gray-700">
                <CardTitle className="dark:text-white">Course Content</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {modules.length} modules • {modules.reduce((sum, module) => sum + module.lessons.length, 0)} lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="rounded-lg border hover:border-jdblue transition-colors dark:border-gray-700 dark:bg-gray-800"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div>
                          <h3 className="font-medium mb-1 dark:text-white">{module.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {module.description} • {module.lessons.length} lessons
                          </p>
                        </div>
                        {expandedModules[module.id] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                      
                      {expandedModules[module.id] && (
                        <div className="border-t dark:border-gray-700">
                          <ul className="divide-y dark:divide-gray-700">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id} className="p-3 pl-6 flex items-center gap-3 dark:hover:bg-gray-700/50">
                                {lesson.video_id && (
                                  <Video className="h-4 w-4 text-jdblue shrink-0 dark:text-blue-400" />
                                )}
                                <span className="text-sm dark:text-gray-300">{lesson.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enrollment CTA */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Ready to Start Learning?</h2>
              <p className="text-gray-600 mb-6 dark:text-gray-300">
                Get {course.days_of_access} days of access to all course materials.
              </p>
              <Button 
                size="lg" 
                className="bg-jdorange hover:bg-jdorange/90"
                onClick={handleEnroll}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner className="h-5 w-5 mr-2" />
                    Processing...
                  </span>
                ) : (
                  "Enroll Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal using the shared component */}
      {clientSecret && (
        <StripeCheckoutDialog
          open={showPaymentModal}
          onClose={handleClosePaymentModal}
          clientSecret={clientSecret}
          title="Complete your enrollment"
          description={`Enroll in "${course.title}" (${course.days_of_access} days access)`}
          onError={(error) => {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed');
          }}
        />
      )}
    </>
  );
} 