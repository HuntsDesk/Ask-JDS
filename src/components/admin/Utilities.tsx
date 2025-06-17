import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Database, 
  Settings, 
  Trash2, 
  CreditCard, 
  Key, 
  BarChart3,
  Globe,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { DiagnosticTests } from './utilities/DiagnosticTests';
import { BrowserDebug } from './utilities/BrowserDebug';
import { UsermavenDebug } from './utilities/UsermavenDebug';
import { StorageManager } from './utilities/StorageManager';
import { SubscriptionTester } from './utilities/SubscriptionTester';
import { AuthTokenExtractor } from './utilities/AuthTokenExtractor';

type UtilityComponent = 'diagnostic' | 'browser' | 'usermaven' | 'storage' | 'subscription' | 'auth-token';

interface Utility {
  id: UtilityComponent;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'debugging' | 'testing' | 'management';
  environment: 'dev-only' | 'all';
  component: React.ComponentType;
}

const utilities: Utility[] = [
  {
    id: 'diagnostic',
    title: 'Diagnostic Tests',
    description: 'Run comprehensive system diagnostics including database connectivity, admin functions, and browser compatibility tests',
    icon: <Bug className="h-5 w-5" />,
    category: 'debugging',
    environment: 'all',
    component: DiagnosticTests
  },
  {
    id: 'browser',
    title: 'Browser Debug',
    description: 'Debug browser environment, localStorage, cookies, and platform-specific issues (Safari, Chrome, etc.)',
    icon: <Globe className="h-5 w-5" />,
    category: 'debugging',
    environment: 'all',
    component: BrowserDebug
  },
  {
    id: 'usermaven',
    title: 'Usermaven Analytics',
    description: 'Test and debug Usermaven analytics integration, track events, and verify data collection',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'debugging',
    environment: 'all',
    component: UsermavenDebug
  },
  {
    id: 'storage',
    title: 'Storage Manager',
    description: 'Clear browser storage, cookies, and cached data. Includes Safari-specific deep clean utilities',
    icon: <Trash2 className="h-5 w-5" />,
    category: 'management',
    environment: 'dev-only',
    component: StorageManager
  },
  {
    id: 'subscription',
    title: 'Subscription Tester',
    description: 'Test subscription activation, Stripe integration, and payment flows without real transactions',
    icon: <CreditCard className="h-5 w-5" />,
    category: 'testing',
    environment: 'dev-only',
    component: SubscriptionTester
  },
  {
    id: 'auth-token',
    title: 'Auth Token Extractor',
    description: 'Extract authentication tokens for API testing and debugging purposes',
    icon: <Key className="h-5 w-5" />,
    category: 'testing',
    environment: 'dev-only',
    component: AuthTokenExtractor
  }
];

export default function Utilities() {
  const [activeUtility, setActiveUtility] = useState<UtilityComponent | null>(null);
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';
  
  // Filter utilities based on environment
  const availableUtilities = utilities.filter(utility => 
    utility.environment === 'all' || (utility.environment === 'dev-only' && isDevelopment)
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'debugging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'testing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'management': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    return environment === 'dev-only' 
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (activeUtility) {
    const utility = utilities.find(u => u.id === activeUtility);
    if (utility) {
      const UtilityComponent = utility.component;
      return (
        <AdminLayout title={`Utilities - ${utility.title}`}>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveUtility(null)}
              className="mb-4"
            >
              ← Back to Utilities
            </Button>
            <UtilityComponent />
          </div>
        </AdminLayout>
      );
    }
  }

  return (
    <AdminLayout title="Development Utilities">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-bold">Development Utilities</h1>
          </div>
          <p className="text-muted-foreground">
            Diagnostic tools and utilities for debugging, testing, and managing the application.
          </p>
          {!isDevelopment && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Production Mode: Some utilities are restricted to development environment only.
              </span>
            </div>
          )}
        </div>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Mode:</span>
                <Badge className={`ml-2 ${isDevelopment ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {isDevelopment ? 'Development' : 'Production'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Domain:</span>
                <span className="ml-2 font-mono text-xs">{window.location.hostname}</span>
              </div>
              <div>
                <span className="font-medium">Port:</span>
                <span className="ml-2 font-mono text-xs">{window.location.port || '80/443'}</span>
              </div>
              <div>
                <span className="font-medium">Available Utilities:</span>
                <span className="ml-2 font-mono text-xs">{availableUtilities.length}/{utilities.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utilities Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableUtilities.map((utility) => (
            <Card key={utility.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {utility.icon}
                    <CardTitle className="text-lg">{utility.title}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getCategoryColor(utility.category)}>
                      {utility.category}
                    </Badge>
                    <Badge className={getEnvironmentColor(utility.environment)}>
                      {utility.environment}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4 min-h-[3rem]">
                  {utility.description}
                </CardDescription>
                <Button 
                  onClick={() => setActiveUtility(utility.id)}
                  className="w-full"
                  variant="outline"
                >
                  Open Utility
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-medium mb-2">Categories:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">debugging</Badge>
                    <span>System diagnostics and debugging tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">testing</Badge>
                    <span>Testing and validation utilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">management</Badge>
                    <span>Data and system management tools</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Environment:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">all</Badge>
                    <span>Available in all environments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">dev-only</Badge>
                    <span>Development environment only</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 