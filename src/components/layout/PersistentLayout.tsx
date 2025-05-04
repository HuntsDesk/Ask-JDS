import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useThreads, useCreateThread, useDeleteThread, useUpdateThread } from '@/hooks/use-query-threads';
import { Sidebar } from '@/components/chat/Sidebar';
import { useAuth } from '@/lib/auth';
import { SidebarContext, SelectedThreadContext } from '@/App';
import { useContext, useEffect } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useLastVisitedPage } from '@/hooks/use-last-visited-page';

export function PersistentLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Use direct persisted state for sidebar pinning
  const [isPinned, setIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);
  
  // Use our custom hook to track the last visited page
  useLastVisitedPage();

  const threadQuery = useThreads();
  const threads = threadQuery.data || [];
  const createThreadMutation = useCreateThread();
  const updateThreadMutation = useUpdateThread();
  const deleteThreadMutation = useDeleteThread();

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
      await deleteThreadMutation.mutateAsync(threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await updateThreadMutation.mutateAsync({ id: threadId, title: newTitle });
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleSetActiveThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/chat/${threadId}`, { state: { fromSidebar: true } });
  };

  const handlePinChange = (pinned: boolean) => {
    setIsPinned(pinned);
    if (pinned) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {isExpanded && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsExpanded(false)}
        />
      )}

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

      <div className="flex-1 overflow-auto w-full h-full" style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default PersistentLayout;