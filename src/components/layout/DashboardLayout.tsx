import { ReactNode } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-threads';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { threads: originalThreads, createThread } = useThreads();

  // Define handlers for sidebar actions in the dashboard context
  const handleNewChat = async () => {
    try {
      const thread = await createThread();
      if (thread) {
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

  // Navigation handler that keeps user in the dashboard
  const handleSetActiveThread = (threadId: string) => {
    // In dashboard context, we might want to handle this differently
    // For now, just navigate to the thread
    navigate(`/chat/${threadId}`);
  };

  // Configure sidebar props for dashboard context
  const sidebarProps = {
    onNewChat: handleNewChat,
    onSignOut: handleSignOut,
    sessions: originalThreads.map(thread => ({
      id: thread.id,
      title: thread.title,
      created_at: thread.created_at
    })),
    setActiveTab: handleSetActiveThread,
    // No current session in dashboard context
    currentSession: null,
    // We could add dashboard-specific sidebar props here
  };

  return (
    <SidebarLayout sidebarProps={sidebarProps}>
      <div className="p-6 bg-gray-50 h-full">
        {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
        {children}
      </div>
    </SidebarLayout>
  );
};

export default DashboardLayout; 