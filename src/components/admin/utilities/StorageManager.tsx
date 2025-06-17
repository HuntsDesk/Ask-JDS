import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  Database, 
  Cookie, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to detect Safari browser
const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

interface StorageInfo {
  localStorage: {
    available: boolean;
    itemCount: number;
    estimatedSize: number;
    error?: string;
  };
  sessionStorage: {
    available: boolean;
    itemCount: number;
    estimatedSize: number;
    error?: string;
  };
  indexedDB: {
    available: boolean;
    databases?: string[];
    error?: string;
  };
  cookies: {
    enabled: boolean;
    count: number;
    list: string[];
  };
  caches: {
    available: boolean;
    names?: string[];
    error?: string;
  };
}

export function StorageManager() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const getStorageSize = (storage: Storage): number => {
    let size = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        size += storage[key].length + key.length;
      }
    }
    return size;
  };

  const scanStorage = async () => {
    setLoading(true);
    addLog('Starting storage scan...');
    
    const info: StorageInfo = {
      localStorage: {
        available: false,
        itemCount: 0,
        estimatedSize: 0
      },
      sessionStorage: {
        available: false,
        itemCount: 0,
        estimatedSize: 0
      },
      indexedDB: {
        available: false
      },
      cookies: {
        enabled: navigator.cookieEnabled,
        count: 0,
        list: []
      },
      caches: {
        available: false
      }
    };

    // Test localStorage
    try {
      const testKey = '_storage_test_';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      info.localStorage.available = true;
      info.localStorage.itemCount = localStorage.length;
      info.localStorage.estimatedSize = getStorageSize(localStorage);
      addLog(`localStorage: ${info.localStorage.itemCount} items, ~${info.localStorage.estimatedSize} bytes`);
    } catch (error) {
      info.localStorage.error = error.message;
      addLog(`localStorage error: ${error.message}`);
    }

    // Test sessionStorage
    try {
      const testKey = '_storage_test_';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      
      info.sessionStorage.available = true;
      info.sessionStorage.itemCount = sessionStorage.length;
      info.sessionStorage.estimatedSize = getStorageSize(sessionStorage);
      addLog(`sessionStorage: ${info.sessionStorage.itemCount} items, ~${info.sessionStorage.estimatedSize} bytes`);
    } catch (error) {
      info.sessionStorage.error = error.message;
      addLog(`sessionStorage error: ${error.message}`);
    }

    // Test IndexedDB
    try {
      if ('indexedDB' in window) {
        info.indexedDB.available = true;
        
        // Try to get database names (this is experimental)
        if ('databases' in indexedDB) {
          const databases = await (indexedDB as any).databases();
          info.indexedDB.databases = databases.map((db: any) => db.name);
          addLog(`IndexedDB: ${databases.length} databases found`);
        } else {
          addLog('IndexedDB: Available (database enumeration not supported)');
        }
      }
    } catch (error) {
      info.indexedDB.error = error.message;
      addLog(`IndexedDB error: ${error.message}`);
    }

    // Scan cookies
    try {
      const cookies = document.cookie.split(';').filter(c => c.trim());
      info.cookies.count = cookies.length;
      info.cookies.list = cookies.map(c => c.trim().split('=')[0]);
      addLog(`Cookies: ${info.cookies.count} found`);
    } catch (error) {
      addLog(`Cookie scan error: ${error.message}`);
    }

    // Test Cache API
    try {
      if ('caches' in window) {
        info.caches.available = true;
        const cacheNames = await caches.keys();
        info.caches.names = cacheNames;
        addLog(`Cache API: ${cacheNames.length} caches found`);
      }
    } catch (error) {
      info.caches.error = error.message;
      addLog(`Cache API error: ${error.message}`);
    }

    setStorageInfo(info);
    setLoading(false);
    addLog('Storage scan completed');
  };

  const clearStorage = async (type: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB' | 'caches' | 'all') => {
    setLoading(true);
    addLog(`Starting ${type} cleanup...`);

    try {
      if (type === 'localStorage' || type === 'all') {
        localStorage.clear();
        addLog('localStorage cleared');
      }

      if (type === 'sessionStorage' || type === 'all') {
        sessionStorage.clear();
        addLog('sessionStorage cleared');
      }

      if (type === 'cookies' || type === 'all') {
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        addLog('Cookies cleared');
      }

      if (type === 'indexedDB' || type === 'all') {
        if (storageInfo?.indexedDB.databases) {
          for (const dbName of storageInfo.indexedDB.databases) {
            try {
              const deleteRequest = indexedDB.deleteDatabase(dbName);
              await new Promise((resolve, reject) => {
                deleteRequest.onsuccess = () => resolve(undefined);
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
              addLog(`IndexedDB '${dbName}' deleted`);
            } catch (error) {
              addLog(`Failed to delete IndexedDB '${dbName}': ${error.message}`);
            }
          }
        }
      }

      if (type === 'caches' || type === 'all') {
        if (storageInfo?.caches.names) {
          for (const cacheName of storageInfo.caches.names) {
            try {
              await caches.delete(cacheName);
              addLog(`Cache '${cacheName}' deleted`);
            } catch (error) {
              addLog(`Failed to delete cache '${cacheName}': ${error.message}`);
            }
          }
        }
      }

      toast({
        title: "Storage cleared",
        description: `${type} has been cleared successfully.`,
      });

      // Rescan storage after clearing
      setTimeout(() => {
        scanStorage();
      }, 1000);

    } catch (error) {
      addLog(`Error during ${type} cleanup: ${error.message}`);
      toast({
        title: "Error",
        description: `Failed to clear ${type}: ${error.message}`,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const safariDeepClean = async () => {
    setLoading(true);
    addLog('Starting Safari deep clean...');
    
    try {
      // Clear all storage types
      await clearStorage('all');
      
      // Safari-specific cleanup
      if (isSafari()) {
        // Try to clear WebSQL (deprecated but might still exist)
        try {
          const db = (window as any).openDatabase('test', '1.0', 'test', 1024);
          db.transaction((tx: any) => {
            tx.executeSql('DROP TABLE IF EXISTS test');
          });
          addLog('WebSQL cleanup attempted');
        } catch (error) {
          addLog('WebSQL not available or already clean');
        }

        // Clear any Safari-specific storage
        try {
          // Clear application cache if available
          if ('applicationCache' in window) {
            (window as any).applicationCache.update();
            addLog('Application cache update triggered');
          }
        } catch (error) {
          addLog('Application cache not available');
        }
      }

      toast({
        title: "Safari deep clean completed",
        description: "All browser storage has been cleared. The page will reload in 3 seconds.",
      });

      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      addLog(`Safari deep clean error: ${error.message}`);
      toast({
        title: "Error",
        description: `Safari deep clean failed: ${error.message}`,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const clearLog = () => {
    setLog([]);
  };

  useEffect(() => {
    scanStorage();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold">Storage Manager</h2>
        </div>
        <Button onClick={scanStorage} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Rescan Storage
        </Button>
      </div>

      {isSafari() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Safari browser detected. Use the "Safari Deep Clean" feature for comprehensive cleanup of Safari-specific storage.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="log">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {storageInfo && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Browser Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {storageInfo.localStorage.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">localStorage</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {storageInfo.localStorage.available 
                        ? `${storageInfo.localStorage.itemCount} items, ~${storageInfo.localStorage.estimatedSize}B`
                        : 'Unavailable'
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {storageInfo.sessionStorage.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">sessionStorage</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {storageInfo.sessionStorage.available 
                        ? `${storageInfo.sessionStorage.itemCount} items, ~${storageInfo.sessionStorage.estimatedSize}B`
                        : 'Unavailable'
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {storageInfo.indexedDB.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">IndexedDB</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {storageInfo.indexedDB.available 
                        ? `${storageInfo.indexedDB.databases?.length || 0} databases`
                        : 'Unavailable'
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {storageInfo.caches.available ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">Cache API</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {storageInfo.caches.available 
                        ? `${storageInfo.caches.names?.length || 0} caches`
                        : 'Unavailable'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    Cookies & Other
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {storageInfo.cookies.enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">Cookies</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {storageInfo.cookies.enabled 
                        ? `${storageInfo.cookies.count} active`
                        : 'Disabled'
                      }
                    </div>
                  </div>

                  {storageInfo.cookies.list.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1">Cookie Names:</div>
                      <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                        {storageInfo.cookies.list.join(', ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Individual Storage Types</CardTitle>
                <CardDescription>Clear specific storage types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => clearStorage('localStorage')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading || !storageInfo?.localStorage.available}
                >
                  Clear localStorage
                </Button>
                <Button 
                  onClick={() => clearStorage('sessionStorage')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading || !storageInfo?.sessionStorage.available}
                >
                  Clear sessionStorage
                </Button>
                <Button 
                  onClick={() => clearStorage('cookies')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  Clear Cookies
                </Button>
                <Button 
                  onClick={() => clearStorage('indexedDB')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading || !storageInfo?.indexedDB.available}
                >
                  Clear IndexedDB
                </Button>
                <Button 
                  onClick={() => clearStorage('caches')} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading || !storageInfo?.caches.available}
                >
                  Clear Caches
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>Clear multiple storage types at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => clearStorage('all')} 
                  variant="destructive" 
                  className="w-full"
                  disabled={loading}
                >
                  Clear All Storage
                </Button>
                
                {isSafari() && (
                  <Button 
                    onClick={safariDeepClean} 
                    variant="destructive" 
                    className="w-full"
                    disabled={loading}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Safari Deep Clean
                  </Button>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  <strong>Warning:</strong> These actions will clear all stored data and may log you out of the application.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Activity Log
                <Button onClick={clearLog} variant="outline" size="sm">
                  Clear Log
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {log.length > 0 ? (
                <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {log.join('\n')}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No activity logged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 