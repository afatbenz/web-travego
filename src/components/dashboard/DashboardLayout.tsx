import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col min-w-0 ml-16 lg:ml-72 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 2xl:p-12 overflow-x-auto">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};