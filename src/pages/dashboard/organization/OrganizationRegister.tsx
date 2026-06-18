import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, FileText, Landmark, Loader2, ArrowLeft, List, ChevronDown, CheckCircle, Info, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';

export const OrganizationRegisterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    organization_name: '',
    company_name: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    organization_type: 0,
  });
  const [provinceOptions, setProvinceOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [types, setTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [provinceDisplay, setProvinceDisplay] = useState('');
  const [cityDisplay, setCityDisplay] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
      setForm((prev) => ({ ...prev, [name]: normalized }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim());
    if (!emailOk) {
      showAlert({ title: 'Email tidak valid', description: 'Masukkan email yang benar', type: 'warning' });
      return;
    }
    if (!form.organization_type || Number(form.organization_type) <= 0) {
      showAlert({ title: 'Tipe organisasi belum dipilih', description: 'Silakan pilih tipe organisasi', type: 'warning' });
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem('token') ?? '';
    const headers = { Authorization: token };
    const payload = { ...form, province: Number(form.province), city: Number(form.city) };
    const res = await api.post('/organization/create', payload, headers);
    setSubmitting(false);
    if (res.status === 'success') {
      const newToken = (res.data as unknown as { token?: string })?.token;
      const orgId = (res.data as unknown as { organization_id?: string })?.organization_id;
      const orgCode = (res.data as unknown as { organization_code?: string })?.organization_code;

      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('Token updated in localStorage');
      }
      if (orgId !== undefined && orgId !== null) {
        localStorage.setItem('organization_id', String(orgId));
        console.log('organization_id saved:', orgId);
      }
      if (form.organization_name) {
        localStorage.setItem('organization_name', String(form.organization_name));
        console.log('organization_name saved:', form.organization_name);
      }
      if (orgCode) {
        localStorage.setItem('organization_code', String(orgCode));
        console.log('organization_code saved:', orgCode);
      }

      console.log('Register organization response:', res.data);

      showAlert({
        title: 'Organisasi dibuat',
        description: orgCode ? `Kode Organisasi: ${orgCode}` : 'Anda dapat melanjutkan ke dashboard',
        type: 'success',
        onConfirm: () => {
          window.dispatchEvent(new StorageEvent('storage', { key: 'organization_id' }));
          navigate('/dashboard/partner');
        },
      });
    }
  };

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

  useEffect(() => {
    setLoadingTypes(true);
    (async () => {
      const res = await api.get('/organization/types');
      setLoadingTypes(false);
      if (res.status === 'success') {
        const raw = (res.data ?? []) as unknown;
        const list = Array.isArray(raw)
          ? raw
              .map((x: unknown) => {
                if (typeof x === 'object' && x !== null) {
                  const obj = x as Record<string, unknown>;
                  const idSrc = obj.id ?? obj.value ?? x;
                  const nameSrc = obj.name ?? obj.label ?? x;
                  const idNum = typeof idSrc === 'number' ? idSrc : Number(idSrc);
                  const nameStr = typeof nameSrc === 'string' ? nameSrc : String(nameSrc);
                  return { id: idNum, name: nameStr };
                }
                const idNum = typeof x === 'number' ? x : Number(x);
                const nameStr = typeof x === 'string' ? x : String(x);
                return { id: idNum, name: nameStr };
              })
              .filter((t) => !Number.isNaN(t.id) && !!t.name)
          : [];
        setTypes(list);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const token = localStorage.getItem('token') ?? '';
          let isAdmin = false;
          try {
            const payloadStr = token.split('.')[1];
            const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const json = JSON.parse(atob(padded));
            isAdmin = Boolean(json.is_admin ?? json.isAdmin ?? false);
          } catch {}
          navigate(isAdmin ? '/dashboard/organization/choice' : '/dashboard/partner/organization/choice');
        }}
        className="!w-auto !h-auto p-2"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="grid md:grid-cols-7 gap-6">
        <Card className="md:col-span-4">
          <CardHeaderWithBadge
            badgeIcon={Building2}
            title="Registrasi Organisasi"
            subtitle="Lengkapi informasi berikut untuk mendaftarkan organisasi Anda."
          />
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="organization_name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Nama Organisasi</span>
                    <span className="text-blue-500 text-xs">•</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="organization_name" name="organization_name" value={form.organization_name} onChange={handleChange} required className="pl-10 h-12 rounded-2xl" placeholder="Masukkan nama organisasi" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="company_name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Nama Perusahaan</span>
                    <span className="text-blue-500 text-xs">•</span>
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="company_name" name="company_name" value={form.company_name} onChange={handleChange} required className="pl-10 h-12 rounded-2xl" placeholder="Masukkan nama perusahaan" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Alamat</span>
                    <span className="text-blue-500 text-xs">•</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="address" name="address" value={form.address} onChange={handleChange} required className="pl-10 h-12 rounded-2xl" placeholder="Masukkan alamat lengkap" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="province" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Provinsi (ID)</span>
                      <span className="text-blue-500 text-xs">•</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="province"
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
                        required
                        className="pl-10 pr-10 h-12 rounded-2xl"
                        placeholder="Cari provinsi (ID/nama)"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
                              className="w-full text-left px-3 py-2 bg-white hover:bg-gray-100 rounded-2xl"
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Kota (ID)</span>
                      <span className="text-blue-500 text-xs">•</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="city"
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
                        required
                        className="pl-10 pr-10 h-12 rounded-2xl"
                        placeholder="Cari kota (ID/nama)"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
                              className="w-full text-left px-3 py-2 bg-white hover:bg-gray-100 rounded-2xl"
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Telepon (62...)</span>
                      <span className="text-blue-500 text-xs">•</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required className="pl-10 h-12 rounded-2xl" placeholder="62xxxxxxxxxxx" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Email</span>
                      <span className="text-blue-500 text-xs">•</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="pl-10 h-12 rounded-2xl" placeholder="email@domain.com" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span>Tipe Organisasi</span>
                    <span className="text-blue-500 text-xs">•</span>
                  </label>
                  <Select
                    value={String(form.organization_type ?? '')}
                    onValueChange={(v) => setForm((p) => ({ ...p, organization_type: Number(v) }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <div className="flex items-center">
                        <List className="h-4 w-4 text-gray-400 mr-2 rounded-2xl" />
                        <SelectValue placeholder={loadingTypes ? 'Memuat...' : 'Pilih tipe organisasi'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__placeholder__" disabled>-- pilih organisasi --</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={submitting}>
                  {submitting ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</span>) : (<><Building2 className="mr-2 h-4 w-4" />Daftarkan Organisasi</>)}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 flex flex-col">
          <CardContent className="flex-1">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 relative">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kenapa perlu registrasi?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-lg mr-2 mt-2"><Check className="h-4 w-4 text-green-600" /></span>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Kelola data organisasi</span>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Simpan dan kelola informasi organisasi Anda dengan aman.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2 mt-2"><Check className="h-4 w-4 text-green-600" /></span>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Akses semua fitur</span>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Dapatkan akses penuh ke semua fitur TraveGo sesuai peran Anda.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2 mt-2"><Check className="h-4 w-4 text-green-600" /></span>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Kolaborasi tim</span>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Undang anggota tim dan atur peran dengan mudah.</p>
                </div>
              </li>
            </ul>
          </CardContent>
          <div className="mt-auto pt-4 border-t border-gray-200 flex items-center text-sm px-4">
            <Info className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">Butuh bantuan?</span>
            <a href="https://wa.me/6285195911626" className="ml-auto text-blue-600 hover:text-blue-700 font-medium">Pelajari lebih lanjut tentang organisasi →</a>
          </div>
        </Card>
      </div>
    </div>
  );
};
