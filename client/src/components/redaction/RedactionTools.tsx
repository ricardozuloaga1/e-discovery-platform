import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Redaction } from '@shared/schema';

interface RedactionBoxProps {
  redaction: Omit<Redaction, 'id' | 'createdAt'>;
  index: number;
  onRemove: (index: number) => void;
}

interface RedactionToolsProps {
  documentId: number;
  isRedactionMode: boolean;
  redactionToolType: 'draw' | 'text' | 'auto';
  redactionReason: string;
  selectedText: string;
  pendingRedactions: Omit<Redaction, 'id' | 'createdAt'>[];
  onAddRedaction: (redaction: Omit<Redaction, 'id' | 'createdAt'>) => void;
  onRemovePendingRedaction: (index: number) => void;
}

// Component to display a pending redaction box
const RedactionBox = ({ redaction, index, onRemove }: RedactionBoxProps) => {
  return (
    <div 
      className="redaction-box" 
      style={{
        left: `${redaction.x}px`,
        top: `${redaction.y}px`,
        width: `${redaction.width}px`,
        height: `${redaction.height}px`
      }}
    >
      <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs py-1 px-2 rounded flex items-center">
        <span className="mr-2">{redaction.reason}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 text-white hover:bg-red-700 p-0"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export function RedactionTools({
  documentId,
  isRedactionMode,
  redactionToolType,
  redactionReason,
  selectedText,
  pendingRedactions,
  onAddRedaction,
  onRemovePendingRedaction
}: RedactionToolsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // Handle mouse down event for drawing mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRedactionMode || redactionToolType !== 'draw') return;
    
    // Get container offset to calculate coordinates relative to container
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  // Handle mouse move event for drawing mode
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPos({ x, y });
  };

  // Handle mouse up event for drawing mode
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    // Calculate redaction box dimensions
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    // Only add redaction if the box has a size
    if (width > 5 && height > 5) {
      // Create a mock text selection based on coordinates
      // In a real app, you'd extract text from the document using these coordinates
      const newRedaction = {
        documentId,
        text: `Selected text at (${x},${y})`,
        reason: redactionReason,
        x,
        y,
        width,
        height,
        pageNumber: 1 // Assuming single page for simplicity
      };
      
      onAddRedaction(newRedaction);
    }
    
    setIsDrawing(false);
  };

  // Listen for text selection in text select mode
  useEffect(() => {
    const handleTextSelection = () => {
      if (!isRedactionMode || redactionToolType !== 'text') return;
      
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Handle only if selection is within the document container
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      if (
        rect.left < containerRect.left || 
        rect.right > containerRect.right || 
        rect.top < containerRect.top || 
        rect.bottom > containerRect.bottom
      ) return;
      
      // Calculate position relative to container
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      
      const newRedaction = {
        documentId,
        text: selection.toString(),
        reason: redactionReason,
        x,
        y,
        width: rect.width,
        height: rect.height,
        pageNumber: 1 // Assuming single page for simplicity
      };
      
      onAddRedaction(newRedaction);
      
      // Clear selection
      selection.removeAllRanges();
    };
    
    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [isRedactionMode, redactionToolType, redactionReason, documentId, onAddRedaction]);

  // Create temporary drawing box while dragging
  const drawingBox = isDrawing ? {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y)
  } : null;

  return (
    <div 
      ref={containerRef}
      className={`relative flex-1 bg-neutral-100 overflow-auto p-6 flex justify-center ${isRedactionMode ? 'cursor-crosshair' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-white shadow-md rounded-lg w-full max-w-4xl p-8 document-content">
        {/* Render pending redactions */}
        {pendingRedactions.map((redaction, index) => (
          <RedactionBox 
            key={index}
            redaction={redaction}
            index={index}
            onRemove={onRemovePendingRedaction}
          />
        ))}
        
        {/* Show drawing box while dragging */}
        {drawingBox && (
          <div 
            className="absolute border-2 border-red-500 bg-red-100 bg-opacity-50"
            style={{
              left: `${drawingBox.x}px`,
              top: `${drawingBox.y}px`,
              width: `${drawingBox.width}px`,
              height: `${drawingBox.height}px`
            }}
          />
        )}
        
        {/* Children (document content) will be passed here */}
      </div>
    </div>
  );
}
