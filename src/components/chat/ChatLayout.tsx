import { ReactNode, useContext, useEffect } from 'react';
import { SidebarLayout } from '../layout/SidebarLayout';
import { ChatContainer } from './ChatContainer';
import { useThreads } from '@/hooks/use-threads';
import { useAuth } from '@/lib/auth';
import { SelectedThreadContext } from '@/App';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';

// Simplified ChatLayout now just composes other components
const ChatLayout = ({ 
  children,
  disableAutoNavigation = false 
}: { 
  children?: ReactNode,
  disableAutoNavigation?: boolean
}) => {
  const { user, signOut } = useAuth();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const {
    threads: originalThreads,
    createThread,
    updateThread,
    deleteThread
  } = useThreads();
  
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
  
  // Define handlers for sidebar actions
  const handleNewChat = async () => {
    try {
      const thread = await createThread();
      if (thread) {
        setSelectedThreadId(thread.id);
        navigate(`/chat/${thread.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await updateThread(threadId, { title: newTitle });
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleSetActiveThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  // Simplified props for the sidebar specific to chat functionality
  const sidebarProps = {
    onNewChat: handleNewChat,
    onSignOut: handleSignOut,
    onDeleteThread: handleDeleteThread,
    onRenameThread: handleRenameThread,
    sessions: originalThreads.map(thread => ({
      id: thread.id,
      title: thread.title,
      created_at: thread.created_at
    })),
    currentSession: selectedThreadId,
    setActiveTab: handleSetActiveThread,
  };

  return (
    <SidebarLayout sidebarProps={sidebarProps}>
      {children ? (
        // If children are provided, render them instead of the chat interface
        children
      ) : (
        // Otherwise render the chat container
        <ChatContainer />
      )}
    </SidebarLayout>
  );
};

export { ChatLayout };
export default ChatLayout;