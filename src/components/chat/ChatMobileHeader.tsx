import React from 'react';
import { cn } from '@/lib/utils';

interface ChatMobileHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export function ChatMobileHeader({ 
  onToggleSidebar,
  title = "Ask JDS" 
}: ChatMobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
      <button
        onClick={() => {
          console.log('Hamburger menu clicked!');
          onToggleSidebar();
        }}
        className={cn(
          "p-2 rounded-md",
          "bg-[#f37022] text-white hover:bg-[#e36012]",
          "flex items-center justify-center",
          "transition-colors duration-200"
        )}
        aria-label="Open sidebar"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
      
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
        {title}
      </h1>
      
      {/* Spacer for alignment */}
      <div className="w-9" />
    </header>
  );
}

export default ChatMobileHeader; 