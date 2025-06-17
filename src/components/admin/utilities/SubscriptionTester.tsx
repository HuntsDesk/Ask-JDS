import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  TestTube, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Server,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  timestamp: string;
}

export function SubscriptionTester() {
  const [customerId, setCustomerId] = useState('');
  const [useTestFunction, setUseTestFunction] = useState(true);
  const [useLocal, setUseLocal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [response, setResponse] = useState('');
  const { toast } = useToast();

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
    setResponse('');
  };

  const getBaseUrl = () => {
    if (useLocal) {
      return useTestFunction
        ? 'http://localhost:54321/functions/v1/activate-subscription-test'
        : 'http://localhost:54321/functions/v1/activate-subscription';
    } else {
      return useTestFunction
        ? 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/activate-subscription-test'
        : 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/activate-subscription';
    }
  };

  const testSubscriptionActivation = async () => {
    if (!customerId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a customer ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const baseUrl = getBaseUrl();
    
    try {
      const requestBody = {
        customer_id: customerId.trim()
      };

      setResponse(`Using ${useLocal ? 'LOCAL' : 'PRODUCTION'} environment with ${useTestFunction ? 'TEST' : 'REGULAR'} function: ${baseUrl}`);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const result: TestResult = {
        success: response.ok,
        message: response.ok ? 'Subscription activation successful' : 'Subscription activation failed',
        data: responseData,
        timestamp: new Date().toLocaleTimeString()
      };

      if (!response.ok) {
        result.error = {
          status: response.status,
          statusText: response.statusText,
          body: responseData
        };
      }

      addResult(result);
      setResponse(JSON.stringify(responseData, null, 2));

      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Network or request error',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };

      addResult(result);
      setResponse(`Error: ${error.message}`);

      toast({
        title: "Error",
        description: `Request failed: ${error.message}`,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const testQuickActivation = async () => {
    setLoading(true);
    
    try {
      // Generate a test customer ID if none provided
      const testCustomerId = customerId.trim() || `test_customer_${Date.now()}`;
      
      const baseUrl = getBaseUrl();
      const requestBody = {
        customer_id: testCustomerId,
        test_mode: true
      };

      setResponse(`Quick test with customer ID: ${testCustomerId}\nUsing: ${baseUrl}`);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      const result: TestResult = {
        success: response.ok,
        message: `Quick test ${response.ok ? 'passed' : 'failed'}`,
        data: responseData,
        timestamp: new Date().toLocaleTimeString()
      };

      addResult(result);
      setResponse(JSON.stringify(responseData, null, 2));

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Quick test failed',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };

      addResult(result);
      setResponse(`Quick test error: ${error.message}`);
    }

    setLoading(false);
  };

  const testEndpointHealth = async () => {
    setLoading(true);
    
    try {
      const baseUrl = getBaseUrl();
      
      // Test with a simple GET request to check if endpoint exists
      const response = await fetch(baseUrl, {
        method: 'GET'
      });

      const result: TestResult = {
        success: response.status !== 404,
        message: response.status === 404 
          ? 'Endpoint not found' 
          : `Endpoint responds (${response.status})`,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        timestamp: new Date().toLocaleTimeString()
      };

      addResult(result);
      setResponse(`Endpoint health check: ${response.status} ${response.statusText}`);

    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Endpoint unreachable',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };

      addResult(result);
      setResponse(`Health check error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-green-500" />
        <h2 className="text-xl font-bold">Subscription Tester</h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Development Only:</strong> This tool is for testing subscription activation endpoints. 
          Do not use with real customer data in production.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Test Configuration
              </CardTitle>
              <CardDescription>
                Configure the testing environment and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-id">Customer ID</Label>
                  <Input
                    id="customer-id"
                    placeholder="cus_test123456789 or leave empty for auto-generation"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter a Stripe customer ID or leave empty for auto-generated test ID
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-test"
                      checked={useTestFunction}
                      onCheckedChange={setUseTestFunction}
                    />
                    <Label htmlFor="use-test">Use Test Function</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-local"
                      checked={useLocal}
                      onCheckedChange={setUseLocal}
                    />
                    <Label htmlFor="use-local">Use Local Environment</Label>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Current Configuration:</div>
                <div className="text-xs space-y-1">
                  <div>Environment: {useLocal ? 'Local Development' : 'Production'}</div>
                  <div>Function: {useTestFunction ? 'Test (No Stripe)' : 'Regular (Real Stripe)'}</div>
                  <div>Endpoint: <code className="text-xs">{getBaseUrl()}</code></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Basic Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={testEndpointHealth} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                  Test Endpoint Health
                </Button>
                
                <Button 
                  onClick={testQuickActivation} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Quick Activation Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Activation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={testSubscriptionActivation} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Test Subscription Activation
                </Button>
                
                <Button 
                  onClick={clearResults} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  Clear Results
                </Button>
              </CardContent>
            </Card>
          </div>

          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Last Response</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={response}
                  readOnly
                  className="min-h-[200px] font-mono text-xs"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <Button onClick={clearResults} variant="outline" size="sm">
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{result.message}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                      </div>
                      
                      {result.data && (
                        <div className="mt-2">
                          <div className="text-xs font-medium mb-1">Response Data:</div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="mt-2">
                          <div className="text-xs font-medium mb-1 text-red-600">Error:</div>
                          <pre className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded overflow-auto max-h-32">
                            {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No test results yet. Run some tests to see results here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 