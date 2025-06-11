import React from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';

/**
 * Example component showing how to use Usermaven analytics tracking
 * This demonstrates different ways to track user interactions and events
 */
export const ExampleTrackingComponent: React.FC = () => {
  const { trackEvent, trackConversion } = useAnalytics();
  
  // Example of tracking a simple button click
  const handleButtonClick = () => {
    trackEvent('button_click', {
      button_name: 'example_button',
      page: 'example_page'
    });
    
    // Do something after tracking...
    console.log('Button clicked and event tracked');
  };
  
  // Example of tracking a form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    trackEvent('form_submit', {
      form_name: 'example_form',
      page: 'example_page'
    });
    
    // Process form...
    console.log('Form submitted and event tracked');
  };
  
  // Example of tracking a conversion (e.g., signup)
  const handleSignup = () => {
    trackConversion('signup', {
      signup_method: 'email',
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'direct'
    });
    
    // Complete signup process...
    console.log('Signup completed and conversion tracked');
  };
  
  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold">Usermaven Analytics Examples</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Track Button Click</h3>
          <Button onClick={handleButtonClick}>
            Click to Track Event
          </Button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Track Form Submission</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input 
                type="text" 
                id="name" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            <Button type="submit">
              Submit Form
            </Button>
          </form>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Track Conversion</h3>
          <Button variant="outline" onClick={handleSignup}>
            Sign Up (Track Conversion)
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p>
          Check the network tab in your browser's developer tools to see the tracking
          requests being sent to Usermaven.
        </p>
      </div>
    </div>
  );
}; 