import { ReactNode, useEffect } from 'react';
import { ChatContainer } from './ChatContainer';
import { useTheme } from '@/lib/theme-provider';

// Simplified ChatLayout now just handles theme and renders the chat container or children
const ChatLayout = ({ 
  children,
  disableAutoNavigation = false 
}: { 
  children?: ReactNode,
  disableAutoNavigation?: boolean
}) => {
  const { theme } = useTheme();
  
  // Ensure dark mode class is applied at layout level
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <>
      {children ? (
        // If children are provided, render them
        children
      ) : (
        // Otherwise render the chat container
        <ChatContainer />
      )}
    </>
  );
};

export { ChatLayout };
export default ChatLayout;