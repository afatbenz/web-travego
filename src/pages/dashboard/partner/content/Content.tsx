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
import { api } from '@/lib/api';

const PartnerContent = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  type PreviewData = { title: string; text: string };
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  const initialSections = [
    { id: 1, name: 'Hero Section - Landing Page', section_tag: 'hero-section', status: 'Checking...', lastUpdated: '2024-01-20' },
    { id: 7, name: 'Hero Section Subtitle - Landing Page', section_tag: 'sub-hero-section', status: 'Checking...', lastUpdated: '2024-01-20' },
    { id: 2, name: 'Highlighted Feature List', section_tag: 'highlighted-features', status: 'Checking...', lastUpdated: '2024-01-18' },
    { id: 3, name: 'Profile Summary', section_tag: 'profile-summary', status: 'Checking...', lastUpdated: '2024-01-15' },
    { id: 4, name: 'Our Services', section_tag: 'our-service', status: 'Checking...', lastUpdated: '2024-01-22' },
    { id: 5, name: 'About Us', section_tag: 'about-us', status: 'Checking...', lastUpdated: '2024-01-20' },
    { id: 6, name: 'Hot Offers and Promo', section_tag: 'hot-offers', status: 'Checking...', lastUpdated: '2024-01-24' },
  ];

  const [sections, setSections] = useState(initialSections);

  type ContentItem = {
    section_tag: string;
    [key: string]: unknown;
  };

  useEffect(() => {
    const fetchContentStatus = async () => {
      const token = localStorage.getItem('token') ?? '';
      const response = await api.get<ContentItem[]>('/content/general', { Authorization: token });
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const availableTags = response.data.map((item) => item.section_tag);
        
        setSections(prev => prev.map(section => ({
          ...section,
          status: availableTags.includes(section.section_tag) ? 'Available' : 'Not Available'
        })));
      } else {
        // Fallback if fetch fails or data is invalid, set all to Not Available or keep Checking...
         setSections(prev => prev.map(section => ({
          ...section,
          status: 'Not Available'
        })));
      }
    };

    fetchContentStatus();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your landing page content and sections.</p>
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
              {sections.map((section) => (
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
              ))}
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

export default PartnerContent;
