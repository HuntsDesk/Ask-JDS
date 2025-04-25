import React, { ReactNode, useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, Sidebar, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-threads';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '@/components/ui/tooltip';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { SelectedThreadContext } from '@/App';
import { usePersistedState } from '@/hooks/use-persisted-state';

interface PersistentLayoutProps {
  children: ReactNode;
}

export function PersistentLayout({ children }: PersistentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { threads, createThread, updateThread, deleteThread } = useThreads();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);

  // State for sidebar expansion and pinning with persistence
  const [isPersistentlyExpanded, setIsPersistentlyExpanded] = usePersistedState<boolean>('sidebar-is-expanded', true);
  const [isPersistentlyPinned, setIsPersistentlyPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);

  // Thread editing state
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Handle thread operations
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
      if (threadId === selectedThreadId) {
        setSelectedThreadId(null);
        if (location.pathname.includes(`/chat/${threadId}`)) {
          navigate('/chat');
        }
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await updateThread(threadId, { title: newTitle });
      setEditingThread(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleStartEdit = (threadId: string, currentTitle: string) => {
    setEditingThread(threadId);
    setEditTitle(currentTitle);
  };

  const handleFinishEdit = (threadId: string) => {
    if (editTitle.trim() !== '') {
      handleRenameThread(threadId, editTitle.trim());
    } else {
      setEditingThread(null);
      setEditTitle('');
    }
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate(`/chat/${threadId}`);
  };

  const handleNavLinkClick = (href: string) => {
    navigate(href);
  };

  // Group threads by date
  const groupedSessions = threads.reduce((acc, thread) => {
    const date = new Date(thread.created_at);
    let group;

    if (isToday(date)) {
      group = 'Today';
    } else if (isYesterday(date)) {
      group = 'Yesterday';
    } else if (isThisWeek(date)) {
      group = 'This Week';
    } else if (isThisMonth(date)) {
      group = 'This Month';
    } else {
      group = 'Older';
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(thread);
    return acc;
  }, {} as Record<string, typeof threads>);

  // Sort entries by date priority
  const sortedSessionEntries = Object.entries(groupedSessions)
    .sort(([a], [b]) => {
      const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
      return order.indexOf(a) - order.indexOf(b);
    });

  // Navigate to thread in URL if available
  const threadIdFromUrl = location.pathname.match(/\/chat\/([^/]+)/)?.[1];
  
  // Update selected thread ID when URL changes
  useEffect(() => {
    if (threadIdFromUrl && threadIdFromUrl !== selectedThreadId) {
      setSelectedThreadId(threadIdFromUrl);
    }
  }, [threadIdFromUrl, selectedThreadId, setSelectedThreadId]);

  // Define navigation items
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

  // Store persisted state
  useEffect(() => {
    // Remove direct localStorage calls as usePersistedState already handles this
  }, [isPersistentlyPinned]);

  useEffect(() => {
    // Remove direct localStorage calls as usePersistedState already handles this
  }, [isPersistentlyExpanded]);

  return (
    <SidebarProvider defaultOpen={isPersistentlyExpanded} defaultPinned={isPersistentlyPinned}>
      <div className="flex h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <SidebarContent 
          threads={threads}
          editingThread={editingThread}
          editTitle={editTitle}
          threadIdFromUrl={threadIdFromUrl}
          navigationItems={navigationItems}
          sortedSessionEntries={sortedSessionEntries}
          onNewChat={handleNewChat}
          onSignOut={handleSignOut}
          onDeleteThread={handleDeleteThread}
          onStartEdit={handleStartEdit}
          onFinishEdit={handleFinishEdit}
          onThreadClick={handleThreadClick}
          onNavLinkClick={handleNavLinkClick}
          onPinChange={setIsPersistentlyPinned}
          onOpenChange={setIsPersistentlyExpanded}
          selectedThreadId={selectedThreadId}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300" style={{ zIndex: 1 }}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Separate component for the sidebar content to keep the main component clean
function SidebarContent({
  threads,
  editingThread,
  editTitle,
  threadIdFromUrl,
  navigationItems,
  sortedSessionEntries,
  onNewChat,
  onSignOut,
  onDeleteThread,
  onStartEdit,
  onFinishEdit,
  onThreadClick,
  onNavLinkClick,
  onPinChange,
  onOpenChange,
  selectedThreadId
}: {
  threads: any[];
  editingThread: string | null;
  editTitle: string;
  threadIdFromUrl: string | undefined;
  navigationItems: any[];
  sortedSessionEntries: [string, any[]][];
  onNewChat: () => void;
  onSignOut: () => void;
  onDeleteThread: (id: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onFinishEdit: (id: string) => void;
  onThreadClick: (id: string) => void;
  onNavLinkClick: (href: string) => void;
  onPinChange: (pinned: boolean) => void;
  onOpenChange: (open: boolean) => void;
  selectedThreadId: string | null;
}) {
  const { open, setOpen, isPinned, setPinned } = useSidebar();
  const isMobile = useIsMobile();

  // Update the parent component's state
  useEffect(() => {
    onPinChange(isPinned);
  }, [isPinned, onPinChange]);

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  // Toggle pin status with event handler
  const togglePin = () => {
    const newPinValue = !isPinned;
    setPinned(newPinValue);
    
    // Ensure the persisted state is updated
    onPinChange(newPinValue);
    
    // When pinning, ensure sidebar is open
    if (newPinValue && !open) {
      setOpen(true);
      onOpenChange(true);
    }
    
    // When unpinning, we don't automatically collapse the sidebar
    // This preserves the user's current expanded state
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r dark:border-gray-700 flex flex-col h-screen"
      mobileTrigger={
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
      }
    >
      {/* Logo */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className={cn(
          "flex items-center justify-center py-4",
          open ? "px-4" : "px-2"
        )}>
          {/* Close button for mobile */}
          {isMobile && open && (
            <button 
              onClick={() => setOpen(false)}
              className="absolute right-2 p-2.5 rounded-md text-muted-foreground hover:bg-muted dark:hover:bg-gray-700 bg-background/80 dark:bg-gray-800/80"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {open ? (
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

      {/* New Chat Button + Pin */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <button
          onClick={onNewChat}
          className={cn(
            "flex font-medium items-center gap-2 px-4 py-2 w-full",
            "rounded-lg bg-[#f37022] text-white hover:bg-[#e36012] transition",
            open ? "justify-start" : "justify-center px-2 mx-auto"
          )}
        >
          <PlusCircle className="h-4 w-4" />
          <span 
            className={cn(
              "transition-all duration-300",
              open ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
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
                  !open && "hidden",
                  "dark:hover:bg-gray-700",
                  isPinned && "text-[#F37022]",
                  !isPinned && "dark:text-gray-300 dark:hover:text-gray-400"
                )}
              >
                {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="right" className="bg-gray-900 text-white border-0 dark:border-gray-700" style={{ zIndex: 99999 }}>
                {isPinned ? "Unpin sidebar" : "Pin sidebar open"}
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-gray-800 w-full max-w-full [&_[data-radix-scroll-area-viewport]]:block" style={{ minWidth: 0 }}>
        <div className="space-y-4 px-3 py-2 w-full max-w-full">
          {sortedSessionEntries.map(([date, dateSessions]) => (
            <div key={date} className="space-y-1 mb-2">
              {open && (
                <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400 px-3 py-2 mb-1">
                  {date}
                </h3>
              )}
              {dateSessions.map((session) => (
                <ContextMenu key={session.id}>
                  <ContextMenuTrigger>
                    {editingThread === session.id ? (
                      <div className="px-3 py-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => onStartEdit(session.id, e.target.value)}
                          onBlur={() => onFinishEdit(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onFinishEdit(session.id);
                            } else if (e.key === 'Escape') {
                              onStartEdit(session.id, session.title);
                            }
                          }}
                          autoFocus
                          className="dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    ) :
                      <button
                        onClick={() => onThreadClick(session.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-lg overflow-hidden transition-colors",
                          open ? "px-3 py-2 text-left" : "p-2 justify-center",
                          (selectedThreadId === session.id) ? 
                            "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" : 
                            "hover:bg-muted/50 dark:hover:bg-gray-700/50 dark:text-gray-200"
                        )}
                        title={open ? session.title : ""}
                      >
                        <MessageSquare 
                          className={cn(
                            "w-4 h-4 shrink-0",
                            (selectedThreadId === session.id) && "text-[#F37022] dark:text-orange-300"
                          )} 
                        />
                        {open ? (
                          <span className={cn(
                            "truncate flex-1 min-w-0 text-left",
                            (selectedThreadId === session.id) 
                              ? "font-medium text-orange-600 dark:text-orange-300" 
                              : "text-gray-800 dark:text-gray-200"
                          )}>
                            {session.title}
                          </span>
                        ) : null}
                        {open && (selectedThreadId === session.id) && (
                          <ChevronRight className="w-4 h-4 shrink-0 text-[#F37022] dark:text-orange-300 ml-auto" />
                        )}
                      </button>
                    }
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-52 dark:bg-gray-800 dark:border-gray-700">
                    <ContextMenuItem 
                      className="gap-2 dark:text-white dark:hover:bg-gray-700" 
                      onClick={() => onStartEdit(session.id, session.title)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Rename</span>
                    </ContextMenuItem>
                    <ContextMenuItem 
                      className="gap-2 text-red-500 dark:text-red-400 dark:hover:bg-gray-700 focus:text-red-500 dark:focus:text-red-400" 
                      onClick={() => onDeleteThread(session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Navigation Links and Sign Out */}
      <div className="sticky bottom-0 z-30 bg-white dark:bg-gray-800 p-3 border-t dark:border-gray-700 space-y-2 mt-auto">
        {navigationItems.map((item) => (
          <Button
            key={item.name}
            variant={item.current ? "default" : "ghost"}
            className={cn(
              "w-full flex items-center gap-2 transition-all",
              open ? "justify-start px-4" : "justify-center px-0",
              item.current && "bg-[#F37022] hover:bg-[#E36012]",
              !item.current && "dark:text-gray-200 dark:hover:bg-gray-700"
            )}
            onClick={() => onNavLinkClick(item.href)}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className={cn(
              "transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0 absolute overflow-hidden w-0"
            )}>{item.name}</span>
          </Button>
        ))}
        <Button
          onClick={onSignOut}
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-2 transition-all",
            open ? "justify-start px-4" : "justify-center px-0",
            "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(
            "transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0 absolute overflow-hidden w-0"
          )}>Sign out</span>
        </Button>
      </div>
    </Sidebar>
  );
} 