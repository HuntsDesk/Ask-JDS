import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Mail, 
  Lock, 
  Brain, 
  Scale, 
  BookOpenCheck, 
  Sparkles, 
  ArrowRight, 
  Stars,
  MessageSquare,
  GraduationCap,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CSSTransition } from 'react-transition-group';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordValidator } from './PasswordValidator';
import { authLog } from '@/lib/debug-logger';
import { recordSignupAgreements } from '@/lib/legal-agreements';
import { EmailConfirmationPage } from './EmailConfirmationPage';
import { supabase } from '@/lib/supabase';

interface AuthFormProps {
  initialTab?: 'signin' | 'signup';
}

export function AuthForm({ initialTab = 'signin' }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackAuth } = useAnalytics();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [otpError, setOtpError] = useState<{ code: string; description: string; email?: string } | null>(null);
  const [resendEmail, setResendEmail] = useState(''); // Separate state for resend form
  const [isResending, setIsResending] = useState(false);
  
  // Create refs for CSSTransition to avoid findDOMNode deprecation warnings
  const signInNodeRef = useRef(null);
  const signUpNodeRef = useRef(null);
  const resendEmailInputRef = useRef<HTMLInputElement>(null);
  
  // Check for OTP errors from URL parameters
  useEffect(() => {
    const storedError = localStorage.getItem('auth_error');
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (storedError && errorParam) {
      try {
        const error = JSON.parse(storedError);
        setOtpError(error);
        
        // Pre-fill email if available
        if (error.email) {
          setEmail(decodeURIComponent(error.email));
          setResendEmail(decodeURIComponent(error.email));
        } else {
          // Try to get email from localStorage
          const lastEmail = localStorage.getItem('last_auth_email');
          if (lastEmail) {
            setResendEmail(lastEmail);
          }
        }
        
        // Show error toast
        toast({
          title: 'Authentication Error',
          description: error.description,
          variant: 'destructive',
          duration: 8000,
        });
        
        // Clear stored error
        localStorage.removeItem('auth_error');
        
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        window.history.replaceState(null, '', newUrl.toString());
      } catch (e) {
        console.error('Failed to parse auth error:', e);
      }
    }
  }, [toast]);
  
  // Auto-focus resend email input when OTP error is shown
  useEffect(() => {
    if (otpError && (otpError.code === 'otp_expired' || otpError.code === 'invalid_token')) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        resendEmailInputRef.current?.focus();
      }, 100);
    }
  }, [otpError]);
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Check URL parameters for tab switching and reset email confirmation state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam === 'signin' || tabParam === 'signup') {
      // If user navigated to a specific tab via URL, reset email confirmation state
      setShowEmailConfirmation(false);
      setActiveTab(tabParam as 'signin' | 'signup');
    }
  }, [location.search]); // Listen for URL search parameter changes

  // Check if redirected due to session expiration
  useEffect(() => {
    // Check if we have a session expiration message in sessionStorage
    const redirectReason = sessionStorage.getItem('auth_redirect_reason');
    if (redirectReason === 'session_expired') {
      console.log('User was redirected due to session expiration');
      setSessionExpired(true);
      
      // Check if there's a preserved message to show in the notification
      const preservedMsg = sessionStorage.getItem('preserved_message');
      let notificationText = 'Your session has expired. Please sign in again to continue.';
      
      if (preservedMsg) {
        notificationText += ' Your draft message has been saved.';
      }
      
      // Set the session expired message with details about preserved content
      toast({
        title: 'Session Expired',
        description: notificationText,
        variant: 'default',
      });
      
      // Clear the redirect reason so it doesn't show on refresh
      sessionStorage.removeItem('auth_redirect_reason');
    }
  }, [toast]);

  // Check if user is already authenticated
  useEffect(() => {
    // Create a mechanism to detect navigation loops
    const prevRedirectAttempts = parseInt(sessionStorage.getItem('auth_redirect_attempts') || '0');
    
    if (user) {
      console.log('User already authenticated, checking redirect loop counter:', prevRedirectAttempts);
      
      // If we've already tried to redirect too many times, don't continue the cycle
      if (prevRedirectAttempts > 3) {
        console.warn('Too many redirect attempts detected (', prevRedirectAttempts, ') - breaking potential infinite loop');
        sessionStorage.removeItem('auth_redirect_attempts');
        // Force a complete page reload to reset all state
        window.location.href = '/chat';
        return;
      }
      
      // Otherwise proceed with normal navigation
      console.log('User already authenticated, navigating to /chat', user);
      
      // Increment redirect counter
      sessionStorage.setItem('auth_redirect_attempts', (prevRedirectAttempts + 1).toString());
      
      navigate('/chat', { replace: true });
    } else {
      // If no user, reset the counter
      if (prevRedirectAttempts > 0) {
        sessionStorage.removeItem('auth_redirect_attempts');
      }
    }
  }, [user, navigate]);

  // Add a safety timeout to prevent getting stuck in loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      console.log('Auth loading state started, setting safety timeout');
      timeoutId = setTimeout(() => {
        console.log('Auth safety timeout triggered after 8 seconds');
        setIsLoading(false);
        toast({
          title: 'Authentication Timeout',
          description: 'The process is taking longer than expected. Please try again.',
          variant: 'destructive',
        });
      }, 8000);
    }
    
    return () => {
      if (timeoutId) {
        console.log('Clearing auth safety timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, toast]);

  // Sign in handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign in form submitted with email:', email);
    setIsLoading(true);

    try {
      console.log('Calling signIn with email:', email);
      
      // Improved error handling to deal with unexpected return values
      let signInResult;
      try {
        signInResult = await signIn(email, password);
        console.log('SignIn result:', signInResult);
      } catch (signInError) {
        console.error('Exception during signIn call:', signInError);
        throw new Error('Authentication service error. Please try again.');
      }
      
      // Handle case where signInResult is undefined or doesn't have the expected structure
      if (!signInResult) {
        console.error('SignIn returned undefined result');
        throw new Error('Authentication failed. Please try again.');
      }
      
      const { error } = signInResult;
      console.log('SignIn response error:', error);
      
      if (error) throw error;
      
      // Track successful sign-in
      trackAuth.logIn('email', { from_page: 'auth_form' });
      
      // Immediately navigate to chat after successful sign-in
      console.log('Sign-in successful, immediately navigating to /chat');
      navigate('/chat', { replace: true });
      
    } catch (error) {
      console.error('Sign in error:', error);
      
      // More descriptive user-facing error messages based on the error type
      let errorMessage = 'Failed to sign in. Please check your credentials and try again.';
      
      if (error instanceof TypeError) {
        // Special handling for the TypeError which was our original issue
        console.error('TypeError in authentication process - likely an API integration issue');
        errorMessage = 'Authentication system error. Our team has been notified.';
      } else if (error instanceof Error) {
        // If it's a specific authentication error, show that message
        errorMessage = error.message;
        
        // Check for specific Supabase error patterns
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many sign-in attempts. Please try again later.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      toast({
        title: 'Sign-in Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting: prevent rapid successive submissions
    const now = Date.now();
    if (now - lastSubmitTime < 5000) { // 5 second cooldown to prevent server overload
      toast({
        title: 'Please wait',
        description: 'Please wait a moment before trying again.',
        variant: 'default',
      });
      return;
    }
    setLastSubmitTime(now);
    
    console.log('Sign up form submitted with email:', email);
    
    setIsLoading(true);
    setPasswordError(null); // Clear previous errors
    
    // Set a safety timeout for loading state
    const timeout = setTimeout(() => {
      setIsLoading(false);
      console.log('Auth safety timeout triggered');
    }, 30000);
    
    console.log('Auth loading state started, setting safety timeout');
    
    try {
      console.log('Calling signUp with email:', email);
      const result = await signUp(email, password);
      console.log('SignUp result:', result);
      clearTimeout(timeout);
      
      if (result.success) {
        console.log('Sign up successful, email confirmation required');
        
        // Track successful sign-up
        trackAuth.signUp('email', { from_page: 'auth_form' });
        
        // Record legal agreement acceptance using the user ID
        const agreementsRecorded = await recordSignupAgreements(result.data.user?.id);
        if (!agreementsRecorded) {
          console.warn('Failed to record legal agreements, but signup succeeded');
        }
        
        // Show email confirmation page instead of auto-redirect
        setConfirmationEmail(email);
        setShowEmailConfirmation(true);
        
        toast({
          title: 'Account Created Successfully!',
          description: 'Please check your email to verify your account.',
          variant: 'default',
        });
      } else {
        console.log('SignUp response error:', result.error);
        const error = new Error(result.error || 'Unknown error occurred');
        throw error;
      }
    } catch (error) {
      clearTimeout(timeout);
      console.log('Sign up error:', error);
      
      // More descriptive user-facing error messages based on the error type
      let errorMessage = 'Failed to create account. Please try again.';
      let isPasswordError = false;
      
      if (error instanceof TypeError) {
        // Special handling for the TypeError which was our original issue
        console.error('TypeError in registration process - likely an API integration issue');
        errorMessage = 'Registration system error. Please notify support.';
      } else if (error instanceof Error) {
        // If it's a specific authentication error, show that message
        errorMessage = error.message;
        
        // Check for specific Supabase error patterns
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('Password should contain') || error.message.includes('weak and easy to guess')) {
          // Format the password error message to be more readable
          isPasswordError = true;
          if (error.message.includes('weak and easy to guess')) {
            errorMessage = 'Your password is too easy to guess. Please use a stronger password that meets all the requirements below.';
            setPasswordError('Password is too easy to guess - please choose a stronger password');
          } else {
            errorMessage = 'Password does not meet security requirements. Please ensure your password meets all the criteria shown below.';
            setPasswordError('Password does not meet security requirements');
          }
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many sign-up attempts. Please try again later.';
        } else if (error.message.includes('Database error') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      toast({
        title: 'Sign-up Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000, // Show for 6 seconds for password errors
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      console.log('Resending confirmation email to:', confirmationEmail);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail
      });
      
      if (error) throw error;
      
      console.log('Confirmation email resent successfully to:', confirmationEmail);
      
      toast({
        title: 'Email Sent',
        description: `Confirmation email has been resent to ${confirmationEmail}.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Resend email error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend from inline OTP error form
  const handleResendFromError = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail || !resendEmail.trim()) {
      return;
    }
    
    try {
      setIsResending(true);
      const trimmedEmail = resendEmail.trim();
      
      // Save email for future use
      localStorage.setItem('last_auth_email', trimmedEmail);
      
      console.log('Resending confirmation email from error form to:', trimmedEmail);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail
      });
      
      if (error) throw error;
      
      console.log('Confirmation email resent successfully to:', trimmedEmail);
      
      // Show success and transition to email confirmation page
      setConfirmationEmail(trimmedEmail);
      setShowEmailConfirmation(true);
      setOtpError(null);
      
      toast({
        title: 'Email Sent!',
        description: `A new confirmation email has been sent to ${trimmedEmail}.`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Resend email error:', error);
      
      let errorMessage = 'Failed to resend email. Please try again.';
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.message?.includes('not found') || error.message?.includes('not registered')) {
        errorMessage = 'This email address is not registered. Please sign up first.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Show email confirmation page if signup succeeded with email verification required
  if (showEmailConfirmation) {
    return (
      <EmailConfirmationPage 
        email={confirmationEmail}
        onResendEmail={handleResendEmail}
        isResending={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center animated-gradient p-4 sm:p-6 md:p-8 force-light-mode">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white/90 rounded-xl shadow-xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#00178E]/10 to-[#F37022]/10 p-8 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="flex flex-col items-center justify-center flex-grow py-8">
            {/* Main Brain Icon with Surrounding Icons - Hero Logo Style */}
            <div className="relative mb-8">
              <div className="relative">
                <Brain className="w-32 h-32 sm:w-40 sm:h-40 text-[#F37022]" />
                
                {/* Positioned Icons Around Brain - Similar to Hero Logo */}
                <div className="absolute -top-4 -right-4">
                  <Scale className="w-10 h-10 text-yellow-500 animate-float-slow" />
                </div>
                
                <div className="absolute -bottom-2 -left-4">
                  <BookOpenCheck className="w-10 h-10 text-purple-500 animate-float-medium" />
                </div>
                
                <div className="absolute -bottom-2 -right-4">
                  <Sparkles className="w-10 h-10 text-sky-400 animate-float-fast" />
                </div>
              </div>
            </div>
            
            {/* Ask JDS Title */}
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">Ask JDS</h1>
            </Link>
            
            <p className="text-gray-600 text-center max-w-sm mb-8">
              Your AI-powered law school study buddy
            </p>
            
            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
              <div className="flex flex-col items-center">
                <div className="bg-[#F37022]/10 p-3 rounded-full mb-2">
                  <MessageSquare className="w-6 h-6 text-[#F37022]" />
                </div>
                <span className="text-xs text-center">Ask Questions</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-[#00178E]/10 p-3 rounded-full mb-2">
                  <GraduationCap className="w-6 h-6 text-[#00178E]" />
                </div>
                <span className="text-xs text-center">Learn Faster</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-purple-500/10 p-3 rounded-full mb-2">
                  <BookOpenCheck className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-xs text-center">Ace Exams</span>
              </div>
            </div>
          </div>
          
          {/* JD Simplified Logo - Pinned to Bottom */}
          <div className="mt-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/images/JD Simplified Logo - Horizontal.svg" 
                alt="JD Simplified Logo" 
                className="h-10 sm:h-12" 
              />
            </Link>
          </div>
        </div>
        
        {/* Right Side - Auth Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-center">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="space-y-1 pb-4 text-center">
                <CardTitle className="text-2xl font-bold">
                  {activeTab === 'signin' ? 'Welcome Back' : 'Create an Account'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'signin' 
                    ? 'Enter your credentials to sign in to your account' 
                    : 'Enter your information to create an account'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* Show session expiration alert if needed */}
                {sessionExpired && (
                  <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-800" />
                    <AlertDescription>
                      Your session has expired. Please sign in again to continue.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Show OTP error alert with inline email form */}
                {otpError && (otpError.code === 'otp_expired' || otpError.code === 'invalid_token') && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-800" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <p className="text-red-800 font-medium">{otpError.description}</p>
                        <p className="text-red-700 text-sm">Enter your email below to receive a new confirmation link.</p>
                        
                        <form onSubmit={handleResendFromError} className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              ref={resendEmailInputRef}
                              type="email"
                              value={resendEmail}
                              onChange={(e) => setResendEmail(e.target.value)}
                              placeholder="you@example.com"
                              required
                              disabled={isResending}
                              className="pl-10 border-red-300 focus:border-red-400 focus:ring-red-400"
                            />
                          </div>
                          
                          <Button
                            type="submit"
                            disabled={isResending || !resendEmail}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isResending ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend Confirmation Email
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Tabs 
                  defaultValue={activeTab} 
                  value={activeTab} 
                  onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <CSSTransition
                    in={activeTab === 'signin'}
                    timeout={300}
                    classNames="fade"
                    unmountOnExit
                    nodeRef={signInNodeRef}
                  >
                    <TabsContent value="signin" ref={signInNodeRef}>
                      <form onSubmit={handleSignIn} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signin-email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signin-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signin-password"
                                placeholder="••••••••"
                                type="password"
                                autoCapitalize="none"
                                autoComplete="current-password"
                                autoCorrect="off"
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="remember" />
                              <Label htmlFor="remember" className="text-xs sm:text-sm">Remember me</Label>
                            </div>
                            <Link to="/auth/reset-password" className="text-xs sm:text-sm text-[#F37022] hover:underline">
                              Forgot password?
                            </Link>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full bg-[#F37022] hover:bg-[#E36012]"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <>
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </CSSTransition>
                  
                  <CSSTransition
                    in={activeTab === 'signup'}
                    timeout={300}
                    classNames="fade"
                    unmountOnExit
                    nodeRef={signUpNodeRef}
                  >
                    <TabsContent value="signup" ref={signUpNodeRef}>
                      <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signup-email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="signup-password"
                                placeholder="••••••••"
                                type="password"
                                autoCapitalize="none"
                                autoComplete="new-password"
                                autoCorrect="off"
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  if (passwordError) setPasswordError(null); // Clear error when user types
                                }}
                                className={`pl-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                required
                                minLength={8}
                              />
                            </div>
                            <PasswordValidator password={password} error={passwordError} />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox id="terms" required />
                            <label
                              htmlFor="terms"
                              className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I agree to the{" "}
                              <Link to="/terms" className="text-[#F37022] hover:underline">
                                Terms of Service
                              </Link>
                              ,{" "}
                              <Link to="/privacy" className="text-[#F37022] hover:underline">
                                Privacy Policy
                              </Link>
                              , and{" "}
                              <Link to="/disclaimer" className="text-[#F37022] hover:underline">
                                Disclaimer
                              </Link>.
                            </label>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full bg-[#F37022] hover:bg-[#E36012]"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <>
                                Create Account
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </CSSTransition>
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex flex-col items-center justify-center pt-0">
                <div className="text-center text-sm text-gray-500 mt-4">
                  {activeTab === 'signin' ? (
                    <p>
                      Don't have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="text-[#F37022] hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setActiveTab('signin')}
                        className="text-[#F37022] hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 