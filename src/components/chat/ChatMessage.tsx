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
  
  // Check for dark mode on mount and when theme changes
  useEffect(() => {
    // Initial check
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
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
      // Assistant message changes based on theme
      return isDarkMode
        ? { 
            backgroundColor: 'rgb(55, 65, 81)', // dark gray (bg-gray-800)
            color: 'rgb(229, 231, 235)',        // light gray (text-gray-200)
            borderBottomLeftRadius: 0 
          }
        : { 
            backgroundColor: 'rgb(243, 244, 246)', // light gray (bg-gray-100)
            color: 'rgb(31, 41, 55)',              // dark gray (text-gray-800)
            borderBottomLeftRadius: 0 
          };
    }
  };
  
  return (
    <div 
      className={`mb-4 ${isUserMessage ? 'flex justify-end' : 'flex justify-start'} w-full`}
      style={{ contain: 'content' }}
    >
      <div 
        className={`flex flex-col max-w-[80%] min-w-[100px] ${
          isUserMessage ? "ml-auto mr-4" : "ml-8"
        }`}
      >
        <div 
          className="rounded-lg p-3 overflow-hidden"
          style={getBubbleStyle()}
          data-user-message={isUserMessage.toString()}
          data-theme-dark={isDarkMode.toString()}
        >
          <div className="prose dark:prose-invert max-w-none text-sm md:text-base break-words">
            <ReactMarkdown 
              className="[&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mt-4 [&>ul]:mb-4 [&>ul:last-child]:mb-0 [&>ul]:list-disc [&>ul]:list-outside [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:list-outside [&>ol]:pl-6 [&>li]:ml-2"
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Message timestamp with copy button */}
        <div 
          className={`flex items-center text-xs mt-1 ${
            isUserMessage ? 'justify-end mr-1' : 'ml-1'
          } text-gray-500 dark:text-gray-400`}
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