import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, deleteCommon, toFileUrl, uploadCommon } from '@/lib/api';
import { ArrowLeft, Calendar as CalendarIcon, Loader2, MapPin, Trash2, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import defaultAvatar from '@/assets/general/avatar.svg';

export const PartnerProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    npwp: '',
    gender: 'M',
    date_of_birth: '',
    address: '',
    city: '',
    province: '',
    postal_code: ''
  });
  const [saving, setSaving] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [provinceDisplay, setProvinceDisplay] = useState('');
  const [cityDisplay, setCityDisplay] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    const payload = {
      ...form,
      province: Number(form.province),
      city: Number(form.city),
      date_of_birth: dob
        ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
        : form.date_of_birth,
      avatar: avatarFile,
    };
    const res = await api.post('/profile/update', payload, { Authorization: token });
    setSaving(false);
    if (res.status === 'success') {
      navigate('/dashboard/partner/profile');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const prevUrl = avatarUrl;
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setAvatarUploading(true);

    try {
      const res = await uploadCommon('avatar', [file]);
      if (res.status === 'success') {
        const data = res.data as { files?: string[] } | undefined;
        const path = data?.files?.[0] ?? '';
        if (path) {
          setAvatarFile(path);
          const url = toFileUrl(path);
          setAvatarUrl(url);
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const u = JSON.parse(userStr) as Record<string, unknown>;
              localStorage.setItem('user', JSON.stringify({ ...u, avatar: url }));
            } catch {
              void 0;
            }
          }
        }
      }
    } finally {
      setAvatarUploading(false);
      if (prevUrl && prevUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch {
          void 0;
        }
      }
      e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (avatarUploading) return;
    if (avatarFile) {
      try {
        await deleteCommon([avatarFile]);
      } catch {
        void 0;
      }
    }
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(avatarUrl);
      } catch {
        void 0;
      }
    }
    setAvatarFile('');
    setAvatarUrl('');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...u, avatar: '' }));
      } catch {
        void 0;
      }
    }
  };

  const fetchProvincesImmediate = async () => {
    setLoadingProvince(true);
    const q = provinceDisplay.trim();
    const res = await api.get('/general/provinces?search=' + encodeURIComponent(q));
    setLoadingProvince(false);
    if (res.status === 'success') {
      const raw = (res.data ?? []) as unknown;
      const list = Array.isArray(raw)
        ? raw
            .map((x: unknown) => {
              if (typeof x === 'object' && x !== null) {
                const obj = x as Record<string, unknown>;
                const idSrc = (obj.id ?? obj.value ?? obj.code ?? obj.province_id ?? obj.provinceId ?? obj.province) as unknown;
                const nameSrc = (obj.name ?? obj.label ?? obj.province) as unknown;
                const idStr = typeof idSrc === 'string' ? idSrc : String(idSrc ?? '');
                const nameStr = typeof nameSrc === 'string' ? nameSrc : String(nameSrc ?? '');
                return idStr && nameStr ? { id: idStr, name: nameStr } : null;
              }
              if (typeof x === 'string') return { id: x, name: x };
              return null;
            })
            .filter((v) => v && v.id && v.name) as Array<{ id: string; name: string }>
        : [];
      setProvinceOptions(list);
    }
  };

  const fetchCitiesImmediate = async () => {
    const prov = form.province.trim();
    if (!prov) return;
    setLoadingCity(true);
    const q = cityDisplay.trim();
    const url = '/general/cities?province=' + encodeURIComponent(prov) + '&search=' + encodeURIComponent(q);
    const res = await api.get(url);
    setLoadingCity(false);
    if (res.status === 'success') {
      const raw = (res.data ?? []) as unknown;
      const list = Array.isArray(raw)
        ? raw
            .map((x: unknown) => {
              if (typeof x === 'object' && x !== null) {
                const obj = x as Record<string, unknown>;
                const idSrc = (obj.id ?? obj.value ?? obj.code ?? obj.city_id ?? obj.cityId ?? obj.city) as unknown;
                const nameSrc = (obj.name ?? obj.label ?? obj.city) as unknown;
                const idStr = typeof idSrc === 'string' ? idSrc : String(idSrc ?? '');
                const nameStr = typeof nameSrc === 'string' ? nameSrc : String(nameSrc ?? '');
                return idStr && nameStr ? { id: idStr, name: nameStr } : null;
              }
              if (typeof x === 'string') return { id: x, name: x };
              return null;
            })
            .filter((v) => v && v.id && v.name) as Array<{ id: string; name: string }>
        : [];
      setCityOptions(list);
    }
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get('/profile/detail', { Authorization: token });
      if (res.status === 'success' && res.data) {
        const d = res.data as Record<string, unknown>;
        setForm((p) => ({
          ...p,
          name: typeof d.name === 'string' ? d.name : p.name,
          phone: typeof d.phone === 'string' ? d.phone : p.phone,
          npwp: typeof d.npwp === 'string' ? d.npwp : p.npwp,
          gender: (typeof d.gender === 'string' ? (d.gender as 'M' | 'F') : p.gender),
          date_of_birth: typeof d.date_of_birth === 'string' ? d.date_of_birth : p.date_of_birth,
          address: typeof d.address === 'string' ? d.address : p.address,
          city: typeof d.city === 'string' ? d.city : p.city,
          province: typeof d.province === 'string' ? d.province : p.province,
          postal_code: typeof d.postal_code === 'string' ? d.postal_code : p.postal_code,
        }));
        const provinceStr = typeof d.province === 'string' ? d.province : '';
        const cityStr = typeof d.city === 'string' ? d.city : '';
        const provinceLabel = typeof d.province_label === 'string' ? d.province_label : '';
        const cityLabel = typeof d.city_label === 'string' ? d.city_label : '';
        setProvinceDisplay(provinceLabel || provinceStr);
        setCityDisplay(cityLabel || cityStr);
        const dobStr = typeof d.date_of_birth === 'string' ? d.date_of_birth : '';
        if (dobStr) {
          const parsed = new Date(dobStr);
          if (!Number.isNaN(parsed.getTime())) setDob(parsed);
        }
        const avatarRaw = d.avatar ?? d.photo ?? d.profile_photo ?? d.profilePhoto;
        const avatarPath = typeof avatarRaw === 'string' ? avatarRaw : '';
        if (avatarPath) {
          setAvatarFile(avatarPath);
          setAvatarUrl(toFileUrl(avatarPath));
        }
      }
    })();
  }, []);

  useEffect(() => {
    const q = provinceDisplay.trim();
    if (!q) {
      setProvinceOptions([]);
      return;
    }
    setLoadingProvince(true);
    const id = setTimeout(async () => {
      const res = await api.get('/general/provinces?search=' + encodeURIComponent(q));
      setLoadingProvince(false);
      if (res.status === 'success') {
        const raw = (res.data ?? []) as unknown;
        const list = Array.isArray(raw)
          ? raw
              .map((x: unknown) => {
                if (typeof x === 'object' && x !== null) {
                  const obj = x as Record<string, unknown>;
                  const idSrc = (obj.id ?? obj.value ?? obj.code ?? obj.province_id ?? obj.provinceId ?? obj.province) as unknown;
                  const nameSrc = (obj.name ?? obj.label ?? obj.province) as unknown;
                  const idStr = typeof idSrc === 'string' ? idSrc : String(idSrc ?? '');
                  const nameStr = typeof nameSrc === 'string' ? nameSrc : String(nameSrc ?? '');
                  return idStr && nameStr ? { id: idStr, name: nameStr } : null;
                }
                if (typeof x === 'string') return { id: x, name: x };
                return null;
              })
              .filter((v) => v && v.id && v.name) as Array<{ id: string; name: string }>
          : [];
        setProvinceOptions(list);
      } else {
        setProvinceOptions([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [provinceDisplay]);

  useEffect(() => {
    const q = cityDisplay.trim();
    const prov = form.province.trim();
    if (!q || !prov) {
      setCityOptions([]);
      return;
    }
    setLoadingCity(true);
    const id = setTimeout(async () => {
      const url = '/general/cities?province=' + encodeURIComponent(prov) + '&search=' + encodeURIComponent(q);
      const res = await api.get(url);
      setLoadingCity(false);
      if (res.status === 'success') {
        const raw = (res.data ?? []) as unknown;
        const list = Array.isArray(raw)
          ? raw
              .map((x: unknown) => {
                if (typeof x === 'object' && x !== null) {
                  const obj = x as Record<string, unknown>;
                  const idSrc = (obj.id ?? obj.value ?? obj.code ?? obj.city_id ?? obj.cityId ?? obj.city) as unknown;
                  const nameSrc = (obj.name ?? obj.label ?? obj.city) as unknown;
                  const idStr = typeof idSrc === 'string' ? idSrc : String(idSrc ?? '');
                  const nameStr = typeof nameSrc === 'string' ? nameSrc : String(nameSrc ?? '');
                  return idStr && nameStr ? { id: idStr, name: nameStr } : null;
                }
                if (typeof x === 'string') return { id: x, name: x };
                return null;
              })
              .filter((v) => v && v.id && v.name) as Array<{ id: string; name: string }>
          : [];
        setCityOptions(list);
      } else {
        setCityOptions([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [cityDisplay, form.province]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/partner/profile')} className="!w-auto !h-auto p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profil</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Perbarui informasi profil anda</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 md:col-span-1 flex">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Foto Profil</h2>
              </div>
              <div className="mt-3 h-px bg-gray-200" />
              <div className="flex flex-col items-center justify-center flex-1 min-h-[300px]">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto Profil" className="h-full w-full object-cover" />
                  ) : (
                    <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 object-contain opacity-80" />
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <label className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Upload className="h-4 w-4 mr-2" />
                    Unggah foto baru
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  <Button type="button" variant="outline" className="h-10" onClick={handleAvatarRemove} disabled={avatarUploading || (!avatarUrl && !avatarFile)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus foto profil
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Profil</h2>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/partner/profile/password')}>
                Ubah Password
              </Button>
            </div>
            <div className="mt-3 h-px bg-gray-200" />
            <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Nama</label>
              <Input name="name" value={form.name} onChange={handleChange} className="h-12" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="text-sm">Telepon</label>
              <Input name="phone" value={form.phone} onChange={handleChange} className="h-12" placeholder="62xxxxxxxxxxx" />
            </div>
            <div>
              <label className="text-sm">NPWP</label>
              <Input name="npwp" value={form.npwp} onChange={handleChange} className="h-12" placeholder="Nomor NPWP" />
            </div>
            <div>
              <label className="text-sm">Gender</label>
              <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Laki Laki (M)</SelectItem>
                  <SelectItem value="F">Perempuan (F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Tanggal Lahir (ISO)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dob
                      ? dob.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Pilih tanggal lahir'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob ?? undefined}
                    onSelect={(date) => setDob(date ?? null)}
                    captionLayout="dropdown"
                    fromYear={1950}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm">Alamat</label>
              <Input name="address" value={form.address} onChange={handleChange} className="h-12" placeholder="Alamat lengkap" />
            </div>
            <div>
              <label className="text-sm">Provinsi (ID)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="province"
                  value={provinceDisplay}
                  onFocus={() => setShowProvinceList(true)}
                  onBlur={() => setTimeout(() => setShowProvinceList(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'PageDown') {
                      e.preventDefault();
                      setShowProvinceList(true);
                      if (!loadingProvince && provinceOptions.length === 0) {
                        fetchProvincesImmediate();
                      }
                    }
                  }}
                  onChange={(e) => setProvinceDisplay(e.target.value)}
                  className="pl-10 h-12"
                  placeholder="Cari provinsi (ID/nama)"
                />
                {showProvinceList && (provinceDisplay.trim().length > 0 || loadingProvince) && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow max-h-60 overflow-auto">
                    <div className="px-3 py-2 text-xs text-gray-500 flex items-center">
                      {loadingProvince ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                      <span>{loadingProvince ? 'Memuat...' : 'Pilih provinsi'}</span>
                    </div>
                    {provinceOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setForm((p) => ({ ...p, province: opt.id }));
                          setProvinceDisplay(opt.name);
                          setShowProvinceList(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-gray-100"
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm">Kota (ID)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="city"
                  value={cityDisplay}
                  onFocus={() => setShowCityList(true)}
                  onBlur={() => setTimeout(() => setShowCityList(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'PageDown') {
                      e.preventDefault();
                      setShowCityList(true);
                      if (!loadingCity && cityOptions.length === 0) {
                        fetchCitiesImmediate();
                      }
                    }
                  }}
                  onChange={(e) => setCityDisplay(e.target.value)}
                  className="pl-10 h-12"
                  placeholder="Cari kota (ID/nama)"
                />
                {showCityList && (cityDisplay.trim().length > 0 || loadingCity) && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow max-h-60 overflow-auto">
                    <div className="px-3 py-2 text-xs text-gray-500 flex items-center">
                      {loadingCity ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                      <span>{loadingCity ? 'Memuat...' : 'Pilih kota'}</span>
                    </div>
                    {cityOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setForm((p) => ({ ...p, city: opt.id }));
                          setCityDisplay(opt.name);
                          setShowCityList(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-gray-100"
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm">Kode Pos</label>
              <Input name="postal_code" value={form.postal_code} onChange={handleChange} className="h-12" placeholder="Kode pos" />
            </div>
          </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-12 text-white">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
};
