import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Loader2, Info } from 'lucide-react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import PageContainer from '@/components/layout/PageContainer';

interface ChatInterfaceProps {
  threadId: string | null;
  messages: Message[];
  loading: boolean;
  loadingTimeout?: boolean;
  onSend: (content: string) => Promise<Message | null>;
  onRefresh: () => void;
  messageCount?: number;
  messageLimit?: number;
  preservedMessage?: string;
  showPaywall: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  isDesktop: boolean;
  isGenerating?: boolean;
  onClosePaywall?: () => void;
}

export function ChatInterface({
  threadId,
  messages = [],
  loading = false,
  loadingTimeout = false,
  onSend,
  onRefresh,
  messageCount = 0,
  messageLimit = 10,
  preservedMessage,
  showPaywall,
  onToggleSidebar,
  isSidebarOpen,
  isDesktop,
  isGenerating = false,
  onClosePaywall = () => {}
}: ChatInterfaceProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageTopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousThreadIdRef = useRef<string | null>(null);
  const [message, setMessage] = useState(preservedMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGeneratingStatus, setShowGeneratingStatus] = useState<boolean>(true);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);

  // Combine our local submission state with the external isGenerating prop
  const isShowingResponseIndicator = isSubmitting || isGenerating;
  
  // Determine if we've been loading for too long - show retry button
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowRetryButton(false);
    }
  }, [loading]);
  
  // Scroll to bottom helper function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };
  
  // Scroll to bottom when messages change or during AI response generation
  useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      scrollToBottom();
    }
  }, [messages, isGenerating]);
  
  // Additional scroll listener to ensure we stay at the bottom during generation
  useEffect(() => {
    if (isGenerating) {
      // Set up an interval to keep scrolling to bottom during generation
      const scrollInterval = setInterval(() => {
        scrollToBottom('auto');
      }, 500);
      
      return () => clearInterval(scrollInterval);
    }
  }, [isGenerating]);
  
  // Scroll to bottom when the user sends a message (after handleSubmit)
  useEffect(() => {
    if (isSubmitting) {
      scrollToBottom('auto');
    }
  }, [isSubmitting]);
  
  // Handle initial load and thread switching
  useEffect(() => {
    // If thread ID changes, scroll to bottom
    if (threadId && threadId !== previousThreadIdRef.current) {
      // Use a slight delay to ensure the messages are rendered
      const timeoutId = setTimeout(() => {
        if (messages.length > 0 && !loading) {
          // Use 'auto' for thread switching to avoid animation
          scrollToBottom('auto');
        }
      }, 100);
      
      // Update the previous thread ID
      previousThreadIdRef.current = threadId;
      
      // Clean up timeout
      return () => clearTimeout(timeoutId);
    }
  }, [threadId, messages.length, loading]);
  
  // Additional scroll to bottom on initial content load
  useEffect(() => {
    // Trigger when loading changes from true to false
    if (!loading && messages.length > 0) {
      // Use a slight delay to ensure the messages are rendered
      const timeoutId = setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, messages.length]);

  // Additional effect to force a render update when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Force a re-render by updating a DOM element
      const container = messagesContainerRef.current;
      if (container) {
        // Trigger layout recalculation to force render
        container.style.display = 'none';
        // Use requestAnimationFrame to ensure the style change is processed
        requestAnimationFrame(() => {
          if (container) {
            container.style.display = '';
            scrollToBottom('auto');
          }
        });
      }
    }
  }, [messages.length, loading]);

  // Track scrolling to show/hide scroll to top button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (container.scrollTop > 300) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Update message input when preservedMessage changes
  useEffect(() => {
    if (preservedMessage) {
      setMessage(preservedMessage);
    }
  }, [preservedMessage]);

  // Reset textarea when thread changes
  useEffect(() => {
    if (threadId !== previousThreadIdRef.current) {
      setMessage('');
      previousThreadIdRef.current = threadId;
      
      // Auto-focus the textarea when a new thread is created
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100); // Small delay to ensure the DOM is ready
      }
    }
  }, [threadId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (message.trim() === '' || isSubmitting || loading || !threadId) return;
    
    setSendError(null);
    setIsSubmitting(true);
    
    // Store message content in a variable
    const messageContent = message.trim();
    
    // Clear the input field immediately
    setMessage('');
    
    // Focus back on the textarea immediately
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
    
    try {
      // Send message
      await onSend(messageContent);
      // No need to clear message here as it's already cleared
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError("An error occurred. Please try again.");
      
      // If sending fails, restore the message for the user to try again
      setMessage(messageContent);
    } finally {
      // Complete our local submission state - isGenerating will still be true if AI is generating
      setIsSubmitting(false);
    }
  };
  
  // Calculate remaining messages
  const remainingMessages = Math.max(0, messageLimit - messageCount);
  const isNearLimit = remainingMessages <= 3 && remainingMessages > 0;

  // Render loading state with more helpful info
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

  // Render empty state (no messages) with better styling
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

  // Render messages with proper handling for empty states and loading
  const renderMessages = () => {
    // Only show loading state on initial load when no messages exist
    if (loading && messages.length === 0) {
      return renderLoadingState();
    }
    
    if (messages.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="flex flex-col space-y-2 pb-0 mt-2">
        {messages.map((msg, index) => (
          <div key={`${msg.id || index}-${msg.created_at || Date.now()}`} className="message-wrapper">
            <ChatMessage 
              key={msg.id || `temp-${index}`} 
              message={msg}
              isLastMessage={index === messages.length - 1}
            />
          </div>
        ))}
        
        {/* Always show the AI response indicator when generating or the loading spinner when refreshing existing messages */}
        {(isShowingResponseIndicator || (loading && messages.length > 0)) && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ml-8 rounded-bl-none">
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">AI is responding...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>
    );
  };

  // Function to scroll to the top of the messages
  const scrollToTop = () => {
    if (messageTopRef.current) {
      messageTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Welcome state - no thread selected
  if (threadId === null) {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Welcome to AskJDS</h1>
          <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
            Ask any law school or bar exam related questions. Start a new chat to begin the conversation.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen chat-interface-root">
      {/* Only show header on mobile */}
      {!isDesktop && (
        <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
          <button
            onClick={() => {
              console.log('Hamburger menu clicked!');
              onToggleSidebar();
            }}
            className="p-2 rounded-md bg-[#f37022] text-white hover:bg-[#e36012] flex items-center justify-center"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Ask JDS</h1>
          <div className="w-9"></div> {/* Spacer for alignment */}
        </header>
      )}
      
      {/* Main content area - messages */}
      <div className={`chat-messages-area flex-1 ${!isDesktop ? 'pt-16' : ''}`}>
        <div 
          ref={messagesContainerRef}
          className="chat-messages-scroll h-full w-full overflow-y-auto px-2 sm:px-4 py-2"
        >
          {/* Spacer element to ensure messages start below the header */}
          <div ref={messageTopRef} className="h-6 md:h-4"></div>
          
          {renderMessages()}
          
          {/* Scroll to top button - only visible on mobile when scrolled */}
          {!isDesktop && isScrolled && messages.length > 0 && (
            <button
              onClick={scrollToTop}
              className="fixed top-[70px] right-3 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
              aria-label="Scroll to top"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Input container - at the bottom with auto height */}
      <div className="input-container px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto mb-1">
          {sendError && (
            <div className="mb-2 p-2 text-sm rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {sendError}
            </div>
          )}
          
          <form 
            className="flex items-end gap-2" 
            onSubmit={(e) => { 
              e.preventDefault(); 
              handleSubmit(); 
              return false; // Explicitly return false to ensure no form submission
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100 min-h-[56px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-[#F37022]"
              placeholder="Type your message..."
              rows={1}
              disabled={isSubmitting || isGenerating || loading || !threadId}
            />
            <button
              type="button" // Change from submit to button type
              onClick={handleSubmit}
              className="px-4 py-3 bg-[#F37022] text-white rounded-lg hover:bg-[#E36012] min-h-[56px] flex items-center justify-center"
              disabled={isSubmitting || isGenerating || loading || message.trim() === '' || !threadId}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </form>
          
          {isNearLimit && (
            <div className="mt-2 p-2 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <p className="text-sm flex items-center">
                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                You have {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} left before hitting your daily limit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}