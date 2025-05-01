import { useState, useEffect } from 'react';
import { useLayoutState } from '@/hooks/useLayoutState';

/**
 * Layout debugger component that displays current layout state
 * Can be toggled with Alt+D keyboard shortcut
 */
export function LayoutDebugger() {
  const { isDesktop, isPinned, isExpanded, contentPadding, contentMargin } = useLayoutState();
  const [isVisible, setIsVisible] = useState(false);
  
  // Toggle visibility with Alt+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-md z-50 shadow-lg text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Layout Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-sm"
        >
          Close
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <span>Desktop:</span><span>{isDesktop ? '✅' : '❌'}</span>
        <span>Pinned:</span><span>{isPinned ? '✅' : '❌'}</span>
        <span>Expanded:</span><span>{isExpanded ? '✅' : '❌'}</span>
        <span>Padding:</span><span>{contentPadding}</span>
        <span>Margin:</span><span>{contentMargin}</span>
        <span>Viewport:</span><span>{window.innerWidth}×{window.innerHeight}</span>
      </div>
      <div className="mt-3 text-xs opacity-70">Press Alt+D to toggle</div>
    </div>
  );
} 