import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-900 h-full w-full">
      {title && <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{title}</h1>}
      {children}
    </div>
  );
};

export default DashboardLayout; 