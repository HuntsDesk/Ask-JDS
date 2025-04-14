import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from './AdminLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Database } from 'lucide-react';
import { isSafari } from '@/lib/auth-utils';
import { useToast } from '@/hooks/use-toast';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  data?: any;
  error?: any;
  duration?: number;
};

export default function DiagnosticTest() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'admin_connection_test', status: 'pending' },
    { name: 'get_course_statistics', status: 'pending' },
    { name: 'get_flashcard_stats', status: 'pending' },
    { name: 'get_total_users', status: 'pending' },
    { name: 'is_admin check', status: 'pending' },
    { name: 'browser detection', status: 'pending' },
  ]);
  const [loading, setLoading] = useState(false);
  const [flashcardTests, setFlashcardTests] = useState<TestResult[]>([
    { name: 'fetch_flashcards_basic', status: 'pending' },
    { name: 'fetch_collections', status: 'pending' },
    { name: 'fetch_subjects', status: 'pending' },
    { name: 'count_flashcards', status: 'pending' }
  ]);
  const [runningFlashcardTests, setRunningFlashcardTests] = useState(false);
  const { toast } = useToast();

  const runTests = async () => {
    setLoading(true);
    const newResults = [...results];

    // Test admin_connection_test
    try {
      console.log("Testing admin_connection_test...");
      const { data, error } = await supabase.rpc('admin_connection_test');
      if (error) throw error;
      newResults[0] = {
        name: 'admin_connection_test',
        status: 'success',
        data
      };
    } catch (error) {
      console.error("admin_connection_test error:", error);
      newResults[0] = {
        name: 'admin_connection_test',
        status: 'error',
        error
      };
    }

    // Test get_course_statistics
    try {
      console.log("Testing get_course_statistics...");
      const { data, error } = await supabase.rpc('get_course_statistics');
      if (error) throw error;
      newResults[1] = {
        name: 'get_course_statistics',
        status: 'success',
        data
      };
    } catch (error) {
      console.error("get_course_statistics error:", error);
      newResults[1] = {
        name: 'get_course_statistics',
        status: 'error',
        error
      };
    }

    // Test get_flashcard_stats
    try {
      console.log("Testing get_flashcard_stats...");
      const { data, error } = await supabase.rpc('get_flashcard_stats');
      if (error) throw error;
      newResults[2] = {
        name: 'get_flashcard_stats',
        status: 'success',
        data
      };
    } catch (error) {
      console.error("get_flashcard_stats error:", error);
      newResults[2] = {
        name: 'get_flashcard_stats',
        status: 'error',
        error
      };
    }

    // Test get_total_users
    try {
      console.log("Testing get_total_users...");
      const { data, error } = await supabase.rpc('get_total_users');
      if (error) throw error;
      newResults[3] = {
        name: 'get_total_users',
        status: 'success',
        data
      };
    } catch (error) {
      console.error("get_total_users error:", error);
      newResults[3] = {
        name: 'get_total_users',
        status: 'error',
        error
      };
    }

    // Test is_admin directly
    try {
      console.log("Testing user auth status...");
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.user_metadata?.is_admin === true;
      newResults[4] = {
        name: 'is_admin check',
        status: 'success',
        data: { isAdmin, userId: user?.id }
      };
    } catch (error) {
      console.error("auth status error:", error);
      newResults[4] = {
        name: 'is_admin check',
        status: 'error',
        error
      };
    }
    
    // Test browser detection
    try {
      console.log("Testing browser detection...");
      const isSafariBrowser = isSafari();
      const userAgent = navigator.userAgent;
      
      // Test localStorage
      const localStorageAvailable = testLocalStorage();
      
      newResults[5] = {
        name: 'browser detection',
        status: 'success',
        data: { 
          isSafari: isSafariBrowser,
          userAgent,
          localStorageAvailable,
          cookiesEnabled: navigator.cookieEnabled,
          platform: navigator.platform,
        }
      };
    } catch (error) {
      console.error("browser detection error:", error);
      newResults[5] = {
        name: 'browser detection',
        status: 'error',
        error
      };
    }

    setResults(newResults);
    setLoading(false);
  };
  
  // Run flashcard-specific tests
  const runFlashcardTests = async () => {
    setRunningFlashcardTests(true);
    const newResults = [...flashcardTests];
    
    // Test 1: Fetch flashcards basic query
    try {
      console.log("Testing basic flashcard fetch...");
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, question, answer')
        .limit(5);
        
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error) throw error;
      
      newResults[0] = {
        name: 'fetch_flashcards_basic',
        status: 'success',
        data,
        duration
      };
    } catch (error) {
      console.error("Basic flashcard fetch error:", error);
      newResults[0] = {
        name: 'fetch_flashcards_basic',
        status: 'error',
        error
      };
    }
    
    // Test 2: Fetch collections
    try {
      console.log("Testing collections fetch...");
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('collections')
        .select('id, title, is_official')
        .limit(5);
        
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error) throw error;
      
      newResults[1] = {
        name: 'fetch_collections',
        status: 'success',
        data,
        duration
      };
    } catch (error) {
      console.error("Collections fetch error:", error);
      newResults[1] = {
        name: 'fetch_collections',
        status: 'error',
        error
      };
    }
    
    // Test 3: Fetch subjects
    try {
      console.log("Testing subjects fetch...");
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, is_official')
        .limit(5);
        
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error) throw error;
      
      newResults[2] = {
        name: 'fetch_subjects',
        status: 'success',
        data,
        duration
      };
    } catch (error) {
      console.error("Subjects fetch error:", error);
      newResults[2] = {
        name: 'fetch_subjects',
        status: 'error',
        error
      };
    }
    
    // Test 4: Count flashcards
    try {
      console.log("Testing flashcard count...");
      const startTime = performance.now();
      
      const { count, error } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true });
        
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error) throw error;
      
      newResults[3] = {
        name: 'count_flashcards',
        status: 'success',
        data: { count },
        duration
      };
    } catch (error) {
      console.error("Count flashcards error:", error);
      newResults[3] = {
        name: 'count_flashcards',
        status: 'error',
        error
      };
    }
    
    setFlashcardTests(newResults);
    setRunningFlashcardTests(false);
  };
  
  // Helper function to test localStorage availability and functionality
  const testLocalStorage = (): boolean => {
    try {
      const testKey = '_test_localStorage_';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return result === 'test';
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <AdminLayout title="Diagnostic Test">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Admin Function Tests</h2>
            <Button 
              onClick={runTests} 
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Running Tests...' : 'Run Tests Again'}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                    {result.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
                    {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin mr-2" />}
                    {result.name}
                  </CardTitle>
                  <CardDescription>
                    Status: {result.status === 'pending' ? 'Testing...' : result.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {result.status === 'success' && (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  {result.status === 'error' && (
                    <div className="text-red-500">
                      <p>Error: {result.error?.message || 'Unknown error'}</p>
                      {result.error?.code && <p>Code: {result.error.code}</p>}
                      {result.error?.details && <p>Details: {result.error.details}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Flashcard-specific diagnostic tests */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Flashcard Diagnostic Tests</h2>
            <Button 
              onClick={runFlashcardTests} 
              disabled={runningFlashcardTests}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {runningFlashcardTests ? 'Running Tests...' : 'Run Flashcard Tests'}
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {flashcardTests.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                    {result.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
                    {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin mr-2" />}
                    {result.name}
                  </CardTitle>
                  <CardDescription>
                    Status: {result.status === 'pending' ? 'Not Run' : result.status}
                    {result.duration && ` (${result.duration.toFixed(2)}ms)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {result.status === 'success' && (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  {result.status === 'error' && (
                    <div className="text-red-500">
                      <p>Error: {result.error?.message || 'Unknown error'}</p>
                      {result.error?.code && <p>Code: {result.error.code}</p>}
                      {result.error?.details && <p>Details: {result.error.details}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* RLS Policy Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              RLS Policy Information
            </CardTitle>
            <CardDescription>
              Run this SQL query in the Supabase dashboard to check your RLS policies:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-sm">
{`SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM 
  pg_policies 
WHERE
  tablename IN ('flashcards', 'collections', 'subjects')
ORDER BY 
  tablename, 
  policyname;`}
            </pre>
          </CardContent>
        </Card>
        
        {/* Safari-specific troubleshooting tips */}
        {isSafari() && (
          <Card className="mt-8 border-orange-500">
            <CardHeader>
              <CardTitle>Safari-Specific Recommendations</CardTitle>
              <CardDescription>
                Your browser was detected as Safari. Here are some tips to improve performance:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Turn off "Prevent Cross-Site Tracking" in Safari Privacy settings</li>
                  <li>Allow cookies for this website in Safari Privacy settings</li>
                  <li>Clear browser cache and website data for this domain</li>
                  <li>Try using private/incognito mode to test without previous cookie data</li>
                  <li>Try using a different browser if problems persist</li>
                </ul>
                
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 rounded-md mt-4">
                  <h3 className="font-medium mb-2 text-orange-800 dark:text-orange-300">Quick Fix for Safari</h3>
                  <p className="text-sm mb-4">If Safari in private mode works but regular mode doesn't, click the button below to clear stored browser data for this site:</p>
                  
                  <Button 
                    onClick={() => {
                      // Clear localStorage
                      localStorage.clear();
                      
                      // Clear sessionStorage
                      sessionStorage.clear();
                      
                      // Remove Supabase and auth-related cookies
                      document.cookie.split(";").forEach(function(c) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                      });
                      
                      toast({
                        title: "Browser data cleared",
                        description: "All site data has been cleared. The page will reload in 3 seconds.",
                      });
                      
                      // Reload after a short delay
                      setTimeout(() => {
                        window.location.href = '/auth';
                      }, 3000);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Clear All Browser Data & Reload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 