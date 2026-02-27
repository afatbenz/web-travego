import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Landmark, MapPin, Phone, Mail, IdCard, ChevronsUpDown, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrganizationSettings: React.FC = () => {
  const [form, setForm] = useState({
    organization_name: '',
    company_name: '',
    address: '',
    province: '',
    city: '',
    phone: '',
    email: '',
    organization_code: '',
    npwp_number: '',
    postal_code: '',
    organization_type: '',
    logo: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; province_id?: string }[]>([]);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [orgTypeCode, setOrgTypeCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typeLabelToCode = (label: string): string => {
    const normalized = label.trim().toUpperCase();
    if (normalized === 'RENTAL KENDARAAN') return '1';
    if (normalized === 'BIRO PERJALANAN WISATA') return '2';
    if (normalized === 'RENTAL DAN BIRO PERJALANAN WISATA') return '3';
    return '';
  };
  const typeCodeToLabel = (code: string): string => {
    if (code === '1') return 'RENTAL KENDARAAN';
    if (code === '2') return 'BIRO PERJALANAN WISATA';
    if (code === '3') return 'RENTAL DAN BIRO PERJALANAN WISATA';
    return '';
  };

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let orgName = '';
    try {
      const payloadStr = token.split('.')[1];
      if (payloadStr) {
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        orgName = String(
          json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? ''
        );
      }
    } catch { orgName = orgName || ''; }
    const orgCode = localStorage.getItem('organization_code') ?? '';
    setLoading(true);
    (async () => {
      const res = await api.get<Record<string, unknown>>('/organization/detail', { Authorization: token });
      setLoading(false);
      if (res.status === 'success' && res.data && typeof res.data === 'object') {
        const d = res.data as Record<string, unknown>;
        setForm((p) => ({
          ...p,
          organization_name: String(d['organization_name'] ?? orgName ?? ''),
          organization_code: String(d['organization_code'] ?? orgCode ?? ''),
          company_name: String(d['company_name'] ?? ''),
          address: String(d['address'] ?? ''),
          province: String(d['province_name'] ?? ''),
          city: String(d['city_name'] ?? ''),
          phone: String(d['phone'] ?? ''),
          email: String(d['email'] ?? ''),
          npwp_number: String(d['npwp_number'] ?? ''),
          postal_code: String(d['postal_code'] ?? ''),
          organization_type: String(d['organization_type'] ?? ''),
          logo: String(d['logo'] ?? ''),
        }));
        setOrgTypeCode(typeLabelToCode(String(d['organization_type'] ?? '')));
        const pid = d['province_id'] ?? d['province'];
        const cid = d['city_id'] ?? d['city'];
        if (typeof pid === 'number' || (typeof pid === 'string' && pid)) {
          setSelectedProvinceId(String(pid));
        }
        if (typeof cid === 'number' || (typeof cid === 'string' && cid)) {
          setSelectedCityId(String(cid));
        }
      } else {
        setForm((p) => ({
          ...p,
          organization_name: orgName || localStorage.getItem('organization_name') || '',
          organization_code: orgCode,
        }));
      }
    })();

    (async () => {
      const resProv = await api.get<unknown>('/general/provinces', { Authorization: token });
      if (resProv.status === 'success' && resProv.data && Array.isArray(resProv.data)) {
        const arr = resProv.data as unknown[];
        setProvinces(arr.map((it) => {
          const o = (it ?? {}) as Record<string, unknown>;
          const id = String(o['id'] ?? o['code'] ?? o['province_id'] ?? '');
          const name = String(o['name'] ?? o['province_name'] ?? o['province'] ?? '');
          return { id, name };
        }).filter((x) => x.name));
      }
      const resCity = await api.get<unknown>('/general/cities', { Authorization: token });
      if (resCity.status === 'success' && resCity.data && Array.isArray(resCity.data)) {
        const arr = resCity.data as unknown[];
        setCities(arr.map((it) => {
          const o = (it ?? {}) as Record<string, unknown>;
          const id = String(o['id'] ?? o['code'] ?? o['city_id'] ?? '');
          const name = String(o['name'] ?? o['city_name'] ?? o['city'] ?? '');
          const pid = o['province_id'] ?? o['provinceCode'] ?? o['province_id_code'];
          return { id, name, province_id: typeof pid === 'string' ? pid : (typeof pid === 'number' ? String(pid) : undefined) };
        }).filter((x) => x.name));
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    const resolvedProvinceId = selectedProvinceId || provinces.find((p) => p.name.toLowerCase() === form.province.toLowerCase())?.id || '';
    const resolvedCityId = selectedCityId || cities.find((c) => c.name.toLowerCase() === form.city.toLowerCase())?.id || '';
    const orgTypeIdStr = orgTypeCode || typeLabelToCode(form.organization_type);
    const orgTypeId = orgTypeIdStr ? Number(orgTypeIdStr) : undefined;
    const payload = {
      organization_name: form.organization_name,
      organization_code: form.organization_code,
      company_name: form.company_name,
      phone: form.phone,
      address: form.address,
      province: resolvedProvinceId && /^\d+$/.test(resolvedProvinceId) ? Number(resolvedProvinceId) : undefined,
      city: resolvedCityId && /^\d+$/.test(resolvedCityId) ? Number(resolvedCityId) : undefined,
      email: form.email,
      npwp_number: form.npwp_number,
      postal_code: form.postal_code,
      organization_type: orgTypeId,
    };
    const res = await api.post('/organization/update', payload, { Authorization: token });
    setSaving(false);
    if (res.status === 'success') {
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Informasi organisasi diperbarui', timer: 1500, showConfirmButton: false });
    }
  };

  const handleLogoFile = async (file: File) => {
    const token = localStorage.getItem('token') ?? '';
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/organization/update/logo', fd, { Authorization: token });
    if (res.status === 'success' && res.data && typeof res.data === 'object') {
      const data = res.data as Record<string, unknown>;
      const url = String(data['logo'] ?? data['url'] ?? form.logo);
      setForm((p) => ({ ...p, logo: url }));
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Logo berhasil diunggah', timer: 1500, showConfirmButton: false });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleLogoFile(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Perbarui informasi organisasi</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Logo</label>
              <div className="flex flex-col items-start gap-3">
                <div className="relative w-full">
                  {form.logo ? (
                    <img src={form.logo} alt={form.organization_name} className="w-full h-32 rounded bg-slate-100 object-contain" />
                  ) : (
                    <div className="w-full h-32 rounded bg-slate-100" />
                  )}
                  <Button type="button" size="icon" className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow text-white" onClick={() => fileInputRef.current?.click()}>
                    <Pencil className="h-4 w-4 text-white" />
                  </Button>
                  <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nama Organisasi</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="organization_name" value={form.organization_name} onChange={handleChange} className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nama Perusahaan</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="company_name" value={form.company_name} onChange={handleChange} className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telepon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="phone"
                    value={form.phone}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setForm((prev) => ({ ...prev, phone: v }));
                    }}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="email" value={form.email} onChange={handleChange} className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Alamat</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="address" value={form.address} onChange={handleChange} className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Provinsi</label>
                <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={provinceOpen}
                      className="w-full justify-between"
                    >
                      {form.province || 'Pilih Provinsi...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Cari provinsi..." />
                      <CommandList>
                        <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {provinces.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={(val) => {
                                const selected = provinces.find((x) => x.name.toLowerCase() === val.toLowerCase()) || p;
                                setForm((prev) => ({ ...prev, province: selected.name, city: '' }));
                                setSelectedProvinceId(selected.id);
                                setSelectedCityId(null);
                                setProvinceOpen(false);
                              }}
                            >
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kota</label>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityOpen}
                      className="w-full justify-between"
                    >
                      {form.city || 'Pilih Kota...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Cari kota..." />
                      <CommandList>
                        <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {(selectedProvinceId ? cities.filter((c) => c.province_id === selectedProvinceId) : cities).map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={(val) => {
                                const selected = cities.find((x) => x.name.toLowerCase() === val.toLowerCase()) || c;
                                setForm((prev) => ({ ...prev, city: selected.name }));
                                setSelectedCityId(selected.id);
                                setCityOpen(false);
                              }}
                            >
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode Pos</label>
                <Input
                  name="postal_code"
                  value={form.postal_code}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setForm((prev) => ({ ...prev, postal_code: v }));
                  }}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NPWP</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input name="npwp_number" value={form.npwp_number} onChange={handleChange} className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Jenis Usaha</label>
                <Select value={orgTypeCode} onValueChange={(v) => {
                  setOrgTypeCode(v);
                  setForm((prev) => ({ ...prev, organization_type: typeCodeToLabel(v) }));
                }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih jenis usaha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">RENTAL KENDARAAN</SelectItem>
                    <SelectItem value="2">BIRO PERJALANAN WISATA</SelectItem>
                    <SelectItem value="3">RENTAL DAN BIRO PERJALANAN WISATA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || loading}>{saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
