import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronsUpDown, IdCard, Image, Loader2, Save, Upload, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { api, deleteCommon, uploadCommon } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type Option = { id: string; label: string; raw?: Record<string, unknown> };

const formFieldClass =
  'h-12 rounded-[18px] border-blue-200/60 bg-white shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formSelectTriggerClass =
  'h-12 rounded-[18px] border-blue-200/60 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formSelectContentClass = 'rounded-xl border border-gray-200/70 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-950';
const formSelectItemClass =
  'rounded-lg data-[highlighted]:bg-blue-50 data-[highlighted]:text-gray-900 data-[state=checked]:bg-blue-50 dark:data-[highlighted]:bg-slate-900 dark:data-[state=checked]:bg-slate-900';
const formComboboxTriggerClass =
  'h-12 w-full justify-between rounded-[18px] border-blue-200/60 bg-white px-4 font-normal text-gray-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formPopoverContentClass =
  'w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-slate-950';
const formCommandItemClass =
  'rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900 dark:data-[selected=true]:bg-slate-900';
const formTextareaClass =
  'min-h-[120px] rounded-[18px] border-blue-200/60 bg-white shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

async function fetchOptions(url: string, token: string): Promise<Option[]> {
  const res = await api.get<unknown>(url, token ? { Authorization: token } : undefined);
  if (res.status !== 'success') return [];
  const payload = res.data as unknown;
  let items: unknown[] = [];
  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const list = o.items ?? o.data ?? o.list ?? o.rows ?? o.result;
    if (Array.isArray(list)) items = list;
  }
  return items
    .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
    .filter((it): it is Record<string, unknown> => Boolean(it))
    .map((it) => {
      const idRaw = it.id ?? it.uuid ?? it.role_id ?? it.contract_type_id ?? it.value ?? it.code ?? it.key;
      const labelRaw = it.name ?? it.role_name ?? it.contract_type_name ?? it.label ?? it.title ?? it.text;
      const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
      const label = typeof labelRaw === 'string' ? labelRaw : id;
      return { id, label, raw: it };
    })
    .filter((o) => o.id && o.label);
}

async function getWithFallback(paths: string[], token: string) {
  for (const p of paths) {
    const res = await api.get<unknown>(p, token ? { Authorization: token } : undefined);
    if (res.status === 'success') return res;
  }
  return null;
}

