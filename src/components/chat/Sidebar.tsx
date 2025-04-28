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
  X,
  Library
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '@/components/ui/tooltip';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useTheme } from '@/lib/theme-provider';
import { useDomain } from '@/lib/domain-context';

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
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { theme } = useTheme();
  const { isJDSimplified } = useDomain();

  // Replace regular state with persisted state - renamed to avoid collision with prop
  const [localIsPinned, setIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);
  
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

  // Ensure expanded state when pinned
  useEffect(() => {
    if (effectiveIsPinned && !isDesktopExpanded) {
      onDesktopExpandedChange(true);
    }
  }, [effectiveIsPinned, isDesktopExpanded, onDesktopExpandedChange]);

  // Add a ref to track recently toggled pin state
  const recentlyToggledPinRef = useRef(false);
  
  const togglePin = () => {
    const newPinState = !effectiveIsPinned;
    setIsPinned(newPinState);
    
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

  // Modify the handleNavLinkClick function to ensure proper navigation
  const handleNavLinkClick = useCallback((path: string) => {
    console.log('Sidebar: Navigation link clicked, path:', path);
    
    // Use React Router's navigate function with replace: false
    // This preserves the current sidebar state in the history
    navigate(path, { replace: false, state: { fromSidebar: true } });
    
    // If on mobile, collapse the sidebar after navigation
    if (isMobile) {
      console.log('Sidebar: handleNavLinkClick called on mobile, collapsing sidebar');
      setIsExpanded(false);
      onDesktopExpandedChange(false);
    }
    
    // Prevent default link behavior by returning false
    return false;
  }, [isMobile, onDesktopExpandedChange, setIsExpanded, navigate]);

  // Toggle sidebar on mobile
  const toggleMobileSidebar = useCallback(() => {
    if (isMobile) {
      onDesktopExpandedChange(!isDesktopExpanded);
      setIsExpanded(!isDesktopExpanded);
    }
  }, [isMobile, isDesktopExpanded, onDesktopExpandedChange, setIsExpanded]);

  // Check if we're on the settings page
  const isSettingsPage = location.pathname.startsWith('/settings');

  // Update the navigation items array
  const navigationItems = [
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
      current: location.pathname === '/chat' || location.pathname.startsWith('/chat/'),
    },
    {
      name: 'Flashcards',
      href: '/flashcards',
      icon: Library,
      current: location.pathname.startsWith('/flashcards'),
    },
    {
      name: 'Courses',
      href: '/courses',
      icon: BookOpen,
      current: location.pathname === '/courses' || location.pathname.startsWith('/course/'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Main Sidebar - no redundant mobile burger button */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col bg-background border-r transition-all duration-300 sidebar-transition sidebar-container",
          // Desktop state
          !isMobile && "z-50",
          !isMobile && (isDesktopExpanded ? "w-[var(--sidebar-width)] expanded" : "w-[var(--sidebar-collapsed-width)] collapsed"),
          // Mobile state - directly use isDesktopExpanded from parent
          isMobile && !isDesktopExpanded ? "opacity-0 pointer-events-none w-0 -translate-x-full sidebar-hidden-mobile" : "",
          isMobile && isDesktopExpanded ? "w-[var(--sidebar-width)] shadow-xl expanded z-[60]" : ""
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ overflow: 'hidden' }}
      >
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className={cn(
            "flex items-center justify-center py-4", // Increased padding
            isDesktopExpanded ? "px-4" : "px-2"
          )}>
            {/* Close button for mobile */}
            {isMobile && isDesktopExpanded && (
              <button 
                onClick={() => {
                  console.log('Sidebar: Mobile close button clicked');
                  onDesktopExpandedChange(false);
                  setIsExpanded(false);
                }}
                className="absolute right-2 p-2.5 rounded-md text-muted-foreground hover:bg-muted dark:hover:bg-gray-700 bg-background/80 dark:bg-gray-800/80"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {isDesktopExpanded ? (
              <>
                <img 
                  src="/images/JDSimplified_Logo.png" 
                  alt="JD Simplified Logo" 
                  className="h-10 transition-all dark:hidden" 
                />
                <img 
                  src="/images/JDSimplified_Logo_wht.png" 
                  alt="JD Simplified Logo" 
                  className="h-10 transition-all hidden dark:block" 
                />
              </>
            ) : (
              <img 
                src="/images/JD Simplified Favicon.svg" 
                alt="JDS" 
                className="h-8 transition-all dark:invert" 
              />
            )}
          </div>
        </div>

        <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <button
            onClick={() => {
              console.log('Sidebar: New Chat button clicked');
              onNewChat();
            }}
            className={cn(
              "flex font-medium items-center gap-2 px-3 py-2 w-full",
              "rounded-lg bg-[#f37022] text-white hover:bg-[#e36012] transition",
              // Adjust padding and size based on sidebar width
              isDesktopExpanded 
                ? "justify-start" 
                : "justify-center px-2 mx-auto"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            <span 
              className={cn(
                "transition-all duration-300",
                isDesktopExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
              )}
            >
              New Chat
            </span>
          </button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={togglePin} 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "ml-1",
                    !isDesktopExpanded && "hidden",
                    "dark:hover:bg-gray-700",
                    effectiveIsPinned && "text-[#F37022]",
                    !effectiveIsPinned && "dark:text-gray-300 dark:hover:text-gray-400"
                  )}
                >
                  {effectiveIsPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="right" className="bg-gray-900 text-white border-0 dark:border-gray-700" style={{ zIndex: 99999 }}>
                  {effectiveIsPinned ? "Unpin sidebar" : "Pin sidebar open"}
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </TooltipProvider>
        </div>

        <ScrollArea className="flex-1 overflow-hidden custom-scrollbar bg-white dark:bg-gray-800 [&_[data-radix-scroll-area-viewport]]:block">
          <div className="space-y-4 p-2 w-full max-w-full">
            {sortedSessionEntries.map(([date, dateSessions]) => (
              <div key={date} className="space-y-1">
                {isDesktopExpanded && (
                  <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400 px-3 mb-1">
                    {date}
                  </h3>
                )}
                {dateSessions.map((session) => (
                  <ContextMenu key={session.id} onOpenChange={setIsContextMenuOpen}>
                    <ContextMenuTrigger>
                      {editingThread === session.id ? (
                        <div className="px-3 py-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleFinishEdit(session.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFinishEdit(session.id);
                              } else if (e.key === 'Escape') {
                                setEditingThread(null);
                                setEditTitle('');
                              }
                            }}
                            autoFocus
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleThreadClick(session.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-lg nav-item overflow-hidden",
                            isDesktopExpanded ? "px-3 py-2" : "p-2 justify-center",
                            (selectedThreadId === session.id) ? 
                              "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" : 
                              "hover:bg-gray-100 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <MessageSquare 
                            className={cn(
                              "w-4 h-4 shrink-0",
                              (selectedThreadId === session.id) && "text-[#F37022] dark:text-orange-300"
                            )} 
                          />
                          <span className={cn(
                            "truncate min-w-0 flex-1 text-left text-sm",
                            isDesktopExpanded ? "block" : "hidden",
                            (selectedThreadId === session.id) && "font-medium text-[#F37022] dark:text-orange-300"
                          )}>{session.title}</span>
                          {isDesktopExpanded && (selectedThreadId === session.id) && (
                            <ChevronRight className="w-4 h-4 shrink-0 text-[#F37022] dark:text-orange-300" />
                          )}
                        </button>
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                      <ContextMenuItem className="dark:hover:bg-gray-700 dark:text-gray-200" onClick={() => handleStartEdit(session.id, session.title)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem 
                        className="text-destructive dark:text-red-400 dark:hover:bg-gray-700"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-30 bg-white dark:bg-gray-800 p-3 border-t dark:border-gray-700 space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full flex items-center gap-2 transition-all",
                isDesktopExpanded ? "justify-start px-4" : "justify-center px-0",
                item.current && "bg-[#F37022] hover:bg-[#E36012]",
                !item.current && "dark:text-gray-200 dark:hover:bg-gray-700"
              )}
              onClick={() => handleNavLinkClick(item.href)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={cn(
                "transition-opacity duration-300",
                isDesktopExpanded ? "opacity-100" : "opacity-0 absolute overflow-hidden w-0"
              )}>{item.name}</span>
            </Button>
          ))}
          <Button
            onClick={() => {
              onSignOut();
              // Also close sidebar on mobile
              if (isMobile) {
                onDesktopExpandedChange(false);
                setIsExpanded(false);
              }
            }}
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-2 transition-all",
              isDesktopExpanded ? "justify-start px-4" : "justify-center px-0",
              "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(
              "transition-opacity duration-300",
              isDesktopExpanded ? "opacity-100" : "opacity-0 absolute overflow-hidden w-0"
            )}>Sign out</span>
          </Button>
        </div>
      </div>
    </>
  );
}