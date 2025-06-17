import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Monitor, 
  Wifi, 
  Cookie, 
  Database, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getEnvironmentConfig, debugEnvironment, validateEnvironment } from '@/lib/env-utils';

// Helper function to detect Safari browser
const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export function BrowserDebug() {
  const { user, session, loading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [storageTest, setStorageTest] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    connection: (navigator as any).connection,
    effectiveType: (navigator as any).connection?.effectiveType || 'unknown'
  });

  const runEnvironmentDebug = () => {
    try {
      // Capture console output
      const originalLog = console.log;
      const originalGroup = console.group;
      const originalGroupEnd = console.groupEnd;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalLog(...args);
      };
      console.group = (label) => {
        logs.push(`=== ${label} ===`);
        originalGroup(label);
      };
      console.groupEnd = () => {
        logs.push('=== END ===');
        originalGroupEnd();
      };

      debugEnvironment();
      
      // Restore console
      console.log = originalLog;
      console.group = originalGroup;
      console.groupEnd = originalGroupEnd;
      
      setDebugInfo(logs);
    } catch (error) {
      setDebugInfo([`Error running debug: ${error.message}`]);
    }

    try {
      setValidation(validateEnvironment());
    } catch (error) {
      setValidation({ error: error.message });
    }

    try {
      setConfig(getEnvironmentConfig());
    } catch (error) {
      setConfig({ error: error.message });
    }
  };

  const testStorage = () => {
    const results = {
      localStorage: { available: false, error: null },
      sessionStorage: { available: false, error: null },
      indexedDB: { available: false, error: null },
      cookies: { enabled: navigator.cookieEnabled, count: 0 }
    };

    // Test localStorage
    try {
      const testKey = '_test_localStorage_';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      results.localStorage.available = result === 'test';
    } catch (error) {
      results.localStorage.error = error.message;
    }

    // Test sessionStorage
    try {
      const testKey = '_test_sessionStorage_';
      sessionStorage.setItem(testKey, 'test');
      const result = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      results.sessionStorage.available = result === 'test';
    } catch (error) {
      results.sessionStorage.error = error.message;
    }

    // Test IndexedDB
    try {
      results.indexedDB.available = 'indexedDB' in window;
    } catch (error) {
      results.indexedDB.error = error.message;
    }

    // Count cookies
    try {
      results.cookies.count = document.cookie.split(';').filter(c => c.trim()).length;
    } catch (error) {
      // Cookies might be blocked
    }

    setStorageTest(results);
  };

  const clearStorage = (type: 'localStorage' | 'sessionStorage' | 'all') => {
    try {
      if (type === 'localStorage' || type === 'all') {
        localStorage.clear();
      }
      if (type === 'sessionStorage' || type === 'all') {
        sessionStorage.clear();
      }
      if (type === 'all') {
        // Clear cookies
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      testStorage(); // Refresh storage test
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  useEffect(() => {
    runEnvironmentDebug();
    testStorage();

    // Listen for network changes
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const browserInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    vendor: navigator.vendor,
    isSafari: isSafari(),
    isChrome: /Chrome/.test(navigator.userAgent),
    isFirefox: /Firefox/.test(navigator.userAgent),
    isEdge: /Edge/.test(navigator.userAgent),
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-bold">Browser Debug Information</h2>
        </div>
        <Button onClick={runEnvironmentDebug} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="browser" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Browser Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Browser Detection</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={browserInfo.isSafari ? "default" : "secondary"}>
                          Safari: {browserInfo.isSafari ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={browserInfo.isChrome ? "default" : "secondary"}>
                          Chrome: {browserInfo.isChrome ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={browserInfo.isFirefox ? "default" : "secondary"}>
                          Firefox: {browserInfo.isFirefox ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Platform</h4>
                    <div className="space-y-1 text-sm">
                      <div>Platform: <code className="text-xs">{browserInfo.platform}</code></div>
                      <div>Vendor: <code className="text-xs">{browserInfo.vendor}</code></div>
                      <div>Language: <code className="text-xs">{browserInfo.language}</code></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Screen & Viewport</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div>Screen: {browserInfo.screen.width} × {browserInfo.screen.height}</div>
                      <div>Color Depth: {browserInfo.screen.colorDepth}-bit</div>
                    </div>
                    <div>
                      <div>Viewport: {browserInfo.viewport.width} × {browserInfo.viewport.height}</div>
                      <div>Pixel Depth: {browserInfo.screen.pixelDepth}-bit</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">User Agent</h4>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {browserInfo.userAgent}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Testing
              </CardTitle>
              <CardDescription>
                Test browser storage capabilities and manage stored data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storageTest && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {storageTest.localStorage.available ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium">localStorage</div>
                      <div className="text-xs text-muted-foreground">
                        {storageTest.localStorage.available ? 'Available' : 'Blocked'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {storageTest.sessionStorage.available ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium">sessionStorage</div>
                      <div className="text-xs text-muted-foreground">
                        {storageTest.sessionStorage.available ? 'Available' : 'Blocked'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {storageTest.indexedDB.available ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium">IndexedDB</div>
                      <div className="text-xs text-muted-foreground">
                        {storageTest.indexedDB.available ? 'Available' : 'Blocked'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Cookie className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-sm font-medium">Cookies</div>
                      <div className="text-xs text-muted-foreground">
                        {storageTest.cookies.enabled ? `${storageTest.cookies.count} active` : 'Disabled'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={() => clearStorage('localStorage')} 
                      variant="outline" 
                      size="sm"
                      disabled={!storageTest.localStorage.available}
                    >
                      Clear localStorage
                    </Button>
                    <Button 
                      onClick={() => clearStorage('sessionStorage')} 
                      variant="outline" 
                      size="sm"
                      disabled={!storageTest.sessionStorage.available}
                    >
                      Clear sessionStorage
                    </Button>
                    <Button 
                      onClick={() => clearStorage('all')} 
                      variant="destructive" 
                      size="sm"
                    >
                      Clear All Storage
                    </Button>
                    <Button onClick={testStorage} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retest
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {networkStatus.online ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {networkStatus.online ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                {networkStatus.connection && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Connection Type</div>
                      <div className="text-muted-foreground">
                        {networkStatus.connection.type || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Effective Type</div>
                      <div className="text-muted-foreground">
                        {networkStatus.effectiveType}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Loading</div>
                    <Badge variant={authLoading ? "destructive" : "default"}>
                      {authLoading ? 'Loading...' : 'Resolved'}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium">User Status</div>
                    <Badge variant={user ? "default" : "secondary"}>
                      {user ? 'Authenticated' : 'Not authenticated'}
                    </Badge>
                  </div>
                </div>
                
                {user && (
                  <div>
                    <div className="font-medium mb-2">User Details</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify({
                        id: user.id,
                        email: user.email,
                        isAdmin: user.user_metadata?.is_admin,
                        metadata: user.user_metadata
                      }, null, 2)}
                    </pre>
                  </div>
                )}
                
                {session && (
                  <div>
                    <div className="font-medium mb-2">Session Info</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify({
                        expires_at: session.expires_at,
                        token_type: session.token_type,
                        provider_token: session.provider_token ? 'Present' : 'None'
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validation && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {validation.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      Environment Validation: {validation.valid ? 'Valid' : 'Issues Found'}
                    </span>
                  </div>
                  
                  {validation.errors && validation.errors.length > 0 && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      <div className="font-medium mb-1">Errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {config && (
                <div className="mb-4">
                  <div className="font-medium mb-2">Configuration</div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Debug Console Output</div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                    {debugInfo.join('\n')}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 