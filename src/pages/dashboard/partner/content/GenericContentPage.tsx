import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BackButton from '@/components/common/BackButton';
import { api } from '@/lib/api';

export interface Section {
  id: number;
  name: string;
  section_tag: string;
  status: string;
  lastUpdated: string;
}

interface GenericContentPageProps {
  title: string;
  description: string;
  initialSections?: Section[];
}

const GenericContentPage = ({ title, description, initialSections = [] }: GenericContentPageProps) => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  type PreviewData = { title: string; text: string };
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>(initialSections);

  type ContentItem = {
    section_tag: string;
    [key: string]: unknown;
  };

  useEffect(() => {
    const fetchContentStatus = async () => {
      if (sections.length === 0) return;
      
      const token = localStorage.getItem('token') ?? '';
      const response = await api.get<ContentItem[]>('/content/general', { Authorization: token });
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const availableTags = response.data.map((item) => item.section_tag);
        
        setSections(prev => prev.map(section => ({
          ...section,
          status: availableTags.includes(section.section_tag) ? 'Available' : 'Not Available'
        })));
      } else {
         setSections(prev => prev.map(section => ({
          ...section,
          status: 'Not Available'
        })));
      }
    };

    fetchContentStatus();
  }, [initialSections]); // Re-run if initialSections changes, though typically static

  const handlePreview = async (section_tag: string) => {
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const response = await api.get(`/content/general/detail/${section_tag}`, { Authorization: token });
    setLoading(false);
    if (response.status === 'success') {
      let contentText = '';
      if (typeof response.data === 'string') {
        contentText = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const obj = response.data as Record<string, unknown>;
        if (typeof obj['text'] === 'string') {
          contentText = obj['text'] as string;
        } else if (typeof obj['content'] === 'string') {
          contentText = obj['content'] as string;
        } else {
           contentText = JSON.stringify(response.data, null, 2);
        }
      }
      
      setPreviewData({
        title: section_tag,
        text: contentText
      });
      setPreviewOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/dashboard/partner/content" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section Name</TableHead>
                <TableHead>Section Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.length > 0 ? (
                sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{section.section_tag}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        section.status === 'Available' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {section.status}
                      </span>
                    </TableCell>
                    <TableCell>{section.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreview(section.section_tag)}
                          disabled={loading}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/partner/content/content/edit/${section.section_tag}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No sections defined for this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewData?.title || 'Preview Content'}</DialogTitle>
            <DialogDescription>
              Preview of the content from API.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[60vh] text-sm whitespace-pre-wrap">
              {previewData?.text || 'No content available'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenericContentPage;
