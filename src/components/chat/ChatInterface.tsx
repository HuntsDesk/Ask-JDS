import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  setFocusInputRef?: (focusFn: () => void) => void;
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
  onClosePaywall = () => {},
  setFocusInputRef
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
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowRetryButton(false);
    }
  }, [loading]);
  
  const focusTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    if (setFocusInputRef) {
      setFocusInputRef(focusTextarea);
    }
  }, [setFocusInputRef, focusTextarea]);
  
  useEffect(() => {
    if (threadId && threadId !== previousThreadIdRef.current) {
      setTimeout(() => {
        focusTextarea();
      }, 100);
    }
  }, [threadId, focusTextarea]);
  
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };
  
  useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      scrollToBottom();
    }
  }, [messages, isGenerating]);
  
  useEffect(() => {
    if (isGenerating) {
      const scrollInterval = setInterval(() => {
        scrollToBottom('auto');
      }, 500);
      
      return () => clearInterval(scrollInterval);
    }
  }, [isGenerating]);
  
  useEffect(() => {
    if (isSubmitting) {
      scrollToBottom('auto');
    }
  }, [isSubmitting]);
  
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 300);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  useEffect(() => {
    if (preservedMessage) {
      setMessage(preservedMessage);
    }
  }, [preservedMessage]);
  
  useEffect(() => {
    if (threadId !== previousThreadIdRef.current) {
      setMessage('');
      previousThreadIdRef.current = threadId;
    }
  }, [threadId]);
  
  const isShowingResponseIndicator = isGenerating;
  
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
  
  const handleSubmit = async () => {
    if (message.trim() === '' || isSubmitting || loading || !threadId) return;
    
    setSendError(null);
    setIsSubmitting(true);
    
    const messageContent = message.trim();
    setMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    try {
      await onSend(messageContent);
      
    } catch (error) {
      console.error('Error calling onSend:', error);
      setSendError("An error occurred while initiating send. Please try again.");
      setMessage(messageContent);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };
  
  const renderMessages = () => {
    if (loading && messages.length === 0) {
      return renderLoadingState();
    }
    
    if (messages.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="flex flex-col space-y-1 pb-0 mt-2 md:mb-1 mb-4">
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
        
        <div ref={messageEndRef} />
      </div>
    );
  };
  
  const scrollToTop = () => {
    if (messageTopRef.current) {
      messageTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <div className="w-9"></div>
        </header>
      )}
      
      <div className={`chat-messages-area flex-1 ${!isDesktop ? 'pt-16' : ''}`}>
        <div 
          ref={messagesContainerRef}
          className="chat-messages-scroll h-full w-full overflow-y-auto px-2 sm:px-4 py-2 pb-0"
        >
          <div ref={messageTopRef} className="mt-2 md:mt-4"></div>
          
          {renderMessages()}
          
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
      
      <div className="input-container px-4 py-1 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto mb-0">
          {sendError && (
            <div className="mb-1 p-2 text-sm rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {sendError}
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100 min-h-[48px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-[#F37022]"
              placeholder="Type your message..."
              rows={1}
              disabled={loading || !threadId}
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2.5 bg-[#F37022] text-white rounded-lg hover:bg-[#E36012] h-12 flex items-center justify-center"
              disabled={isSubmitting || isGenerating || loading || message.trim() === '' || !threadId}
            >
              {isSubmitting || isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}