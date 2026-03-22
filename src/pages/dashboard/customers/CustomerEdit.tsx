import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Calendar as CalendarIcon, ArrowLeft, Check, ChevronsUpDown, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import { Calendar } from '@/components/ui/calendar';

type Option = { id: string; label: string; raw?: Record<string, unknown> };

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
      const idRaw = it.id ?? it.city_id ?? it.value ?? it.code ?? it.key;
      const labelRaw = it.name ?? it.city_name ?? it.label ?? it.title ?? it.text;
      const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
      const label = typeof labelRaw === 'string' ? labelRaw : id;
      return { id, label, raw: it };
    })
    .filter((o) => o.id && o.label);
}

const AsyncCombobox: React.FC<{
  value: Option | null;
  onChange: (opt: Option | null) => void;
  placeholder: string;
  disabled?: boolean;
  minChars?: number;
  fetcher: (q: string) => Promise<Option[]>;
}> = ({ value, onChange, placeholder, disabled, minChars = 3, fetcher }) => {
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
          className={cn('w-full justify-between h-12', !value && 'text-muted-foreground')}
          disabled={disabled}
        >
          {value ? value.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
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

export const CustomerEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState<Option | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  const cityFetcher = async (q: string) => {
    return fetchOptions(`/general/cities?search=${encodeURIComponent(q)}`, token);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<unknown>(`/services/customers/detail/${encodeURIComponent(id)}`, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>;

        setName(String(data.customer_name ?? data.name ?? ''));
        setEmail(String(data.customer_email ?? data.email ?? ''));
        setMobilePhone(String(data.customer_phone ?? data.phone ?? ''));
        setTelephone(String(data.customer_telephone ?? data.telephone ?? ''));
        setAddress(String(data.customer_address ?? data.address ?? ''));
        setCompanyName(String(data.customer_company ?? data.company_name ?? ''));

        const bodRaw = String(data.customer_bod ?? data.date_of_birth ?? data.customer_dob ?? '');
        if (bodRaw) {
          const d = new Date(bodRaw);
          if (!isNaN(d.getTime())) setDob(d);
        }

        const cityIdRaw = data.customer_city ?? data.city_id ?? data.city ?? data.cityId;
        const cityNameRaw = data.customer_city_name ?? data.city_name ?? data.city_name_label ?? data.city_label ?? data.cityName;
        const cityId = typeof cityIdRaw === 'string' || typeof cityIdRaw === 'number' ? String(cityIdRaw) : '';
        const cityLabel = typeof cityNameRaw === 'string' ? cityNameRaw : '';
        if (cityId || cityLabel) setCity({ id: cityId || cityLabel, label: cityLabel || cityId });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Nama pelanggan wajib diisi';
    if (!mobilePhone.trim()) return 'Nomor HP wajib diisi';
    if (!address.trim()) return 'Alamat wajib diisi';
    if (!city) return 'Kota wajib dipilih';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email tidak valid';
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
    if (!id) return;

    setSaving(true);
    try {
      const dobIso = dob
        ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
        : undefined;
      const payload = {
        customer_id: id,
        customer_name: name.trim(),
        customer_phone: mobilePhone.trim(),
        customer_telephone: telephone.trim() || undefined,
        customer_address: address.trim(),
        city_id: city?.id ?? '',
        ...(dobIso ? { date_of_birth: dobIso } : {}),
        customer_email: email.trim() || undefined,
        company_name: companyName.trim() || undefined,
      };
      const res = await api.post<unknown>('/services/customers/update', payload, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data customer berhasil diperbarui.' });
        navigate(`${basePrefix}/customers/detail/${encodeURIComponent(id)}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/customers/detail/${encodeURIComponent(id ?? '')}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ubah Data Pelanggan</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Perbarui informasi customer</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Pelanggan</label>
                  <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama customer" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Telepon</label>
                  <Input
                    className="h-12"
                    value={telephone}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => setTelephone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="021xxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor HP</label>
                  <Input
                    className="h-12"
                    value={mobilePhone}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => setMobilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="62xxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Alamat</label>
                  <Input className="h-12" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat customer" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kota</label>
                  <AsyncCombobox value={city} onChange={setCity} placeholder="Cari kota..." fetcher={cityFetcher} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Lahir</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                  <label className="text-sm font-medium">Perusahaan / Organisasi</label>
                  <Input className="h-12" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nama perusahaan" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/customers/detail/${encodeURIComponent(id ?? '')}`)}>
            Batal
          </Button>
          <Button type="submit" disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
