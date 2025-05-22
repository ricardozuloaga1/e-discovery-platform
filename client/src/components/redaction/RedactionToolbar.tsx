import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Square, Type, Bot } from 'lucide-react';

interface RedactionToolbarProps {
  isVisible: boolean;
  redactionToolType: 'draw' | 'text' | 'auto';
  redactionReason: string;
  onToolTypeChange: (toolType: 'draw' | 'text' | 'auto') => void;
  onReasonChange: (reason: string) => void;
  onApplyRedactions: () => void;
  onCancel: () => void;
  onAutoPIIDetect: () => void;
}

export function RedactionToolbar({
  isVisible,
  redactionToolType,
  redactionReason,
  onToolTypeChange,
  onReasonChange,
  onApplyRedactions,
  onCancel,
  onAutoPIIDetect
}: RedactionToolbarProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-white border border-neutral-300 rounded-t-lg shadow-lg p-3 z-50">
      <div className="flex items-center space-x-4">
        <div className="font-medium text-sm">Redaction Mode</div>
        
        <div className="flex space-x-2">
          <Button
            variant={redactionToolType === 'draw' ? 'secondary' : 'outline'}
            size="sm"
            className="flex items-center"
            onClick={() => onToolTypeChange('draw')}
          >
            <Square className="mr-2 h-4 w-4" />
            Draw
          </Button>
          
          <Button
            variant={redactionToolType === 'text' ? 'secondary' : 'outline'}
            size="sm"
            className="flex items-center"
            onClick={() => onToolTypeChange('text')}
          >
            <Type className="mr-2 h-4 w-4" />
            Text Select
          </Button>
          
          <Button
            variant={redactionToolType === 'auto' ? 'secondary' : 'outline'}
            size="sm"
            className="flex items-center"
            onClick={() => onAutoPIIDetect()}
          >
            <Bot className="mr-2 h-4 w-4" />
            Auto-detect PII
          </Button>
        </div>
        
        <div className="border-l border-neutral-300 pl-4">
          <Select value={redactionReason} onValueChange={onReasonChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Redaction Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PII">PII</SelectItem>
              <SelectItem value="Confidential">Confidential</SelectItem>
              <SelectItem value="Privileged">Privileged</SelectItem>
              <SelectItem value="Trade Secret">Trade Secret</SelectItem>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="border-l border-neutral-300 pl-4 flex space-x-2">
          <Button 
            variant="destructive"
            onClick={onApplyRedactions}
          >
            Apply Redactions
          </Button>
          
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
