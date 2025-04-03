import { ReactNode, useContext } from 'react';
import { SidebarContext } from '@/App';
import { cn } from '@/lib/utils';

interface BaseLayoutProps {
  children: ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  const { isExpanded, isMobile } = useContext(SidebarContext);
  const isDesktop = !isMobile;
  
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Children expecting sidebar context and container */}
      {children}
    </div>
  );
} 