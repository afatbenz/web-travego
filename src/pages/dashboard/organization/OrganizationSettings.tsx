import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Landmark,
  MapPin,
  Phone,
  Mail,
  IdCard,
  ChevronsUpDown,
  Pencil,
  Upload,
  Lightbulb,
  Clock,
  Building2,
  Contact,
  Globe,
  MessageCircle,
  Save,
  CheckCircle2,
  FileImage,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
import { OrganizationPinLocationTab } from './OrganizationPinLocationTab';

type TabId = 'detail' | 'contact' | 'location';

const INPUT_CLS =
  'h-14 rounded-2xl border-slate-200 bg-slate-50 pl-11 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50';
const TEXTAREA_CLS =
  'min-h-[140px] rounded-2xl border-slate-200 bg-slate-50 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50';
const COMBO_CLS =
  'h-14 w-full justify-between rounded-2xl border-slate-200 bg-slate-50 font-normal transition-all duration-300 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50';

const TABS: { id: TabId; label: string; icon: React.ElementType; subtitle: string }[] = [
  { id: 'detail', label: 'Detail Organisasi', icon: Building2, subtitle: 'Kelola informasi publik perusahaan Anda' },
  { id: 'location', label: 'Alamat', icon: MapPin, subtitle: 'Tentukan koordinat dan alamat lokasi organisasi di peta' },
  { id: 'contact', label: 'Kontak', icon: Contact, subtitle: 'Kelola kontak dan kanal komunikasi publik' },
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 pt-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</h3>
    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
    {children}
  </label>
);

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
    description: '',
    whatsapp: '',
    website: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    domain_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('detail');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState('');
  const [logoHover, setLogoHover] = useState(false);
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; province_id?: string }[]>([]);
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

  const markDirty = () => setHasUnsavedChanges(true);

  const formatSavedTime = (d: Date) =>
    d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let orgName = '';
    let userName = '';
    try {
      const payloadStr = token.split('.')[1];
      if (payloadStr) {
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        orgName = String(
          json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? ''
        );
        userName = String(json.name ?? json.full_name ?? json.username ?? '');
      }
    } catch {
      orgName = orgName || '';
    }
    if (!userName) {
      try {
        const u = JSON.parse(localStorage.getItem('user') ?? '{}') as { name?: string };
        userName = String(u.name ?? '');
      } catch {
        userName = '';
      }
    }
    setLastUpdatedBy(userName || 'Admin');

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
          description: String(d['description'] ?? d['company_description'] ?? ''),
          whatsapp: String(d['whatsapp'] ?? ''),
          website: String(d['website'] ?? d['domain_url'] ?? ''),
          instagram: String(d['instagram'] ?? ''),
          tiktok: String(d['tiktok'] ?? ''),
          youtube: String(d['youtube'] ?? ''),
          domain_url: String(d['domain_url'] ?? d['website'] ?? ''),
        }));
        setOrgTypeCode(typeLabelToCode(String(d['organization_type'] ?? '')));
        const updated = d['updated_at'] ?? d['updatedAt'] ?? d['last_updated'];
        if (updated) setLastUpdatedAt(String(updated));
        const updatedBy = d['updated_by'] ?? d['updatedBy'] ?? d['last_updated_by'];
        if (updatedBy) setLastUpdatedBy(String(updatedBy));
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
        setProvinces(
          arr
            .map((it) => {
              const o = (it ?? {}) as Record<string, unknown>;
              const id = String(o['id'] ?? o['code'] ?? o['province_id'] ?? '');
              const name = String(o['name'] ?? o['province_name'] ?? o['province'] ?? '');
              return { id, name };
            })
            .filter((x) => x.name)
        );
      }
      const resCity = await api.get<unknown>('/general/cities', { Authorization: token });
      if (resCity.status === 'success' && resCity.data && Array.isArray(resCity.data)) {
        const arr = resCity.data as unknown[];
        setCities(
          arr
            .map((it) => {
              const o = (it ?? {}) as Record<string, unknown>;
              const id = String(o['id'] ?? o['code'] ?? o['city_id'] ?? '');
              const name = String(o['name'] ?? o['city_name'] ?? o['city'] ?? '');
              const pid = o['province_id'] ?? o['provinceCode'] ?? o['province_id_code'];
              return {
                id,
                name,
                province_id: typeof pid === 'string' ? pid : typeof pid === 'number' ? String(pid) : undefined,
              };
            })
            .filter((x) => x.name)
        );
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    markDirty();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    const resolvedProvinceId =
      selectedProvinceId || provinces.find((p) => p.name.toLowerCase() === form.province.toLowerCase())?.id || '';
    const resolvedCityId =
      selectedCityId || cities.find((c) => c.name.toLowerCase() === form.city.toLowerCase())?.id || '';
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
      description: form.description,
      whatsapp: form.whatsapp,
      website: form.website,
      domain_url: form.domain_url,
    };
    const res = await api.post('/organization/update', payload, { Authorization: token });
    setSaving(false);
    if (res.status === 'success') {
      const now = new Date();
      setLastSavedAt(now);
      setLastUpdatedAt(now.toISOString());
      setHasUnsavedChanges(false);
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
      setLastUpdatedAt(new Date().toISOString());
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Logo berhasil diunggah', timer: 1500, showConfirmButton: false });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleLogoFile(file);
  };

  const logoFileName = form.logo ? form.logo.split('/').pop()?.split('?')[0] || 'logo.png' : 'Belum ada file';

  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Organisasi</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Atur informasi dan branding perusahaan</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Perubahan belum disimpan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tersimpan
            </span>
          )}
          {lastSavedAt && (
            <span className="text-xs text-slate-500">Terakhir disimpan {formatSavedTime(lastSavedAt)}</span>
          )}
        </div>
      </div>

      <form id="org-settings-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr] xl:gap-8">
          {/* Left sidebar */}
          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            {/* Logo card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Logo Organisasi</h2>
              <p className="mt-1 text-xs text-slate-500">PNG atau JPG, maks. 2 MB</p>

              <div
                className="group relative mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
              >
                {form.logo ? (
                  <img src={form.logo} alt={form.organization_name} className="h-full w-full object-contain p-4" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                    <FileImage className="h-10 w-10 opacity-40" />
                    <span className="text-xs">Belum ada logo</span>
                  </div>
                )}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-opacity duration-300',
                    logoHover ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <Button
                    type="button"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-white text-blue-600 shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-blue-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || saving}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </div>
                <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{logoFileName}</p>
                  <p className="text-[11px] text-slate-400">Rasio disarankan 16:9</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-2xl border-blue-100 bg-blue-50/50 text-blue-600 transition-all duration-300 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || saving}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  Unggah
                </Button>
              </div>
            </div>

            {/* Tips card */}
            <div className="rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-indigo-50/80 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-indigo-950/30">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Tips Pengisian</h3>
              </div>
              <ul className="mt-3 space-y-3 text-xs leading-relaxed text-blue-800/90 dark:text-blue-200/80">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Gunakan nama organisasi yang sama dengan dokumen legal.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Pastikan NPWP 15–16 digit tanpa spasi atau tanda baca.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Logo transparan PNG memberikan tampilan terbaik di katalog.
                </li>
              </ul>
            </div>

            {/* Latest update card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Diperbarui Terakhir</h3>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                {lastUpdatedAt
                  ? new Date(lastUpdatedAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">oleh {lastUpdatedBy || '—'}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Status realtime aktif
              </div>
            </div>
          </aside>

          {/* Right main panel */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:p-10">
            {/* Tabs */}
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-full gap-2 rounded-full bg-slate-100/80 p-1.5 dark:bg-slate-800/80 sm:min-w-0">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300',
                        isActive
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/25'
                          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{activeTabMeta.subtitle}</p>

            <div className="mt-8 space-y-8">
              {/* Detail tab */}
              {activeTab === 'detail' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <SectionTitle>Informasi Umum</SectionTitle>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel htmlFor="organization_name">Nama Organisasi</FieldLabel>
                      <div className="relative">
                        <Landmark className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="organization_name"
                          name="organization_name"
                          value={form.organization_name}
                          onChange={handleChange}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="company_name">Nama Perusahaan</FieldLabel>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="company_name"
                          name="company_name"
                          value={form.company_name}
                          onChange={handleChange}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Jenis Usaha</FieldLabel>
                      <Select
                        value={orgTypeCode}
                        onValueChange={(v) => {
                          setOrgTypeCode(v);
                          setForm((prev) => ({ ...prev, organization_type: typeCodeToLabel(v) }));
                          markDirty();
                        }}
                      >
                        <SelectTrigger className={cn(COMBO_CLS, 'pl-4')}>
                          <SelectValue placeholder="Pilih jenis usaha" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">RENTAL KENDARAAN</SelectItem>
                          <SelectItem value="2">BIRO PERJALANAN WISATA</SelectItem>
                          <SelectItem value="3">RENTAL DAN BIRO PERJALANAN WISATA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="npwp_number">No. NPWP</FieldLabel>
                      <div className="relative">
                        <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="npwp_number"
                          name="npwp_number"
                          value={form.npwp_number}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={16}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 16);
                            setForm((prev) => ({ ...prev, npwp_number: v }));
                            markDirty();
                          }}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <SectionTitle>Deskripsi</SectionTitle>
                  <div className="space-y-2">
                    <FieldLabel htmlFor="description">Deskripsi Perusahaan</FieldLabel>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Ceritakan singkat tentang layanan dan keunggulan perusahaan Anda..."
                      className={TEXTAREA_CLS}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={saving || loading}
                      className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-6 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/40"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Contact tab */}
              {activeTab === 'contact' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <SectionTitle>Kontak Publik</SectionTitle>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel htmlFor="phone">Telepon</FieldLabel>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="phone"
                          name="phone"
                          value={form.phone}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9]/g, '');
                            if (v.startsWith('0')) {
                              v = '62' + v.slice(1);
                            }
                            setForm((prev) => ({ ...prev, phone: v }));
                            markDirty();
                          }}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                      <div className="relative">
                        <MessageCircle className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          value={form.whatsapp}
                          inputMode="numeric"
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9]/g, '');
                            if (v.startsWith('0')) {
                              v = '62' + v.slice(1);
                            }
                            setForm((prev) => ({ ...prev, whatsapp: v }));
                            markDirty();
                          }}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="website">Website</FieldLabel>
                      <div className="relative">
                        <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="website"
                          name="website"
                          value={form.website}
                          onChange={handleChange}
                          placeholder="https://"
                          className={INPUT_CLS}
                          disabled={loading}
                        />
                      </div>
                    </div>                    
                  </div>
                  <p className='text-xs italic text-slate-600'>* Pastikan nomor telepon dan whatsapp aktif untuk memudahkan komunikasi dengan pelanggan</p>
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={saving || loading}
                      className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-6 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/40"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Alamat tab */}
              {activeTab === 'location' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <SectionTitle>Pin Lokasi & Alamat</SectionTitle>
                  <OrganizationPinLocationTab
                    province={form.province}
                    city={form.city}
                    postalCode={form.postal_code}
                    provinces={provinces}
                    cities={cities}
                    selectedProvinceId={selectedProvinceId}
                    selectedCityId={selectedCityId}
                    onProvinceSelect={(name, id) => {
                      setForm((prev) => ({ ...prev, province: name, city: '' }));
                      setSelectedProvinceId(id);
                      setSelectedCityId(null);
                      markDirty();
                    }}
                    onCitySelect={(name, id) => {
                      setForm((prev) => ({ ...prev, city: name }));
                      setSelectedCityId(id);
                      markDirty();
                    }}
                    onPostalCodeChange={(val) => {
                      setForm((prev) => ({ ...prev, postal_code: val }));
                      markDirty();
                    }}
                    onAddressChange={(val) => {
                      setForm((prev) => ({ ...prev, address: val }));
                      markDirty();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
