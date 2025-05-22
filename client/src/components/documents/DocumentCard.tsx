import React from 'react';
import { cn, formatFileSize, getFileIcon, getFileIconColor, truncateText, formatDate } from '@/lib/utils';
import { FileText, File, Mail, FilePlus2, FileSpreadsheet } from 'lucide-react';
import type { Document, Tag } from '@shared/schema';

interface DocumentCardProps {
  document: Document;
  tags: Tag[];
  isSelected?: boolean;
  onClick: () => void;
}

export function DocumentCard({ document, tags, isSelected = false, onClick }: DocumentCardProps) {
  // Helper to get appropriate icon based on document type
  const renderIcon = () => {
    const iconType = getFileIcon(document.fileType);
    const iconClass = getFileIconColor(document.fileType);
    
    switch (iconType) {
      case 'file-pdf':
        return <File className={cn("text-lg", iconClass)} />;
      case 'mail':
        return <Mail className={cn("text-lg", iconClass)} />;
      case 'file-word':
        return <FilePlus2 className={cn("text-lg", iconClass)} />;
      case 'file-spreadsheet':
        return <FileSpreadsheet className={cn("text-lg", iconClass)} />;
      default:
        return <FileText className={cn("text-lg", iconClass)} />;
    }
  };

  // Helper to format upload date relative to now
  const getRelativeTime = (date: Date | string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return formatDate(date);
    }
  };

  return (
    <div 
      className={cn(
        "border-b border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer",
        isSelected && "bg-blue-50 border-l-4 border-l-primary",
        !isSelected && "border-l-4 border-l-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">{document.title}</h4>
        <div className="text-xs text-neutral-500">
          {document.uploadedAt ? getRelativeTime(document.uploadedAt) : 'Unknown'}
        </div>
      </div>
      
      <div className="flex mt-2">
        <div className="mr-3 flex-shrink-0">
          <div className="h-16 w-12 bg-neutral-200 rounded border border-neutral-300 flex items-center justify-center text-neutral-500 text-xs">
            {renderIcon()}
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-xs text-neutral-600 line-clamp-2">
            {document.content 
              ? truncateText(document.content, 160)
              : `No preview available for this ${document.fileType.toUpperCase()} file`}
          </p>
          
          {tags.length > 0 && (
            <div className="flex mt-2 space-x-1 flex-wrap">
              {tags.map((tag) => (
                <span 
                  key={tag.id} 
                  className={`tag px-2 py-0.5 rounded-full mt-1 text-xs ${
                    tag.color && typeof tag.color === 'string' && tag.color.startsWith('#') 
                      ? `bg-opacity-10 text-${tag.color}` 
                      : tag.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
