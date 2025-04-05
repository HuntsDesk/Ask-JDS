import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Loader2, Info } from 'lucide-react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';

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
}

export function ChatInterface({
  threadId,
  messages,
  loading,
  loadingTimeout,
  onSend,
  onRefresh,
  messageCount = 0,
  messageLimit = 10,
  preservedMessage,
  showPaywall,
  onToggleSidebar,
  isSidebarOpen,
  isDesktop,
  isGenerating = false
}: ChatInterfaceProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageTopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState(preservedMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Combine our local submission state with the external isGenerating prop
  const isShowingResponseIndicator = isSubmitting || isGenerating;
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to scroll to the top of the messages
  const scrollToTop = () => {
    if (messageTopRef.current) {
      messageTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
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

  // Get loading message based on loading state
  const getLoadingMessage = () => {
    if (loading) {
      return "Loading messages...";
    }
    return "Ready to chat";
  };

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-gray-900">
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
      
      {/* Message container */}
      <div className={`flex-1 overflow-hidden relative ${!isDesktop ? 'pt-16' : ''}`}>
        <div 
          ref={messagesContainerRef}
          className="h-full w-full message-container overflow-y-auto px-6 sm:px-8 py-4 pb-6"
        >
          {/* Spacer element to ensure messages start below the header */}
          <div ref={messageTopRef} className="h-32 md:h-4"></div>
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center max-w-md text-center p-4">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-gray-700 dark:text-gray-300">Loading messages...</p>
                {loadingTimeout && (
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
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Welcome to Ask JDS</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                Your trusted legal AI research assistant. Whether you're researching a legal question, 
                navigating law school, or exploring complex legal topics, Ask JDS is here to provide 
                clear, reliable, and knowledgeable guidance.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 pb-2 mt-4">
              {messages.map((msg, index) => (
                <ChatMessage 
                  key={msg.id || `temp-${index}`} 
                  message={msg}
                  isLastMessage={index === messages.length - 1}
                />
              ))}
              
              {isShowingResponseIndicator && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ml-8 rounded-bl-none">
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">AI is responding...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messageEndRef} className="h-16 md:h-16" />
            </div>
          )}
          
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
      
      {/* Input container - fixed at the bottom with solid background */}
      <div className="input-container px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto mb-1">
          {sendError && (
            <div className="mb-2 p-2 text-sm rounded bg-red-50 text-red-600">
              {sendError}
            </div>
          )}
          
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
              type="submit"
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
            <div className="mt-2 p-2 rounded bg-amber-50 text-amber-700">
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