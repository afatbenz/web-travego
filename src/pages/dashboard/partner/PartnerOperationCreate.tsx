import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

type CityOption = {
  id: number;
  label: string;
};

type FormState = {
  partner_name: string;
  pic_name: string;
  partner_email: string;
  partner_phone: string;
  partner_address: string;
  partner_city: number | null;
  partner_city_label: string;
};

const formFieldClass =
  'h-12 rounded-[18px] border-blue-200/60 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formTextareaClass =
  'min-h-[120px] rounded-[18px] border-blue-200/60 bg-white shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formComboboxTriggerClass =
  'h-12 w-full justify-between rounded-[18px] border-blue-200/60 bg-white px-4 font-normal text-gray-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
const formPopoverContentClass =
  'w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl';
const formCommandItemClass = 'rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900';

const extractCityOptions = (payload: unknown): CityOption[] => {
  let items: unknown[] = [];
  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    const list = root.items ?? root.data ?? root.list ?? root.rows ?? root.result ?? root.cities;
    if (Array.isArray(list)) items = list;
  }

  return items
    .map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const idRaw = item.id ?? item.city_id ?? item.value ?? item.code ?? item.key;
      const labelRaw = item.name ?? item.city_name ?? item.label ?? item.title ?? item.text;
      const id =
        typeof idRaw === 'number'
          ? idRaw
          : typeof idRaw === 'string'
            ? Number.parseInt(idRaw, 10)
            : Number.NaN;
      const label = typeof labelRaw === 'string' ? labelRaw : String(id);
      return Number.isInteger(id) && label ? { id, label } : null;
    })
    .filter((item): item is CityOption => item !== null);
};

const normalizePhone = (value: string): string => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
};

