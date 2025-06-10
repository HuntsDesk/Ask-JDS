import React, { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import { DebugOverlay } from './DebugOverlay';

export function DebugTrigger() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    // Only show in development
    if (!import.meta.env.DEV) return;

    // Show trigger after a delay to avoid interfering with initial load
    const timer = setTimeout(() => {
      setShowTrigger(true);
    }, 2000);

    // Listen for keyboard shortcuts
    const handleKeyboard = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle debug overlay
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowOverlay(prev => !prev);
      }
      
      // Escape to close overlay
      if (event.key === 'Escape' && showOverlay) {
        event.preventDefault();
        setShowOverlay(false);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [showOverlay]);

  // Don't render anything in production
  if (!import.meta.env.DEV || !showTrigger) return null;

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setShowOverlay(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-40 transition-all duration-200 hover:scale-110"
        title="Open Debug Console (Ctrl/Cmd + Shift + D)"
        style={{ 
          fontFamily: 'system-ui',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* Debug Overlay */}
      <DebugOverlay 
        isOpen={showOverlay} 
        onClose={() => setShowOverlay(false)} 
      />
    </>
  );
} 