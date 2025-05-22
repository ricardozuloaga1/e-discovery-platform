import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getFileIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  
  switch (type) {
    case 'pdf':
      return 'file-pdf';
    case 'docx':
    case 'doc':
      return 'file-word';
    case 'xlsx':
    case 'xls':
      return 'file-spreadsheet';
    case 'pptx':
    case 'ppt':
      return 'file-presentation';
    case 'msg':
    case 'eml':
      return 'mail';
    case 'txt':
      return 'file-text';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    default:
      return 'file';
  }
}

export function getFileIconColor(fileType: string): string {
  const type = fileType.toLowerCase();
  
  switch (type) {
    case 'pdf':
      return 'text-red-500';
    case 'docx':
    case 'doc':
      return 'text-blue-500';
    case 'xlsx':
    case 'xls':
      return 'text-green-500';
    case 'pptx':
    case 'ppt':
      return 'text-orange-500';
    case 'msg':
    case 'eml':
      return 'text-blue-500';
    case 'txt':
      return 'text-gray-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

export function createBatesNumber(prefix: string, number: number, padding: number = 6): string {
  return `${prefix}${number.toString().padStart(padding, '0')}`;
}

export function getRandomColor(): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-gray-100 text-gray-800'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}
