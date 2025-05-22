import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

export function MainLayout({ 
  children, 
  showSearch = true, 
  onSearch = () => {}, 
  searchTerm = '' 
}: MainLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-100 text-neutral-900">
      <Header 
        toggleSidebar={toggleSidebar} 
        onSearch={showSearch ? onSearch : () => {}}
        searchTerm={searchTerm}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar />}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
