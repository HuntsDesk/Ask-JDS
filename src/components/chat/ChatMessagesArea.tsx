import React, { useRef } from 'react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';

interface ChatMessagesAreaProps {
  messages: Message[];
  loading: boolean;
  showRetryButton?: boolean;
  isGenerating?: boolean;
  onRefresh: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  threadId?: string | null;
}

export function ChatMessagesArea({
  messages = [],
  loading = false,
  showRetryButton = false,
  isGenerating = false,
  onRefresh,
  scrollContainerRef,
  threadId
}: ChatMessagesAreaProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageTopRef = useRef<HTMLDivElement>(null);
  
  // More robust scroll to bottom function
  const scrollToBottom = React.useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
    if (scrollContainerRef?.current) {
      // Use scrollTop for immediate positioning
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else if (messageEndRef.current) {
      // Fallback to scrollIntoView
      messageEndRef.current.scrollIntoView({ behavior });
    }
  }, [scrollContainerRef]);
  
  // Scroll to bottom when messages first load or when new messages arrive
  React.useEffect(() => {
    if (messages.length > 0) {
      // Use immediate scroll for better UX
      scrollToBottom('auto');
    }
  }, [messages.length, scrollToBottom]);
  
  // Ensure immediate scroll to bottom when component mounts with messages
  React.useEffect(() => {
    if (messages.length > 0) {
      // Multiple scroll attempts to ensure it works on mobile
      scrollToBottom('auto');
      
      // Additional scrolls with slight delays for mobile reliability
      const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
      const timer2 = setTimeout(() => scrollToBottom('auto'), 150);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []); // Only run on mount
  
  // Auto-scroll during generation
  React.useEffect(() => {
    if (isGenerating) {
      const scrollInterval = setInterval(() => {
        scrollToBottom('auto');
      }, 500);
      
      return () => clearInterval(scrollInterval);
    }
  }, [isGenerating, scrollToBottom]);
  
  const renderLoadingState = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center max-w-md text-center p-4">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading messages...</p>
          {showRetryButton && (
            <div className="mt-4">
              <p className="mb-2 text-gray-600 dark:text-gray-400">
                This is taking longer than expected. You can try refreshing.
              </p>
              <Button onClick={onRefresh} variant="outline">
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Welcome to Ask JDS</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          Ask any law school or bar exam related questions. Start a new chat to begin the conversation.
        </p>
      </div>
    );
  };
  
  // Show loading state for existing threads while messages are loading
  if (loading && messages.length === 0 && threadId) {
    return renderLoadingState();
  }
  
  // Show empty state only for new conversations (no threadId) or when not loading
  if (messages.length === 0 && !loading) {
    return renderEmptyState();
  }
  
  // Don't render anything if we have a threadId but no messages and not loading
  // This prevents the flash of empty state when switching between existing threads
  if (messages.length === 0 && threadId && !loading) {
    return <div className="flex flex-col h-full" />;
  }
  
  return (
    <div 
      role="log"
      aria-label="Chat conversation"
      aria-live="polite"
      aria-relevant="additions"
      className="flex flex-col h-full overflow-y-auto"
      style={{
        // Ensure the container is immediately visible and scrollable
        minHeight: '100%',
        display: 'flex'
      }}
    >
      <div ref={messageTopRef} />
      
      <div className="flex flex-col space-y-0.5 pb-0 mt-2 md:mb-0 mb-2">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="message-wrapper py-0"
          >
            <ChatMessage 
              message={msg}
              isLastMessage={msg === messages[messages.length - 1]}
            />
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ml-8 rounded-bl-none">
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">AI is responding...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div ref={messageEndRef} />
    </div>
  );
}

export default ChatMessagesArea; 