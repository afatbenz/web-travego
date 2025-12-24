import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowLeft, MapPin, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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
    };
    const res = await api.post('/profile/update', payload, { Authorization: token });
    setSaving(false);
    if (res.status === 'success') {
      navigate('/dashboard/partner/profile');
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
        const d = res.data as Record<string, string>;
        setForm((p) => ({
          ...p,
          name: d.name ?? p.name,
          phone: d.phone ?? p.phone,
          npwp: d.npwp ?? p.npwp,
          gender: (d.gender as 'M' | 'F') ?? p.gender,
          date_of_birth: d.date_of_birth ?? p.date_of_birth,
          address: d.address ?? p.address,
          city: d.city ?? p.city,
          province: d.province ?? p.province,
          postal_code: d.postal_code ?? p.postal_code,
        }));
        setProvinceDisplay(d.province ?? '');
        setCityDisplay(d.city ?? '');
        const dobStr = d.date_of_birth ?? '';
        if (dobStr) {
          const parsed = new Date(dobStr);
          if (!Number.isNaN(parsed.getTime())) setDob(parsed);
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
      const res = await api.get('http://localhost:3100/api/general/provinces?search=' + encodeURIComponent(q));
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
      const url = 'http://localhost:3100/api/general/cities?province=' + encodeURIComponent(prov) + '&search=' + encodeURIComponent(q);
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
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-12 text-white">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </div>
    </div>
  );
};
