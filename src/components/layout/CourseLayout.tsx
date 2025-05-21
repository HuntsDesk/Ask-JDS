import { ReactNode, useEffect } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-threads';

interface CourseLayoutProps {
  children: ReactNode;
  title?: string;
}

export const CourseLayout = ({ children, title }: CourseLayoutProps) => {
  const navigate = useNavigate();
  const params = useParams<{ courseId?: string; moduleId?: string; lessonId?: string }>();
  const { signOut } = useAuth();
  const { threads: originalThreads, createThread } = useThreads();

  // Debug when CourseLayout renders
  useEffect(() => {
    console.log('CourseLayout rendering with params:', params);
    
    return () => {
      console.log('CourseLayout unmounting');
    };
  }, [params]);

  // Define handlers for course context actions
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

  // Navigation handler for sidebar
  const handleSetActiveThread = (threadId: string) => {
    navigate(`/chat/${threadId}`);
  };

  // Configure sidebar props for course context
  const sidebarProps = {
    onNewChat: handleNewChat,
    onSignOut: handleSignOut,
    sessions: originalThreads.map(thread => ({
      id: thread.id,
      title: thread.title,
      created_at: thread.created_at
    })),
    setActiveTab: handleSetActiveThread,
    currentSession: null,
  };

  // Return with SidebarLayout wrapper to maintain the universal sidebar
  return (
    <SidebarLayout sidebarProps={sidebarProps}>
      {children}
    </SidebarLayout>
  );
};

export default CourseLayout; 