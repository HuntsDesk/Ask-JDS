import React, { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Activity, CheckCircle, XCircle } from 'lucide-react';

export function UsermavenDebug() {
  const { trackEvent, initialized } = useAnalytics();
  const [eventsSent, setEventsSent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Track page view on component mount
  useEffect(() => {
    if (initialized) {
      try {
        const eventName = 'debug_page_view';
        const data = { page: 'usermaven_debug' };
        
        // Log the tracking call for debugging
        console.log('Sending Usermaven page view:', { eventName, data });
        
        // Track the event using our analytics hook
        trackEvent(eventName, data);
        
        // Add to our local list of sent events
        setEventsSent(prev => [...prev, `${eventName}: ${JSON.stringify(data)}`]);
      } catch (err) {
        setError(`Failed to send page view: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Usermaven tracking error:', err);
      }
    }
  }, [initialized, trackEvent]);

  // Handle a test event button click
  const handleTestEvent = () => {
    if (!initialized) {
      setError('Usermaven not initialized');
      return;
    }

    try {
      const eventName = 'debug_test_event';
      const data = { 
        button: 'test_button', 
        timestamp: new Date().toISOString(),
        random_id: Math.random().toString(36).substring(2, 10)
      };
      
      // Log the tracking call for debugging
      console.log('Sending Usermaven test event:', { eventName, data });
      
      // Track the event using our analytics hook
      trackEvent(eventName, data);
      
      // Add to our local list of sent events
      setEventsSent(prev => [...prev, `${eventName}: ${JSON.stringify(data)}`]);
    } catch (err) {
      setError(`Failed to send test event: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Usermaven tracking error:', err);
    }
  };

  const clearEvents = () => {
    setEventsSent([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Usermaven Analytics Debug</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status & Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Initialization Status:</div>
              <div className="flex items-center gap-1">
                {initialized ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${initialized ? 'text-green-600' : 'text-red-600'}`}>
                  {initialized ? 'Initialized' : 'Not Initialized'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Configuration:</div>
              <div className="text-xs bg-muted p-2 rounded">
                <div>Tracking Host: {import.meta.env.VITE_USERMAVEN_TRACKING_HOST || 'Not configured'}</div>
                <div>Key: {import.meta.env.VITE_USERMAVEN_KEY ? `${import.meta.env.VITE_USERMAVEN_KEY.substring(0, 8)}...` : 'Not configured'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleTestEvent} 
                disabled={!initialized}
                className="w-full"
              >
                Send Test Event
              </Button>
              <Button 
                onClick={clearEvents} 
                variant="outline"
                className="w-full"
              >
                Clear Event Log
              </Button>
            </div>

            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsSent.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {eventsSent.map((event, index) => (
                  <div 
                    key={index} 
                    className="text-xs p-2 bg-muted rounded font-mono"
                  >
                    {event}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No events sent yet. Click "Send Test Event" to start.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p className="font-medium">To verify events are being sent:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Network tab</li>
              <li>Filter for "a.jdsimplified.com" or your tracking domain</li>
              <li>Click "Send Test Event" button above</li>
              <li>Check for network requests to the tracking domain</li>
              <li>Look for successful HTTP 200 responses</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm">
                <strong>Note:</strong> Events should appear in your Usermaven dashboard within a few minutes. 
                Real-time tracking verification requires checking network requests in DevTools.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 