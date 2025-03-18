import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ 
  children, 
  text, 
  position = 'top' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      // Calculate position based on the children's bounding rect
      switch (position) {
        case 'top':
          top = rect.top - 8; // Position above with a small gap
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8; // Position below with a small gap
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8; // Position to the left with a small gap
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8; // Position to the right with a small gap
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const getPositionStyles = () => {
    const base = { 
      transform: 'translate(-50%, -100%)',
      pointerEvents: 'none' as const,
    };

    switch (position) {
      case 'top':
        return { ...base, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { ...base, transform: 'translate(-50%, 0%)' };
      case 'left':
        return { ...base, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { ...base, transform: 'translate(0%, -50%)' };
      default:
        return base;
    }
  };

  return (
    <>
      <div 
        ref={childRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && document.body && ReactDOM.createPortal(
        <div 
          className="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-sm whitespace-nowrap"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            ...getPositionStyles()
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
} 