import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Type, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import { uploadCommon, deleteCommon, api } from '@/lib/api';

const parseDuration = (str: string) => {
  const units = ['jam', 'hari', 'pekan', 'bulan'];
  const parts = str.trim().split(' ');
  let value = str;
  let unit = 'hari';
  
  if (parts.length > 1) {
    const last = parts[parts.length - 1].toLowerCase();
    if (units.includes(last)) {
      unit = last;
      value = parts.slice(0, -1).join(' ');
    }
  }
  return { value, unit };
};

export const ArmadaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Sample data for edit mode
  const sampleData = {
    id: 1,
    name: 'Toyota Hiace Premio',
    type: 'Minibus',
    capacity: 15,
    year: 2022,
    engine: '2.5L Diesel',
    features: ['AC', 'Reclining seats', 'Audio system', 'Safety equipment'],
    pickupPoints: [
      { id: 3173, name: 'Jakarta' },
      { id: 3201, name: 'Bandung' },
      { id: 3031, name: 'Yogyakarta' }
    ],
    rentalPrices: [
      { duration: '1-3 hari', price: 200000, type: 1 },
      { duration: '4-7 hari', price: 180000, type: 2 },
      { duration: '8+ hari', price: 160000, type: 1 }
    ],
    addons: [
      { name: 'Driver', description: 'Driver profesional', price: 100000 },
      { name: 'Bahan Bakar', description: 'Full tank', price: 500000 }
    ],
    status: 'active',
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop'],
    description: 'Minibus nyaman untuk perjalanan jarak jauh dengan fasilitas lengkap.',
    fuel_type: 'diesel',
    transmission: 'Manual'
  };

  const [formData, setFormData] = useState({
    name: isEdit ? sampleData.name : '',
    type: isEdit ? sampleData.type : '',
    capacity: isEdit ? sampleData.capacity : 0,
    year: isEdit ? sampleData.year : new Date().getFullYear(),
    engine: isEdit ? sampleData.engine : '',
    body: '',
    fuel_type: isEdit ? sampleData.fuel_type : '',
    transmission: isEdit ? sampleData.transmission : '',
    features: isEdit ? sampleData.features : [''],
    pickupPoints: isEdit ? sampleData.pickupPoints : [],
    rentalPrices: isEdit 
      ? sampleData.rentalPrices.map(p => {
          const { value, unit } = parseDuration(p.duration);
          return { ...p, duration: value, unit };
        })
      : [{ duration: '', unit: 'hari', price: 0, type: 1 }],
    addons: isEdit ? sampleData.addons : [{ name: '', description: '', price: 0 }],
    status: isEdit ? sampleData.status : 'active',
    images: isEdit ? sampleData.images : [],
    imageFiles: [] as string[],
    thumbnail: '',
    thumbnailFile: '',
    description: isEdit ? sampleData.description : ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Array<{ preview: string; status: 'uploading' | 'done' | 'error'; path?: string; url?: string }>>([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [fleetTypes, setFleetTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [loadingFleetTypes, setLoadingFleetTypes] = useState(false);
  const [bodyQuery, setBodyQuery] = useState('');
  const [engineQuery, setEngineQuery] = useState('');
  const [bodySuggestions, setBodySuggestions] = useState<string[]>([]);
  const [engineSuggestions, setEngineSuggestions] = useState<string[]>([]);
  const [showBodyDropdown, setShowBodyDropdown] = useState(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [loadingEngine, setLoadingEngine] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama armada wajib diisi';
    if (!String(formData.type).trim()) newErrors.type = 'Jenis armada wajib diisi';
    if (formData.capacity <= 0) newErrors.capacity = 'Kapasitas harus lebih dari 0';
    if (formData.year <= 0) newErrors.year = 'Tahun produksi harus valid';
    if (!formData.engine.trim()) newErrors.engine = 'Mesin wajib diisi';
    if (!formData.fuel_type) newErrors.fuel_type = 'Jenis bahan bakar wajib dipilih';
    if (!formData.transmission) newErrors.transmission = 'Transmisi wajib dipilih';
    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (!formData.thumbnail && formData.images.length === 0 && uploads.length === 0) newErrors.images = 'Minimal 1 gambar wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = Array.from(files)[0];
    const prevUrl = formData.thumbnail;
    const prevPath = formData.thumbnailFile;
    const previewUrl = URL.createObjectURL(file);
    if (prevPath) {
      try { await deleteCommon([prevPath]); } catch { void 0; }
    }
    setFormData((prev) => ({ ...prev, thumbnail: previewUrl, thumbnailFile: '' }));
    setThumbnailUploading(true);
    try {
      const res = await uploadCommon('armada', [file]);
      if (res.status === 'success') {
        const data = res.data as { files?: string[]; first_url?: string } | undefined;
        const path = Array.isArray(data?.files) && data!.files!.length > 0 ? data!.files![0] : '';
        setFormData((prev) => ({ ...prev, thumbnailFile: path }));
      }
    } finally {
      setThumbnailUploading(false);
      if (prevUrl && prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch { void 0; }
      }
    }
  };

  const removeThumbnail = async () => {
    const p = formData.thumbnailFile;
    if (p) {
      try {
        await deleteCommon([p]);
      } catch { void 0; }
    }
    if (formData.thumbnail && formData.thumbnail.startsWith('blob:')) {
      try { URL.revokeObjectURL(formData.thumbnail); } catch { void 0; }
    }
    setFormData((prev) => ({ ...prev, thumbnailFile: '', thumbnail: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const addonItems = formData.addons
        .filter((a) => a && (a.name?.trim() || a.description?.trim() || (a.price ?? 0) > 0))
        .map((a) => ({ addon_name: a.name, description: a.description, price: a.price }));

      const payload = {
        fleet_name: formData.name,
        fleet_type: formData.type,
        capacity: formData.capacity,
        production_year: formData.year,
        engine: formData.engine,
        body: formData.body,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        description: formData.description,
        active: formData.status === 'active',
        pickup_point: formData.pickupPoints.map((p: any) => p?.id ?? p),
        fascilities: formData.features.filter((x) => x.trim()),
        prices: formData.rentalPrices.map((p) => ({ duration: parseInt(String(p.duration).replace(/\D/g, '')) || 0, rent_category: (typeof p.type === 'number' ? p.type : (String(p.type).toLowerCase() === 'citytour' ? 1 : (String(p.type).toLowerCase() === 'overland' ? 2 : 3))), price: p.price, uom: (p as any).unit || 'hari' })),
        ...(addonItems.length > 0 ? { addon: addonItems } : {}),
        thumbnail: formData.thumbnailFile || undefined,
        images: formData.imageFiles,
      };
      const token = localStorage.getItem('token') ?? '';
      api.post<unknown>('/partner/services/fleet/create', payload, token ? { Authorization: token } : undefined)
        .then((res) => {
          if (res.status === 'success') {
            navigate('/dashboard/partner/services/fleet');
          }
        });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxAllowed = 10 - uploads.length;
    const pick = Array.from(files).slice(0, Math.max(0, maxAllowed));
    if (pick.length < files.length) {
      alert('Maksimal 10 gambar');
    }
    const previews = pick.map((f) => URL.createObjectURL(f));
    setUploads((prev) => [...prev, ...previews.map((p) => ({ preview: p, status: 'uploading' as const }))]);
    try {
      const res = await uploadCommon('armada', pick);
      if (res.status === 'success') {
        const data = res.data as { files?: string[]; count?: number; first_url?: string } | undefined;
        const returnedFiles = Array.isArray(data?.files) ? data!.files! : [];
        setFormData((prev) => ({ ...prev, imageFiles: [...prev.imageFiles, ...returnedFiles], images: [...prev.images, ...(returnedFiles.map((p) => data?.first_url ?? p))] }));
        setUploads((prev) => {
          const updated = [...prev];
          let idx = updated.findIndex((u) => u.status === 'uploading');
          for (let i = 0; i < returnedFiles.length && idx !== -1; i++) {
            updated[idx] = { ...updated[idx], status: 'done', path: returnedFiles[i], url: data?.first_url ?? undefined };
            idx = updated.findIndex((u) => u.status === 'uploading');
          }
          return updated;
        });
      } else {
        setUploads((prev) => prev.map((u) => (u.status === 'uploading' ? { ...u, status: 'error' } : u)));
      }
    } catch {
      setUploads((prev) => prev.map((u) => (u.status === 'uploading' ? { ...u, status: 'error' } : u)));
    }
  };

  const removeImage = async (index: number) => {
    const item = uploads[index];
    if (item?.path) {
      try {
        await deleteCommon([item.path]);
      } catch { void 0; }
      setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index), imageFiles: prev.imageFiles.filter((p) => p !== item.path) }));
    }
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addPickupPoint = () => {
    const val = cityQuery.trim();
    if (val) {
      const found = cities.find((c) => c.name.toLowerCase() === val.toLowerCase());
      if (found) {
        const exists = formData.pickupPoints.some((p: any) => (p?.id ?? p) === found.id);
        if (!exists) {
          setFormData(prev => ({
            ...prev,
            pickupPoints: [...prev.pickupPoints, { id: found.id, name: found.name }]
          }));
        }
      }
      setCityQuery('');
      setShowCityDropdown(false);
    }
  };

  const removePickupPoint = (id: number) => {
    setFormData(prev => ({
      ...prev,
      pickupPoints: prev.pickupPoints.filter((p: any) => (p?.id ?? p) !== id)
    }));
  };

  const addRentalPrice = () => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: [...prev.rentalPrices, { duration: '', unit: 'hari', price: 0, type: 1 }]
    }));
  };

  const removeRentalPrice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: prev.rentalPrices.filter((_, i) => i !== index)
    }));
  };

  const updateRentalPrice = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: prev.rentalPrices.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
  };

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', description: '', price: 0 }]
    }));
  };

  const removeAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const updateAddon = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    }));
  };

  // WYSIWYG Editor Functions
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      handleInputChange('description', content);
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

  useEffect(() => {
    async function fetchFleetTypes() {
      setLoadingFleetTypes(true);
      const res = await api.get<unknown>('/general/fleet-types');
      if (res.status === 'success') {
        const payload = res.data as unknown;
        let list: Array<{ id: string; label: string }> = [];
        if (Array.isArray(payload)) {
          list = payload
            .map((x) => {
              const id = (x as { id?: unknown }).id;
              const label = (x as { label?: unknown }).label ?? (x as { name?: unknown }).name;
              return typeof id !== 'undefined' && typeof label === 'string'
                ? { id: String(id), label: String(label) }
                : null;
            })
            .filter((x): x is { id: string; label: string } => Boolean(x));
        } else if (payload && typeof payload === 'object') {
          const items = (payload as Record<string, unknown>).items;
          if (Array.isArray(items)) {
            list = items
              .map((x) => {
                const id = (x as { id?: unknown }).id;
                const label = (x as { label?: unknown }).label ?? (x as { name?: unknown }).name;
                return typeof id !== 'undefined' && typeof label === 'string'
                  ? { id: String(id), label: String(label) }
                  : null;
              })
              .filter((x): x is { id: string; label: string } => Boolean(x));
          }
        }
        setFleetTypes(list);
      } else {
        setFleetTypes([]);
      }
      setLoadingFleetTypes(false);
    }
    fetchFleetTypes();
  }, []);

  async function fetchBody(q: string) {
    setLoadingBody(true);
    const token = localStorage.getItem('token') ?? '';
    const res = await api.get<unknown>(`/general/fleet-body${q ? `?search=${encodeURIComponent(q)}` : ''}`, token ? { Authorization: token } : undefined);
    if (res.status === 'success') {
      const payload = res.data as unknown;
      let list: string[] = [];
      if (Array.isArray(payload)) {
        list = (payload as unknown[])
          .map((x) => {
            if (typeof x === 'string') return x;
            const n = (x as { name?: unknown }).name;
            return typeof n === 'string' ? n : '';
          })
          .filter((n) => n);
      } else if (payload && typeof payload === 'object') {
        const items = (payload as Record<string, unknown>).items;
        if (Array.isArray(items)) {
          list = items
            .map((x) => {
              const n = (x as { name?: unknown }).name;
              return typeof n === 'string' ? n : '';
            })
            .filter((n) => n);
        }
      }
      setBodySuggestions(list);
    } else {
      setBodySuggestions([]);
    }
    setLoadingBody(false);
  }

  async function fetchEngine(q: string) {
    setLoadingEngine(true);
    const token = localStorage.getItem('token') ?? '';
    const res = await api.get<unknown>(`/general/fleet-engine${q ? `?search=${encodeURIComponent(q)}` : ''}`, token ? { Authorization: token } : undefined);
    if (res.status === 'success') {
      const payload = res.data as unknown;
      let list: string[] = [];
      if (Array.isArray(payload)) {
        list = (payload as unknown[])
          .map((x) => {
            if (typeof x === 'string') return x;
            const n = (x as { name?: unknown }).name;
            return typeof n === 'string' ? n : '';
          })
          .filter((n) => n);
      } else if (payload && typeof payload === 'object') {
        const items = (payload as Record<string, unknown>).items;
        if (Array.isArray(items)) {
          list = items
            .map((x) => {
              const n = (x as { name?: unknown }).name;
              return typeof n === 'string' ? n : '';
            })
            .filter((n) => n);
        }
      }
      setEngineSuggestions(list);
    } else {
      setEngineSuggestions([]);
    }
    setLoadingEngine(false);
  }

  useEffect(() => {
    if (!showBodyDropdown) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchBody(bodyQuery), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [bodyQuery, showBodyDropdown]);

  useEffect(() => {
    if (!showEngineDropdown) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchEngine(engineQuery), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [engineQuery, showEngineDropdown]);

  async function fetchCities(q: string) {
    setLoadingCities(true);
    const res = await api.get<unknown>(`/general/cities${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    if (res.status === 'success') {
      const payload = res.data as unknown;
      let list: Array<{ id: number; name: string }> = [];
      if (Array.isArray(payload)) {
        list = (payload as unknown[])
          .map((x, i) => {
            if (typeof x === 'string') return { id: -1, name: x };
            const n = (x as { name?: unknown }).name;
            const idRaw = (x as { id?: unknown }).id;
            const name = typeof n === 'string' ? n : '';
            const id = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw) || i : i);
            return name ? { id, name } : null;
          })
          .filter((v): v is { id: number; name: string } => Boolean(v));
      } else if (payload && typeof payload === 'object') {
        const items = (payload as Record<string, unknown>).items;
        if (Array.isArray(items)) {
          list = items
            .map((x, i) => {
              const n = (x as { name?: unknown }).name;
              const idRaw = (x as { id?: unknown }).id;
              const name = typeof n === 'string' ? n : '';
              const id = typeof idRaw === 'number' ? idRaw : (typeof idRaw === 'string' ? parseInt(idRaw) || i : i);
              return name ? { id, name } : null;
            })
            .filter((v): v is { id: number; name: string } => Boolean(v));
        }
      }
      setCities(list);
    } else {
      setCities([]);
    }
    setLoadingCities(false);
  }

  useEffect(() => {
    if (!showCityDropdown) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchCities(cityQuery);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [cityQuery, showCityDropdown]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/partner/services/fleet')}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Armada' : 'Tambah Armada'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {isEdit ? 'Ubah informasi armada' : 'Tambahkan armada baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

            {/* Thumbnail Section - Single image */}
        <Card>
          <CardHeader>
            <CardTitle>Gambar Thumbnail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Thumbnail</span>
              </Button>
              {thumbnailUploading && <span className="text-sm text-gray-500">Mengunggah...</span>}
            </div>
            
            {formData.thumbnail && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative group rounded-lg border overflow-hidden">
                  <AspectRatio ratio={4 / 3}>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
          </CardContent>
        </Card>

        {/* Basic Information - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Nama Armada *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama armada"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Jenis Armada *
                </label>
                <Select value={String(formData.type)} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder={loadingFleetTypes ? 'Memuat...' : 'Pilih jenis'} />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Mesin *
                </label>
                <Input
                  value={formData.engine}
                  onChange={(e) => { handleInputChange('engine', e.target.value); setEngineQuery(e.target.value); }}
                  placeholder="Contoh: 2.5L Diesel"
                  className={errors.engine ? 'border-red-500' : ''}
                  onFocus={() => { setShowEngineDropdown(true); fetchEngine(''); }}
                  onBlur={() => { window.setTimeout(() => setShowEngineDropdown(false), 150); }}
                />
                {showEngineDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white z-10">
                    {loadingEngine ? (
                      <div className="p-2 text-sm text-gray-500">Memuat...</div>
                    ) : engineSuggestions.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
                    ) : (
                      engineSuggestions.map((name, idx) => (
                        <button
                          key={`eng-${name}-${idx}`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-900"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { handleInputChange('engine', name); setEngineQuery(name); setShowEngineDropdown(false); }}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {errors.engine && <p className="text-sm text-red-500 mt-1">{errors.engine}</p>}
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Body
                </label>
                <Input
                  value={formData.body}
                  onChange={(e) => { handleInputChange('body', e.target.value); setBodyQuery(e.target.value); }}
                  placeholder="Contoh: Hiace, Elf, Bus Besar"
                  onFocus={() => { setShowBodyDropdown(true); fetchBody(''); }}
                  onBlur={() => { window.setTimeout(() => setShowBodyDropdown(false), 150); }}
                />
                {showBodyDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white z-10">
                    {loadingBody ? (
                      <div className="p-2 text-sm text-gray-500">Memuat...</div>
                    ) : bodySuggestions.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
                    ) : (
                      bodySuggestions.map((name, idx) => (
                        <button
                          key={`body-${name}-${idx}`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-900"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { handleInputChange('body', name); setBodyQuery(name); setShowBodyDropdown(false); }}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Jenis Bahan Bakar *
                </label>
                <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                  <SelectTrigger className={errors.fuel_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih Bahan Bakar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="bbg">BBG</SelectItem>
                    <SelectItem value="bensin">Bensin</SelectItem>
                    <SelectItem value="listrik">Listrik</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuel_type && <p className="text-sm text-red-500 mt-1">{errors.fuel_type}</p>}
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Transmisi *
                </label>
                <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                  <SelectTrigger className={errors.transmission ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih Transmisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transmission && <p className="text-sm text-red-500 mt-1">{errors.transmission}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Tahun Produksi *
                </label>
                <Input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
                  placeholder="2022"
                  className={errors.year ? 'border-red-500' : ''}
                  style={{ colorScheme: 'light' }}
                />
                {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Kapasitas (pax) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 15"
                  className={errors.capacity ? 'border-red-500' : ''}
                  style={{ colorScheme: 'light' }}
                />
                {errors.capacity && <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Titik Jemput
                </label>
                <div className="space-y-2">
                  <div className="relative flex space-x-2">
                    <Input
                      value={cityQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setCityQuery(q);
                        if (!showCityDropdown) {
                          setShowCityDropdown(true);
                        }
                      }}
                      placeholder="Masukkan titik jemput"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPickupPoint();
                        }
                      }}
                      onFocus={() => {
                        setShowCityDropdown(true);
                        fetchCities('');
                      }}
                      onBlur={() => {
                        window.setTimeout(() => setShowCityDropdown(false), 150);
                      }}
                    />
                    {showCityDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-white z-10">
                        {loadingCities ? (
                          <div className="p-2 text-sm text-gray-500">Memuat...</div>
                        ) : cities.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
                        ) : (
                          cities.map((city, idx) => (
                            <button
                              key={`${city.name}-${city.id}-${idx}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-900"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const exists = formData.pickupPoints.some((p: any) => (p?.id ?? p) === city.id);
                                if (!exists) {
                                  setFormData((prev) => ({ ...prev, pickupPoints: [...prev.pickupPoints, { id: city.id, name: city.name }] }));
                                }
                                setCityQuery('');
                                setShowCityDropdown(false);
                              }}
                            >
                              {city.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPickupPoint}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.pickupPoints.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.pickupPoints.map((point: any, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{point?.name ?? String(point)}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removePickupPoint(point?.id ?? point)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Deskripsi *
              </label>
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
                  className={`min-h-[150px] p-3 border-0 resize-none focus:outline-none ${errors.description ? 'border-red-500' : ''}`}
                  style={{ 
                    minHeight: '150px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                  data-placeholder="Deskripsikan armada secara detail..."
                />
              </div>
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Gambar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Gallery Gambar</span>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Gambar</span>
                </Button>
                <span className="text-sm text-gray-500">Maksimal 10 gambar ({uploads.length}/10)</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploads.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploads.map((item, index) => (
                  <div key={index} className="relative group rounded-lg border overflow-hidden">
                    <AspectRatio ratio={4 / 3}>
                      <img src={item.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    </AspectRatio>
                    {item.status !== 'done' && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Features - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fasilitas</span>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Fasilitas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Masukkan fasilitas"
                    className="flex-1"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rental Prices - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Harga Sewa</span>
              <Button type="button" variant="outline" size="sm" onClick={addRentalPrice}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Durasi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.rentalPrices.map((price, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Durasi
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        value={price.duration}
                        onChange={(e) => updateRentalPrice(index, 'duration', e.target.value)}
                        placeholder="1"
                        className="flex-1"
                      />
                      <Select
                        value={(price as any).unit || 'hari'}
                        onValueChange={(value) => updateRentalPrice(index, 'unit', value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jam">Jam</SelectItem>
                          <SelectItem value="hari">Hari</SelectItem>
                          <SelectItem value="pekan">Pekan</SelectItem>
                          <SelectItem value="bulan">Bulan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Jenis Sewa
                    </label>
                    <Select 
                      value={String(price.type)} 
                      onValueChange={(value) => updateRentalPrice(index, 'type', parseInt(value) || 0)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis sewa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Citytour (Dalam Kota)</SelectItem>
                        <SelectItem value="2">Overland (Luar Kota)</SelectItem>
                        <SelectItem value="3">Citytour Pickup / Drop only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga (Rp)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={price.price.toLocaleString()}
                        onChange={(e) => updateRentalPrice(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                        placeholder="200,000"
                        className="flex-1"
                      />
                      {formData.rentalPrices.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRentalPrice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Addon Packages - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Paket Addon</span>
              <Button type="button" variant="outline" size="sm" onClick={addAddon}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Addon
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.addons.map((addon, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Nama Addon
                    </label>
                    <Input
                      value={addon.name}
                      onChange={(e) => updateAddon(index, 'name', e.target.value)}
                      placeholder="Contoh: Driver"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Deskripsi
                    </label>
                    <Input
                      value={addon.description}
                      onChange={(e) => updateAddon(index, 'description', e.target.value)}
                      placeholder="Contoh: Driver profesional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga Tambahan (Rp)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={addon.price.toLocaleString()}
                        onChange={(e) => updateAddon(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                        placeholder="100,000"
                        className="flex-1"
                      />
                      {formData.addons.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAddon(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

    {/* Bottom Buttons */}
    <div className="flex justify-between items-center pt-6 border-t">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Status:
        </label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/partner/services/fleet')}
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
        
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Armada' : 'Simpan Armada'}
          </Button>
      </div>
    </div>
      </form>
    </div>
  );
};
