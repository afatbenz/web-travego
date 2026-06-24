import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Type, Loader2, ImageIcon, BusFront, Tags, Layers, Package2, SlidersHorizontal, Globe, ShieldCheck, Info} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import CreatableSelect from 'react-select/creatable';
import { uploadCommon, deleteCommon, api, toFileUrl } from '@/lib/api';
import Swal from 'sweetalert2';

// Dynamic Icon Helper
const DynamicIcon = ({ name, ...props }: { name?: string; size?: number; className?: string }) => {
  // Trim whitespace dari nama icon
  const trimmedName = name?.trim();
  // Coba dapatkan icon dari LucideIcons, fallback ke Check jika tidak ditemukan
  const Icon = (LucideIcons as any)[trimmedName] || (LucideIcons as any).Check;
  return <Icon {...props} />;
};

export const ArmadaForm: React.FC = () => {
  // Facility Option Type
  type FacilityOption = {
    value: string;
    label: string;
    icon?: string;
    isManual?: boolean;
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const isEdit = Boolean(id);
  const normalizeSelectKey = (value: unknown): string =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
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
  const [fuelTypes, setFuelTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingFuelTypes, setLoadingFuelTypes] = useState(false);
  const [metaFleetType, setMetaFleetType] = useState('');
  const [metaFuelType, setMetaFuelType] = useState('');
  const [bodyQuery, setBodyQuery] = useState('');
  const [bodySuggestions, setBodySuggestions] = useState<string[]>([]);
  const [showBodyDropdown, setShowBodyDropdown] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<FacilityOption[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [manualFacilities, setManualFacilities] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama armada wajib diisi';
    if (!String(formData.type).trim()) newErrors.type = 'Jenis armada wajib diisi';
    if (!formData.fuel_type) newErrors.fuel_type = 'Jenis bahan bakar wajib dipilih';
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
    console.log("test saving ... ", saving)
    if (saving) return;

    if (validateForm()) {
      console.log(".... validate form ...")
      setSaving(true);
      const addonItems = formData.addons
        .filter((a) => a && (a.name?.trim() || a.description?.trim() || (a.price ?? 0) > 0))
        .map((a) => ({
          ...(isUuid(a.uuid) ? { uuid: a.uuid } : {}),
          addon_name: a.name,
          description: a.description,
          price: a.price,
        }));

      setManualFacilities(
        selectedFacilities.filter(f => f.isManual).map(f => f.label)
      );

      const facilityIds = selectedFacilities
        .filter(f => !f.isManual)
        .map(f => f.value);

      const payload = {
        fleet_name: formData.name,
        fleet_type: formData.type,
        body: formData.body,
        fuel_type: formData.fuel_type,
        description: formData.description,
        active: formData.status === 'active',
        is_public: formData.status === 'active' ? 1 : 0,
        pickup_point: isEdit
          ? formData.pickupPoints.map((p) => ({
              ...(isUuid(p.uuid) ? { uuid: p.uuid } : {}),
              city_id: p.id,
            }))
          : formData.pickupPoints.map((p) => p.id),
        facility_ids: facilityIds,
        fascilities: manualFacilities,
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
          uom: 'hari',
        })),
        ...(addonItems.length > 0 ? { addon: addonItems } : {}),
        thumbnail: formData.thumbnailFile ? toFileUrl(formData.thumbnailFile) : undefined,
        images: formData.imageFiles.map((img) => toFileUrl(img)),
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
      console.log("error validate")
      setSaving(false);
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        html: Object.values(errors)
          .filter(msg => msg)
          .map(msg => `• ${msg}`)
          .join('<br/>'),
        confirmButtonColor: '#4F6BFF',
      });
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

  const addPickupPoint = () => {
    const val = cityQuery.trim();
    if (val) {
      const found = cities.find((c) => c.name.toLowerCase() === val.toLowerCase());
      if (found) {
        const exists = formData.pickupPoints.some((p) => p.id === found.id);
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
      pickupPoints: prev.pickupPoints.filter((p) => p.id !== id)
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
      const res = await api.post<unknown>('/services/fleet/detail', { fleet_id: fleetId }, headers);
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
      setMetaFleetType(type);
      setMetaFuelType(fuel_type);

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
              const uom = 'hari';
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
      // Load existing facilities as manual for now
      const initialFacilities: FacilityOption[] = facilitiesArr.map(name => ({
        value: name,
        label: name,
        isManual: true,
        icon: 'Tag'
      }));
      setSelectedFacilities(initialFacilities);
      setBodyQuery(body);
      setShowBodyDropdown(false);
    };

    loadDetail();
  }, [isEdit, id]);

  // Fetch facilities on component mount
  useEffect(() => {
    fetchFacilities();
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

  useEffect(() => {
    async function fetchFuelTypes() {
      setLoadingFuelTypes(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>('/general/fuel-type', token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown): string =>
          typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

        const rawItems: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray(record(payload).items)
            ? (record(payload).items as unknown[])
            : [];

        const normalized = rawItems
          .map((x) => {
            if (typeof x === 'string' || typeof x === 'number') {
              const label = String(x);
              const value = label.toLowerCase().replace(/\s+/g, '_');
              return value ? { value, label } : null;
            }
            const obj = record(x);
            const value = getString(obj.value ?? obj.id ?? obj.code).trim();
            const label = getString(obj.label ?? obj.name ?? obj.text).trim();
            if (!value || !label) return null;
            return { value, label };
          })
          .filter((x): x is { value: string; label: string } => Boolean(x));

        const seen = new Set<string>();
        const unique = normalized.filter((x) => {
          const k = x.value;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        setFuelTypes(unique);
      } else {
        setFuelTypes([]);
      }
      setLoadingFuelTypes(false);
    }

    fetchFuelTypes();
  }, []);

  useEffect(() => {
    if (!isEdit || !metaFleetType || fleetTypes.length === 0) return;
    const current = String(formData.type ?? '');
    if (fleetTypes.some((t) => t.id === current)) return;
    const metaKey = normalizeSelectKey(metaFleetType);
    const matched = fleetTypes.find(
      (t) => normalizeSelectKey(t.id) === metaKey || normalizeSelectKey(t.label) === metaKey
    );
    if (matched && current !== matched.id) {
      setFormData((prev) => ({ ...prev, type: matched.id }));
    }
  }, [isEdit, metaFleetType, fleetTypes, formData.type]);

  useEffect(() => {
    if (!isEdit || !metaFuelType || fuelTypes.length === 0) return;
    const current = String(formData.fuel_type ?? '');
    if (fuelTypes.some((t) => normalizeSelectKey(t.value) === normalizeSelectKey(current))) return;
    const metaKey = normalizeSelectKey(metaFuelType);
    const matched = fuelTypes.find(
      (t) => normalizeSelectKey(t.value) === metaKey || normalizeSelectKey(t.label) === metaKey
    );
    if (matched && current !== matched.value) {
      setFormData((prev) => ({ ...prev, fuel_type: matched.value }));
    }
  }, [isEdit, metaFuelType, fuelTypes, formData.fuel_type]);

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

  useEffect(() => {
    if (!showBodyDropdown) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchBody(bodyQuery), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [bodyQuery, showBodyDropdown]);

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

  async function fetchFacilities(q: string = '') {
    setLoadingFacilities(true);
    const token = localStorage.getItem('token') ?? '';
    const res = await api.get<unknown>(`/services/fleet/facilities${q ? `?search=${encodeURIComponent(q)}` : ''}`, token ? { Authorization: token } : undefined);
    if (res.status === 'success') {
      const payload = res.data as unknown;
      let list: Array<{ facility_id: string; facility_name: string; facility_icon: string }> = [];
      if (Array.isArray(payload)) {
        list = (payload as unknown[])
          .map((x) => {
            const obj = x as Record<string, unknown>;
            const facility_id = String(obj.facility_id ?? '');
            const facility_name = String(obj.facility_name ?? '');
            const facility_icon = String(obj.facility_icon ?? '');
            return facility_id && facility_name ? { facility_id, facility_name, facility_icon } : null;
          })
          .filter((v): v is { facility_id: string; facility_name: string; facility_icon: string } => Boolean(v));
      } else if (payload && typeof payload === 'object') {
        const items = (payload as Record<string, unknown>).items;
        if (Array.isArray(items)) {
          list = items
            .map((x) => {
              const obj = x as Record<string, unknown>;
              const facility_id = String(obj.facility_id ?? '');
              const facility_name = String(obj.facility_name ?? '');
              const facility_icon = String(obj.facility_icon ?? '');
              return facility_id && facility_name ? { facility_id, facility_name, facility_icon } : null;
            })
            .filter((v): v is { facility_id: string; facility_name: string; facility_icon: string } => Boolean(v));
        }
      }
      // Map to FacilityOption
      const options: FacilityOption[] = list.map(f => ({
        value: f.facility_id,
        label: f.facility_name,
        icon: f.facility_icon
      }));
      setFacilityOptions(options);
    } else {
      setFacilityOptions([]);
    }
    setLoadingFacilities(false);
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

  // Fetch facilities on mount
  useEffect(() => {
    fetchFacilities();
  }, []);

  const steps = [
    { id: 'overview', label: 'Overview', icon: BusFront },
    { id: 'fasilitas', label: 'Fasilitas', icon: Tags },
    { id: 'harga', label: 'Harga', icon: Layers },
    { id: 'publikasi', label: 'Publikasi', icon: SlidersHorizontal },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const descriptionPlainText = String(formData.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const descriptionCharCount = descriptionPlainText.length;

  const onCancel = () => {
    navigate(`${basePrefix}/services/fleet`);
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10 rounded-xl border-[#E9EEF7]hover:bg-[#EEF3FF]"
            >
              <ArrowLeft className="h-4 w-4 text-[#1E293B] dark:text-white" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E293B] dark:text-white tracking-tight">
                {isEdit ? 'Edit Armada' : 'Tambah Armada'}
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                {isEdit ? 'Ubah informasi armada dan simpan perubahan.' : 'Lengkapi informasi armada untuk dipublikasikan.'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="border-[#E9EEF7] bg-white text-[#64748B]">
              {isEdit ? 'Edit Mode' : 'Create Mode'}
            </Badge>
          </div>
        </div>
      </div>

      <form id="armada-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Step 0: Overview */}
          {currentStep === 0 && (
            <>
              <div className="lg:col-span-2 space-y-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center">
                        <div className={`flex items-center gap-2 ${idx <= currentStep ? 'text-[#4F6BFF]' : 'text-[#94A3B8]'}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            idx <= currentStep ? 'border-[#4F6BFF] bg-[#EEF3FF]' : 'border-[#E9EEF7] bg-white'
                          }`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className={`flex-1 mx-4 h-0.5 ${idx < currentStep ? 'bg-[#4F6BFF]' : 'bg-[#E9EEF7]'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basic Information - Full Width */}
                <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
                  <CardHeaderWithBadge
                    badgeIcon={BusFront}
                    title="Armada"
                    subtitle="Lengkapi informasi dan deskripsi armada."
                  />
                  <CardContent className="px-5 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-[#475569]">
                      Nama Armada *
                    </label>
                    <div className="relative mt-1">
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama armada"
                        className={[
                          'h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30',
                          errors.name ? 'border-red-500' : '',
                        ].join(' ')}
                      />
                    </div>
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#475569]">
                      Jenis Armada *
                    </label>
                    <Select value={String(formData.type)} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger
                        className={[
                          'mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus:ring-2 focus:ring-[#4F6BFF]/30',
                          errors.type ? 'border-red-500' : '',
                        ].join(' ')}
                      >
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
                    <label className="text-sm font-medium text-[#475569]">
                      Body
                    </label>
                    <Input
                      value={formData.body}
                      onChange={(e) => { handleInputChange('body', e.target.value); setBodyQuery(e.target.value); }}
                      placeholder="Contoh: Hiace, Elf, Bus Besar"
                      onFocus={() => { setShowBodyDropdown(true); fetchBody(''); }}
                      onBlur={() => { window.setTimeout(() => setShowBodyDropdown(false), 150); }}
                      className="mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                    />
                    {showBodyDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-[#E9EEF7] bg-white shadow-sm z-10">
                        {loadingBody ? (
                          <div className="p-2 text-sm text-gray-500">Memuat...</div>
                        ) : bodySuggestions.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
                        ) : (
                          bodySuggestions.map((name, idx) => (
                            <button
                              key={`body-${name}-${idx}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-[#EEF3FF] text-[#1E293B]"
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
                    <label className="text-sm font-medium text-[#475569]">
                      Jenis Bahan Bakar *
                    </label>
                    <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                      <SelectTrigger
                        className={[
                          'mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus:ring-2 focus:ring-[#4F6BFF]/30',
                          errors.fuel_type ? 'border-red-500' : '',
                        ].join(' ')}
                      >
                        <SelectValue placeholder={loadingFuelTypes ? 'Memuat...' : 'Pilih Bahan Bakar'} />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.length > 0 ? (
                          fuelTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="bbg">BBG</SelectItem>
                            <SelectItem value="bensin">Bensin</SelectItem>
                            <SelectItem value="listrik">Listrik</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.fuel_type && <p className="text-sm text-red-500 mt-1">{errors.fuel_type}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-[#475569]">
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
                          className="h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                        />
                        {showCityDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-[#E9EEF7] bg-white shadow-sm z-10">
                            {loadingCities ? (
                              <div className="p-2 text-sm text-gray-500">Memuat...</div>
                            ) : cities.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
                            ) : (
                              cities
                                .filter((city) => {
                                  const selected = formData.pickupPoints.some((p) => p.id === city.id);
                                  return !selected;
                                })
                                .map((city, idx) => (
                                <button
                                  key={`${city.name}-${city.id}-${idx}`}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-[#EEF3FF] text-[#1E293B]"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const exists = formData.pickupPoints.some((p) => p.id === city.id);
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
                          className="h-11 rounded-xl border-[#c8cdd5] bg-white hover:bg-[#EEF3FF]"
                          onClick={addPickupPoint}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.pickupPoints.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.pickupPoints.map((point, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 rounded-full bg-[#EEF3FF] text-[#1E293B]">
                              <span>{point.name}</span>
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removePickupPoint(point.id)}
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
                  <label className="text-sm font-medium text-[#475569]">
                    Deskripsi *
                  </label>
                  <div className={['mt-1 rounded-2xl border border-[#c8cdd5] bg-white overflow-hidden', errors.description ? 'border-red-500' : ''].join(' ')}>
                    <div className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-2 border-b border-[#E9EEF7] bg-white/70 dark:bg-slate-900 dark:text-white backdrop-blur">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#c8cdd5] dark:text-white"
                        onClick={() => executeCommand('bold')}
                        title="Bold"
                      >
                        <span className="font-bold text-[#1E293B] dark:text-white">B</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#EEF3FF] dark:text-white"
                        onClick={() => executeCommand('italic')}
                        title="Italic"
                      >
                        <span className="italic text-[#1E293B] dark:text-white">I</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#EEF3FF] dark:text-white"
                        onClick={() => executeCommand('underline')}
                        title="Underline"
                      >
                        <span className="underline text-[#1E293B] dark:text-white">U</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#EEF3FF]"
                        onClick={() => executeCommand('insertUnorderedList')}
                        title="Bullet List"
                      >
                        <span className="text-[#1E293B] dark:text-white">•</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#EEF3FF]"
                        onClick={() => executeCommand('insertOrderedList')}
                        title="Numbered List"
                      >
                        <span className="text-[#1E293B] dark:text-white">1.</span>
                      </Button>
                      <div className="flex items-center gap-1 ml-2">
                        <Type className="h-4 w-4 text-[#64748B] dark:text-white" />
                        <Select onValueChange={changeFontSize}>
                          <SelectTrigger className="h-8 w-24 text-xs rounded-lg border-[#E9EEF7] bg-white dark:text-white">
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
                    <div className="relative">
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorChange}
                        className="min-h-[170px] max-h-[340px] overflow-y-auto scroll-smooth p-4 text-sm text-[#1E293B] dark:text-white focus:outline-none"
                        data-placeholder="Deskripsikan armada secara detail..."
                      />
                      <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#64748B]">
                        {descriptionCharCount}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[#64748B]">
                    Tips: Tulis deskripsi singkat namun jelas, termasuk kapasitas, fasilitas, dan keunggulan armada.
                  </div>
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>
              </CardContent>
            </Card>
              </div>

              <div className="lg:col-span-1 space-y-6">
                {/* Thumbnail */}
                <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
                  <CardHeaderWithBadge
                    className="px-5 py-4"
                    badgeIcon={ImageIcon}
                    title="Thumbnail"
                    subtitle="Unggah gambar utama untuk tampilan armada."
                  />
                  <div className="h-px bg-[#E9EEF7]" />
                  <CardContent className="px-5 py-5">
                    <div className="space-y-4">
                      <div className="relative rounded-2xl border-2 border-dashed border-[#E9EEF7] bg-white p-4 text-center transition-colors hover:bg-[#EEF3FF]/40">
                        {formData.thumbnail ? (
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                            <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 rounded-xl"
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
                            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-[#EEF3FF] flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-[#4F6BFF]" />
                            </div>
                            <div className="text-sm font-medium text-[#1E293B]">Upload thumbnail</div>
                            <div className="mt-1 text-xs text-[#64748B]">Drag & drop atau klik untuk memilih file (JPG/PNG)</div>
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
                <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
                  <CardHeaderWithBadge
                    className="px-5 py-4"
                    badgeIcon={Upload}
                    title="Galeri"
                    subtitle="Kelola foto galeri untuk memperkaya tampilan armada."
                    actions={
                      <Badge variant="outline" className="border-[#E9EEF7] bg-white text-[#64748B]">
                        {uploads.length}/10
                      </Badge>
                    }
                  />
                  <div className="h-px bg-[#E9EEF7]" />
                  <CardContent className="px-5 py-5">
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
                      <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-[#E9EEF7] rounded-2xl cursor-pointer hover:bg-[#EEF3FF]/40 transition-colors">
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-2xl bg-[#EEF3FF] flex items-center justify-center mb-2">
                            <Upload className="h-5 w-5 text-[#4F6BFF]" />
                          </div>
                          <span className="text-sm font-medium text-[#1E293B]">Upload foto</span>
                          <span className="mt-1 text-xs text-[#64748B]">Maks. 10 foto • JPG/PNG</span>
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
              </div>
            </>
          )}

          {/* Step 1: Fasilitas */}
          {currentStep === 1 && (
            <div className="lg:col-span-3">
              {/* Features - Full Width */}
              <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
              <CardHeaderWithBadge
                badgeIcon={Tags}
                title="Fasilitas Armada"
                subtitle="Fasilitas kabin dan pelayanan armada."
              />
              <div className="h-px bg-[#c8cdd5]" />
              <CardContent className="px-5 py-5">
                <div className="space-y-4">
                  <CreatableSelect
                    isMulti
                    options={facilityOptions}
                    value={selectedFacilities}
                    onChange={(newValue) => {
                      // When creating a new option, mark it as manual
                      const processed = (newValue as FacilityOption[]).map(opt => {
                        // If it's a new option (not from facilityOptions), mark as manual
                        const isManual = !facilityOptions.some(fo => fo.value === opt.value);
                        return {
                          ...opt,
                          isManual,
                          icon: isManual ? 'Check' : opt.icon
                        };
                      });
                      setSelectedFacilities(processed);
                    }}
                    placeholder="Pilih atau ketik fasilitas..."
                    formatOptionLabel={(option) => (
                      <div className="flex items-center gap-2">
                        <DynamicIcon name={option.icon} size={16} />
                        <span>{option.label}</span>
                      </div>
                    )}
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        borderColor: '#c8cdd5',
                        borderWidth: '1px',
                        boxShadow: 'none',
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        minHeight: '2.75rem',
                        '&:hover': {
                          borderColor: '#4F6BFF',
                        },
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        borderColor: '#E9EEF7',
                        borderWidth: '1px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        marginTop: '0.25rem',
                      }),
                      menuList: (base) => ({
                        ...base,
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected ? '#EEF3FF' : state.isFocused ? '#F9FAFB' : 'white',
                        color: '#1E293B',
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        cursor: 'pointer',
                        '&:active': {
                          backgroundColor: '#EEF3FF',
                        },
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#EEF3FF',
                        color: '#1E293B',
                        borderRadius: '9999px',
                        paddingLeft: '0.5rem',
                        paddingRight: '0.25rem',
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: '#1E293B',
                        paddingLeft: '0',
                        paddingRight: '0.25rem',
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: '#4F6BFF',
                        borderRadius: '9999px',
                        padding: '0.125rem',
                        '&:hover': {
                          backgroundColor: '#D1D5DB',
                          color: '#1E293B',
                        },
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#9CA3AF',
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        paddingTop: '0.125rem',
                        paddingBottom: '0.125rem',
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        paddingLeft: '0',
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        padding: '0.25rem',
                        color: '#9CA3AF',
                        '&:hover': {
                          color: '#475569',
                        },
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: '0.25rem',
                        color: '#9CA3AF',
                      }),
                      input: (base) => ({
                        ...base,
                        color: '#1E293B',
                      }),
                    }}
                  />
                </div>
                <div className="mt-4 rounded-[18px] border border-blue-200/60 bg-blue-100/50 dark:bg-transparent dark:border-[#226524] px-4 py-3 text-sm text-blue-900/80 dark:text-white">
                  <span className="inline-flex items-center gap-2 dark:text-yellow-300/80">
                    <Info className="h-5 w-5 text-blue-700 mr-3 hover:scale-50 transition-all animate-bounce dark:text-yellow-300/80" />
                    Kamu bisa menambahkan lebih dari 1 (satu) fasilitas
                  </span>
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {/* Step 2: Harga */}
            {currentStep === 2 && (
              <div className="lg:col-span-3 space-y-6">
                {/* Rental Prices - Full Width */}
                <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
              <CardHeaderWithBadge
                className="px-5 py-4"
                badgeIcon={Layers}
                title="Harga Sewa"
                subtitle="Kelola durasi dan harga sewa untuk armada ini."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#c8cdd5] bg-white hover:bg-[#EEF3FF]"
                    onClick={addRentalPrice}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Durasi
                  </Button>
                }
              />
              <div className="h-px bg-[#E9EEF7]" />
              <CardContent className="px-5 py-5 space-y-4">
                {formData.rentalPrices.map((price, index) => (
                  <div key={index} className="rounded-2xl border border-[#E9EEF7] bg-white p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-[#475569]">
                          Durasi
                        </label>
                        <div className="flex">
                          <Input
                            value={price.duration}
                            onChange={(e) => updateRentalPrice(index, 'duration', e.target.value)}
                            placeholder="1"
                            className="flex-1 mt-1 h-11 rounded-l-xl rounded-r-none border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                          />
                          <div className="mt-1 h-11 px-4 flex items-center rounded-r-xl border border-l-0 border-[#c8cdd5] bg-[#F8FAFC] dark:bg-gray-800 dark:border-gray-800 dark:text-gray-200 text-sm font-medium text-[#475569]">
                            Hari
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-sm font-medium text-[#475569]">
                          Jenis Sewa
                        </label>
                        <Select 
                          value={String(price.type)} 
                          onValueChange={(value) => updateRentalPrice(index, 'type', parseInt(value) || 0)}
                        >
                          <SelectTrigger className="mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white">
                            <SelectValue placeholder="Pilih jenis sewa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Citytour / Perjalanan Dalam Kota / Kawasan</SelectItem>
                            <SelectItem value="2">Overland / Perjalanan Luar Kota</SelectItem>
                            <SelectItem value="3">Citytour Pickup / Drop only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-[#475569]">
                          Harga (Rp)
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={price.price.toLocaleString()}
                            onChange={(e) => updateRentalPrice(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                            placeholder="200,000"
                            className="flex-1 mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                          />
                          {formData.rentalPrices.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-1 rounded-full hover:bg-[#EEF3FF]"
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
                <div className="mt-4 rounded-[18px] border border-blue-200/60 bg-blue-100/50 dark:bg-transparent dark:border-[#226524] px-4 py-3 text-sm text-blue-900/80 dark:text-white">
                  <span className="inline-flex items-center gap-2 dark:text-yellow-300/80">
                    <Info className="h-5 w-5 text-blue-700 mr-3 hover:scale-50 transition-all animate-bounce dark:text-yellow-300/80" />
                    Masukkan harga rata-rata sebagai harga awal. <br />
                    Kamu bisa menambah atau mengurangi biaya layanan saat membuat pesanan.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Addon Packages - Full Width */}
            <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
              <CardHeaderWithBadge
                className="px-5 py-4"
                badgeIcon={Package2}
                title="Paket Addon"
                subtitle="Tambahkan layanan tambahan beserta harganya."
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#c8cdd5] bg-white hover:bg-[#EEF3FF]"
                    onClick={addAddon}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Addon
                  </Button>
                }
              />
              <div className="h-px bg-[#E9EEF7]" />
              <CardContent className="px-5 py-5 space-y-4">
                {formData.addons.map((addon, index) => (
                  <div key={index} className="rounded-2xl border border-[#E9EEF7] bg-white p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-[#475569]">
                          Nama Addon
                        </label>
                        <Input
                          value={addon.name}
                          onChange={(e) => updateAddon(index, 'name', e.target.value)}
                          placeholder="Contoh: Custom seat / tempat duduk"
                          className="mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#475569]">
                          Biaya Tambahan (Rp)
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={addon.price.toLocaleString()}
                            onChange={(e) => updateAddon(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                            placeholder="100,000"
                            className="flex-1 mt-1 h-11 rounded-xl border-[#c8cdd5] bg-white focus-visible:ring-[#4F6BFF]/30"
                          />
                          {formData.addons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-1 rounded-full hover:bg-[#EEF3FF]"
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
              </div>
            )}

            {/* Step 3: Publikasi */}
            {currentStep === 3 && (
              <div className="lg:col-span-3">
                {/* Status */}
                <Card className="rounded-[22px] border-[#E9EEF7] bg-white shadow-sm">
              <CardHeaderWithBadge
                className="px-5 py-4"
                badgeIcon={SlidersHorizontal}
                title="Status Publikasi"
                subtitle="Atur visibilitas armada untuk publik maupun internal."
              />
              <div className="h-px bg-[#E9EEF7]" />
              <CardContent className="px-5 py-5">
                <RadioGroup value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-3 cursor-pointer rounded-2xl border-2 p-4 transition-colors ${formData.status === 'active' ? 'border-[#4F6BFF] bg-[#EEF3FF]' : 'border-[#E9EEF7] bg-white'}`}>
                      <RadioGroupItem value="active" className="sr-only" />
                      <div className="h-10 w-10 rounded-2xl bg-[#EEF3FF] flex items-center justify-center">
                        <Globe className="h-5 w-5 text-[#4F6BFF]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1E293B] dark:text-white">Publish</div>
                        <div className="text-xs text-[#64748B]">Tampil di publik</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 cursor-pointer rounded-2xl border-2 p-4 transition-colors ${formData.status === 'inactive' ? 'border-[#4F6BFF] bg-[#EEF3FF]' : 'border-[#E9EEF7] bg-white'}`}>
                      <RadioGroupItem value="inactive" className="sr-only" />
                      <div className="h-10 w-10 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-[#475569]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1E293B]">Hanya Internal</div>
                        <div className="text-xs text-[#64748B]">Hanya untuk kebutuhan internal</div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
                <div className="mt-2 text-xs text-[#64748B]">
                  Publish akan menampilkan armada ke publik. Hanya Internal untuk kebutuhan internal.
                </div>
              </CardContent>
             </Card>
              </div>
            )}
          </div>

      <div className="block mt-6 md:mt-2 md:fixed md:bottom-4 right-4 left-4 sm:left-auto z-40">
        <div className="rounded-[22px] border border-[#E9EEF7] bg-white/80 dark:bg-transparent dark:border-[#1E293B] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 px-3 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-full border-[#E9EEF7] bg-white hover:bg-[#EEF3FF]"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Kembali
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#295BFF] text-white shadow-[0_10px_24px_-14px_rgba(79,107,255,0.75)] hover:shadow-[0_16px_32px_-18px_rgba(79,107,255,0.9)] transition-all"
                  onClick={nextStep}
                >
                  Lanjutkan
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#295BFF] text-white shadow-[0_10px_24px_-14px_rgba(79,107,255,0.75)] hover:shadow-[0_16px_32px_-18px_rgba(79,107,255,0.9)] transition-all"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Armada'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEdit && currentStep === steps.length - 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                  onClick={handleInactive}
                  disabled={saving || formData.status === 'inactive'}
                >
                  Nonaktifkan Armada
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-full border-[#E9EEF7] bg-white hover:bg-[#EEF3FF]"
                onClick={onCancel}
                disabled={saving}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      </div>
      </form>

    </div>
  );
};
