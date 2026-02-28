import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, Loader2, Image as ImageIcon, Type, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadCommon, deleteCommon, api } from '@/lib/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100/api';
const ASSET_BASE_URL = BASE_URL.replace('/api', '');

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ASSET_BASE_URL}/${path}`;
};

// Interface for API response/request
interface TourPackage {
  id?: number;
  package_name: string;
  package_type: string;
  package_description: string;
  thumbnail: string;
  images: string[];
  features?: string[];
  facilities?: string[];
  itineraries: Array<{
    day: number;
    activities: Array<{
      time: string;
      description: string;
      city?: { id: number; name: string };
      location: string;
    }>;
  }>;
  pricing: Array<{
    min_pax: number;
    max_pax: number;
    price: number;
  }>;
  trip_date_start?: string;
  trip_date_end?: string;
  schedules?: Array<{
    start_date: string;
    end_date: string;
  }>;
  addons: Array<{
    description: string;
    price: number;
  }>;
  pickup_areas?: Array<{ id: number; name?: string }>;
  active: boolean;
}

export const PackageForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Initial State
  const [formData, setFormData] = useState({
    title: '',
    packageType: '2', // Default to Open Trip (2)
    description: '',
    tripDateStart: '',
    tripDateEnd: '',
    schedules: [{ start_date: '', end_date: '' }],
    thumbnail: '', // Preview URL
    thumbnailFile: '', // Server path
    gallery: [] as string[], // Server paths
    features: [''] as string[],
    itinerary: [{ 
      day: 1, 
      activities: [{ time: '08:00', description: '', city: undefined as { id: number; name: string } | undefined, location: '' }] 
    }],
    pricing: [{ min_pax: 1, max_pax: 1, price: 0 }],
    addons: [{ description: '', price: 0 }],
    pickupAreas: [] as Array<{ id: number; name: string }>,
    active: true
  });

  const [galleryPreviews, setGalleryPreviews] = useState<Array<{ url: string; path?: string; status: 'uploading' | 'done' | 'error' }>>([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // City Search State
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [activeCityDropdown, setActiveCityDropdown] = useState<{ dayIndex: number, activityIndex: number } | null>(null);
  
  // Pickup Area Search State
  const [pickupQuery, setPickupQuery] = useState('');
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // WYSIWYG Editor Functions
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setFormData(prev => ({ ...prev, description: content }));
    }
  };

  const changeFontSize = (size: string) => {
    executeCommand('fontSize', size);
  };

  useEffect(() => {
    if (editorRef.current && formData.description) {
      if (editorRef.current.innerHTML !== formData.description) {
        editorRef.current.innerHTML = formData.description;
      }
    }
  }, [formData.description]);

  // Add CSS for placeholder
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [contenteditable]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Load data for edit
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      // Mock fetch or actual fetch if API existed for single package
      // For now we assume we need to fetch from list or a specific endpoint
      // Since the user asked for GET /api/partner/tour-packages for list, likely GET /api/partner/tour-packages/{id} for detail
      const fetchDetail = async () => {
        try {
          // const res = await api.get(`/partner/tour-packages/${id}`);
          // if (res.status === 'success') { ... populate state ... }
          // Placeholder for edit logic
          console.log("Fetching detail for", id);
        } catch (error) {
          console.error("Failed to fetch package detail", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEdit, id]);

  // City Search Logic
  async function fetchCities(q: string) {
    setLoadingCities(true);
    try {
      const res = await api.get<unknown>(`/general/cities${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      if (res.status === 'success') {
        const payload = res.data as any;
        let list: Array<{ id: number; name: string }> = [];
        
        const items = Array.isArray(payload) ? payload : (payload?.items || []);
        
        if (Array.isArray(items)) {
            list = items.map((x: any, i: number) => {
                const name = x?.name || (typeof x === 'string' ? x : '');
                const id = x?.id || i;
                return name ? { id, name } : null;
            }).filter((v): v is { id: number; name: string } => Boolean(v));
        }
        setCities(list);
      } else {
        setCities([]);
      }
    } catch (e) {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }

  useEffect(() => {
    if (activeCityDropdown) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchCities(cityQuery);
      }, 500);
    } else if (showPickupDropdown) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchCities(pickupQuery);
      }, 500);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cityQuery, activeCityDropdown, pickupQuery, showPickupDropdown]);

  // Handlers
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Cleanup old preview
    if (formData.thumbnail && formData.thumbnail.startsWith('blob:')) {
      URL.revokeObjectURL(formData.thumbnail);
    }

    const previewUrl = URL.createObjectURL(file);
    const prevPath = formData.thumbnailFile;

    // Delete old file from server if exists
    if (prevPath) {
      try { await deleteCommon([prevPath]); } catch { void 0; }
    }

    setFormData(prev => ({ ...prev, thumbnail: previewUrl, thumbnailFile: '' }));
    setThumbnailUploading(true);

    try {
      const res = await uploadCommon('package', [file]);
      if (res.status === 'success') {
        const data = res.data as { files?: string[] };
        const path = data?.files?.[0] || '';
        setFormData(prev => ({ ...prev, thumbnailFile: path }));
      }
    } catch (error) {
      console.error('Thumbnail upload failed', error);
      // Revert or show error
    } finally {
      setThumbnailUploading(false);
    }
  };

  const removeThumbnail = async () => {
    if (formData.thumbnailFile) {
      try { await deleteCommon([formData.thumbnailFile]); } catch { void 0; }
    }
    if (formData.thumbnail && formData.thumbnail.startsWith('blob:')) {
      URL.revokeObjectURL(formData.thumbnail);
    }
    setFormData(prev => ({ ...prev, thumbnail: '', thumbnailFile: '' }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = galleryPreviews.length;
    const maxAllowed = 10;
    const remaining = maxAllowed - currentCount;
    
    if (remaining <= 0) {
      alert('Maksimal 10 foto galeri.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      alert(`Hanya ${remaining} foto yang dapat ditambahkan.`);
    }

    const newPreviews = filesToUpload.map(f => ({
      url: URL.createObjectURL(f),
      status: 'uploading' as const
    }));

    setGalleryPreviews(prev => [...prev, ...newPreviews]);

    try {
      const res = await uploadCommon('package', filesToUpload);
      if (res.status === 'success') {
        const data = res.data as { files?: string[]; first_url?: string };
        const paths = data?.files || [];
        
        setGalleryPreviews(prev => {
          const updated = [...prev];
          let pathIdx = 0;
          return updated.map(item => {
            if (item.status === 'uploading' && paths[pathIdx]) {
              const newItem = { ...item, status: 'done' as const, path: paths[pathIdx] };
              pathIdx++;
              return newItem;
            }
            return item;
          });
        });

        setFormData(prev => ({
            ...prev,
            gallery: [...prev.gallery, ...paths]
        }));
      } else {
        // Handle error state for previews
        setGalleryPreviews(prev => prev.map(p => p.status === 'uploading' ? { ...p, status: 'error' } : p));
      }
    } catch (error) {
      setGalleryPreviews(prev => prev.map(p => p.status === 'uploading' ? { ...p, status: 'error' } : p));
    }
  };

  const removeGalleryImage = async (index: number) => {
    const item = galleryPreviews[index];
    if (item.path) {
      try { await deleteCommon([item.path]); } catch { void 0; }
      setFormData(prev => ({
        ...prev,
        gallery: prev.gallery.filter(p => p !== item.path)
      }));
    }
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Judul paket wajib diisi';
    if (!formData.thumbnailFile) newErrors.thumbnail = 'Thumbnail wajib diisi';
    
    if (formData.packageType === '2') {
      const validSchedules = formData.schedules.filter(s => s.start_date && s.end_date);
      if (validSchedules.length === 0) {
        newErrors.schedules = 'Minimal satu jadwal trip wajib diisi';
      }
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Construct Payload
    const payload: TourPackage = {
      package_name: formData.title,
      package_type: formData.packageType,
      package_description: formData.description,
      thumbnail: formData.thumbnailFile,
      images: formData.gallery,
      facilities: formData.features.filter(f => f.trim() !== ''),
      itineraries: formData.itinerary.map(day => ({
        ...day,
        activities: day.activities.map(activity => ({
          ...activity,
          city: activity.city ? { id: activity.city.id, name: activity.city.name } : undefined
        }))
      })),
      pricing: formData.pricing.filter(p => p.price > 0),
      addons: formData.addons.filter(a => a.description.trim() !== ''),
      pickup_areas: formData.pickupAreas.map(area => ({ id: area.id })),
      trip_date_start: formData.packageType === '2' && formData.schedules[0] ? formData.schedules[0].start_date : undefined,
      trip_date_end: formData.packageType === '2' && formData.schedules[0] ? formData.schedules[0].end_date : undefined,
      schedules: formData.packageType === '2' ? formData.schedules.filter(s => s.start_date && s.end_date) : undefined,
      active: formData.active
    };

    console.log('Submitting Payload:', payload);
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      
      let res;
      if (isEdit && id) {
        res = await api.put<unknown>(`/partner/tour-packages/${id}`, payload, headers);
      } else {
        res = await api.post<unknown>('/partner/services/tour-packages/create', payload, headers);
      }

      if (res.status === 'success') {
        navigate('/dashboard/partner/services/packages');
      }
    } catch (error) {
      console.error('Failed to save package', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/partner/services/packages')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Paket Wisata' : 'Tambah Paket Wisata'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isEdit ? 'Ubah informasi paket wisata' : 'Tambahkan paket wisata baru'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Thumbnail & Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Dasar */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Judul Paket</label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: Paket Wisata Bali 3H2M"
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jenis Paket</label>
                  <Select 
                    value={formData.packageType} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, packageType: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Private Trip</SelectItem>
                      <SelectItem value="2">Open Trip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Deskripsi</label>
                <div className="border rounded-md">
                  <div className="flex items-center space-x-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => executeCommand('bold')}
                      title="Bold"
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-300">B</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => executeCommand('italic')}
                      title="Italic"
                    >
                      <span className="italic text-gray-700 dark:text-gray-300">I</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => executeCommand('underline')}
                      title="Underline"
                    >
                      <span className="underline text-gray-700 dark:text-gray-300">U</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => executeCommand('insertUnorderedList')}
                      title="Bullet List"
                    >
                      <span className="text-gray-700 dark:text-gray-300">•</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => executeCommand('insertOrderedList')}
                      title="Numbered List"
                    >
                      <span className="text-gray-700 dark:text-gray-300">1.</span>
                    </Button>
                    <div className="flex items-center space-x-1 ml-2">
                      <Type className="h-4 w-4 text-gray-500" />
                      <Select onValueChange={changeFontSize}>
                        <SelectTrigger className="h-8 w-20 text-xs">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Small</SelectItem>
                          <SelectItem value="3">Normal</SelectItem>
                          <SelectItem value="5">Large</SelectItem>
                          <SelectItem value="7">X-Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    className="min-h-[150px] p-3 border-0 resize-none focus:outline-none"
                    style={{ 
                      minHeight: '150px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                    data-placeholder="Deskripsi lengkap paket wisata..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jadwal Trip - Only for Open Trip */}
          {formData.packageType === '2' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Jadwal Trip</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-transparent"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      schedules: [...(prev.schedules || []), { start_date: '', end_date: '' }]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Jadwal
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.schedules?.map((schedule, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative border-b pb-4 last:border-0">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Tanggal Mulai
                      </label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={schedule.start_date}
                        onChange={(e) => {
                          const newSchedules = [...(formData.schedules || [])];
                          newSchedules[index].start_date = e.target.value;
                          setFormData(prev => ({ ...prev, schedules: newSchedules }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Tanggal Selesai
                        </label>
                        {formData.schedules && formData.schedules.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700 bg-transparent hover:bg-transparent"
                            onClick={() => {
                              const newSchedules = formData.schedules?.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, schedules: newSchedules }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        type="date"
                        min={schedule.start_date || new Date().toISOString().split('T')[0]}
                        value={schedule.end_date}
                        onChange={(e) => {
                          const newSchedules = [...(formData.schedules || [])];
                          newSchedules[index].end_date = e.target.value;
                          setFormData(prev => ({ ...prev, schedules: newSchedules }));
                        }}
                      />
                    </div>
                  </div>
                ))}
                {errors.schedules && <p className="text-red-500 text-sm">{errors.schedules}</p>}
              </CardContent>
            </Card>
          )}

          {/* Itinerary */}
          <Card>
            <CardHeader>
              <CardTitle>Itinerary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Area Penjemputan */}
              <div className="space-y-4 border-b pb-6">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Area Penjemputan</label>
                <div className="flex flex-wrap gap-2">
                  {formData.pickupAreas?.map((area) => (
                    <div key={area.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{area.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                           const newAreas = formData.pickupAreas.filter(a => a.id !== area.id);
                           setFormData(prev => ({ ...prev, pickupAreas: newAreas }));
                        }}
                        className="hover:text-red-600 focus:outline-none bg-transparent p-0 border-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="relative">
                  <Input
                    value={pickupQuery}
                    onChange={(e) => {
                      setPickupQuery(e.target.value);
                      setShowPickupDropdown(true);
                    }}
                    onFocus={() => {
                      setShowPickupDropdown(true);
                      if (pickupQuery) fetchCities(pickupQuery);
                    }}
                    placeholder="Cari area penjemputan..."
                  />
                  
                  {showPickupDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowPickupDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingCities ? (
                          <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                        ) : cities.length > 0 ? (
                          cities.map((city) => {
                             const isSelected = formData.pickupAreas.some(a => a.id === city.id);
                             if (isSelected) return null;
                             return (
                              <div
                                key={city.id}
                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    pickupAreas: [...prev.pickupAreas, city]
                                  }));
                                  setPickupQuery('');
                                  setShowPickupDropdown(false);
                                }}
                              >
                                {city.name}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-2 text-center text-sm text-gray-500">Tidak ada data</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {formData.itinerary.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Hari ke-{day.day}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const newItinerary = formData.itinerary.filter((_, i) => i !== dayIndex);
                        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                      }}
                      className="text-red-500 bg-transparent hover:bg-transparent"
                    >
                      Hapus Hari
                    </Button>
                  </div>
                  
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 p-3 rounded">
                        {/* Activity */}
                        <div className="md:col-span-3">
                          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Aktifitas</label>
                          <Input 
                            value={activity.description}
                            onChange={(e) => {
                              const newItinerary = [...formData.itinerary];
                              newItinerary[dayIndex].activities[actIndex].description = e.target.value;
                              setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                            }}
                            placeholder="Kegiatan..."
                          />
                        </div>

                        {/* City */}
                        <div className="md:col-span-3 relative">
                          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Kota</label>
                          <div 
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              className={`relative ${activeCityDropdown?.dayIndex === dayIndex && activeCityDropdown?.activityIndex === actIndex ? 'z-50' : ''}`}
                              value={
                                activeCityDropdown?.dayIndex === dayIndex && activeCityDropdown?.activityIndex === actIndex
                                  ? cityQuery
                                  : (activity.city?.name || '')
                              }
                              onChange={(e) => {
                                setCityQuery(e.target.value);
                                if (!activeCityDropdown || activeCityDropdown.dayIndex !== dayIndex || activeCityDropdown.activityIndex !== actIndex) {
                                  setActiveCityDropdown({ dayIndex, activityIndex: actIndex });
                                }
                              }}
                              onFocus={() => {
                                setActiveCityDropdown({ dayIndex, activityIndex: actIndex });
                                setCityQuery(activity.city?.name || '');
                                fetchCities(activity.city?.name || '');
                              }}
                              placeholder="Cari Kota..."
                            />
                            {activeCityDropdown?.dayIndex === dayIndex && activeCityDropdown?.activityIndex === actIndex && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setActiveCityDropdown(null)}
                                />
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                  {loadingCities ? (
                                    <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                                  ) : cities.length > 0 ? (
                                    cities.map((city) => (
                                      <div
                                        key={city.id}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          const newItinerary = [...formData.itinerary];
                                          newItinerary[dayIndex].activities[actIndex].city = city;
                                          setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                                          setActiveCityDropdown(null);
                                          setCityQuery('');
                                        }}
                                      >
                                        {city.name}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-center text-sm text-gray-500">Tidak ada data</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="md:col-span-5">
                          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Lokasi</label>
                          <Input 
                            value={activity.location}
                            onChange={(e) => {
                              const newItinerary = [...formData.itinerary];
                              newItinerary[dayIndex].activities[actIndex].location = e.target.value;
                              setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                            }}
                            placeholder="Lokasi spesifik..."
                          />
                        </div>

                        {/* Delete Action */}
                        <div className="md:col-span-1 flex justify-center pt-5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 bg-transparent hover:bg-transparent"
                            onClick={() => {
                              const newItinerary = [...formData.itinerary];
                              newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== actIndex);
                              setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-transparent hover:bg-transparent"
                      onClick={() => {
                        const newItinerary = [...formData.itinerary];
                        newItinerary[dayIndex].activities.push({ time: '09:00', description: '', location: '' });
                        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Tambah Kegiatan
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full bg-transparent hover:bg-transparent"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    itinerary: [...prev.itinerary, { 
                      day: prev.itinerary.length + 1, 
                      activities: [{ time: '08:00', description: '', location: '' }] 
                    }]
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Hari
              </Button>
            </CardContent>
          </Card>

          {/* Fasilitas */}
          <Card>
            <CardHeader>
              <CardTitle>Fasilitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input 
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[index] = e.target.value;
                      setFormData(prev => ({ ...prev, features: newFeatures }));
                    }}
                    placeholder="Contoh: Hotel Bintang 4"
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="bg-transparent hover:bg-transparent"
                    onClick={() => {
                      const newFeatures = formData.features.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, features: newFeatures }));
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))}
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Fasilitas
              </Button>
            </CardContent>
          </Card>

          {/* Harga Paket */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Harga Paket</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent hover:bg-transparent"
                  onClick={() => setFormData(prev => ({ ...prev, pricing: [...prev.pricing, { min_pax: 1, max_pax: 1, price: 0 }] }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Harga
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.pricing.map((price, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Min Pax
                      </label>
                      <Input 
                        type="number"
                        min="1"
                        value={price.min_pax}
                        onChange={(e) => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].min_pax = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, pricing: newPricing }));
                        }}
                        placeholder="Min Pax"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Max Pax
                      </label>
                      <Input 
                        type="number"
                        min="1"
                        value={price.max_pax}
                        onChange={(e) => {
                          const newPricing = [...formData.pricing];
                          newPricing[index].max_pax = parseInt(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, pricing: newPricing }));
                        }}
                        placeholder="Max Pax"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Harga (Rp)
                      </label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text"
                          value={price.price.toLocaleString()}
                          onChange={(e) => {
                            const newPricing = [...formData.pricing];
                            newPricing[index].price = parseInt(formatCurrency(e.target.value)) || 0;
                            setFormData(prev => ({ ...prev, pricing: newPricing }));
                          }}
                          placeholder="0"
                          className="flex-1"
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="bg-transparent hover:bg-transparent"
                          onClick={() => {
                            const newPricing = formData.pricing.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, pricing: newPricing }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {formData.pricing.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                  <p>Belum ada harga paket</p>
                  <Button 
                    variant="link" 
                    onClick={() => setFormData(prev => ({ ...prev, pricing: [...prev.pricing, { min_pax: 1, max_pax: 1, price: 0 }] }))}
                  >
                    Tambah Harga Baru
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Paket Addon</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent hover:bg-transparent"
                  onClick={() => setFormData(prev => ({ ...prev, addons: [...prev.addons, { description: '', price: 0 }] }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Addon
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.addons.map((addon, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Deskripsi
                      </label>
                      <Input 
                        value={addon.description}
                        onChange={(e) => {
                          const newAddons = [...formData.addons];
                          newAddons[index].description = e.target.value;
                          setFormData(prev => ({ ...prev, addons: newAddons }));
                        }}
                        placeholder="Contoh: Bed tambahan untuk 1 orang"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Harga (Rp)
                      </label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text"
                          value={addon.price.toLocaleString()}
                          onChange={(e) => {
                            const newAddons = [...formData.addons];
                            newAddons[index].price = parseInt(formatCurrency(e.target.value)) || 0;
                            setFormData(prev => ({ ...prev, addons: newAddons }));
                          }}
                          placeholder="0"
                          className="flex-1"
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="bg-transparent hover:bg-transparent"
                          onClick={() => {
                            const newAddons = formData.addons.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, addons: newAddons }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {formData.addons.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                  <p>Belum ada addon tambahan</p>
                  <Button 
                    variant="link" 
                    onClick={() => setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', description: '', price: 0 }] }))}
                  >
                    Tambah Addon Baru
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Images & Status */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                  {formData.thumbnail ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={removeThumbnail}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {thumbnailUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="cursor-pointer block p-8">
                      <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Klik untuk upload thumbnail (Wajib)</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                    </label>
                  )}
                </div>
                {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Galeri ({galleryPreviews.length}/10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {galleryPreviews.map((item, index) => (
                  <div key={index} className="relative aspect-square rounded overflow-hidden group">
                    <img src={item.url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {galleryPreviews.length < 10 && (
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center">
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload Foto</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleGalleryUpload} 
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status Publikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.status} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Publikasi (Aktif)</SelectItem>
                  <SelectItem value="inactive">Draft (Tidak Aktif)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Close Dropdown on Click Outside */}
      {activeCityDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveCityDropdown(null)}
        />
      )}

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50 flex justify-end lg:static lg:bg-transparent lg:border-none lg:p-0">
        <Button 
          onClick={handleSubmit} 
          disabled={thumbnailUploading || galleryPreviews.some(p => p.status === 'uploading')}
          className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Simpan Paket Wisata
        </Button>
      </div>
    </div>
  );
};
