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

const INPUT_CLS =
  'h-14 rounded-2xl border-slate-200 bg-slate-50 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50';

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
      navigate('/dashboard/profile');
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
    <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/profile')}
            className="h-10 w-10 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Profil</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Perbarui informasi profil anda</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr] xl:gap-8">
          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Foto Profil</h2>
              <p className="mt-1 text-xs text-slate-500">PNG atau JPG</p>

              <div className="mt-5 flex flex-col items-center">
                <div className="h-36 w-36 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto Profil" className="h-full w-full object-cover" />
                  ) : (
                    <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 object-contain opacity-80" />
                  )}
                </div>
                <div className="mt-5 flex flex-col gap-2 w-full">
                  <label
                    className={[
                      'inline-flex items-center justify-center rounded-2xl text-sm font-medium h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all duration-300',
                      avatarUploading ? 'opacity-60 pointer-events-none' : '',
                    ].join(' ')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Unggah foto baru
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading || (!avatarUrl && !avatarFile)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus foto profil
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">Informasi Profil</div>
                <p className="mt-1 text-sm text-slate-500">Lengkapi informasi dasar profil Anda</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl border-blue-100 bg-blue-50/50 text-blue-600 transition-all duration-300 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200 dark:hover:bg-blue-950/40"
                onClick={() => navigate('/dashboard/profile/password')}
              >
                Ubah Password
              </Button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama</label>
                <Input name="name" value={form.name} onChange={handleChange} className={INPUT_CLS} placeholder="Nama lengkap" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telepon</label>
                <Input name="phone" value={form.phone} onChange={handleChange} className={INPUT_CLS} placeholder="62xxxxxxxxxxx" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">NPWP</label>
                <Input
                  name="npwp"
                  value={form.npwp}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={16}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
                    setForm((p) => ({ ...p, npwp: v }));
                  }}
                  className={INPUT_CLS}
                  placeholder="Nomor NPWP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                  <SelectTrigger className={INPUT_CLS}>
                    <SelectValue placeholder="Pilih gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Laki Laki (M)</SelectItem>
                    <SelectItem value="F">Perempuan (F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal Lahir</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={[INPUT_CLS, 'w-full justify-start text-left font-normal px-4'].join(' ')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {dob ? dob.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Pilih tanggal lahir'}
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Alamat</label>
                <Input name="address" value={form.address} onChange={handleChange} className={INPUT_CLS} placeholder="Alamat lengkap" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Provinsi</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    className={[INPUT_CLS, 'pl-11'].join(' ')}
                    placeholder="Cari provinsi (ID/nama)"
                  />
                  {showProvinceList && (provinceDisplay.trim().length > 0 || loadingProvince) && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 max-h-60 overflow-auto">
                      <div className="px-4 py-3 text-xs text-slate-500 flex items-center">
                        {loadingProvince ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        <span>{loadingProvince ? 'Memuat...' : 'Pilih provinsi'}</span>
                      </div>
                      {provinceOptions.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setForm((p) => ({ ...p, province: opt.id, city: '' }));
                            setProvinceDisplay(opt.name);
                            setCityDisplay('');
                            setShowProvinceList(false);
                          }}
                          className="w-full text-left px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kota</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    className={[INPUT_CLS, 'pl-11'].join(' ')}
                    placeholder="Cari kota (ID/nama)"
                  />
                  {showCityList && (cityDisplay.trim().length > 0 || loadingCity) && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 max-h-60 overflow-auto">
                      <div className="px-4 py-3 text-xs text-slate-500 flex items-center">
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
                          className="w-full text-left px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kode Pos</label>
                <Input name="postal_code" value={form.postal_code} onChange={handleChange} className={INPUT_CLS} placeholder="Kode pos" />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <Button type="submit" disabled={saving} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
