import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Loader2, Info, Menu } from 'lucide-react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { useIsTablet, useIsMobile } from '@/hooks/useResponsive';

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
  isTablet?: boolean;
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
  isGenerating = false,
  isTablet = false
}: ChatInterfaceProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageTopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState(preservedMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use the responsive hooks directly in the component
  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  
  // Combine our local submission state with the external isGenerating prop
  const isShowingResponseIndicator = isSubmitting || isGenerating;
  
  // Calculate appropriate sizing based on device type
  const textareaMaxHeight = isTabletDevice ? '150px' : (isMobileDevice ? '120px' : '200px');
  const buttonSize = isTabletDevice ? 'sm' : (isMobileDevice ? 'sm' : 'default');
  const messagePadding = isTabletDevice ? 'px-4 py-3' : (isMobileDevice ? 'px-3 py-2' : 'px-6 py-4');
  
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
    
    try {
      // Send message
      await onSend(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError("An error occurred. Please try again.");
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
    <div className="flex flex-col h-screen w-full">
      {/* Chat Header with Hamburger Menu for Mobile/Tablet */}
      <div className="flex items-center justify-between p-3 border-b">
        {(!isDesktop || isTabletDevice) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-2"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold flex-1 truncate">
          {threadId ? 'Chat' : 'New Chat'}
        </h2>
        {messageCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {messageCount}/{messageLimit} messages
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6"
      >
        <div ref={messageTopRef} />
        
        {/* Show loading indicator or messages */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingSpinner size="lg" className="text-primary mb-4" />
            <p className="text-muted-foreground text-center">{getLoadingMessage()}</p>
            {loadingTimeout && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={onRefresh}
              >
                Retry
              </Button>
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-xl font-medium mb-2">
                    Start a conversation with JDS
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Ask a legal question or describe a scenario you'd like help with.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id || `temp-${index}`} 
                    message={msg} 
                    className={messagePadding}
                  />
                ))}
                
                {/* Indicate when we're generating a response */}
                {isShowingResponseIndicator && (
                  <div className="flex items-center text-muted-foreground p-4 animate-pulse">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Generating response...</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        <div ref={messageEndRef} />
        
        {/* Scroll to top button */}
        {isScrolled && (
          <Button
            className="fixed bottom-24 right-4 rounded-full shadow-lg z-10"
            size="icon"
            onClick={scrollToTop}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
          </Button>
        )}
      </div>

      {/* Input Area */}
      <div className={`border-t p-3 md:p-4 ${(isMobileDevice || isTabletDevice) ? 'pb-6' : ''}`}>
        <div className="flex items-end gap-2 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none min-h-[50px] pr-12"
            style={{ maxHeight: textareaMaxHeight }}
            disabled={isSubmitting || showPaywall}
          />
          <Button
            size={buttonSize}
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting || showPaywall}
            className="absolute right-2 bottom-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </Button>
        </div>
        
        {sendError && (
          <div className="text-red-500 mt-2 text-sm flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>{sendError}</span>
          </div>
        )}
      </div>
    </div>
  );
}