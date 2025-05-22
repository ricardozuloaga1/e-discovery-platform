import { useState, useCallback } from 'react';
import { detectPII } from '@/lib/documentProcessing';
import type { Redaction } from '@shared/schema';

interface RedactionState {
  isRedactionMode: boolean;
  redactionToolType: 'draw' | 'text' | 'auto';
  redactionReason: string;
  selectedText: string;
  pendingRedactions: Omit<Redaction, 'id' | 'createdAt'>[];
}

export function useRedaction(documentId: number) {
  const [redactionState, setRedactionState] = useState<RedactionState>({
    isRedactionMode: false,
    redactionToolType: 'draw',
    redactionReason: 'Confidential',
    selectedText: '',
    pendingRedactions: [],
  });

  // Toggle redaction mode on/off
  const toggleRedactionMode = useCallback(() => {
    setRedactionState(prev => ({
      ...prev,
      isRedactionMode: !prev.isRedactionMode,
      // Reset pending redactions when exiting
      pendingRedactions: prev.isRedactionMode ? [] : prev.pendingRedactions
    }));
  }, []);

  // Set the type of redaction tool
  const setRedactionToolType = useCallback((type: 'draw' | 'text' | 'auto') => {
    setRedactionState(prev => ({
      ...prev,
      redactionToolType: type
    }));
  }, []);

  // Set the reason for redaction
  const setRedactionReason = useCallback((reason: string) => {
    setRedactionState(prev => ({
      ...prev,
      redactionReason: reason
    }));
  }, []);

  // Set selected text for redaction
  const setSelectedText = useCallback((text: string) => {
    setRedactionState(prev => ({
      ...prev,
      selectedText: text
    }));
  }, []);

  // Add a new redaction
  const addRedaction = useCallback((redaction: Omit<Redaction, 'id' | 'createdAt'>) => {
    setRedactionState(prev => ({
      ...prev,
      pendingRedactions: [...prev.pendingRedactions, redaction]
    }));
  }, []);

  // Remove a pending redaction by index
  const removePendingRedaction = useCallback((index: number) => {
    setRedactionState(prev => ({
      ...prev,
      pendingRedactions: prev.pendingRedactions.filter((_, i) => i !== index)
    }));
  }, []);

  // Clear all pending redactions
  const clearPendingRedactions = useCallback(() => {
    setRedactionState(prev => ({
      ...prev,
      pendingRedactions: []
    }));
  }, []);

  // Auto-detect PII in content and create redaction suggestions
  const autoPIIDetection = useCallback((content: string) => {
    const detectedPII = detectPII(content);
    
    // Convert detected PII to pending redactions
    // Note: in a real app, you'd calculate actual coordinates
    const newPendingRedactions = detectedPII.map((pii, index) => ({
      documentId,
      text: pii.text,
      reason: pii.reason,
      x: 10, // Mock coordinates
      y: 10 + (index * 30), // Mock coordinates
      width: 200,
      height: 20,
      pageNumber: 1
    }));
    
    setRedactionState(prev => ({
      ...prev,
      pendingRedactions: [...prev.pendingRedactions, ...newPendingRedactions]
    }));
    
    return newPendingRedactions.length;
  }, [documentId]);

  return {
    ...redactionState,
    toggleRedactionMode,
    setRedactionToolType,
    setRedactionReason,
    setSelectedText,
    addRedaction,
    removePendingRedaction,
    clearPendingRedactions,
    autoPIIDetection
  };
}
