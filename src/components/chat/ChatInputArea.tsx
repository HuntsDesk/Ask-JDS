import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface ChatInputAreaProps {
  threadId: string | null;
  onSend: (content: string) => Promise<any>;
  messageCount?: number;
  messageLimit?: number;
  preservedMessage?: string;
  isGenerating?: boolean;
  isLoading?: boolean;
  setFocusInputRef?: (focusFn: () => void) => void;
  isSubscribed?: boolean;
}

export function ChatInputArea({
  threadId,
  onSend,
  messageCount = 0,
  messageLimit = 10,
  preservedMessage,
  isGenerating = false,
  isLoading = false,
  setFocusInputRef,
  isSubscribed = false
}: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState(preservedMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  // Focus management
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
  
  // Focus on thread change
  useEffect(() => {
    if (threadId) {
      setTimeout(focusTextarea, 100);
    }
  }, [threadId, focusTextarea]);
  
  // Update message from preserved
  useEffect(() => {
    if (preservedMessage) {
      setMessage(preservedMessage);
    }
  }, [preservedMessage]);
  
  // Debug subscription status
  useEffect(() => {
    logger.debug('[ChatInputArea] Props received:', {
      isSubscribed,
      messageCount,
      messageLimit,
      showCounter: !isSubscribed && messageCount > 0 && messageLimit > 0
    });
  }, [isSubscribed, messageCount, messageLimit]);
  
  // Clear message on thread change
  useEffect(() => {
    setMessage('');
  }, [threadId]);
  
  const handleSubmit = async () => {
    if (message.trim() === '' || isSubmitting || isLoading || !threadId) return;
    
    setSendError(null);
    setIsSubmitting(true);
    
    const messageContent = message.trim();
    setMessage('');
    
    try {
      await onSend(messageContent);
    } catch (error) {
      logger.error('Error sending message', error as Error);
      setSendError("An error occurred while sending. Please try again.");
      setMessage(messageContent); // Restore message on error
    } finally {
      setIsSubmitting(false);
      setTimeout(focusTextarea, 0);
    }
  };
  
  return (
    <div className="w-full">
      {sendError && (
        <div className="mb-2 p-2 text-sm rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
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
          className={cn(
            "flex-1 resize-none rounded-lg border bg-white dark:bg-gray-800",
            "p-3 text-gray-900 dark:text-gray-100 min-h-[48px] max-h-[200px]",
            "focus:outline-none focus:ring-2 focus:ring-[#F37022]",
            "border-gray-300 dark:border-gray-700"
          )}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading || !threadId}
          aria-label="Type your message"
          aria-describedby={messageCount > 0 ? "message-limit-indicator" : undefined}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className={cn(
            "px-4 py-2.5 rounded-lg h-12 flex items-center justify-center",
            "bg-[#F37022] text-white hover:bg-[#E36012]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200"
          )}
          disabled={isSubmitting || isGenerating || isLoading || message.trim() === '' || !threadId}
          aria-label="Send message"
        >
          {isSubmitting || isGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
      
      {!isSubscribed && messageCount > 0 && messageLimit > 0 && (
        <div id="message-limit-indicator" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {messageCount} / {messageLimit} messages used this month
        </div>
      )}
    </div>
  );
}

export default ChatInputArea; 