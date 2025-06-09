import React, { useRef, useEffect, useMemo } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { BREAKPOINTS, TRANSITIONS } from '@/constants/layout';

export interface LayoutMetrics {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  inputAreaHeight: string;
  messagesAreaHeight: string;
}

export interface ChatLayoutContainerProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onLayoutChange?: (metrics: LayoutMetrics) => void;
  inputHeight?: number;
}

export function ChatLayoutContainer({
  children,
  footer,
  className,
  scrollContainerRef,
  onLayoutChange,
  inputHeight
}: ChatLayoutContainerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobile}px)`);
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet}px)`);
  
  // Track keyboard height for mobile
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  
  // Calculate base input height based on device
  const baseInputHeight = useMemo(() => {
    if (inputHeight) return inputHeight;
    return isDesktop ? 64 : 56;
  }, [inputHeight, isDesktop]);
  
  // Simplified layout metrics - only device detection and heights
  const layoutMetrics = useMemo(() => {
    const totalInputHeight = baseInputHeight + keyboardHeight;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      inputAreaHeight: `${totalInputHeight}px`,
      messagesAreaHeight: `calc(100vh - ${totalInputHeight}px)`
    };
  }, [isDesktop, isTablet, isMobile, baseInputHeight, keyboardHeight]);
  
  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(layoutMetrics);
  }, [layoutMetrics, onLayoutChange]);
  
  // Handle visual viewport changes (virtual keyboard on mobile)
  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        setKeyboardHeight(Math.max(0, keyboardHeight));
      }
    };
    
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);
  
  return (
    <div 
      className={cn(
        "relative h-full flex flex-col overflow-hidden",
        // Mobile: Full screen with adjusted padding
        "pl-0 pr-0",
        // Desktop: Account for sidebar
        "md:pl-[var(--sidebar-offset)]",
        "transition-[padding] duration-300 ease-in-out",
        // Add the background color to match flashcards/study
        "bg-gray-50 dark:bg-gray-900",
        className
      )}
    >
      {/* Messages Area */}
      <div 
        role="region"
        aria-label="Chat messages"
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto",
          "p-3 md:p-4",
          "pt-16 md:pt-4", // Account for mobile header
          TRANSITIONS.default
        )}
        style={{
          // Only keep height for smooth scrolling
          height: layoutMetrics.messagesAreaHeight,
          // Mobile: account for fixed input area padding
          paddingBottom: isMobile ? `${baseInputHeight + 16}px` : 0,
        }}
      >
        {children}
      </div>
      
      {/* Input Area */}
      <div 
        role="region"
        aria-label="Message input"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "border-t border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-gray-950",
          TRANSITIONS.default
        )}
        style={{
          // Mobile safe area support
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined,
        }}
      >
        <div className="p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatLayoutContainer; 