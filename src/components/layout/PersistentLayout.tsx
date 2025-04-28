import { Outlet, useNavigate } from 'react-router-dom';
import { useThreads, useCreateThread, useDeleteThread, useUpdateThread } from '@/hooks/use-query-threads';
import { Sidebar } from '@/components/chat/Sidebar';
import { useAuth } from '@/lib/auth';
import { SidebarContext, SelectedThreadContext } from '@/App';
import { useContext } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import useMediaQuery from '@/hooks/useMediaQuery';

export function PersistentLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Use persisted state for pinning sidebar
  const [isPinned, setIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);

  // Use query-threads hooks
  const threadQuery = useThreads();
  const threads = threadQuery.data || [];
  const createThreadMutation = useCreateThread();
  const updateThreadMutation = useUpdateThread();
  const deleteThreadMutation = useDeleteThread();

  // Handler for creating new chat
  const handleNewChat = async () => {
    try {
      const thread = await createThreadMutation.mutateAsync('New Conversation');
      if (thread) {
        setSelectedThreadId(thread.id);
        navigate(`/chat/${thread.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  // Handler for signing out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Handler for deleting threads
  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThreadMutation.mutateAsync(threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  // Handler for renaming threads
  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await updateThreadMutation.mutateAsync({ id: threadId, title: newTitle });
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  // Handler for thread selection
  const handleSetActiveThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/chat/${threadId}`, { state: { fromSidebar: true } });
  };

  // Handle pin change
  const handlePinChange = (pinned: boolean) => {
    setIsPinned(pinned);
    
    // When pinned, ensure sidebar is expanded
    if (pinned) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile backdrop - only show on mobile when sidebar is expanded */}
      {isExpanded && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Sidebar with proper width handling */}
      <div 
        className={`${
          isExpanded || isDesktop ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDesktop ? 'relative' : 'fixed'
        } ${isDesktop ? (isExpanded ? 'w-64' : 'w-16') : 'w-64'} h-full transition-all duration-300 ease-in-out z-50`}
      >
        <Sidebar
          setActiveTab={handleSetActiveThread}
          isDesktopExpanded={isExpanded}
          onDesktopExpandedChange={setIsExpanded}
          isPinned={isPinned}
          onPinChange={handlePinChange}
          onNewChat={handleNewChat}
          onSignOut={handleSignOut}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          sessions={threads.map(thread => ({
            id: thread.id,
            title: thread.title,
            created_at: thread.created_at
          }))}
          currentSession={selectedThreadId}
        />
      </div>

      {/* Main content area with dynamic padding */}
      <div className={`flex-1 overflow-auto w-full ${isDesktop ? (isExpanded ? 'pl-6' : 'pl-4') : 'pl-0'} transition-all duration-300`} style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default PersistentLayout; 