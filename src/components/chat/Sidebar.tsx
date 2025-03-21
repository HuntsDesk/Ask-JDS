import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  LogOut, 
  Trash2, 
  MessageSquare,
  Shield,
  PlusCircle,
  Pencil,
  Settings,
  BookOpen,
  Pin,
  PinOff,
  Menu,
  X
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { useContext } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useTheme } from '@/lib/theme-provider';

interface SidebarProps {
  setActiveTab: (tab: string) => void;
  isDesktopExpanded: boolean;
  onDesktopExpandedChange: (expanded: boolean) => void;
  isPinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  onNewChat: () => void;
  onSignOut: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  sessions: {
    id: string;
    title: string;
    created_at: string;
  }[];
  currentSession: string | null;
}

interface GroupedSessions {
  [key: string]: Array<{ id: string; title: string; created_at: string }>;
}

export function Sidebar({
  setActiveTab,
  isDesktopExpanded,
  onDesktopExpandedChange,
  isPinned: isPinnedProp,
  onPinChange,
  onNewChat,
  onSignOut,
  onDeleteThread,
  onRenameThread,
  sessions,
  currentSession,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const { theme } = useTheme();

  // Use a constant for z-index
  const sidebarZIndex = 50;

  // Replace regular state with persisted state - renamed to avoid collision with prop
  const [localIsPinned, setLocalIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);
  
  // Use the prop value if provided, otherwise use local state
  const effectiveIsPinned = isPinnedProp !== undefined ? isPinnedProp : localIsPinned;

  // Check current active section based on URL
  const isInChat = location.pathname.startsWith('/chat');
  const isInFlashcards = location.pathname.startsWith('/flashcards');
  const isInSettings = location.pathname.startsWith('/settings');
  
  // Check if we're in a specific chat thread by examining the URL or currentSession
  const isInChatThread = isInChat && (currentSession !== null || location.pathname.length > 5);

  // Sync local expanded state with props
  useEffect(() => {
    if (isDesktopExpanded !== isExpanded) {
      setIsExpanded(isDesktopExpanded);
    }
  }, [isDesktopExpanded, setIsExpanded]);

  // Sync global expanded state with local props
  useEffect(() => {
    if (isExpanded !== isDesktopExpanded) {
      onDesktopExpandedChange(isExpanded);
    }
  }, [isExpanded, onDesktopExpandedChange, isDesktopExpanded]);

  // Ensure expanded state when pinned, and sync pin state across instances
  useEffect(() => {
    // When the component mounts, apply the persisted pin state
    if (localIsPinned) {
      onDesktopExpandedChange(true);
      setIsExpanded(true);
      // Call the prop callback if provided to sync parent components
      if (onPinChange) {
        onPinChange(localIsPinned);
      }
    }
  }, []);

  // Monitor prop changes to sync with local state
  useEffect(() => {
    if (isPinnedProp !== undefined && isPinnedProp !== localIsPinned) {
      setLocalIsPinned(isPinnedProp);
    }
  }, [isPinnedProp, localIsPinned]);

  // Check for mobile and tablet on mount and window resize
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1024);
      
      // Add class to body for easier CSS targeting
      if (width >= 768 && width <= 1024) {
        document.body.classList.add('is-tablet-device');
      } else {
        document.body.classList.remove('is-tablet-device');
      }
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Add a ref to track recently toggled pin state
  const recentlyToggledPinRef = useRef(false);
  
  const togglePin = () => {
    const newPinState = !effectiveIsPinned;
    console.log('Toggling pin state to:', newPinState);
    
    // Update local persisted state
    setLocalIsPinned(newPinState);
    
    // Set the recently toggled flag
    recentlyToggledPinRef.current = true;
    
    // Clear the flag after a short delay to prevent mouse events from immediately triggering
    setTimeout(() => {
      recentlyToggledPinRef.current = false;
    }, 300);
    
    // Call the prop callback if provided
    if (onPinChange) {
      onPinChange(newPinState);
    }
    
    // Always ensure expanded state matches pin state
    setIsExpanded(newPinState);
    onDesktopExpandedChange(newPinState);
  };

  // Sync expanded states
  useEffect(() => {
    if (!isMobile) {
      setIsExpanded(isDesktopExpanded);
    }
  }, [isDesktopExpanded, isMobile]);

  const handleMouseEnter = useCallback(() => {
    // Don't trigger if pin was recently toggled
    if (recentlyToggledPinRef.current) return;
    
    if (!isMobile && !effectiveIsPinned) {
      console.log('Expanding sidebar on hover');
      onDesktopExpandedChange(true);
      setIsExpanded(true);
    }
  }, [isMobile, effectiveIsPinned, onDesktopExpandedChange, setIsExpanded]);

  const handleMouseLeave = useCallback(() => {
    // Don't trigger if pin was recently toggled
    if (recentlyToggledPinRef.current) return;
    
    if (!isMobile && !effectiveIsPinned) {
      console.log('Collapsing sidebar on leave');
      onDesktopExpandedChange(false);
      setIsExpanded(false);
    }
  }, [isMobile, effectiveIsPinned, onDesktopExpandedChange, setIsExpanded]);

  const handleStartEdit = (threadId: string, currentTitle: string) => {
    setEditingThread(threadId);
    setEditTitle(currentTitle);
  };

  const handleFinishEdit = async (threadId: string) => {
    if (editTitle.trim()) {
      await onRenameThread(threadId, editTitle.trim());
    }
    setEditingThread(null);
    setEditTitle('');
  };

  const groupSessionsByDate = useCallback((sessions: Array<{ id: string; title: string; created_at: string }>) => {
    console.log("Computing grouped sessions"); // Debug log to verify memoization
    const grouped: GroupedSessions = {};
    
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      let key = '';
      
      const isSessionToday = isToday(date);
      const isSessionYesterday = isYesterday(date);
      const isSessionThisWeek = isThisWeek(date);
      
      // Debug log to check date categorization
      console.log(`Session "${session.title}" (${date.toLocaleDateString()}): isToday=${isSessionToday}, isYesterday=${isSessionYesterday}, isThisWeek=${isSessionThisWeek}`);
      
      if (isSessionToday) {
        key = 'Today';
      } else if (isSessionYesterday) {
        key = 'Yesterday';
      } else if (isSessionThisWeek) {
        // This is in the current week, but not today or yesterday
        key = 'This Week';
      } else {
        // Not in the current week, group by month and year
        key = format(date, 'MMMM yyyy');
      }
      
      console.log(`→ Grouped under: ${key}`);
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(session);
    });
    
    // Sort sessions within each group by created_at in descending order
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    return grouped;
  }, []);

  // Memoize the grouped sessions to prevent unnecessary recalculations
  const groupedSessions = useMemo(() => 
    groupSessionsByDate(sessions), 
    [groupSessionsByDate, sessions]
  );

  // Memoize the sorted entries to prevent recalculation on every render
  const sortedSessionEntries = useMemo(() => {
    return Object.entries(groupedSessions)
      .sort((a, b) => {
        // Custom sort order for date groups
        const order = ['Today', 'Yesterday', 'This Week'];
        const aIndex = order.indexOf(a[0]);
        const bIndex = order.indexOf(b[0]);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // For month entries (format: "Month Year"), sort by date (newest first)
        // Parse "Month Year" format
        try {
          // Use Date.parse with the first day of the month for comparison
          const aDate = new Date(Date.parse(`1 ${a[0]}`));
          const bDate = new Date(Date.parse(`1 ${b[0]}`));
          
          // Sort in descending order (newest first)
          return bDate.getTime() - aDate.getTime();
        } catch (err) {
          console.error('Error parsing month dates:', err);
          return 0;
        }
      });
  }, [groupedSessions]);

  const handleDelete = async (threadId: string) => {
    try {
      console.log('Sidebar: handleDelete called with thread ID:', threadId);
      
      // If this is the currently selected thread, we need to navigate away first
      if (threadId === selectedThreadId || threadId === currentSession) {
        // Find a different thread to navigate to
        const otherThread = sessions.find(s => s.id !== threadId);
        
        if (otherThread) {
          console.log('Sidebar: Navigating to alternative thread:', otherThread.id);
          setSelectedThreadId(otherThread.id);
          setActiveTab(otherThread.id);
          navigate(`/chat/${otherThread.id}`);
        } else {
          console.log('Sidebar: No alternative thread found, navigating to /chat');
          setSelectedThreadId(null);
          navigate('/chat');
        }
      }
      
      // Call the deletion function provided by the parent component
      // This already has optimistic updates in the useThreads hook
      await onDeleteThread(threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  // Use the selectedThreadId from context with higher priority than currentSession prop
  useEffect(() => {
    // If selectedThreadId is set and different from currentSession,
    // log the mismatch for debugging
    if (selectedThreadId && currentSession && selectedThreadId !== currentSession) {
      console.log('Sidebar: Thread selection mismatch - Context:', selectedThreadId, 'Props:', currentSession);
    }
  }, [selectedThreadId, currentSession]);

  // Modify the handleThreadClick function to close the sidebar on mobile after clicking
  const handleThreadClick = (threadId: string) => {
    console.log('Clicked on thread:', threadId);
    
    // Set current thread ID context
    setSelectedThreadId(threadId);
    
    // Set the active tab for parent component
    setActiveTab(threadId);
    
    // Handle navigation
    // Use immediate navigation without setTimeout to avoid race conditions
    navigate(`/chat/${threadId}`);
    
    // If on mobile, collapse the sidebar
    if (isMobile) {
      onDesktopExpandedChange(false);
      setIsExpanded(false);
    }
  };

  // Create a new function to handle navigation link clicks
  const handleNavLinkClick = () => {
    // If on mobile, collapse the sidebar after navigation
    if (isMobile) {
      onDesktopExpandedChange(false);
      setIsExpanded(false);
    }
  };

  // Toggle sidebar on mobile
  const toggleMobileSidebar = useCallback(() => {
    if (isMobile) {
      onDesktopExpandedChange(!isDesktopExpanded);
      setIsExpanded(!isDesktopExpanded);
    }
  }, [isMobile, isDesktopExpanded, onDesktopExpandedChange, setIsExpanded]);

  // Check if we're on the settings page
  const isSettingsPage = location.pathname.startsWith('/settings');

  return (
    <div
      className={`sidebar-container ${
        isExpanded ? 'expanded' : 'collapsed'
      } h-full border-r border-border flex flex-col py-2 px-0 bg-card`}
      style={{ zIndex: sidebarZIndex }}
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
      {/* Header with logo and expand/collapse button */}
      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center text-[#F37022] font-bold text-xl">
          {isExpanded ? (
            <div className="flex items-center gap-2">
              <Shield size={20} /> 
              <span>AskJDS</span>
            </div>
          ) : (
            <Shield size={20} />
          )}
        </div>
        {isExpanded && !isMobile && (
          <button
            onClick={togglePin}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title={effectiveIsPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {effectiveIsPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        )}
      </div>

      {/* Sidebar content - wrap in sidebar-inner div */}
      <div className="sidebar-inner">
        {/* New chat button */}
        <div className="px-3 my-2">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center rounded-md px-3 py-2 text-sm bg-[#F37022] hover:bg-[#E36012] text-white ${
              isExpanded ? 'justify-start' : 'justify-center'
            }`}
          >
            <PlusCircle size={isExpanded ? 16 : 20} />
            {isExpanded && <span className="ml-2">New Chat</span>}
          </button>
        </div>

        {/* Tabs for chat history */}
        <ScrollArea className="flex-1 px-3 my-2">
          {/* Sessions grouped by time */}
          {Object.entries(groupedSessions).length > 0 ? (
            Object.entries(sortedSessionEntries).map(([key, sessions]) => (
              <div key={key} className="mb-4">
                <h3 className={`text-xs text-muted-foreground uppercase font-medium mb-2 ${isExpanded ? 'block' : 'sr-only'}`}>
                  {key}
                </h3>
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <ContextMenu key={session.id} onOpenChange={setIsContextMenuOpen}>
                      <ContextMenuTrigger asChild>
                        <button
                          className={`w-full flex items-center rounded-md px-3 py-2 text-sm hover:bg-secondary ${
                            currentSession === session.id ? 'bg-secondary text-accent-foreground' : 'transparent'
                          } ${isExpanded ? 'justify-start' : 'justify-center'} overflow-hidden`}
                          onClick={() => setActiveTab(session.id)}
                        >
                          <MessageSquare size={isExpanded ? 16 : 20} className="flex-shrink-0" />
                          {isExpanded ? (
                            editingThread === session.id ? (
                              <Input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleFinishEdit(session.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingThread(null);
                                  }
                                }}
                                className="ml-2 text-sm h-6 flex-1"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            ) : (
                              <span className="ml-2 truncate flex-1 text-left">{session.title}</span>
                            )
                          ) : null}
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuItem onClick={() => handleStartEdit(session.id, session.title)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onDeleteThread(session.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              {isExpanded ? 'No conversations yet.' : ''}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer navigation */}
      <div className="mt-auto px-3 border-t border-border pt-2">
        <div className="space-y-1">
          <Link
            to="/flashcards"
            className={`w-full flex items-center rounded-md px-3 py-2 text-sm hover:bg-secondary ${
              isInFlashcards ? 'bg-secondary text-accent-foreground' : 'transparent'
            } ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <BookOpen size={isExpanded ? 16 : 20} />
            {isExpanded && <span className="ml-2">Flashcards</span>}
          </Link>
          <Link
            to="/settings"
            className={`w-full flex items-center rounded-md px-3 py-2 text-sm hover:bg-secondary ${
              isInSettings ? 'bg-secondary text-accent-foreground' : 'transparent'
            } ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <Settings size={isExpanded ? 16 : 20} />
            {isExpanded && <span className="ml-2">Settings</span>}
          </Link>
          <button
            onClick={onSignOut}
            className={`w-full flex items-center rounded-md px-3 py-2 text-sm hover:bg-secondary text-red-500 ${
              isExpanded ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut size={isExpanded ? 16 : 20} />
            {isExpanded && <span className="ml-2">Log Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}