import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ArrowLeft, Check, ChevronsUpDown, Eye, Loader2, Plus, ShoppingCart, Trash2 } from 'lucide-react';
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

type FleetPriceOption = {
  price_id: string;
  duration: number;
  price: number;
  rent_type: number | undefined;
  raw: Record<string, unknown>;
};

type ArmadaEntry = {
  armada_id: string;
  price_id: string;
  qty: string;
  biaya_lain: string;
  discount: string;
  fleet_prices: FleetPriceOption[];
  loading_prices: boolean;
};

function formatRupiahFromNumber(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTimeTicket(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
}

async function fetchJsonSilent(path: string, token: string): Promise<unknown> {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
  const url = path.startsWith('http') ? path : `${base.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { headers: token ? { Authorization: token, Accept: 'application/json' } : { Accept: 'application/json' } });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) return null;
  return json;
}

export const FleetOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [saving, setSaving] = useState(false);
  const [rentType, setRentType] = useState('1');
  const [armadaEntries, setArmadaEntries] = useState<ArmadaEntry[]>([
    {
      armada_id: '',
      price_id: '',
      qty: '1',
      biaya_lain: '',
      discount: '',
      fleet_prices: [],
      loading_prices: false,
    },
  ]);
  const [armadaEntryOptions, setArmadaEntryOptions] = useState<(Option | null)[]>([null]);
  const [customer, setCustomer] = useState<Option | null>(null);
  const [pickupAt, setPickupAt] = useState('');
  const [dropoffAt, setDropoffAt] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState<Option | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [specialRequest, setSpecialRequest] = useState('');

  const primaryFleetId = useMemo(() => armadaEntries.find((e) => e.armada_id)?.armada_id ?? '', [armadaEntries]);
  const primaryFleetLabel = useMemo(() => {
    const idx = armadaEntries.findIndex((e) => e.armada_id);
    if (idx < 0) return '';
    return armadaEntryOptions[idx]?.label ?? '';
  }, [armadaEntries, armadaEntryOptions]);

  const { armadaAdditionalTotal, armadaDiscountTotal, armadaBasePriceTotal, computedTotalPrice } = useMemo(() => {
    const additional = armadaEntries.reduce((acc, r) => acc + digitsToNumber(r.biaya_lain), 0);
    const discount = armadaEntries.reduce((acc, r) => acc + digitsToNumber(r.discount), 0);
    const base = armadaEntries.reduce((acc, r) => {
      const priceObj = r.fleet_prices.find((p) => p.price_id === r.price_id);
      const price = priceObj?.price ?? 0;
      const qty = digitsToNumber(r.qty) || 0;
      return acc + price * qty;
    }, 0);
    const total = Math.max(0, base + additional - discount);
    return {
      armadaAdditionalTotal: additional,
      armadaDiscountTotal: discount,
      armadaBasePriceTotal: base,
      computedTotalPrice: total,
    };
  }, [armadaEntries]);

  const daysCount = useMemo(() => daysBetweenInclusive(pickupAt, dropoffAt), [pickupAt, dropoffAt]);

  const fetchPricesForEntry = async (fleetId: string, currentRentType: string): Promise<FleetPriceOption[]> => {
    const defaultNoPrice: FleetPriceOption = {
      price_id: '0',
      duration: 0,
      price: 0,
      rent_type: undefined,
      raw: {},
    };

    if (!fleetId) return [];
    try {
      const primaryPath = `/services/fleet/prices/${encodeURIComponent(fleetId)}/${encodeURIComponent(currentRentType)}`;
      const fallbackPath = `/services/fleet/prices/${encodeURIComponent(fleetId)}`;

      let payload: unknown = null;
      const resPrimary = await api.get<unknown>(primaryPath, token ? { Authorization: token } : undefined);
      if (resPrimary.status === 'success') payload = resPrimary.data;
      if (!payload) {
        const resFallback = await api.get<unknown>(fallbackPath, token ? { Authorization: token } : undefined);
        if (resFallback.status === 'success') payload = resFallback.data;
      }
      if (!payload) return [defaultNoPrice];

      const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
      const data = (root.data ?? payload) as unknown;
      const items = Array.isArray(data) ? data : [];

      const prices = items
        .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
        .filter((it): it is Record<string, unknown> => Boolean(it))
        .map((it): FleetPriceOption | null => {
          const rentTypeRaw = it.rent_type ?? it.rentType ?? it.type ?? it.rent_category;
          const rt = typeof rentTypeRaw === 'number' ? rentTypeRaw : Number(rentTypeRaw ?? NaN);
          const durationRaw = it.duration ?? it.duration_label ?? it.label ?? it.name;
          const duration = typeof durationRaw === 'number' ? durationRaw : Number(durationRaw ?? NaN);
          const priceRaw = it.price ?? it.amount ?? it.value ?? 0;
          const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0);
          const priceIdRaw = it.price_id;
          const price_id = typeof priceIdRaw === 'string' || typeof priceIdRaw === 'number' ? String(priceIdRaw) : '';
          return price_id && Number.isFinite(duration)
            ? { price_id, duration, price, rent_type: Number.isFinite(rt) ? rt : undefined, raw: it }
            : null;
        })
        .filter((x): x is FleetPriceOption => x !== null);

      return prices.length > 0 ? prices : [defaultNoPrice];
    } catch (error) {
      console.error('Error fetching prices:', error);
      return [defaultNoPrice];
    }
  };

  useEffect(() => {
    const updateAllPrices = async () => {
      const newEntries = await Promise.all(
        armadaEntries.map(async (entry) => {
          if (!entry.armada_id) return entry;
          const prices = await fetchPricesForEntry(entry.armada_id, rentType);
          let newPriceId = entry.price_id;
          if (prices.length === 1) {
            newPriceId = prices[0].price_id;
          } else if (!prices.find((p) => p.price_id === entry.price_id)) {
            newPriceId = '';
          }
          return { ...entry, fleet_prices: prices, price_id: newPriceId };
        })
      );
      setArmadaEntries(newEntries);
    };
    updateAllPrices();
  }, [rentType]);

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
    if (armadaEntries.length <= 0) return 'Minimal 1 armada wajib diisi';
    for (let i = 0; i < armadaEntries.length; i++) {
      const entry = armadaEntries[i];
      if (!entry.armada_id) return `Pilih armada pada baris ke-${i + 1}`;
      if (entry.fleet_prices.length > 0 && !entry.price_id) return `Pilih durasi sewa pada baris ke-${i + 1}`;
      if (digitsToNumber(entry.qty) <= 0) return `Jumlah armada pada baris ke-${i + 1} minimal 1`;
    }
    if (!customer) return 'Pilih customer terlebih dahulu';
    if (!pickupAt) return 'Tanggal dan jam penjemputan wajib diisi';
    if (!dropoffAt) return 'Tanggal dan jam pengantaran wajib diisi';
    if (!pickupAddress.trim()) return 'Alamat penjemputan wajib diisi';
    if (!pickupCity) return 'Kota penjemputan wajib dipilih';
    
    if (computedTotalPrice <= 0) return 'Total harga wajib diisi';
    if (daysCount > 0) {
      for (const it of itinerary) {
        const allowEmpty = it.day === 1 || it.day === daysCount;
        if (!allowEmpty && (!it.stops || it.stops.length === 0)) return `Itinerary hari ke-${it.day} wajib diisi`;
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
      const discount = armadaDiscountTotal;
      const additional = armadaAdditionalTotal;
      const totalQty = armadaEntries.reduce((acc, r) => acc + digitsToNumber(r.qty), 0);
      const firstEntry = armadaEntries[0];
      
      const payload = {
        fleet_id: firstEntry.armada_id,
        ...(firstEntry.price_id ? { price_id: firstEntry.price_id } : {}),
        rent_type: Number(rentType),
        customer_id: customer!.id,
        pickup_datetime: pickupAt,
        dropoff_datetime: dropoffAt,
        pickup_address: pickupAddress,
        pickup_city_id: pickupCity!.id,
        fleet_qty: totalQty,
        price: computedTotalPrice,
        discount_amount: discount,
        additional_amount: additional,
        additional_request: specialRequest,
        fleets: armadaEntries.map((r) => ({
          armada_id: r.armada_id,
          price_id: r.price_id,
          qty: digitsToNumber(r.qty),
          biaya_lain: digitsToNumber(r.biaya_lain),
          discount: digitsToNumber(r.discount),
        })),
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

  const onPreview = async () => {
    const totalTagihan = armadaBasePriceTotal + armadaAdditionalTotal;
    const sisaTagihan = Math.max(0, totalTagihan - armadaDiscountTotal);
    
    const itemsTableRows = armadaEntries.map((r, i) => {
      const priceObj = r.fleet_prices.find((p) => p.price_id === r.price_id);
      const label = armadaEntryOptions[i]?.label ?? 'Armada';
      return {
        item: label,
        qty: digitsToNumber(r.qty),
        price: priceObj?.price ?? 0,
        total: (priceObj?.price ?? 0) * digitsToNumber(r.qty),
      };
    });

    const itemsTableHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">No</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Item</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Jumlah</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Harga</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsTableRows
            .map(
              (r, i) => `
                <tr>
                  <td style="border:1px solid #e5e7eb;padding:8px">${i + 1}</td>
                  <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(r.item || '-')}</td>
                  <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${escapeHtml(String(r.qty || 0))}</td>
                  <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(r.price || 0)}</td>
                  <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(r.total || 0)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
        <tfoot>
          ${
            armadaAdditionalTotal > 0
              ? `
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Biaya Lain</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(armadaAdditionalTotal)}</b></td>
          </tr>
          `
              : ''
          }
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Total Tagihan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(totalTagihan)}</b></td>
          </tr>
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Potongan Harga</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(armadaDiscountTotal)}</td>
          </tr>
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Sisa Tagihan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(sisaTagihan)}</b></td>
          </tr>
        </tfoot>
      </table>
    `;

    const customerDetailJson =
      customer?.id ? await fetchJsonSilent(`/services/customers/detail/${encodeURIComponent(String(customer.id))}`, token) : null;
    const customerDetailRoot =
      customerDetailJson && typeof customerDetailJson === 'object' ? (customerDetailJson as Record<string, unknown>) : {};
    const customerDetailData =
      (customerDetailRoot.data && typeof customerDetailRoot.data === 'object' ? customerDetailRoot.data : customerDetailRoot) as Record<
        string,
        unknown
      >;
    const customerName = String(customerDetailData.customer_name ?? customerDetailData.name ?? customer?.label ?? '');
    const customerEmail = String(customerDetailData.customer_email ?? customerDetailData.email ?? '');
    const customerPhone = String(customerDetailData.customer_phone ?? customerDetailData.phone ?? '');
    const customerTelephone = String(customerDetailData.customer_telephone ?? customerDetailData.telephone ?? '');
    const customerAddress = String(customerDetailData.customer_address ?? customerDetailData.address ?? '');
    const customerCity = String(customerDetailData.customer_city_name ?? customerDetailData.city_name ?? customerDetailData.city ?? '');
    const customerAddressText = customerAddress && customerCity ? `${customerAddress}, ${customerCity}` : (customerAddress || customerCity || '-');

    const itineraryTableHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          ${itinerary
            .map((day) => {
              const dateLabel = pickupAt ? dayLabelFromPickup(pickupAt, day.day) : '';
              const visibleStops = (day.stops ?? []).filter((s) => s.city || s.location.trim());
              const rows = visibleStops
                .filter((s) => s.city || s.location.trim())
                .map(
                  (s, idx) => `
                    <tr>
                      <td style="border:1px solid #e5e7eb;padding:8px">${idx + 1}</td>
                      <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(dateLabel || '-')}</td>
                      <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(s.location || '-')}</td>
                      <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(s.city?.label ?? '-')}</td>
                    </tr>
                  `
                )
                .join('');
              const bodyRows =
                rows ||
                `
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:8px">1</td>
                    <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(dateLabel || '-')}</td>
                    <td style="border:1px solid #e5e7eb;padding:8px">-</td>
                    <td style="border:1px solid #e5e7eb;padding:8px">-</td>
                  </tr>
                `;
              return `
                <tr>
                  <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;background:#f9fafb"><b>Hari ke-${day.day}</b></td>
                </tr>
                <tr>
                  <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">No</th>
                  <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Tanggal</th>
                  <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Lokasi</th>
                  <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Kota</th>
                </tr>
                ${bodyRows}
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;

    const dropoffAddressText = pickupAddress || '-';

    const html = `
      <div style="text-align:left;background:#f3f4f6;padding:12px;border-radius:14px">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
          <div style="padding:12px 16px">
            <div style="font-size:14px;font-weight:700">Order Preview</div>
            <div style="height:1px;background:#e5e7eb;margin:10px 0 0 0"></div>
          </div>

          <div style="padding:14px 16px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;font-size:13px">
              <div>
                <div style="font-weight:600;margin-bottom:8px">Pemesan</div>
                <div><b>Nama Pemesan</b>: ${escapeHtml(customerName || '-')}</div>
                <div><b>No. Telepon</b>: ${escapeHtml(customerPhone || customerTelephone || '-')}</div>
                <div><b>Email</b>: ${escapeHtml(customerEmail || '-')}</div>
                <div><b>Alamat</b>: ${escapeHtml(customerAddressText)}</div>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:8px">Pickup / Dropoff</div>
                <div><b>Alamat Pickup</b>: ${escapeHtml(pickupAddress || '-')}</div>
                <div><b>Waktu Pickup</b>: ${escapeHtml(formatDateTimeTicket(pickupAt))}</div>
                <div><b>Alamat Drop off</b>: ${escapeHtml(dropoffAddressText)}</div>
                <div><b>Waktu DropOff</b>: ${escapeHtml(formatDateTimeTicket(dropoffAt))}</div>
              </div>
            </div>

            <div style="height:1px;background:#e5e7eb;margin:12px 0"></div>

            <div style="font-size:14px;font-weight:700;margin-bottom:8px">Order Detail</div>
            ${itemsTableHtml}

            <div style="height:1px;background:#e5e7eb;margin:14px 0 12px 0"></div>

            <details class="order-preview-itinerary-details">
              <summary class="order-preview-itinerary-summary">
                <span>Itinerary</span>
                <span class="order-preview-itinerary-toggle">
                  Lihat
                  <svg class="order-preview-itinerary-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </summary>
              <div class="order-preview-itinerary-content">
                <div class="order-preview-itinerary-inner">
                  <div style="margin-top:10px">
                    ${itineraryTableHtml}
                  </div>
                </div>
              </div>
            </details>

            ${specialRequest ? `
            <div style="height:1px;background:#e5e7eb;margin:14px 0 12px 0"></div>
            <div style="font-size:14px;font-weight:700;margin-bottom:8px">Permintaan Khusus</div>
            <div style="font-size:13px;padding:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap">${escapeHtml(specialRequest)}</div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    const printWindowHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Order Preview</title>
    <style>
      @page { margin: 16mm; }
      body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #ffffff; }
      details.order-preview-itinerary-details:not([open]) > :not(summary) { display: block !important; }
      @media print {
        details.order-preview-itinerary-details > summary { display: none !important; }
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;

    await Swal.fire({
      html,
      width: 900,
      showCloseButton: true,
      showDenyButton: true,
      denyButtonText:
        '<span style="display:inline-flex;align-items:center;gap:8px">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M6 9V2h12v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 14h12v8H6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        'Cetak Preview' +
        '</span>',
      confirmButtonText:
        '<span style="display:inline-flex;align-items:center;gap:8px">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        'Tutup' +
        '</span>',
      heightAuto: false,
      customClass: {
        popup: 'order-preview-popup',
      },
      preDeny: () => {
        const w = window.open('', 'ORDER_PREVIEW_PRINT', 'height=700,width=900');
        if (!w) return false;
        w.document.open();
        w.document.write(printWindowHtml);
        w.document.close();
        w.focus();
        w.print();
        w.close();
        return false;
      },
    });
  };

  const formReady = useMemo(() => validate() === null, [
    armadaEntries,
    rentType,
    customer?.id,
    pickupAt,
    dropoffAt,
    pickupAddress,
    pickupCity?.id,
    itinerary,
    daysCount,
    computedTotalPrice
  ]);

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
                <label className="text-sm font-medium">Customer</label>
                <AsyncCombobox value={customer} onChange={setCustomer} placeholder="Cari customer..." fetcher={customerFetcher} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Sewa</label>
                <Select
                  value={rentType}
                  onValueChange={(v) => setRentType(v)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih jenis sewa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Citytour (Dalam Kota)</SelectItem>
                    <SelectItem value="2">Overland (Luar Kota)</SelectItem>
                    <SelectItem value="3">Citytour Pickup / Drop only</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informasi Jenis Kendaraan</span>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setArmadaEntries((prev) => [
                    ...prev,
                    {
                      armada_id: '',
                      price_id: '',
                      qty: '1',
                      biaya_lain: '',
                      discount: '',
                      fleet_prices: [],
                      loading_prices: false,
                    },
                  ]);
                  setArmadaEntryOptions((prev) => [...prev, null]);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah Armada
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {armadaEntries.map((row, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-2 col-span-1 md:col-span-4">
                      <label className="text-sm font-medium">Pilih Armada</label>
                      <AsyncCombobox
                        value={armadaEntryOptions[idx] ?? null}
                        onChange={async (opt) => {
                          setArmadaEntryOptions((prev) => {
                            const next = [...prev];
                            next[idx] = opt;
                            return next;
                          });
                          
                          if (opt) {
                            setArmadaEntries((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, loading_prices: true } : r))
                            );
                            const prices = await fetchPricesForEntry(opt.id, rentType);
                            setArmadaEntries((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      armada_id: opt.id,
                                      fleet_prices: prices,
                                      price_id: prices.length === 1 ? prices[0].price_id : '',
                                      loading_prices: false,
                                    }
                                  : r
                              )
                            );
                          } else {
                            setArmadaEntries((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, armada_id: '', fleet_prices: [], price_id: '', loading_prices: false }
                                  : r
                              )
                            );
                          }
                        }}
                        placeholder="Cari armada..."
                        fetcher={fleetFetcher}
                      />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-3">
                      <label className="text-sm font-medium">Durasi Sewa</label>
                      <Select
                        value={row.price_id}
                        onValueChange={(v) =>
                          setArmadaEntries((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, price_id: v } : r))
                          )
                        }
                        disabled={!row.armada_id || row.loading_prices}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue
                            placeholder={
                              !row.armada_id
                                ? 'Pilih armada'
                                : row.loading_prices
                                ? 'Memuat...'
                                : 'Pilih durasi'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {row.fleet_prices.map((p) => (
                            <SelectItem key={p.price_id} value={p.price_id}>
                              {p.price_id === '0' ? 'Belum ada harga' : `${p.duration} hari ${formatRupiahFromNumber(p.price)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-1">
                      <label className="text-sm font-medium">Jumlah</label>
                      <Input
                        value={row.qty}
                        inputMode="numeric"
                        onChange={(e) =>
                          setArmadaEntries((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, qty: e.target.value.replace(/[^0-9]/g, '') } : r))
                          )
                        }
                        className="h-12"
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-sm font-medium">Biaya Lain</label>
                      <Input
                        value={formatRupiahFromDigits(row.biaya_lain)}
                        inputMode="numeric"
                        onChange={(e) =>
                          setArmadaEntries((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, biaya_lain: e.target.value.replace(/[^0-9]/g, '') } : r))
                          )
                        }
                        className="h-12"
                        placeholder="Rp 0"
                      />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-sm font-medium">Diskon</label>
                      <Input
                        value={formatRupiahFromDigits(row.discount)}
                        inputMode="numeric"
                        onChange={(e) =>
                          setArmadaEntries((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, discount: e.target.value.replace(/[^0-9]/g, '') } : r))
                          )
                        }
                        className="h-12"
                        placeholder="Rp 0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-sm font-medium text-gray-500">
                      Subtotal: {formatRupiahFromNumber(
                        (row.fleet_prices.find(p => p.price_id === row.price_id)?.price ?? 0) * digitsToNumber(row.qty) +
                        digitsToNumber(row.biaya_lain) -
                        digitsToNumber(row.discount)
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={armadaEntries.length <= 1}
                      onClick={() => {
                        setArmadaEntries((prev) => prev.filter((_, i) => i !== idx));
                        setArmadaEntryOptions((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center rounded-b-lg">
            <div className="text-lg font-bold">Total Tagihan</div>
            <div className="text-2xl font-bold text-primary">
              {formatRupiahFromNumber(computedTotalPrice)}
            </div>
          </div>
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
                              disabled={(it.stops ?? []).length <= 1 && !(it.day === 1 || it.day === daysCount)}
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

        <Card>
          <CardHeader>
            <CardTitle>Permintaan Khusus</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="Contoh: Unit warna putih, supir tidak merokok, dll"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/orders/fleet`)}>
            Batal
          </Button>
          <Button type="button" variant="outline" onClick={onPreview} disabled={saving || !formReady}>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Preview Pesanan
            </span>
          </Button>
          <Button type="submit" disabled={saving || !formReady} className="bg-blue-600 hover:bg-blue-700 text-white">
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
