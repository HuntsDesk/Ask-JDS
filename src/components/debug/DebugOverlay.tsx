import React, { useState, useEffect } from 'react';
import { X, Settings, Bug, Database, Wifi, User, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { debugLogger, type LogLevel, type LogContext } from '@/lib/debug-logger';
import { getEnvironmentConfig } from '@/lib/env-utils';

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugOverlay({ isOpen, onClose }: DebugOverlayProps) {
  const { user, session, loading, isAuthResolved } = useAuth();
  const [logStats, setLogStats] = useState(debugLogger.getStats());
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLogStats(debugLogger.getStats());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    // Check realtime connection status
    const checkRealtimeStatus = () => {
      // This is a simplified check - you might want to implement actual realtime status checking
      setRealtimeStatus('connected'); // Placeholder
    };
    
    if (isOpen) {
      checkRealtimeStatus();
    }
  }, [isOpen]);

  const handleLogLevelChange = (level: LogLevel) => {
    debugLogger.setLogLevel(level);
    setLogStats(debugLogger.getStats());
  };

  const handleContextToggle = (context: LogContext) => {
    debugLogger.toggleContext(context);
    setLogStats(debugLogger.getStats());
  };

  const clearLogs = () => {
    debugLogger.clearHistory();
    setLogStats(debugLogger.getStats());
  };

  if (!isOpen) return null;

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const envConfig = getEnvironmentConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Debug Console</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Environment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-sm">Environment</h3>
              </div>
              <div className="space-y-1 text-xs">
                <div>Mode: <span className="font-mono">{envConfig.isDevelopment ? 'Development' : 'Production'}</span></div>
                <div>Domain: <span className="font-mono">{envConfig.buildDomain}</span></div>
                <div>Hostname: <span className="font-mono">{window.location.hostname}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-sm">Auth Status</h3>
              </div>
              <div className="space-y-1 text-xs">
                <div>Resolved: <span className={`font-mono ${isAuthResolved ? 'text-green-600' : 'text-red-600'}`}>{isAuthResolved.toString()}</span></div>
                <div>Loading: <span className={`font-mono ${loading ? 'text-yellow-600' : 'text-green-600'}`}>{loading.toString()}</span></div>
                <div>User ID: <span className="font-mono">{user?.id ? user.id.slice(0, 8) + '...' : 'null'}</span></div>
                <div>Session: <span className={`font-mono ${session ? 'text-green-600' : 'text-red-600'}`}>{session ? 'Active' : 'None'}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-gray-600" />
                <h3 className="font-semibold text-sm">Connections</h3>
              </div>
              <div className="space-y-1 text-xs">
                <div>Realtime: <span className={`font-mono ${realtimeStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>{realtimeStatus}</span></div>
                <div>Network: <span className={`font-mono ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>{navigator.onLine ? 'Online' : 'Offline'}</span></div>
              </div>
            </div>
          </div>

          {/* Logging Controls */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold">Logging Controls</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Log Level</label>
                <div className="flex gap-2 flex-wrap">
                  {(['debug', 'info', 'warn', 'error', 'none'] as LogLevel[]).map(level => (
                    <Button
                      key={level}
                      variant={logStats.currentLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleLogLevelChange(level)}
                      className="text-xs"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contexts</label>
                <div className="flex gap-2 flex-wrap">
                  {(['auth', 'realtime', 'subscription', 'fsm', 'ui', 'api', 'performance'] as LogContext[]).map(context => (
                    <Button
                      key={context}
                      variant={logStats.enabledContexts.includes(context) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleContextToggle(context)}
                      className="text-xs"
                    >
                      {context}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total logs: {logStats.totalEntries} | Recent errors: {logStats.recentErrors.length}
              </div>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>
          </div>

          {/* Log Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold">Log Statistics</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(logStats.byLevel).map(([level, count]) => (
                <div key={level} className="text-center">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-gray-600 capitalize">{level}</div>
                </div>
              ))}
            </div>

            {logStats.recentErrors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Recent Errors</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {logStats.recentErrors.map((error, index) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded border">
                      <div className="font-mono text-red-800">{error.message}</div>
                      <div className="text-gray-600 mt-1">{error.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.setItem('forceSubscription', 'true');
                  window.location.reload();
                }}
              >
                Force Subscription: ON
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.setItem('forceSubscription', 'false');
                  window.location.reload();
                }}
              >
                Force Subscription: OFF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('forceSubscription');
                  window.location.reload();
                }}
              >
                Reset Subscription
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 