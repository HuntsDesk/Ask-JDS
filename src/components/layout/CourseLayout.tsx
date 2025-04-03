import { ReactNode } from 'react';
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

  // Define handlers for sidebar actions in the course context
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

  // Navigation handler that keeps user in the course context
  const handleSetActiveThread = (threadId: string) => {
    // In course context, we might want to handle this differently
    // For now, just navigate to the thread
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
    // No current session in course context
    currentSession: null,
    // We could add course-specific sidebar props here
  };

  return (
    <SidebarLayout sidebarProps={sidebarProps}>
      <div className="p-6">
        {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
        {children}
      </div>
    </SidebarLayout>
  );
};

export default CourseLayout; 