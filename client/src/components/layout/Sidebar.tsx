import React from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Highlighter, 
  FileOutput, 
  BarChart, 
  Settings 
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5" /> },
    { label: 'Document Ingestion', href: '/documents/upload', icon: <Upload className="w-5" /> },
    { label: 'Document Review', href: '/documents', icon: <FileText className="w-5" /> },
    { label: 'Redaction', href: '/redaction', icon: <Highlighter className="w-5" /> },
    { label: 'Export', href: '/export', icon: <FileOutput className="w-5" /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart className="w-5" /> },
    { label: 'Settings', href: '/settings', icon: <Settings className="w-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="font-semibold text-sm uppercase text-neutral-500">Workspace</h2>
        <h3 className="font-medium">Johnson v. Smith Legal Discovery</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-1">
              <Link href={item.href} className={cn(
                  "flex items-center px-3 py-2 rounded-md",
                  location === item.href
                    ? "bg-primary text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}>
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Storage</span>
          <span className="text-neutral-800 font-medium">4.2 GB / 10 GB</span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full mt-2">
          <div className="h-full bg-primary rounded-full" style={{ width: '42%' }}></div>
        </div>
      </div>
    </aside>
  );
}