const AsyncCombobox: React.FC<{
  value: Option | null;
  onChange: (opt: Option | null) => void;
  placeholder: string;
  disabled?: boolean;
  minChars?: number;
  fetcher: (q: string) => Promise<Option[]>;
}> = ({ value, onChange, placeholder, disabled, minChars = 2, fetcher }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < minChars) {
      setOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetcher(query.trim());
        setOptions(res);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, query, minChars, fetcher]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(formComboboxTriggerClass, !value && 'text-muted-foreground')}
          disabled={disabled}
        >
          {value ? value.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={formPopoverContentClass} align="start">
        <Command className="rounded-xl">
          <CommandInput placeholder="Ketik untuk mencari..." value={query} onValueChange={setQuery} />
          <CommandList>
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </div>
            ) : null}
            {!loading && query.trim().length < minChars ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Minimal {minChars} karakter</div>
            ) : null}
            <CommandEmpty>Tidak ada data</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  className={formCommandItemClass}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value?.id === opt.id ? 'opacity-100' : 'opacity-0')} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const TeamMemberCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const token = localStorage.getItem('token') ?? '';

  const [saving, setSaving] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingContractTypes, setLoadingContractTypes] = useState(true);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);
  const [contractTypeOptions, setContractTypeOptions] = useState<Option[]>([]);

  const [photoPreview, setPhotoPreview] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [nik, setNik] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState<Option | null>(null);
  const [nip, setNip] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [contractTypeId, setContractTypeId] = useState('');

  const normalizePhone = (raw: string) => {
    const digits = String(raw ?? '').replace(/[^0-9]/g, '');
    const trimmedLeadingZeros = digits.replace(/^0+/, '');
    const base = trimmedLeadingZeros.startsWith('62') ? trimmedLeadingZeros : `62${trimmedLeadingZeros}`;
    return base.length < 2 ? '62' : base;
  };

  useEffect(() => {
    setPhone((prev) => normalizePhone(prev || '62'));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingRoles(true);
      setLoadingContractTypes(true);
      try {
        const rolesResp = await getWithFallback(['/services/team/roles', '/team/roles'], token);
        if (rolesResp?.status === 'success') {
          const payload = rolesResp.data as unknown;
          const root = toRecord(payload);
          const rootData = root.data;
          const dataObj = toRecord(rootData);
          const items =
            (Array.isArray(payload) ? payload : undefined) ??
            (Array.isArray(rootData) ? rootData : undefined) ??
            (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
            (Array.isArray(dataObj.roles) ? dataObj.roles : undefined) ??
            (Array.isArray(root.roles) ? root.roles : undefined) ??
            [];
          const mapped = (items as unknown[]).map((raw) => {
            const obj = toRecord(raw);
            const id = toStringSafe(obj.role_id).trim();
            const label = `${toStringSafe(obj.role_name).trim()} (Divisi ${toStringSafe(obj.division_name).trim()})`;
            return { id, label, raw: obj };
          });
          setRoleOptions(mapped.filter((x) => x.id && x.label));
        } else {
          setRoleOptions([]);
        }
      } finally {
        setLoadingRoles(false);
      }

      try {
        const contractResp = await getWithFallback(['/general/contract-type', '/services/general/contract-type'], token);
        if (contractResp?.status === 'success') {
          const payload = contractResp.data as unknown;
          const root = toRecord(payload);
          const rootData = root.data;
          const dataObj = toRecord(rootData);
          const items =
            (Array.isArray(payload) ? payload : undefined) ??
            (Array.isArray(rootData) ? rootData : undefined) ??
            (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
            (Array.isArray(dataObj.contract_types) ? dataObj.contract_types : undefined) ??
            (Array.isArray(dataObj.contractTypes) ? dataObj.contractTypes : undefined) ??
            (Array.isArray(root.contract_types) ? root.contract_types : undefined) ??
            (Array.isArray(root.contractTypes) ? root.contractTypes : undefined) ??
            [];

          const mapped = (items as unknown[]).map((raw) => {
            const obj = toRecord(raw);
            const id = toStringSafe(obj.contract_type_id ?? obj.contractTypeId ?? obj.id ?? obj.code ?? obj.value).trim();
            const label = toStringSafe(obj.contract_type_name ?? obj.contractTypeName ?? obj.name ?? obj.label ?? obj.title).trim();
            return { id, label, raw: obj };
          });
          setContractTypeOptions(mapped.filter((x) => x.id && x.label));
        } else {
          setContractTypeOptions([]);
        }
      } finally {
        setLoadingContractTypes(false);
      }
    };
    load();
  }, [token]);

  const cityFetcher = async (q: string) => {
    return fetchOptions(`/general/cities?search=${encodeURIComponent(q)}`, token);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const prevPreview = photoPreview;
    const prevPath = photoPath;
    const previewUrl = URL.createObjectURL(file);

    if (prevPath) {
      try {
        await deleteCommon([prevPath], token);
      } catch {
        void 0;
      }
    }

    setPhotoPreview(previewUrl);
    setPhotoPath('');
    setPhotoUploading(true);
    try {
      const res = await uploadCommon('employee_photo', [file], token);
      if (res.status === 'success') {
        const data = res.data as unknown;
        const obj = toRecord(data);
        const filesRaw = obj.files;
        const path =
          Array.isArray(filesRaw) && filesRaw.length > 0
            ? toStringSafe(filesRaw[0]).trim()
            : toStringSafe(obj.file).trim() || toStringSafe(obj.path).trim();
        setPhotoPath(path);
      }
    } finally {
      setPhotoUploading(false);
      if (prevPreview && prevPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prevPreview);
        } catch {
          void 0;
        }
      }
    }
  };

  const removePhoto = async () => {
    if (photoPath) {
      try {
        await deleteCommon([photoPath], token);
      } catch {
        void 0;
      }
    }
    if (photoPreview && photoPreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch {
        void 0;
      }
    }
    setPhotoPreview('');
    setPhotoPath('');
  };

  const validate = () => {
    if (!name.trim()) return 'Nama karyawan wajib diisi';
    if (!roleId) return 'Role wajib dipilih';
    if (!nik.trim()) return 'NIK wajib diisi';
    if (!dob) return 'Tanggal lahir wajib diisi';
    if (!phone.trim() || phone.trim() === '62') return 'Nomor telepon wajib diisi';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email tidak valid';
    if (!address.trim()) return 'Alamat wajib diisi';
    if (!city) return 'Kota asal wajib dipilih';
    if (!nip.trim()) return 'ID Karyawan wajib diisi';
    if (!joinDate) return 'Tanggal bergabung wajib diisi';
    if (!contractTypeId) return 'Status kontrak wajib dipilih';
    if (photoUploading) return 'Upload foto masih diproses';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const err = validate();
    if (err) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: err });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        photo: photoPath || undefined,
        fullname: name.trim(),
        role_id: roleId,
        nik: nik.trim(),
        date_of_birth: dob,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city_id: city?.id ?? '',
        employee_id: nip.trim(),
        join_date: joinDate,
        contract_type_id: contractTypeId,
      };

      const res = await api.post<unknown>('/services/employee/create', payload, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Team member berhasil ditambahkan.' });
        navigate(`${basePrefix}/organization/team-members`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/organization/team-members`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Member Baru</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Lengkapi data karyawan</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-1 h-fit">
            <CardHeaderWithBadge
              badgeIcon={Image}
              title="Foto"
              subtitle="Unggah foto karyawan untuk identitas profil."
            />
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                  {photoPreview ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                      <img src={photoPreview} alt="Foto karyawan" className="w-full h-full object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removePhoto}>
                        <X className="h-4 w-4" />
                      </Button>
                      {photoUploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-10">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Upload Foto</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeaderWithBadge
              badgeIcon={IdCard}
              title="Informasi Karyawan"
              subtitle="Lengkapi data identitas dan administrasi karyawan."
            />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">
                    Nama Karyawan <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" className={formFieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama karyawan" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nip">
                    NIP (ID Karyawan) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nip"
                    className={formFieldClass}
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="NIP / ID Karyawan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nik">
                    NIK <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nik"
                    className={formFieldClass}
                    value={nik}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="NIK"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Input id="dob" type="date" className={formFieldClass} value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    className={formFieldClass}
                    value={phone}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    placeholder="62xxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" className={formFieldClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">
                    Alamat <span className="text-red-500">*</span>
                  </Label>
                  <Textarea id="address" rows={4} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap" className={formTextareaClass} />
                </div>

                <div className="space-y-2">
                  <Label>
                    Kota Asal <span className="text-red-500">*</span>
                  </Label>
                  <AsyncCombobox value={city} onChange={setCity} placeholder="Cari kota..." fetcher={cityFetcher} />
                </div>

                <div className="space-y-2">
                  <Label>
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={roleId} onValueChange={setRoleId} disabled={loadingRoles}>
                    <SelectTrigger className={formSelectTriggerClass}>
                      <SelectValue placeholder={loadingRoles ? 'Memuat role...' : 'Pilih role'} />
                    </SelectTrigger>
                    <SelectContent className={formSelectContentClass}>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id} className={formSelectItemClass}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">
                    Tanggal Bergabung <span className="text-red-500">*</span>
                  </Label>
                  <Input id="joinDate" type="date" className={formFieldClass} value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>
                    Status Kontrak <span className="text-red-500">*</span>
                  </Label>
                  <Select value={contractTypeId} onValueChange={setContractTypeId} disabled={loadingContractTypes}>
                    <SelectTrigger className={formSelectTriggerClass}>
                      <SelectValue placeholder={loadingContractTypes ? 'Memuat status...' : 'Pilih status kontrak'} />
                    </SelectTrigger>
                    <SelectContent className={formSelectContentClass}>
                      {contractTypeOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id} className={formSelectItemClass}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || photoUploading}>
                  {saving ? (
                    'Menyimpan...'
                  ) : (
                    <span className="inline-flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Team Member
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};
