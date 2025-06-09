import React, { useRef } from 'react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';

interface ChatMessagesAreaProps {
  messages: Message[];
  loading: boolean;
  loadingTimeout?: boolean;
  showRetryButton?: boolean;
  isGenerating?: boolean;
  onRefresh: () => void;
}

export function ChatMessagesArea({
  messages = [],
  loading = false,
  loadingTimeout = false,
  showRetryButton = false,
  isGenerating = false,
  onRefresh
}: ChatMessagesAreaProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageTopRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);
  
  // Auto-scroll during generation
  React.useEffect(() => {
    if (isGenerating) {
      const scrollInterval = setInterval(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 500);
      
      return () => clearInterval(scrollInterval);
    }
  }, [isGenerating]);
  
  const renderLoadingState = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center max-w-md text-center p-4">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading messages...</p>
          {(loadingTimeout || showRetryButton) && (
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
  
  if (loading && messages.length === 0) {
    return renderLoadingState();
  }
  
  if (messages.length === 0) {
    return renderEmptyState();
  }
  
  return (
    <div 
      role="log"
      aria-label="Chat conversation"
      aria-live="polite"
      aria-relevant="additions"
      className="flex flex-col h-full"
    >
      <div ref={messageTopRef} />
      
      <div className="flex flex-col space-y-1 pb-0 mt-2 md:mb-0 mb-2">
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