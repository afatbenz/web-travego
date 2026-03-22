import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

type Option = { id: string; label: string; raw?: Record<string, unknown> };

function daysBetweenInclusive(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate());
  const diff = endDay.getTime() - startDay.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, days);
}

function dayLabelFromPickup(pickupAt: string, day: number): string {
  if (!pickupAt || !day) return '';
  const d = new Date(pickupAt);
  if (isNaN(d.getTime())) return '';
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  base.setDate(base.getDate() + Math.max(0, day - 1));
  return base.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

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
      const idRaw =
        it.id ??
        it.fleet_id ??
        it.customer_id ??
        it.city_id ??
        it.value ??
        it.code ??
        it.key;
      const labelRaw =
        it.name ??
        it.fleet_name ??
        it.customer_name ??
        it.city_name ??
        it.label ??
        it.title ??
        it.text;
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
          <CommandInput
            placeholder="Ketik untuk mencari..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </div>
            ) : null}
            {!loading && query.trim().length < minChars ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Minimal {minChars} karakter
              </div>
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

type ItineraryStop = {
  id: string;
  city: Option | null;
  location: string;
};

type ItineraryItem = {
  day: number;
  stops: ItineraryStop[];
};

function formatRupiahFromDigits(digits: string): string {
  const clean = digits.replace(/[^0-9]/g, '');
  if (!clean) return '';
  const n = Number(clean);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function digitsToNumber(digits: string): number {
  const clean = digits.replace(/[^0-9]/g, '');
  if (!clean) return 0;
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export const FleetOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [saving, setSaving] = useState(false);
  const [fleet, setFleet] = useState<Option | null>(null);
  const [customer, setCustomer] = useState<Option | null>(null);
  const [pickupAt, setPickupAt] = useState('');
  const [dropoffAt, setDropoffAt] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState<Option | null>(null);
  const [dpAmount, setDpAmount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

  const daysCount = useMemo(() => daysBetweenInclusive(pickupAt, dropoffAt), [pickupAt, dropoffAt]);

  useEffect(() => {
    if (daysCount <= 0) {
      setItinerary([]);
      return;
    }
    setItinerary((prev) => {
      const next: ItineraryItem[] = [];
      for (let i = 1; i <= daysCount; i++) {
        const existing = prev.find((p) => p.day === i);
        if (existing) {
          const stops = (existing.stops ?? []).length > 0 ? existing.stops : [{ id: crypto.randomUUID(), city: null, location: '' }];
          next.push({ day: i, stops });
        } else {
          next.push({ day: i, stops: [{ id: crypto.randomUUID(), city: null, location: '' }] });
        }
      }
      return next;
    });
  }, [daysCount]);

  const fleetFetcher = async (q: string) => {
    const qp = `?fleet_name=${encodeURIComponent(q)}&search=${encodeURIComponent(q)}`;
    return fetchOptions(`/services/fleet/list${qp}`, token);
  };

  const customerFetcher = async (q: string) => {
    const qp = `?customer_name=${encodeURIComponent(q)}&search=${encodeURIComponent(q)}`;
    return fetchOptions(`/services/customers${qp}`, token);
  };

  const cityFetcher = async (q: string) => {
    const qp = `?search=${encodeURIComponent(q)}`;
    return fetchOptions(`/general/cities${qp}`, token);
  };

  const validate = (): string | null => {
    if (!fleet) return 'Pilih armada terlebih dahulu';
    if (!customer) return 'Pilih customer terlebih dahulu';
    if (!pickupAt) return 'Tanggal dan jam penjemputan wajib diisi';
    if (!dropoffAt) return 'Tanggal dan jam pengantaran wajib diisi';
    if (!pickupAddress.trim()) return 'Alamat penjemputan wajib diisi';
    if (!pickupCity) return 'Kota penjemputan wajib dipilih';
    const dp = digitsToNumber(dpAmount);
    const total = digitsToNumber(totalPrice);
    if (dp <= 0) return 'Nominal DP wajib diisi';
    if (total <= 0) return 'Total harga wajib diisi';
    if (dp > total) return 'Nominal DP tidak boleh lebih besar dari total harga';
    if (daysCount > 0) {
      for (const it of itinerary) {
        if (!it.stops || it.stops.length === 0) return `Itinerary hari ke-${it.day} wajib diisi`;
        for (const s of it.stops) {
          if (!s.city) return `Kota tujuan hari ke-${it.day} wajib dipilih`;
          if (!s.location.trim()) return `Lokasi hari ke-${it.day} wajib diisi`;
        }
      }
    }
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
      const total = digitsToNumber(totalPrice);
      const dp = digitsToNumber(dpAmount);
      const payload = {
        fleet_id: fleet!.id,
        customer_id: customer!.id,
        pickup_datetime: pickupAt,
        dropoff_datetime: dropoffAt,
        pickup_address: pickupAddress,
        pickup_city_id: pickupCity!.id,
        price: total,
        dp_amount: dp,
        itinerary: itinerary.flatMap((it) =>
          (it.stops ?? []).map((s) => ({
            day: it.day,
            city_id: s.city?.id ?? '',
            destination: s.location,
          }))
        ),
      };
      const res = await api.post<unknown>('/services/fleet/orders/create', payload, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pesanan berhasil dibuat.' });
        navigate(`${basePrefix}/orders/fleet`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/orders/fleet`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Form Pesanan Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Tambahkan pesanan baru</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Armada</label>
                <AsyncCombobox value={fleet} onChange={setFleet} placeholder="Cari armada..." fetcher={fleetFetcher} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <AsyncCombobox value={customer} onChange={setCustomer} placeholder="Cari customer..." fetcher={customerFetcher} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal & Jam Penjemputan</label>
                <Input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal & Jam Pengantaran</label>
                <Input type="datetime-local" value={dropoffAt} onChange={(e) => setDropoffAt(e.target.value)} className="h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Penjemputan</label>
                <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="h-12" placeholder="Alamat penjemputan" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kota Penjemputan</label>
                <AsyncCombobox value={pickupCity} onChange={setPickupCity} placeholder="Cari kota..." fetcher={cityFetcher} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nominal DP</label>
                <Input
                  value={formatRupiahFromDigits(dpAmount)}
                  inputMode="numeric"
                  onChange={(e) => setDpAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-12"
                  placeholder="Rp 0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Harga</label>
                <Input
                  value={formatRupiahFromDigits(totalPrice)}
                  inputMode="numeric"
                  onChange={(e) => setTotalPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-12"
                  placeholder="Rp 0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            {daysCount <= 0 ? (
              <div className="text-sm text-muted-foreground">Isi tanggal penjemputan dan pengantaran untuk membuat itinerary.</div>
            ) : (
              <div className="space-y-6">
                {itinerary.map((it) => (
                  <div key={it.day} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Hari {it.day}</div>
                        {pickupAt ? (
                          <div className="text-xs text-muted-foreground">Tanggal: {dayLabelFromPickup(pickupAt, it.day) || '-'}</div>
                        ) : null}
                        <div className="text-xs text-muted-foreground">Tambahkan lokasi tujuan untuk hari ini</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          setItinerary((prev) =>
                            prev.map((p) =>
                              p.day === it.day
                                ? { ...p, stops: [...(p.stops ?? []), { id: crypto.randomUUID(), city: null, location: '' }] }
                                : p
                            )
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Lokasi
                      </Button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {(it.stops ?? []).map((s) => (
                        <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Kota Tujuan</label>
                            <AsyncCombobox
                              value={s.city}
                              onChange={(v) =>
                                setItinerary((prev) =>
                                  prev.map((p) =>
                                    p.day === it.day
                                      ? {
                                          ...p,
                                          stops: (p.stops ?? []).map((x) => (x.id === s.id ? { ...x, city: v } : x)),
                                        }
                                      : p
                                  )
                                )
                              }
                              placeholder="Cari kota tujuan..."
                              fetcher={cityFetcher}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Lokasi</label>
                            <Input
                              value={s.location}
                              onChange={(e) =>
                                setItinerary((prev) =>
                                  prev.map((p) =>
                                    p.day === it.day
                                      ? {
                                          ...p,
                                          stops: (p.stops ?? []).map((x) => (x.id === s.id ? { ...x, location: e.target.value } : x)),
                                        }
                                      : p
                                  )
                                )
                              }
                              className="h-12"
                              placeholder="Contoh: Malioboro / Pantai / dll"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 w-12 p-0"
                              disabled={(it.stops ?? []).length <= 1}
                              onClick={() =>
                                setItinerary((prev) =>
                                  prev.map((p) =>
                                    p.day === it.day
                                      ? { ...p, stops: (p.stops ?? []).filter((x) => x.id !== s.id) }
                                      : p
                                  )
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/orders/fleet`)}>
            Batal
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buat Pesanan
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
