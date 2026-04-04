import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Type, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { uploadCommon, deleteCommon, api, toFileUrl } from '@/lib/api';
import Swal from 'sweetalert2';

export const ArmadaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const isEdit = Boolean(id);
  const isUuid = (value: unknown): value is string =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: 0,
    year: new Date().getFullYear(),
    engine: '',
    body: '',
    fuel_type: '',
    transmission: '',
    features: [''],
    pickupPoints: [] as Array<{ id: number; name: string; uuid?: string }>,
    rentalPrices: [{ uuid: undefined as string | undefined, duration: '', unit: 'hari', price: 0, type: 1 }],
    addons: [{ uuid: undefined as string | undefined, name: '', description: '', price: 0 }],
    status: 'active',
    images: [] as string[],
    imageFiles: [] as string[],
    thumbnail: '',
    thumbnailFile: '',
    description: ''
  });

  const editorRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Array<{ uuid?: string; preview: string; status: 'uploading' | 'done' | 'error'; path?: string; url?: string }>>([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (validateForm()) {
      setSaving(true);
      const addonItems = formData.addons
        .filter((a) => a && (a.name?.trim() || a.description?.trim() || (a.price ?? 0) > 0))
        .map((a) => ({
          ...(isUuid(a.uuid) ? { uuid: a.uuid } : {}),
          addon_name: a.name,
          description: a.description,
          price: a.price,
        }));

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
        is_public: formData.status === 'active' ? 1 : 0,
        pickup_point: isEdit
          ? formData.pickupPoints.map((p) => ({
              ...(isUuid(p.uuid) ? { uuid: p.uuid } : {}),
              city_id: p.id,
            }))
          : formData.pickupPoints.map((p) => p.id),
        fascilities: formData.features.filter((x) => x.trim()),
        prices: formData.rentalPrices.map((p) => ({
          ...(isUuid(p.uuid) ? { uuid: p.uuid } : {}),
          duration: parseInt(String(p.duration).replace(/\D/g, '')) || 0,
          rent_category:
            typeof p.type === 'number'
              ? p.type
              : String(p.type).toLowerCase() === 'citytour'
                ? 1
                : String(p.type).toLowerCase() === 'overland'
                  ? 2
                  : 3,
          price: p.price,
          uom: (p as any).unit || 'hari',
        })),
        ...(addonItems.length > 0 ? { addon: addonItems } : {}),
        thumbnail: formData.thumbnailFile || undefined,
        images: formData.imageFiles,
      };
      const token = localStorage.getItem('token') ?? '';
      const endpoint = isEdit ? '/services/fleet/update' : '/services/fleet/create';
      const body = isEdit && id ? { fleet_id: decodeURIComponent(id), ...payload } : payload;
      try {
        const res = await api.post<unknown>(endpoint, body, token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          navigate(`${basePrefix}/services/fleet`);
        }
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(false);
    }
  };

  const handleInactive = async () => {
    if (!id) return;
    const result = await Swal.fire({
      title: 'Nonaktifkan armada?',
      text: 'Armada akan diset menjadi tidak aktif.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, nonaktifkan',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const res = await api.post<unknown>('/services/fleet/inactive', { fleet_id: id }, token ? { Authorization: token } : undefined);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Armada berhasil dinonaktifkan.' });
      setFormData(prev => ({ ...prev, status: 'inactive' }));
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
        setFormData((prev) => ({
          ...prev,
          imageFiles: [...prev.imageFiles, ...returnedFiles],
          images: [...prev.images, ...returnedFiles.map((p) => toFileUrl(data?.first_url ?? p))],
        }));
        setUploads((prev) => {
          const updated = [...prev];
          let idx = updated.findIndex((u) => u.status === 'uploading');
          for (let i = 0; i < returnedFiles.length && idx !== -1; i++) {
            updated[idx] = { ...updated[idx], status: 'done', path: returnedFiles[i], url: toFileUrl(data?.first_url ?? returnedFiles[i]) };
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
      rentalPrices: [...prev.rentalPrices, { uuid: undefined, duration: '', unit: 'hari', price: 0, type: 1 }]
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
      addons: [...prev.addons, { uuid: undefined, name: '', description: '', price: 0 }]
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
    const toServerPath = (value: string) => {
      if (!value) return '';
      if (value.startsWith('http')) {
        try {
          const u = new URL(value);
          return u.pathname.replace(/^\/+/, '');
        } catch {
          return value;
        }
      }
      return value.replace(/^\/+/, '');
    };

    const loadDetail = async () => {
      if (!isEdit || !id) return;
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const fleetId = decodeURIComponent(id);
      const res = await api.get<unknown>(`/services/fleet/id?fleet_id=${encodeURIComponent(fleetId)}`, headers);
      if (res.status !== 'success') return;

      const payload = res.data as unknown;
      const p = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
      const meta = p.meta as unknown;
      const facilities = p.facilities as unknown;
      const pickup = p.pickup as unknown;
      const addon = p.addon as unknown;
      const pricing = p.pricing as unknown;
      const images = p.images as unknown;

      const metaObj = meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {};
      const name = typeof metaObj.fleet_name === 'string' ? metaObj.fleet_name : '';
      const type = typeof metaObj.fleet_type === 'string' ? metaObj.fleet_type : '';
      const capacity = typeof metaObj.capacity === 'number' ? metaObj.capacity : Number(metaObj.capacity ?? 0);
      const year = typeof metaObj.production_year === 'number'
        ? metaObj.production_year
        : typeof metaObj.production_year === 'string'
          ? Number(metaObj.production_year)
          : typeof metaObj.year === 'number'
            ? metaObj.year
            : new Date().getFullYear();
      const engine = typeof metaObj.engine === 'string' ? metaObj.engine : '';
      const body = typeof metaObj.body === 'string' ? metaObj.body : '';
      const fuel_type = typeof metaObj.fuel_type === 'string' ? metaObj.fuel_type : '';
      const transmission = typeof metaObj.transmission === 'string' ? metaObj.transmission : '';
      const description = typeof metaObj.description === 'string' ? metaObj.description : '';

      const activeRaw = metaObj.active ?? metaObj.status;
      const active =
        typeof activeRaw === 'boolean'
          ? activeRaw
          : activeRaw === 1 || activeRaw === '1'
            ? true
            : activeRaw === 0 || activeRaw === '0'
              ? false
              : true;
      const status = active ? 'active' : 'inactive';

      const facilitiesArr = Array.isArray(facilities)
        ? (facilities as unknown[]).map((x) => (typeof x === 'string' ? x : '')).filter((x) => x)
        : [];

      const pickupArr = Array.isArray(pickup)
        ? (pickup as unknown[])
            .map((x) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const uuid = isUuid(obj.uuid) ? obj.uuid : undefined;
              const city_id = typeof obj.city_id === 'number' ? obj.city_id : Number(obj.city_id ?? 0);
              const city_name = typeof obj.city_name === 'string' ? obj.city_name : '';
              return city_id ? { uuid, id: city_id, name: city_name || String(city_id) } : null;
            })
            .filter((v): v is { uuid: string | undefined; id: number; name: string } => v !== null)
        : [];

      const addonArr = Array.isArray(addon)
        ? (addon as unknown[])
            .map((x) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const uuid = isUuid(obj.uuid) ? obj.uuid : undefined;
              const nameVal = obj.addon_name ?? obj.name ?? obj.title;
              const descriptionVal = obj.addon_desc ?? obj.description;
              const priceVal = obj.addon_price ?? obj.price;
              const name = typeof nameVal === 'string' ? nameVal : '';
              const description = typeof descriptionVal === 'string' ? descriptionVal : '';
              const price = typeof priceVal === 'number' ? priceVal : Number(priceVal ?? 0);
              return name || description || price ? { uuid, name, description, price } : null;
            })
            .filter((v): v is { uuid: string | undefined; name: string; description: string; price: number } => v !== null)
        : [];

      const pricingArr = Array.isArray(pricing)
        ? (pricing as unknown[])
            .map((x) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const uuid = isUuid(obj.uuid) ? obj.uuid : undefined;
              const durationNum = typeof obj.duration === 'number' ? obj.duration : Number(obj.duration ?? 0);
              const uom = typeof obj.uom === 'string' ? obj.uom : 'hari';
              const rent_type = typeof obj.rent_type === 'number' ? obj.rent_type : Number(obj.rent_type ?? 1);
              const disc_price = typeof obj.disc_price === 'number' ? obj.disc_price : Number(obj.disc_price ?? 0);
              const base_price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
              const price = disc_price > 0 ? disc_price : base_price;
              return durationNum > 0 ? { uuid, duration: String(durationNum), unit: uom, price, type: rent_type } : null;
            })
            .filter((v): v is { uuid: string | undefined; duration: string; unit: string; price: number; type: number } => v !== null)
        : [];

      const thumbnailUrl = typeof metaObj.thumbnail === 'string' ? metaObj.thumbnail : '';
      const thumbnailFile = toServerPath(thumbnailUrl);
      const thumbnailDisplayUrl = toFileUrl(thumbnailUrl);

      const imagesRaw = Array.isArray(images)
        ? (images as unknown[])
        : Array.isArray((meta as unknown as { images?: unknown[] })?.images)
          ? ((meta as unknown as { images?: unknown[] }).images as unknown[])
          : [];
      const imageItems = imagesRaw
        .map((x) => {
          if (typeof x === 'string') {
            const path = toServerPath(x);
            return path ? { uuid: undefined, url: toFileUrl(x), path } : null;
          }
          if (x && typeof x === 'object') {
            const obj = x as Record<string, unknown>;
            const uuid = isUuid(obj.uuid) ? obj.uuid : undefined;
            const url = obj.path_file ?? obj.url ?? obj.path;
            const u = typeof url === 'string' ? url : '';
            const path = toServerPath(u);
            return path ? { uuid, url: toFileUrl(u), path } : null;
          }
          return null;
        })
        .filter((v): v is { uuid: string | undefined; url: string; path: string } => v !== null);

      const seen = new Set<string>();
      const uniqueImageItems = imageItems.filter((it) => {
        const key = it.path;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const imageFiles = uniqueImageItems.map((x) => x.path);

      setUploads(uniqueImageItems.map((u) => ({ uuid: u.uuid, preview: u.url, status: 'done' as const, path: u.path, url: u.url })));
      setFormData((prev) => ({
        ...prev,
        name,
        type,
        capacity: Number.isFinite(capacity) ? capacity : 0,
        year: Number.isFinite(year) ? year : prev.year,
        engine,
        body,
        fuel_type,
        transmission,
        features: facilitiesArr.length > 0 ? facilitiesArr : [''],
        pickupPoints: pickupArr,
        rentalPrices: pricingArr.length > 0 ? pricingArr : [{ uuid: undefined, duration: '', unit: 'hari', price: 0, type: 1 }],
        addons: addonArr.length > 0 ? addonArr : [{ uuid: undefined, name: '', description: '', price: 0 }],
        status,
        thumbnail: thumbnailDisplayUrl,
        thumbnailFile,
        images: uniqueImageItems.map((x) => x.url),
        imageFiles,
        description,
      }));
      setBodyQuery(body);
      setEngineQuery(engine);
      setShowBodyDropdown(false);
      setShowEngineDropdown(false);
    };

    loadDetail();
  }, [isEdit, id]);

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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/partner/services/fleet')}
          className="!w-auto !h-auto p-2 bg-transparent hover:bg-transparent"
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
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
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
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
                          className="bg-transparent hover:bg-transparent"
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

            {/* Features - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fasilitas</span>
                  <Button type="button" variant="outline" size="sm" className="bg-transparent hover:bg-transparent" onClick={addFeature}>
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
                          variant="ghost"
                          size="icon"
                          className="bg-transparent hover:bg-transparent"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
                  <Button type="button" variant="outline" size="sm" className="bg-transparent hover:bg-transparent" onClick={addRentalPrice}>
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
                              variant="ghost"
                              size="icon"
                              className="bg-transparent hover:bg-transparent"
                              onClick={() => removeRentalPrice(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
                  <Button type="button" variant="outline" size="sm" className="bg-transparent hover:bg-transparent" onClick={addAddon}>
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
                              variant="ghost"
                              size="icon"
                              className="bg-transparent hover:bg-transparent"
                              onClick={() => removeAddon(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2 justify-start">
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  onClick={handleInactive}
                  disabled={saving || formData.status === 'inactive'}
                >
                  Nonaktifkan Armada
                </Button>
              )}
              <Button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Armada'}
              </Button>
            </div>
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
                        type="button"
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
                {errors.images && !formData.thumbnail && <p className="text-red-500 text-sm">{errors.images}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Galeri ({uploads.length}/10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {uploads.map((item, index) => (
                  <div key={index} className="relative aspect-square rounded overflow-hidden group">
                    <img src={item.preview} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeImage(index)}
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
              
              {uploads.length < 10 && (
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
                    onChange={handleImageUpload} 
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
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Publish</SelectItem>
                    <SelectItem value="inactive">Hanya Internal</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>

      </form>
    </div>
  );
};
