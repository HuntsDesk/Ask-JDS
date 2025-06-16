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
  

  
  // Calculate base input height based on device
  const baseInputHeight = useMemo(() => {
    if (inputHeight) return inputHeight;
    return isDesktop ? 64 : 56;
  }, [inputHeight, isDesktop]);
  
  // Simplified layout metrics - only device detection and heights
  const layoutMetrics = useMemo(() => {
    // On mobile with fixed input, messages take full height
    // On desktop, subtract input height from viewport
    const messagesHeight = isMobile 
      ? '100vh' 
      : `calc(100vh - ${baseInputHeight}px)`;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      inputAreaHeight: `${baseInputHeight}px`,
      messagesAreaHeight: messagesHeight
    };
  }, [isDesktop, isTablet, isMobile, baseInputHeight]);
  
  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(layoutMetrics);
  }, [layoutMetrics, onLayoutChange]);
  

  
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
          // Padding: mobile gets all sides, tablet/desktop gets no bottom padding
          isMobile ? "p-3" : "pt-4 px-4 pb-0",
          "pt-16 md:pt-4", // Account for mobile header
          // Better mobile scrolling
          "touch-pan-y overscroll-contain",
          TRANSITIONS.default
        )}
        style={{
          // Height calculation: mobile uses input offset, tablet/desktop uses minimal constraint
          height: isMobile
            ? 'calc(100vh - var(--chat-input-offset, 80px))'
            : 'calc(100vh - 120px)', // Fixed reasonable constraint for tablet/desktop
          // iOS momentum scrolling
          WebkitOverflowScrolling: 'touch',
          // Constrain scrollbar positioning on mobile
          ...(isMobile && {
            position: 'relative',
            contain: 'layout style paint',
          }),
        }}
      >
        <div 
          className={cn(
            // Minimal bottom padding to ensure last message timestamp is visible
            isMobile && "pb-1" // Minimal padding to prevent excessive white space
          )}
        >
          {children}
        </div>
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
          // Mobile: fixed positioning
          isMobile && "fixed bottom-0 left-0 right-0 z-50",
          // Desktop: relative positioning
          !isMobile && "relative",
          TRANSITIONS.default
        )}
        style={{
          // Mobile safe area support
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined,
        }}
      >
        <div className="p-2 md:p-3">
          <div className="max-w-4xl mx-auto">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatLayoutContainer; 