const AsyncCityCombobox: React.FC<{
  value: number | null;
  selectedLabel: string;
  onChange: (value: CityOption | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  fetcher: (query: string) => Promise<CityOption[]>;
}> = ({ value, selectedLabel, onChange, disabled, invalid, fetcher }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CityOption[]>([]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 3) {
      setOptions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetcher(query.trim());
        setOptions(result);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [fetcher, open, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setOptions([]);
      setLoading(false);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(formComboboxTriggerClass, !value && 'text-muted-foreground', invalid && 'border-red-500')}
          disabled={disabled}
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-blue-700" />
            <span className="truncate">{value !== null ? selectedLabel : 'Ketik minimal 3 karakter untuk cari kota'}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={formPopoverContentClass} align="start">
        <Command shouldFilter={false} className="rounded-xl">
          <CommandInput placeholder="Cari kota..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 3 ? 'Ketik minimal 3 karakter.' : loading ? 'Memuat...' : 'Kota tidak ditemukan.'}
            </CommandEmpty>
            <CommandGroup heading="Kota">
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.label} ${option.id}`}
                  className={formCommandItemClass}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const PartnerOperationCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const token = localStorage.getItem('token') ?? '';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    partner_name: '',
    pic_name: '',
    partner_email: '',
    partner_phone: '',
    partner_address: '',
    partner_city: null,
    partner_city_label: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cityFetcher = async (query: string): Promise<CityOption[]> => {
    const res = await api.get<unknown>(`/general/cities?search=${encodeURIComponent(query)}`, token ? { Authorization: token } : undefined);
    if (res.status !== 'success') return [];
    return extractCityOptions(res.data);
  };

  const submitReady = useMemo(() => {
    return (
      Boolean(form.partner_name.trim()) &&
      Boolean(form.pic_name.trim()) &&
      Boolean(form.partner_phone.trim()) &&
      Boolean(form.partner_address.trim()) &&
      form.partner_city !== null
    );
  }, [form]);

  const setField = (key: keyof FormState, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.partner_name.trim()) next.partner_name = 'Nama partner wajib diisi';
    if (!form.pic_name.trim()) next.pic_name = 'PIC wajib diisi';
    if (!form.partner_phone.trim()) next.partner_phone = 'Nomor telepon wajib diisi';
    if (!form.partner_address.trim()) next.partner_address = 'Alamat wajib diisi';
    if (!form.partner_city) next.partner_city = 'Kota wajib dipilih';
    if (form.partner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.partner_email)) {
      next.partner_email = 'Format email tidak valid';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    if (!validate()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validasi',
        text: 'Periksa kembali field yang wajib diisi.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        partner_name: form.partner_name.trim(),
        partner_address: form.partner_address.trim(),
        partner_city: form.partner_city ?? 0,
        partner_phone: normalizePhone(form.partner_phone),
        partner_email: form.partner_email.trim(),
        pic_name: form.pic_name.trim(),
      };

      const res = await api.post<unknown>(
        '/services/partnership/operations/create',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Mitra operasional berhasil ditambahkan.',
        });
        navigate(`${basePrefix}/partner-operations`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/partner-operations`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Tambah Mitra Operasional</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Lengkapi data partner baru untuk kebutuhan operasional.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="rounded-[28px] border border-gray-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
          <CardHeaderWithBadge
            badgeIcon={Building2}
            title="Informasi Mitra"
            subtitle="Masukkan data utama partner operasional sesuai dokumen atau data resmi."
          />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nama Partner *</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                  <Input
                    value={form.partner_name}
                    onChange={(e) => setField('partner_name', e.target.value)}
                    placeholder="Contoh: PT Maju Lancar"
                    className={cn(formFieldClass, errors.partner_name && 'border-red-500')}
                  />
                </div>
                {errors.partner_name ? <p className="text-sm text-red-500">{errors.partner_name}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">PIC *</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                  <Input
                    value={form.pic_name}
                    onChange={(e) => setField('pic_name', e.target.value)}
                    placeholder="Nama PIC partner"
                    className={cn(formFieldClass, errors.pic_name && 'border-red-500')}
                  />
                </div>
                {errors.pic_name ? <p className="text-sm text-red-500">{errors.pic_name}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Alamat Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                  <Input
                    type="email"
                    value={form.partner_email}
                    onChange={(e) => setField('partner_email', e.target.value)}
                    placeholder="email@partner.com"
                    className={cn(formFieldClass, errors.partner_email && 'border-red-500')}
                  />
                </div>
                {errors.partner_email ? <p className="text-sm text-red-500">{errors.partner_email}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nomor Telepon *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                  <Input
                    value={form.partner_phone}
                    onChange={(e) => setField('partner_phone', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 628123456789"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={cn(formFieldClass, errors.partner_phone && 'border-red-500')}
                  />
                </div>
                {errors.partner_phone ? <p className="text-sm text-red-500">{errors.partner_phone}</p> : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Alamat *</label>
                <Textarea
                  value={form.partner_address}
                  onChange={(e) => setField('partner_address', e.target.value)}
                  placeholder="Masukkan alamat lengkap partner"
                  className={cn(formTextareaClass, errors.partner_address && 'border-red-500')}
                />
                {errors.partner_address ? <p className="text-sm text-red-500">{errors.partner_address}</p> : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Pilih Kota *</label>
                <AsyncCityCombobox
                  value={form.partner_city}
                  selectedLabel={form.partner_city_label}
                  onChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      partner_city: value?.id ?? null,
                      partner_city_label: value?.label ?? '',
                    }));
                    if (errors.partner_city) setErrors((prev) => ({ ...prev, partner_city: '' }));
                  }}
                  invalid={Boolean(errors.partner_city)}
                  disabled={saving}
                  fetcher={cityFetcher}
                />
                {errors.partner_city ? <p className="text-sm text-red-500">{errors.partner_city}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10">
          <div className="flex flex-col-reverse gap-3 px-3 py-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-gray-200/70 bg-white px-5 hover:bg-gray-50"
              onClick={() => navigate(`${basePrefix}/partner-operations`)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-white shadow-sm hover:from-blue-700 hover:to-blue-600"
              disabled={saving || !submitReady}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Mitra
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
