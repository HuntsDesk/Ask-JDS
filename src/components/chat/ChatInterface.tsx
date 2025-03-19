import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isDesktop: boolean;
}

export function ChatInterface({
  onToggleSidebar,
  isSidebarOpen,
  isDesktop
}: ChatInterfaceProps) {
  const { id } = useParams();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

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
    if (message.trim() === '' || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Add the user message to the UI
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Clear the input
      setMessage('');
      
      // Show typing indicator
      setIsTyping(true);
      
      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'This is a placeholder response. In a real application, this would come from your AI provider API.',
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSubmitting(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Chat</h1>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </header>
      
      {/* Message container */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full message-container overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Welcome to the Chat</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                Start a conversation by typing a message below.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-[#F37022] text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <div className="flex items-center">
                  <LoadingSpinner className="h-5 w-5 mr-2" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>
      </div>
      
      {/* Input container - fixed at the bottom with solid background */}
      <div className="input-container px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-gray-900 dark:text-gray-100 min-h-[56px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-[#F37022]"
              placeholder="Type your message..."
              rows={1}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="px-4 py-3 bg-[#F37022] text-white rounded-lg hover:bg-[#E36012] min-h-[56px] flex items-center justify-center"
              disabled={isSubmitting || message.trim() === ''}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}