import { ReactNode, useContext, useState, useEffect } from 'react';
import { SidebarContext } from '@/App';
import { Sidebar } from '../chat/Sidebar';
import useMediaQuery from '@/hooks/useMediaQuery';
import { usePersistedState } from '@/hooks/use-persisted-state';

// Define the props that can be passed to the sidebar
interface SidebarProps {
  onNewChat?: () => void;
  onSignOut?: () => void;
  onDeleteThread?: (threadId: string) => void;
  onRenameThread?: (threadId: string, newTitle: string) => void;
  sessions?: Array<{ id: string; title: string; created_at: string }>;
  currentSession?: string | null;
  setActiveTab?: (threadId: string) => void;
}

interface SidebarLayoutProps {
  children: ReactNode;
  sidebarProps?: SidebarProps;
}

export const SidebarLayout = ({ children, sidebarProps = {} }: SidebarLayoutProps) => {
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Use persisted state for isPinned to keep it consistent across pages
  const [isPinned, setIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);
  
  // For desktop: calculate the sidebar width based on expanded state
  const sidebarWidth = isDesktop ? (isExpanded ? 'w-64' : 'w-16') : 'w-64';
  
  // Calculate the main content padding/margin based on sidebar state
  const contentPadding = isDesktop ? 
    (isExpanded ? 'pl-6' : 'pl-4') : 
    'pl-0';
  
  // Handle pin change
  const handlePinChange = (pinned: boolean) => {
    setIsPinned(pinned);
    
    // When pinned, ensure sidebar is expanded
    if (pinned) {
      setIsExpanded(true);
    }
  };
  
  // Add/remove sidebar-visible class on body when sidebar is expanded on mobile
  useEffect(() => {
    if (!isDesktop) {
      if (isExpanded) {
        document.body.classList.add('sidebar-visible');
      } else {
        document.body.classList.remove('sidebar-visible');
      }
    }
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('sidebar-visible');
    };
  }, [isExpanded, isDesktop]);
  
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile backdrop - only show on mobile when sidebar is expanded */}
      {isExpanded && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => {
            console.log('[DEBUG] Backdrop clicked, closing sidebar');
            setIsExpanded(false);
          }}
        />
      )}
      
      {/* Sidebar with proper width handling */}
      <div 
        className={`${
          isExpanded || isDesktop ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDesktop ? 'relative' : 'fixed'
        } ${sidebarWidth} h-full transition-all duration-300 ease-in-out z-50 sidebar-container ${
          !isExpanded ? 'sidebar-hidden-mobile' : ''
        }`}
      >
        <Sidebar
          setActiveTab={sidebarProps.setActiveTab}
          isDesktopExpanded={isExpanded}
          onDesktopExpandedChange={setIsExpanded}
          isPinned={isPinned}
          onPinChange={handlePinChange}
          onNewChat={sidebarProps.onNewChat}
          onSignOut={sidebarProps.onSignOut}
          onDeleteThread={sidebarProps.onDeleteThread}
          onRenameThread={sidebarProps.onRenameThread}
          sessions={sidebarProps.sessions || []}
          currentSession={sidebarProps.currentSession}
        />
      </div>

      {/* Main content area with dynamic padding */}
      <div className={`flex-1 overflow-auto w-full ${contentPadding} transition-all duration-300`} style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout; 