import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Settings, Menu, User } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  onSearch: (term: string) => void;
  searchTerm: string;
}

export function Header({ toggleSidebar, onSearch, searchTerm }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [searchValue, setSearchValue] = useState(searchTerm);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleAdvancedSearch = () => {
    // In a real app, this would open an advanced search modal
    console.log('Advanced search clicked');
  };

  return (
    <header className="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="mr-4 text-neutral-500 hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-primary">Relativity Clone</h1>
          <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded">v1.0</span>
        </div>
      </div>
      
      <div className="flex-1 px-8">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search documents..."
            className="w-full py-1.5 pl-10 pr-12"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-primary"
            onClick={handleAdvancedSearch}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-neutral-600 hover:text-primary"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
