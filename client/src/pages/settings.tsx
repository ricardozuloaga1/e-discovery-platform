import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Tags, Save, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@shared/schema';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tag management
  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['/api/tags'],
  });
  
  const [newTag, setNewTag] = useState({ name: '', color: 'bg-blue-100 text-blue-800' });
  
  // App preferences
  const [preferences, setPreferences] = useState({
    autoPIIDetection: true,
    autoTagging: true,
    documentViewMode: 'side-by-side',
    defaultProductionFormat: 'PDF'
  });
  
  const handlePreferenceChange = (key: keyof typeof preferences, value: string | boolean) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };
  
  const handleSavePreferences = () => {
    // In a real app, we would save preferences to the server
    toast({
      title: "Preferences Saved",
      description: "Your application preferences have been updated."
    });
  };
  
  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Extract color code from the class string
      const color = newTag.color;
      
      await apiRequest('POST', '/api/tags', {
        name: newTag.name,
        color
      });
      
      // Invalidate tags query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      // Reset form
      setNewTag({ name: '', color: 'bg-blue-100 text-blue-800' });
      
      toast({
        title: "Tag Created",
        description: `Tag "${newTag.name}" has been created successfully.`
      });
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive"
      });
    }
  };
  
  // Handle deleting a tag
  const handleDeleteTag = async (tagId: number, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/tags/${tagId}`);
      
      // Invalidate tags query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      
      toast({
        title: "Tag Deleted",
        description: `Tag "${tagName}" has been deleted successfully.`
      });
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive"
      });
    }
  };
  
  // Available tag colors
  const tagColors = [
    { label: 'Blue', value: 'bg-blue-100 text-blue-800' },
    { label: 'Green', value: 'bg-green-100 text-green-800' },
    { label: 'Yellow', value: 'bg-yellow-100 text-yellow-800' },
    { label: 'Red', value: 'bg-red-100 text-red-800' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-800' },
    { label: 'Pink', value: 'bg-pink-100 text-pink-800' },
    { label: 'Gray', value: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <MainLayout>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center px-4">
          <h1 className="px-4 py-3 text-xl font-medium">Settings</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">
              <Settings2 className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tags className="h-4 w-4 mr-2" />
              Tag Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoPII">Auto PII Detection</Label>
                      <p className="text-sm text-neutral-500">
                        Automatically detect and suggest redactions for PII
                      </p>
                    </div>
                    <Switch 
                      id="autoPII"
                      checked={preferences.autoPIIDetection}
                      onCheckedChange={(checked) => handlePreferenceChange('autoPIIDetection', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoTag">Auto Document Tagging</Label>
                      <p className="text-sm text-neutral-500">
                        Automatically suggest tags based on document content
                      </p>
                    </div>
                    <Switch 
                      id="autoTag"
                      checked={preferences.autoTagging}
                      onCheckedChange={(checked) => handlePreferenceChange('autoTagging', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="viewMode">Default Document View</Label>
                    <Select 
                      value={preferences.documentViewMode}
                      onValueChange={(value) => handlePreferenceChange('documentViewMode', value)}
                    >
                      <SelectTrigger id="viewMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="side-by-side">Side by Side</SelectItem>
                        <SelectItem value="document-only">Document Only</SelectItem>
                        <SelectItem value="metadata-focus">Metadata Focus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productionFormat">Default Production Format</Label>
                    <Select 
                      value={preferences.defaultProductionFormat}
                      onValueChange={(value) => handlePreferenceChange('defaultProductionFormat', value)}
                    >
                      <SelectTrigger id="productionFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="TIFF">TIFF</SelectItem>
                        <SelectItem value="Native">Native</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={handleSavePreferences}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Color Theme</Label>
                    <Select 
                      value={theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-neutral-500 mt-1">
                      Choose the application's color theme or use your system's preference
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tags">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTags ? (
                    <p>Loading tags...</p>
                  ) : !tags || tags.length === 0 ? (
                    <p className="text-neutral-500">No tags available</p>
                  ) : (
                    <div className="space-y-2">
                      {tags.map((tag: Tag) => (
                        <div 
                          key={tag.id} 
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center">
                            <span 
                              className={`w-6 h-6 rounded-full mr-2 ${tag.color.startsWith('#') 
                                ? `bg-opacity-10 text-${tag.color}` 
                                : tag.color}`}
                            ></span>
                            <span>{tag.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Create New Tag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagName">Tag Name</Label>
                    <Input 
                      id="tagName"
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                      placeholder="Enter tag name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tagColor">Tag Color</Label>
                    <Select 
                      value={newTag.color}
                      onValueChange={(value) => setNewTag({ ...newTag, color: value })}
                    >
                      <SelectTrigger id="tagColor">
                        <div className="flex items-center">
                          <span 
                            className={`w-4 h-4 rounded-full mr-2 ${newTag.color}`}
                          ></span>
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {tagColors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center">
                              <span className={`w-4 h-4 rounded-full mr-2 ${color.value}`}></span>
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={handleCreateTag}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tag
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
