import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

const ContentEdit = () => {
  const { section_tag } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper untuk mendapatkan judul yang readable
  const getSectionName = (tag: string | undefined) => {
    if (!tag) return 'Unknown Section';
    return tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    if (section_tag) {
      fetchData();
    }
  }, [section_tag]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const response = await api.get<{ content: string }>(`/content/general/detail/${section_tag}`, { Authorization: token });
    if (response.status === 'success' && response.data) {
      if (typeof response.data === 'string') {
        setContent(response.data);
      } else if (typeof response.data === 'object' && response.data !== null && 'content' in response.data) {
        setContent((response.data as any).content);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!section_tag) return;
    setSaving(true);
    
    const payload = {
      section_tag: section_tag,
      content: content
    };
    
    const token = localStorage.getItem('token') ?? '';
    const response = await api.post('/content/general/create', payload, { Authorization: token });
    setSaving(false);
    
    if (response.status === 'success') {
      navigate('/dashboard/partner/content/content');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/partner/content/content');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Content</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Editing section: <span className="font-mono font-semibold">{section_tag}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getSectionName(section_tag)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading content...</div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content here..."
              rows={15}
              className="w-full font-mono text-sm"
            />
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSave} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Simpan'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentEdit;
