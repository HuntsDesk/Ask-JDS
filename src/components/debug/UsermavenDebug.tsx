import React, { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const UsermavenDebug: React.FC = () => {
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
  }, [initialized]); // Removed trackEvent from dependencies to prevent infinite loop

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

  return (
    <Card className="w-full max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Usermaven Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">Status:</div>
            <div className={`text-sm ${initialized ? 'text-green-500' : 'text-red-500'}`}>
              {initialized ? 'Initialized' : 'Not Initialized'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Tracking Host:</div>
            <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {import.meta.env.VITE_USERMAVEN_TRACKING_HOST || 'Not configured'}
            </div>
          </div>

          <Button 
            onClick={handleTestEvent} 
            disabled={!initialized}
            className="w-full"
          >
            Send Test Event
          </Button>

          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {eventsSent.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Events Sent:</div>
              <div className="max-h-40 overflow-y-auto">
                {eventsSent.map((event, index) => (
                  <div 
                    key={index} 
                    className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded mb-1"
                  >
                    {event}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4">
            <p>To verify events are being sent:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Network tab</li>
              <li>Filter for "a.jdsimplified.com"</li>
              <li>Click "Send Test Event" button</li>
              <li>Check for network requests to the tracking domain</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 