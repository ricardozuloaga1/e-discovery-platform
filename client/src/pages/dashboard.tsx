import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { BarChart, UploadCloud, FileText, Tag, AlertTriangle, Pencil } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { useAllDocuments } = useDocuments();
  const { data: documents, isLoading } = useAllDocuments();

  // Calculate dashboard metrics
  const getTotalDocuments = () => documents?.length || 0;
  const getReviewedDocuments = () => documents?.filter(doc => doc.isReviewed).length || 0;
  const getRedactedDocuments = () => documents?.filter(doc => doc.isRedacted).length || 0;
  const getUnreviewedDocuments = () => documents?.filter(doc => !doc.isReviewed).length || 0;

  const reviewProgress = getTotalDocuments() > 0
    ? Math.round((getReviewedDocuments() / getTotalDocuments()) * 100)
    : 0;
  
  const handleUploadDocument = () => {
    navigate('/documents/upload');
  };

  const handleReviewDocuments = () => {
    navigate('/documents');
  };

  return (
    <MainLayout>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center px-4">
          <h1 className="px-4 py-3 text-xl font-medium">Dashboard</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : getTotalDocuments()}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {getReviewedDocuments()} reviewed, {getUnreviewedDocuments()} pending
              </p>
              <div className="w-full h-2 bg-neutral-200 rounded-full mt-3">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${reviewProgress}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Redacted Documents</CardTitle>
              <Pencil className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : getRedactedDocuments()}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {getTotalDocuments() - getRedactedDocuments()} not redacted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attention Required</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : getUnreviewedDocuments()}</div>
              <p className="text-xs text-neutral-500 mt-1">Documents needing review</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {isLoading ? (
                    <p>Loading activity...</p>
                  ) : documents && documents.length > 0 ? (
                    documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h3 className="font-medium text-sm">{doc.title}</h3>
                          <p className="text-xs text-neutral-500">
                            {doc.isReviewed ? 'Reviewed' : 'Awaiting review'} • {doc.fileType.toUpperCase()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-500">No documents available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleUploadDocument}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleReviewDocuments}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Review Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/redaction')}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Redact Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/export')}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Export Production Set
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
