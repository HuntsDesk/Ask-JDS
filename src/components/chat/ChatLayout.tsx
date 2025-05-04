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
    
    // Temporarily add a class to prevent theme flashing
    root.classList.add('theme-changing');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
    
    // Remove the temporary class after a short delay
    setTimeout(() => {
      root.classList.remove('theme-changing');
    }, 50);
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