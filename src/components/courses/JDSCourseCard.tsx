import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock, Layers, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { StripeCheckoutDialog } from '@/components/stripe/StripeCheckoutDialog';
import useCourseAccess from '@/hooks/useCourseAccess';

// Get Supabase URL from environment variable
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  is_featured?: boolean;
  status?: string;
  _count?: {
    modules: number;
    lessons: number;
  };
  expired?: boolean;
  enrolled?: boolean;
}

export default function JDSCourseCard({
  id,
  title,
  description,
  image_url,
  is_featured = false,
  status = 'Published',
  _count = { modules: 0, lessons: 0 },
  expired = false,
  enrolled = false
}: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Ensure module and lesson counts are numbers
  const modulesCount = _count?.modules || 0;
  const lessonsCount = _count?.lessons || 0;
  
  // Add effect to check for reopenPayment parameter
  useEffect(() => {
    const reopenPayment = searchParams.get('reopenPayment');
    // Only reopen if this card matches the current course ID in the URL
    if (reopenPayment === 'true' && window.location.pathname.includes(`/courses/${id}`)) {
      setShowPaymentModal(true);
    }
  }, [searchParams, id]);
  
  // Handle rent button click
  const handleRent = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      navigate(`/login?redirectTo=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }
    
    console.log(`Starting checkout for course: ${id}`);
    
    setIsLoading(true);
    
    try {
      // Get the authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No authenticated session available');
        toast.error('Authentication error. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Use the new create-payment-handler Edge Function 
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-handler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          purchaseType: 'course_purchase',  // Specifies this is a course purchase
          courseId: id,                     // The ID of the course being purchased
          userId: session.user.id,          // Using consistent camelCase for userId
          isRenewal: false,                 // Not a renewal
          coursePurchaseType: 'standard'    // Indicate this is a standard course purchase
        }),
      });
      
      console.log(`Checkout API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout API error:', errorData);
        toast.error(errorData.error || 'Failed to create checkout session');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Payment handler response:', data);
      
      // Handle Payment Elements Flow (client_secret response)
      if (data.client_secret) {
        console.log(`Got client_secret, showing payment form`);
        setClientSecret(data.client_secret);
        setShowPaymentModal(true);
        setIsLoading(false);
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
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close of payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };
  
  // Use the hook to check access for this specific course
  const { hasAccess, isLoading: accessLoading } = useCourseAccess(id);
  
  return (
    <>
    <div 
      className={cn(
        "premium-card h-full flex flex-col bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-all duration-300 relative",
        is_featured && "border border-jdorange/30 dark:border-jdorange/20",
        isHovered && "shadow-lg transform translate-y-[-2px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Course Icon and Title */}
      <div className="flex flex-col items-center justify-center">
        {/* JD Simplified Favicon */}
        <div className="w-24 h-24 mb-0.5 flex items-center justify-center">
          <img 
            src={image_url || "/images/JD Simplified Favicon.svg"}
            alt="JD Simplified Logo" 
            className={cn(
              "w-full h-full object-contain transition-transform duration-300 dark:filter dark:brightness-0 dark:invert",
              isHovered && "transform scale-105"
            )}
            onError={(e) => {
              // Fallback to text icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<div class="w-16 h-16 bg-jdblue rounded-full flex items-center justify-center text-white text-2xl font-bold">JD</div>`;
            }}
          />
        </div>
        
        {/* Course Title */}
        <h3 
          className={cn(
            "text-[1.35rem] font-bold text-center mb-1",
            "text-jdblue dark:text-blue-300"
          )}
        >
          {title}
        </h3>
      </div>
      
      {/* Description - Fixed height with overflow */}
      <div className="min-h-[90px] mt-1 mb-3">
        <p className="text-gray-600 dark:text-gray-300 text-center line-clamp-3 text-sm leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Spacer to push content to bottom */}
      <div className="flex-grow"></div>
      
      {/* Course Info - Fixed position above buttons */}
      {status?.toLowerCase() !== 'coming soon' && (
        <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              <span>{modulesCount} {modulesCount === 1 ? 'module' : 'modules'}</span>
            </div>
            
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>{lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom actions */}
      <div>
        {/* Status badges - Coming Soon takes priority over Featured */}
        <div className="absolute top-3 right-3">
          {status?.toLowerCase() === 'coming soon' && (
            <span className="bg-gradient-to-r from-blue-500 to-jdblue text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Coming Soon
            </span>
          )}
          
          {status?.toLowerCase() !== 'coming soon' && is_featured && (
            <span className="bg-gradient-to-r from-amber-500 to-jdorange text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Featured
            </span>
          )}
          
          {!is_featured && status?.toLowerCase() === 'draft' && (
            <span className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Draft
            </span>
          )}
        </div>
        
        {status?.toLowerCase() === 'coming soon' ? (
          <div className="text-center mt-2 text-gray-500 dark:text-gray-400 italic text-sm">
            This course will be available soon
          </div>
        ) : expired ? (
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-center text-red-500 dark:text-red-400 font-medium text-sm">
              Access expired
            </div>
            <button
              onClick={handleRent}
              disabled={isLoading}
              className={cn(
                "w-full py-2 rounded-md text-center transition-all duration-200",
                "bg-jdorange hover:bg-orange-600 text-white font-medium",
                "dark:bg-jdorange/90 dark:hover:bg-jdorange",
                "disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Clock className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </span>
              ) : (
                <>Renew Access</>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {accessLoading ? (
              <div className="mt-4 h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            ) : hasAccess ? (
              <Link
                to={`/course/${id}`}
                className={cn(
                  "block w-full py-2 rounded-md text-center transition-all duration-200",
                  "bg-jdorange hover:bg-orange-600 text-white font-medium",
                  "dark:bg-jdorange/90 dark:hover:bg-jdorange"
                )}
              >
                Access Course
              </Link>
            ) : is_featured ? (
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to={`/course-detail/${id}`}
                  className="px-4 py-2 text-center border border-jdblue dark:border-blue-300 text-jdblue dark:text-blue-300 rounded-lg font-medium hover:bg-jdblue hover:text-white dark:hover:bg-blue-600 transition-all duration-300"
                >
                  Details
                </Link>
                <button 
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-all duration-300",
                    "bg-gradient-to-r from-jdorange to-jdorange-dark text-white hover:opacity-90",
                    "disabled:bg-gray-400 disabled:hover:bg-gray-500 disabled:text-white disabled:cursor-not-allowed disabled:opacity-80"
                  )}
                  disabled={isLoading}
                  onClick={handleRent}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Clock className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </span>
                  ) : (
                    <>Purchase</>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to={`/course-detail/${id}`}
                  className="px-4 py-2 text-center border border-jdblue dark:border-blue-300 text-jdblue dark:text-blue-300 rounded-lg font-medium hover:bg-jdblue hover:text-white dark:hover:bg-blue-600 transition-all duration-300"
                >
                  Details
                </Link>
                <Link
                  to={`/course/${id}`}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-all duration-300",
                    "bg-gray-100 hover:bg-gray-200 text-gray-800",
                    "dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  )}
                >
                  Access Free
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Payment Modal using the shared component */}
      {clientSecret && (
        <StripeCheckoutDialog
          open={showPaymentModal}
          onClose={handleClosePaymentModal}
          clientSecret={clientSecret}
          title="Complete your purchase"
          description={`Purchase access to "${title}"`}
          onError={(error) => {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed');
          }}
        />
      )}
    </>
  );
}

// Add a named export as well
export { JDSCourseCard };