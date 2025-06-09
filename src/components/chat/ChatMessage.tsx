import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types';
import { Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const isUserMessage = message.role === 'user';
  const isSystem = message.role === 'system';
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messageReady, setMessageReady] = useState(false);
  
  // Preload theme status before first render
  useEffect(() => {
    // Check if document has dark mode class immediately
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    
    // Set a very short timeout to ensure theme is applied before showing message
    const timer = setTimeout(() => {
      setMessageReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    // Initial check
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Set up an observer to detect theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Don't display system messages
  if (isSystem) return null;
  
  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    
    // Format: "Today, 10:30 AM" or "May 15, 10:30 AM"
    if (isToday) {
      return `Today, ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return messageDate.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  };
  
  // Handle copy message content
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Get the appropriate bubble style based on message role and theme
  const getBubbleStyle = () => {
    if (isUserMessage) {
      // User message is always orange with white text
      return { 
        backgroundColor: '#F37022', 
        color: 'white', 
        borderBottomRightRadius: 0 
      };
    } else {
      // Use CSS variables that change with theme instead of hardcoded colors
      return {
        backgroundColor: 'var(--message-bg)',
        color: 'var(--message-text)',
        borderBottomLeftRadius: 0 
      };
    }
  };
  
  return (
    <div 
      className={`mb-0.5 ${isUserMessage ? 'flex justify-end' : 'flex justify-start'} w-full theme-aware-message ${isLastMessage ? 'mb-2' : ''}`}
      style={{ 
        contain: 'content',
        opacity: messageReady ? 1 : 0, 
        transition: 'opacity 150ms ease-in'
      }}
    >
      <div 
        className={`flex flex-col max-w-[80%] min-w-[100px] ${
          isUserMessage ? "ml-auto mr-4" : "ml-8"
        }`}
      >
        <div 
          className="rounded-lg py-2 px-3 overflow-hidden"
          style={getBubbleStyle()}
          data-user-message={isUserMessage.toString()}
          data-theme-dark={isDarkMode.toString()}
        >
          <div className="max-w-none text-xs md:text-sm break-words leading-tight">
            <ReactMarkdown 
              className="outline-markdown [&>*]:text-xs [&>*]:md:text-sm [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ul]:mb-3 [&>ul:last-child]:mb-0 [&>ul]:list-disc [&>ul]:list-outside [&>ul]:pl-6 [&>ol]:mt-2 [&>ol]:mb-3 [&>ol:last-child]:mb-0 [&>ol]:list-decimal [&>ol]:list-outside [&>ol]:pl-6 [&>li]:ml-2 [&>li]:mb-1 [&>li]:text-xs [&>li]:md:text-sm [&>li]:leading-relaxed [&>strong]:text-xs [&>strong]:md:text-sm [&>strong]:font-semibold [&>em]:text-xs [&>em]:md:text-sm [&>code]:text-xs [&>code]:md:text-sm [&>code]:bg-gray-200 [&>code]:dark:bg-gray-700 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>h1]:text-base [&>h1]:md:text-lg [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-3 [&>h1:first-child]:mt-0 [&>h2]:text-sm [&>h2]:md:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2 [&>h2:first-child]:mt-0 [&>h3]:text-xs [&>h3]:md:text-sm [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-2 [&>h3:first-child]:mt-0 [&>h4]:text-xs [&>h4]:md:text-sm [&>h4]:font-semibold [&>h4]:mt-2 [&>h4]:mb-1 [&>h4:first-child]:mt-0 [&>h5]:text-xs [&>h5]:md:text-sm [&>h5]:font-medium [&>h5]:mt-2 [&>h5]:mb-1 [&>h5:first-child]:mt-0 [&>h6]:text-xs [&>h6]:md:text-sm [&>h6]:font-medium [&>h6]:mt-2 [&>h6]:mb-1 [&>h6:first-child]:mt-0"
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Message timestamp with copy button */}
        <div 
          className={`flex items-center text-xs mt-0.5 ${
            isUserMessage ? 'justify-end mr-1' : 'ml-1'
          } text-gray-500 dark:text-gray-400 message-timestamp ${isLastMessage ? 'mb-1' : ''}`}
        >
          {/* Copy button next to timestamp */}
          <button
            onClick={handleCopyMessage}
            className={`p-1 rounded-md mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors duration-200`}
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          
          {formatTimestamp(message.created_at)}
        </div>
      </div>
    </div>
  );
} 