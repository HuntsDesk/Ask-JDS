import React from 'react';
import { debugEnvironment, getEnvironmentConfig, validateEnvironment } from '@/lib/env-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function EnvironmentDebug() {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [validation, setValidation] = React.useState<any>(null);
  const [config, setConfig] = React.useState<any>(null);

  const runDebug = () => {
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

  React.useEffect(() => {
    runDebug();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Environment Debug</h1>
        <Button onClick={runDebug}>Refresh Debug Info</Button>
      </div>

      <div className="grid gap-6">
        {/* Validation Results */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Validation</CardTitle>
            <CardDescription>Results of environment variable validation</CardDescription>
          </CardHeader>
          <CardContent>
            {validation?.error ? (
              <div className="text-red-600 dark:text-red-400">
                <strong>Error:</strong> {validation.error}
              </div>
            ) : validation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={validation.valid ? "default" : "destructive"}>
                    {validation.valid ? "VALID" : "INVALID"}
                  </Badge>
                </div>
                
                {validation.errors && validation.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validation.errors.map((error: string, i: number) => (
                        <li key={i} className="text-red-600 dark:text-red-400">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validation.warnings && validation.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validation.warnings.map((warning: string, i: number) => (
                        <li key={i} className="text-yellow-600 dark:text-yellow-400">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div>No validation data available</div>
            )}
          </CardContent>
        </Card>

        {/* Environment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Resolved environment configuration values</CardDescription>
          </CardHeader>
          <CardContent>
            {config?.error ? (
              <div className="text-red-600 dark:text-red-400">
                <strong>Error:</strong> {config.error}
              </div>
            ) : config ? (
              <div className="space-y-2">
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium">{key}:</span>
                    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') 
                        ? typeof value === 'string' ? `${value.substring(0, 12)}...` : 'undefined'
                        : typeof value === 'string' ? value : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>No configuration data available</div>
            )}
          </CardContent>
        </Card>

        {/* Runtime Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Runtime Configuration</CardTitle>
            <CardDescription>Available runtime configuration from window.RUNTIME_CONFIG</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof window !== 'undefined' && window.RUNTIME_CONFIG ? (
              <div className="space-y-2">
                {Object.entries(window.RUNTIME_CONFIG).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium">{key}:</span>
                    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') 
                        ? typeof value === 'string' ? `${value.substring(0, 12)}...` : 'undefined'
                        : typeof value === 'string' ? value : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-yellow-600 dark:text-yellow-400">
                No runtime configuration available. Check if runtime-config.js is loaded.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Build-time Environment */}
        <Card>
          <CardHeader>
            <CardTitle>Build-time Environment</CardTitle>
            <CardDescription>Environment variables available during build (import.meta.env)</CardDescription>
          </CardHeader>
          <CardContent>
            {typeof import.meta !== 'undefined' && import.meta.env ? (
              <div className="space-y-2">
                {Object.entries(import.meta.env)
                  .filter(([key]) => key.startsWith('VITE_'))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1 border-b">
                      <span className="font-medium">{key}:</span>
                      <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') 
                          ? typeof value === 'string' ? `${value.substring(0, 12)}...` : 'undefined'
                          : typeof value === 'string' ? value : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-yellow-600 dark:text-yellow-400">
                No build-time environment variables available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Console Output</CardTitle>
            <CardDescription>Console output from debugEnvironment() function</CardDescription>
          </CardHeader>
          <CardContent>
            {debugInfo ? (
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-96">
                {debugInfo.join('\n')}
              </pre>
            ) : (
              <div>No debug info available</div>
            )}
          </CardContent>
        </Card>

        {/* Global Debug Function */}
        <Card>
          <CardHeader>
            <CardTitle>Global Debug Functions</CardTitle>
            <CardDescription>Run debug functions directly in the browser console</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Try running these commands in your browser console:</p>
              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded font-mono">
                <div>• window.debugRuntimeConfig()</div>
                <div>• window.RUNTIME_CONFIG</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 