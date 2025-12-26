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
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

const PartnerContent = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  type PreviewData = { title: string; text: string };
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editSection, setEditSection] = useState<any | null>(null);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editActive, setEditActive] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const initialSections = [
    { id: 1, name: 'Hero Title Section', description: 'Main title of the landing page', section_tag: 'hero-section', status: 'Checking...', lastUpdated: '-', type: 'text', is_active: false },
    { id: 2, name: 'Hero Subtitle Section', description: 'Subtitle below the main title', section_tag: 'sub-hero-section', status: 'Checking...', lastUpdated: '-', type: 'text', is_active: false },
    { id: 3, name: 'Highlighted Feature List', description: 'List of key features to highlight', section_tag: 'highlighted-features', status: 'Checking...', lastUpdated: '-', type: 'text', is_active: false },
    { id: 4, name: 'Hero Search Catalogue', description: 'Search bar for catalogue', section_tag: 'hero-search-catalogue', status: 'Checking...', lastUpdated: '-', type: 'toggle', is_active: false },
  ];

  const [sections, setSections] = useState(initialSections);

  type ContentItem = {
    section_tag: string;
    [key: string]: unknown;
  };

  useEffect(() => {
    const fetchContentStatus = async () => {
      const token = localStorage.getItem('token') ?? '';
      const parent = 'landing-page';
      const response = await api.get<ContentItem[]>(`/content/${parent}`, { Authorization: token });
      
      if (response.status === 'success' && Array.isArray(response.data)) {
        const dataMap = new Map(response.data.map((item) => [item.section_tag, item]));
        
        setSections(prev => prev.map(section => {
          const item = dataMap.get(section.section_tag);
          const isActive = item && typeof item.is_active === 'boolean' ? item.is_active : false;
          return {
            ...section,
            status: item ? 'Available' : 'Not Available',
            is_active: isActive
          };
        }));
      } else {
        // Fallback if fetch fails or data is invalid, set all to Not Available or keep Checking...
         setSections(prev => prev.map(section => ({
          ...section,
          status: 'Not Available',
          is_active: false
        })));
      }
    };

    fetchContentStatus();
  }, []);

  const handleToggle = async (section: any, checked: boolean) => {
    setSections(prev => prev.map(s => 
      s.id === section.id ? { ...s, is_active: checked } : s
    ));

    const token = localStorage.getItem('token') ?? '';
    const resp = await api.post('/content/update', {
      parent: 'landing-page',
      section_tag: section.section_tag,
      is_active: checked,
      type: 'toggle'
    }, { Authorization: token });

    if (resp.status === 'success') {
      setSections(prev => prev.map(s => 
        s.id === section.id ? { ...s, status: 'Available' } : s
      ));
    } else {
      // Revert if failed
      setSections(prev => prev.map(s => 
        s.id === section.id ? { ...s, is_active: !checked } : s
      ));
    }
  };

  const handlePreview = async (section_tag: string) => {
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const response = await api.get(`/content/landing-page/${section_tag}`, { Authorization: token });
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

  const handleEdit = async (section: any) => {
    const token = localStorage.getItem('token') ?? '';
    const parent = 'landing-page';
    const resp = await api.get(`/content/${parent}/${section.section_tag}`, { Authorization: token });
    setEditSection(section);
    if ((section.type ?? '') === 'radio-button') {
      let active = false;
      if (resp.status === 'success' && resp.data && typeof resp.data === 'object') {
        const obj = resp.data as Record<string, unknown>;
        active = Boolean(obj['is_active']);
      }
      setEditActive(active);
      setRadioModalOpen(true);
      return;
    }
    if ((section.type ?? '') === 'text') {
      let textVal = '';
      if (resp.status === 'success') {
        if (typeof resp.data === 'string') {
          textVal = resp.data as string;
        } else if (resp.data && typeof resp.data === 'object') {
          const obj = resp.data as Record<string, unknown>;
          if (typeof obj['text'] === 'string') textVal = obj['text'] as string;
          else if (typeof obj['content'] === 'string') textVal = obj['content'] as string;
        }
      }
      setEditText(textVal);
      setTextModalOpen(true);
      return;
    }
    navigate(`/dashboard/partner/content/content/edit/${section.section_tag}`, { state: { parent } });
  };

  const saveText = async () => {
    if (!editSection) return;
    setSavingEdit(true);
    const token = localStorage.getItem('token') ?? '';
    const resp = await api.post('/content/update', {
      parent: 'landing-page',
      section_tag: editSection.section_tag,
      content: editText,
      type: editSection.type
    }, { Authorization: token });
    setSavingEdit(false);
    if (resp.status === 'success') {
      setTextModalOpen(false);
      setSections(prev => prev.map(s => 
        s.id === editSection.id ? { ...s, status: 'Available' } : s
      ));
      setEditSection(null);
    }
  };

  const saveRadio = async () => {
    if (!editSection) return;
    setSavingEdit(true);
    const token = localStorage.getItem('token') ?? '';
    const resp = await api.post('/content/update', {
      parent: 'landing-page',
      section_tag: editSection.section_tag,
      is_active: editActive,
      type: editSection.type
    }, { Authorization: token });
    setSavingEdit(false);
    if (resp.status === 'success') {
      setRadioModalOpen(false);
      setSections(prev => prev.map(s => 
        s.id === editSection.id ? { ...s, status: 'Available' } : s
      ));
      setEditSection(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/dashboard/partner/content" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your landing page content and sections.</p>
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
                <TableHead>Description</TableHead>
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
                  <TableCell className="text-sm text-gray-500 max-w-[200px] truncate" title={(section as any).description}>{(section as any).description || '-'}</TableCell>
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
                      {section.type !== 'toggle' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreview(section.section_tag)}
                          disabled={loading}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      )}
                      {section.type === 'toggle' ? (
                        <div className="flex items-center h-9">
                          <Switch
                            checked={section.is_active}
                            onCheckedChange={(checked) => handleToggle(section, checked)}
                          />
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(section)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
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

      <Dialog open={textModalOpen} onOpenChange={setTextModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editSection?.name ?? 'Edit Text'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={10}
              className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTextModalOpen(false)}>Cancel</Button>
              <Button onClick={saveText} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700">
                {savingEdit ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={radioModalOpen} onOpenChange={setRadioModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSection?.name ?? 'Set Active Status'}</DialogTitle>
            <DialogDescription>Enable or disable this section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button variant={editActive ? 'default' : 'outline'} onClick={() => setEditActive(true)}>
                Enable
              </Button>
              <Button variant={!editActive ? 'default' : 'outline'} onClick={() => setEditActive(false)}>
                Disable
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRadioModalOpen(false)}>Cancel</Button>
              <Button onClick={saveRadio} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700">
                {savingEdit ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerContent;
