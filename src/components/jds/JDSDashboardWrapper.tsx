import JDSDashboard from '@/pages/Dashboard';
import { useEffect } from 'react';

export function JDSDashboardWrapper() {
  // Use an effect to inject CSS to override the Dashboard's background
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      .space-y-6.bg-white, .space-y-6.dark\\:bg-gray-900 {
        background-color: transparent !important;
      }
    `;
    
    // Add it to the document head
    document.head.appendChild(style);
    
    // Clean up when the component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <JDSDashboard />
    </div>
  );
}

export default JDSDashboardWrapper; 