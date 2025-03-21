import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
  className?: string;
}

export function ChatMessage({ message, isLastMessage, className }: ChatMessageProps) {
  const isUserMessage = message.role === 'user';
  const isSystem = message.role === 'system';
  
  // Don't display system messages
  if (isSystem) return null;
  
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
          className={cn(
            `rounded-lg overflow-hidden`,
            isUserMessage 
              ? 'bg-[#F37022] text-white rounded-br-none' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none',
            className || 'p-3'
          )}
        >
          <div className="prose dark:prose-invert max-w-none text-sm md:text-base break-words">
            <ReactMarkdown 
              className="[&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mt-4 [&>ul]:mb-4 [&>ul:last-child]:mb-0 [&>ul]:list-disc [&>ul]:list-outside [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:list-outside [&>ol]:pl-6 [&>li]:ml-2"
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
} 