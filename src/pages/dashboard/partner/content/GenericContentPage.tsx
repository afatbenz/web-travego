import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Eye, Trash, Upload, Image as ImageIcon, Check, Star, Shield, Truck, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Tag, BadgePercent, Gift, Megaphone, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  description?: string;
  section_tag: string;
  status: string;
  lastUpdated: string;
  type?: 'text' | 'image' | 'radio-button' | 'list' | 'social-media' | string;
}

interface GenericContentPageProps {
  title: string;
  description: string;
  parent: string;
  initialSections?: Section[];
}

const GenericContentPage = ({ title, description, parent, initialSections = [] }: GenericContentPageProps) => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  type PreviewData = { title: string; text?: string; image?: string; items?: Array<{ icon: string; label: string; subLabel: string }>; listId?: string };
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editActive, setEditActive] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listRows, setListRows] = useState<Array<{ icon: string; label: string; subLabel: string; uuid?: string }>>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const renderPreviewIcon = (icon: string) => {
    const i = (icon ?? '').trim();
    if (!i) return null;
    const isUrl = /^https?:\/\//.test(i) || i.startsWith('/');
    const isImg = isUrl || /\.(png|jpe?g|svg|gif|webp)$/i.test(i);
    if (isImg) return <img src={i} alt="" className="w-5 h-5 object-contain" />;
    const k = i.toLowerCase();
    if (k === 'check') return <Check className="w-5 h-5" />;
    if (k === 'star') return <Star className="w-5 h-5" />;
    if (k === 'shield') return <Shield className="w-5 h-5" />;
    if (k === 'truck') return <Truck className="w-5 h-5" />;
    if (k === 'phone') return <Phone className="w-5 h-5" />;
    if (k === 'mail' || k === 'email') return <Mail className="w-5 h-5" />;
    if (k === 'map-pin' || k === 'map') return <MapPin className="w-5 h-5" />;
    if (k === 'facebook') return <Facebook className="w-5 h-5" />;
    if (k === 'twitter' || k === 'x') return <Twitter className="w-5 h-5" />;
    if (k === 'instagram') return <Instagram className="w-5 h-5" />;
    if (k === 'tag') return <Tag className="w-5 h-5" />;
    if (k === 'badge-percent' || k === 'promo' || k === 'discount') return <BadgePercent className="w-5 h-5" />;
    if (k === 'percent') return <Percent className="w-5 h-5" />;
    if (k === 'gift') return <Gift className="w-5 h-5" />;
    if (k === 'megaphone') return <Megaphone className="w-5 h-5" />;
    return <span className="text-[10px] text-gray-500">{i}</span>;
  };

  const ICON_OPTIONS_BASE: Array<{ value: string; label: string }> = [
    { value: 'check', label: 'Check' },
    { value: 'star', label: 'Star' },
    { value: 'shield', label: 'Shield' },
    { value: 'truck', label: 'Truck' },
    { value: 'phone', label: 'Phone' },
    { value: 'mail', label: 'Mail' },
    { value: 'map-pin', label: 'Map Pin' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'badge-percent', label: 'Promo / Discount' },
    { value: 'tag', label: 'Tag' },
    { value: 'percent', label: 'Percent' },
    { value: 'gift', label: 'Gift' },
    { value: 'megaphone', label: 'Megaphone' },
  ];

  const ICON_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'none', label: '-- select option --' },
    ...ICON_OPTIONS_BASE.sort((a, b) => a.label.localeCompare(b.label))
  ];

  type ContentItem = {
    section_tag: string;
    [key: string]: unknown;
  };

  useEffect(() => {
    const fetchContentStatus = async () => {
      if (sections.length === 0) return;
      
      const token = localStorage.getItem('token') ?? '';
      const response = await api.get<ContentItem[]>(`/content/${parent}`, { Authorization: token });
      
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
  }, [initialSections, parent]);

  const handlePreview = async (section: Section) => {
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const response = await api.get(`/content/${parent}/${section.section_tag}`, { Authorization: token });
    setLoading(false);
    if (response.status === 'success') {
      if ((section.type ?? '') === 'list') {
        const data = response.data as unknown;
        const tryArray = (val: unknown) => Array.isArray(val) ? val : undefined;
        const tryObjectArray = (val: unknown) => Array.isArray(val) ? val as Array<Record<string, unknown>> : undefined;
        const fromObj = (obj: Record<string, unknown>) => {
          const items = tryArray(obj['items']) ?? tryArray(obj['list']) ?? tryArray(obj['content']);
          return items;
        };
        let items: unknown = undefined;
        if (Array.isArray(data)) items = data;
        else if (data && typeof data === 'object') items = fromObj(data as Record<string, unknown>);
        else if (typeof data === 'string') {
          try { const parsed = JSON.parse(data); if (Array.isArray(parsed)) items = parsed; } catch (_e) { items = undefined; }
        }
        const objArr = tryObjectArray(items) ?? [];
        const rows = objArr.map((it) => ({
          icon: String(it['icon'] ?? ''),
          label: String(it['label'] ?? ''),
          subLabel: String((it['subLabel'] ?? it['sub_label'] ?? '')),
          uuid: String((it['uuid'] ?? it['id'] ?? '') as string) || undefined,
        }));
        let listId = '';
        for (const it of objArr) {
          const id = String((it['uuid'] ?? it['id'] ?? '') as string);
          if (id) { listId = id; break; }
        }
        setPreviewData({ title: section.section_tag, items: rows, listId: listId || undefined });
      } else if ((section.type ?? '') === 'image') {
        let imageUrl = '';
        if (typeof response.data === 'string') {
          imageUrl = response.data;
        } else if (response.data && typeof response.data === 'object') {
          const obj = response.data as Record<string, unknown>;
          if (typeof obj['image'] === 'string') imageUrl = obj['image'];
          else if (typeof obj['url'] === 'string') imageUrl = obj['url'];
          else if (typeof obj['file_path'] === 'string') imageUrl = obj['file_path'];
          else if (typeof obj['path'] === 'string') imageUrl = obj['path'];
          else if (typeof obj['content'] === 'string') imageUrl = obj['content'];
        }
        setPreviewData({ title: section.section_tag, image: imageUrl });
      } else {
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
        setPreviewData({ title: section.section_tag, text: contentText });
      }
      setPreviewOpen(true);
    }
  };

  

  const handleEdit = async (section: Section) => {
    const token = localStorage.getItem('token') ?? '';
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
    if ((section.type ?? '') === 'list') {
      let rows: Array<{ icon: string; label: string; subLabel: string }> = [];
      if (resp.status === 'success') {
        const data = resp.data as unknown;
        const tryArray = (val: unknown) => Array.isArray(val) ? val : undefined;
        const tryObjectArray = (val: unknown) => Array.isArray(val) ? val as Array<Record<string, unknown>> : undefined;
        const fromObj = (obj: Record<string, unknown>) => {
          const items = tryArray(obj['items']) ?? tryArray(obj['list']) ?? tryArray(obj['content']);
          return items;
        };
        let items: unknown = undefined;
        if (Array.isArray(data)) items = data;
        else if (data && typeof data === 'object') items = fromObj(data as Record<string, unknown>);
        else if (typeof data === 'string') {
          try { const parsed = JSON.parse(data); if (Array.isArray(parsed)) items = parsed; } catch (_e) { items = undefined; }
        }
        const objArr = tryObjectArray(items);
        if (objArr) {
          rows = objArr.map((it) => ({
            icon: String(it['icon'] ?? ''),
            label: String(it['label'] ?? ''),
            subLabel: String((it['subLabel'] ?? it['sub_label'] ?? '')),
            uuid: String((it['uuid'] ?? it['id'] ?? '') as string) || undefined,
          }));
        }
      }
      if (rows.length === 0) rows = [{ icon: '', label: '', subLabel: '' }];
      setListRows(rows);
      setListModalOpen(true);
      return;
    }
    if ((section.type ?? '') === 'image') {
      setSelectedFile(null);
      setImageModalOpen(true);
      return;
    }
    navigate(`/dashboard/partner/content/content/edit/${section.section_tag}`, { state: { parent } });
  };

  const saveText = async () => {
    if (!editSection) return;
    setSavingEdit(true);
    const token = localStorage.getItem('token') ?? '';
    const resp = await api.post('/content/update', {
      parent,
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
      parent,
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

  const saveList = async () => {
    if (!editSection) return;
    setSavingEdit(true);
    const token = localStorage.getItem('token') ?? '';
    const resp = await api.post('/content/update', {
      parent,
      section_tag: editSection.section_tag,
      list: listRows.map(r => ({
        icon: r.icon,
        label: r.label,
        sub_label: r.subLabel,
        ...(r.uuid ? { list_id: String(r.uuid) } : {})
      })),
      type: editSection.type
    }, { Authorization: token });
    setSavingEdit(false);
    if (resp.status === 'success') {
      setListModalOpen(false);
      setSections(prev => prev.map(s => 
        s.id === editSection.id ? { ...s, status: 'Available' } : s
      ));
      setEditSection(null);
    }
  };

  const handleImageUpload = async () => {
    if (!editSection || !selectedFile) return;
    setSavingEdit(true);
    const token = localStorage.getItem('token') ?? '';
    const formData = new FormData();
    formData.append('file_path', selectedFile);
    formData.append('section_tag', editSection.section_tag);
    formData.append('parent', parent);

    const resp = await api.post('/content/upload', formData, { Authorization: token });
    setSavingEdit(false);
    if (resp.status === 'success') {
      setImageModalOpen(false);
      setSections(prev => prev.map(s => 
        s.id === editSection.id ? { ...s, status: 'Available' } : s
      ));
      setEditSection(null);
      setSelectedFile(null);
    }
  };

  const handleDeleteListRow = async (idx: number) => {
    const row = listRows[idx];
    if (row?.uuid) {
      const token = localStorage.getItem('token') ?? '';
      const resp = await api.delete(`/content/delete-list/${row.uuid}`, { Authorization: token });
      if (resp.status === 'success') {
        setListRows(prev => prev.filter((_, i) => i !== idx));
      }
      return;
    }
    setListRows(prev => prev.filter((_, i) => i !== idx));
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
                <TableHead>Description</TableHead>
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
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate" title={section.description}>{section.description || '-'}</TableCell>
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
                          onClick={() => handlePreview(section)}
                          disabled={loading}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(section)}
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
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
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
            {previewData?.items && previewData.items.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {previewData.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      {renderPreviewIcon(it.icon)}
                      <div className="text-sm font-semibold">{it.label || '-'}</div>
                    </div>
                    {it.subLabel ? (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{it.subLabel}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : previewData?.image ? (
              <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <img 
                  src={previewData.image} 
                  alt={previewData.title} 
                  className="max-w-full max-h-[60vh] object-contain rounded-md" 
                />
              </div>
            ) : (
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[60vh] text-sm whitespace-pre-wrap">
                {previewData?.text || 'No content available'}
              </pre>
            )}
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

      <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{editSection?.name ?? 'Edit List'}</DialogTitle>
            <DialogDescription>Manage multiple rows for this section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4">
            {listRows.map((row, idx) => (
              <div key={idx} className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Item - {idx + 1}</div>
                  {idx > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30"
                      onClick={() => handleDeleteListRow(idx)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete Row
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    value={row.icon}
                    onValueChange={(val) => setListRows(prev => prev.map((r, i) => i === idx ? { ...r, icon: val === 'none' ? '' : val } : r))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Icon (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            {opt.value !== 'none' ? renderPreviewIcon(opt.value) : null}
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    value={row.label}
                    onChange={(e) => setListRows(prev => prev.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                    placeholder="Label (wajib)"
                    className="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm"
                  />
                  <textarea
                    value={row.subLabel}
                    onChange={(e) => setListRows(prev => prev.map((r, i) => i === idx ? { ...r, subLabel: e.target.value } : r))}
                    placeholder="Sub Label (opsional)"
                    rows={4}
                    className="md:col-span-3 w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-sm"
                  />
                </div>
              </div>
            ))}
            <div className="sticky bottom-0 pt-3 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setListRows(prev => [...prev, { icon: '', label: '', subLabel: '' }])}>Add Row</Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setListModalOpen(false)}>Cancel</Button>
                  <Button onClick={saveList} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700">
                    {savingEdit ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSection?.name ?? 'Upload Image'}</DialogTitle>
            <DialogDescription>Upload a new image for this section.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedFile ? (
                    <>
                      <ImageIcon className="w-12 h-12 mb-3 text-blue-500" />
                      <p className="mb-2 text-sm text-gray-900 dark:text-gray-100 font-semibold">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="mb-2 text-lg text-gray-500 dark:text-gray-400 font-medium">
                        Click to upload image
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SVG, PNG, JPG or GIF
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setImageModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleImageUpload} 
                disabled={!selectedFile || savingEdit} 
                className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
              >
                {savingEdit ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenericContentPage;
