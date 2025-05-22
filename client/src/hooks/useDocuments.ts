import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Document, Tag, InsertDocument, Redaction } from '@shared/schema';

export function useDocuments() {
  const queryClient = useQueryClient();
  
  // Get all documents
  const useAllDocuments = () => {
    return useQuery({
      queryKey: ['/api/documents'],
    });
  };
  
  // Get a specific document
  const useDocument = (id: number | null) => {
    return useQuery({
      queryKey: ['/api/documents', id],
      enabled: !!id,
    });
  };
  
  // Create a new document
  const useCreateDocument = () => {
    return useMutation({
      mutationFn: async (document: InsertDocument) => {
        const res = await apiRequest('POST', '/api/documents', document);
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      },
    });
  };
  
  // Update an existing document
  const useUpdateDocument = () => {
    return useMutation({
      mutationFn: async ({ id, document }: { id: number, document: Partial<Document> }) => {
        const res = await apiRequest('PATCH', `/api/documents/${id}`, document);
        return res.json();
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      },
    });
  };
  
  // Delete a document
  const useDeleteDocument = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        await apiRequest('DELETE', `/api/documents/${id}`);
        return id;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      },
    });
  };
  
  // Get tags for a document
  const useDocumentTags = (documentId: number | null) => {
    return useQuery({
      queryKey: ['/api/documents', documentId, 'tags'],
      enabled: !!documentId,
    });
  };
  
  // Add a tag to a document
  const useAddDocumentTag = () => {
    return useMutation({
      mutationFn: async ({ documentId, tagId }: { documentId: number, tagId: number }) => {
        const res = await apiRequest('POST', `/api/documents/${documentId}/tags`, { tagId });
        return res.json();
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.documentId, 'tags'] });
      },
    });
  };
  
  // Remove a tag from a document
  const useRemoveDocumentTag = () => {
    return useMutation({
      mutationFn: async ({ documentId, tagId }: { documentId: number, tagId: number }) => {
        await apiRequest('DELETE', `/api/documents/${documentId}/tags/${tagId}`);
        return { documentId, tagId };
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.documentId, 'tags'] });
      },
    });
  };
  
  // Get redactions for a document
  const useDocumentRedactions = (documentId: number | null) => {
    return useQuery({
      queryKey: ['/api/documents', documentId, 'redactions'],
      enabled: !!documentId,
    });
  };
  
  // Create a redaction for a document
  const useCreateRedaction = () => {
    return useMutation({
      mutationFn: async (redaction: Omit<Redaction, 'id' | 'createdAt'>) => {
        const res = await apiRequest('POST', '/api/redactions', redaction);
        return res.json();
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.documentId, 'redactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.documentId] });
      },
    });
  };
  
  // Delete a redaction
  const useDeleteRedaction = () => {
    return useMutation({
      mutationFn: async ({ id, documentId }: { id: number, documentId: number }) => {
        await apiRequest('DELETE', `/api/redactions/${id}`);
        return { id, documentId };
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', variables.documentId, 'redactions'] });
      },
    });
  };
  
  return {
    useAllDocuments,
    useDocument,
    useCreateDocument,
    useUpdateDocument,
    useDeleteDocument,
    useDocumentTags,
    useAddDocumentTag,
    useRemoveDocumentTag,
    useDocumentRedactions,
    useCreateRedaction,
    useDeleteRedaction,
  };
}
