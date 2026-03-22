import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type AddonOption = {
  addon_id: string;
  addon_name: string;
  addon_price: number;
  raw: Record<string, unknown>;
};

type AddonRow = {
  id: string;
  addonId: string;
  qty: string;
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
  const [fleet, setFleet] = useState<Option | null>(null);
  const [rentType, setRentType] = useState('1');
  const [fleetQty, setFleetQty] = useState('1');
  const [fleetPricesLoading, setFleetPricesLoading] = useState(false);
  const [fleetPrices, setFleetPrices] = useState<FleetPriceOption[]>([]);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [totalManual, setTotalManual] = useState(false);
  const [customer, setCustomer] = useState<Option | null>(null);
  const [pickupAt, setPickupAt] = useState('');
  const [dropoffAt, setDropoffAt] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState<Option | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [dpAmount, setDpAmount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonOptions, setAddonOptions] = useState<AddonOption[]>([]);
  const [addonRows, setAddonRows] = useState<AddonRow[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

  const daysCount = useMemo(() => daysBetweenInclusive(pickupAt, dropoffAt), [pickupAt, dropoffAt]);

  useEffect(() => {
    (async () => {
      if (!fleet?.id) {
        setFleetPrices([]);
        setSelectedPriceId('');
        setTotalManual(false);
        return;
      }
      setFleetPricesLoading(true);
      setFleetPrices([]);
      setSelectedPriceId('');
      setTotalManual(false);
      try {
        const fleetId = String(fleet.id);
        const primaryPath = `/services/fleet/prices/${encodeURIComponent(fleetId)}/${encodeURIComponent(rentType)}`;
        const fallbackPath = `/services/fleet/prices/${encodeURIComponent(fleetId)}`;

        const res = await api.get<unknown>(primaryPath || fallbackPath, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;

        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = (root.data ?? payload) as unknown;
        const items = Array.isArray(data) ? data : [];

        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it): FleetPriceOption | null => {
            const rentTypeRaw = it.rent_type ?? it.rentType ?? it.type ?? it.rent_category;
            const rent_type = typeof rentTypeRaw === 'number' ? rentTypeRaw : Number(rentTypeRaw ?? NaN);
            const durationRaw = it.duration ?? it.duration_label ?? it.label ?? it.name;
            const duration = typeof durationRaw === 'number' ? durationRaw : Number(durationRaw ?? NaN);
            const priceRaw = it.price ?? it.amount ?? it.value ?? 0;
            const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0);
            const explicitIdRaw = it.price_id ?? it.id ?? it.uuid ?? it.key;
            const explicitId =
              typeof explicitIdRaw === 'string' || typeof explicitIdRaw === 'number' ? String(explicitIdRaw) : '';
            const derivedId = Number.isFinite(duration) ? `${String(rent_type)}-${String(duration)}` : '';
            const price_id = explicitId || derivedId;
            return price_id && Number.isFinite(duration)
              ? { price_id, duration, price, rent_type: Number.isFinite(rent_type) ? rent_type : undefined, raw: it }
              : null;
          })
          .filter((x): x is FleetPriceOption => x !== null);

        setFleetPrices(mapped);
        if (mapped.length === 1) {
          const qty = Math.max(1, digitsToNumber(fleetQty));
          setSelectedPriceId(mapped[0].price_id);
          if (mapped[0].price > 0) setTotalPrice(String(mapped[0].price * qty));
        }
      } finally {
        setFleetPricesLoading(false);
      }
    })();
  }, [fleet?.id, rentType]);

  useEffect(() => {
    (async () => {
      if (!fleet?.id) {
        setAddonOptions([]);
        setAddonRows([]);
        return;
      }
      setAddonsLoading(true);
      try {
        const fleetId = String(fleet.id);
        const res = await api.get<unknown>(`/services/fleet/addon/${encodeURIComponent(fleetId)}`, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;

        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = (root.data ?? payload) as unknown;
        const items = Array.isArray(data) ? data : [];

        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it): AddonOption | null => {
            const idRaw = it.addon_id ?? it.id ?? it.uuid ?? it.key;
            const addon_id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
            const nameRaw = it.addon_name ?? it.name ?? it.label ?? it.title;
            const addon_name = typeof nameRaw === 'string' ? nameRaw : '';
            const priceRaw = it.addon_price ?? it.price ?? it.amount ?? 0;
            const addon_price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0);
            return addon_id && addon_name ? { addon_id, addon_name, addon_price: Number.isFinite(addon_price) ? addon_price : 0, raw: it } : null;
          })
          .filter((x): x is AddonOption => x !== null);

        setAddonOptions(mapped);
        setAddonRows((prev) => {
          const kept = prev.filter((r) => !r.addonId || mapped.some((a) => a.addon_id === r.addonId));
          if (kept.length > 0) return kept;
          if (mapped.length === 0) return [];
          return [{ id: crypto.randomUUID(), addonId: '', qty: '1' }];
        });
      } finally {
        setAddonsLoading(false);
      }
    })();
  }, [fleet?.id]);

  useEffect(() => {
    if (totalManual) return;
    if (!selectedPriceId) return;
    const found = fleetPrices.find((p) => p.price_id === selectedPriceId);
    if (!found || !Number.isFinite(found.price) || found.price <= 0) return;
    const qty = Math.max(1, digitsToNumber(fleetQty));
    setTotalPrice(String(found.price * qty));
  }, [fleetQty, selectedPriceId, fleetPrices, totalManual]);

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
    const qty = digitsToNumber(fleetQty);
    if (qty <= 0) return 'Jumlah armada wajib diisi';
    if (fleetPrices.length > 0 && !selectedPriceId) return 'Pilih harga terlebih dahulu';
    if (!customer) return 'Pilih customer terlebih dahulu';
    if (!pickupAt) return 'Tanggal dan jam penjemputan wajib diisi';
    if (!dropoffAt) return 'Tanggal dan jam pengantaran wajib diisi';
    if (!pickupAddress.trim()) return 'Alamat penjemputan wajib diisi';
    if (!pickupCity) return 'Kota penjemputan wajib dipilih';
    const dp = digitsToNumber(dpAmount);
    const total = digitsToNumber(totalPrice);
    const discount = digitsToNumber(discountAmount);
    if (total <= 0) return 'Total harga wajib diisi';
    if (discount > total) return 'Diskon tidak boleh lebih besar dari total harga';
    if (dp > Math.max(0, total - discount)) return 'Nominal DP tidak boleh lebih besar dari total setelah diskon';
    for (const r of addonRows) {
      if (!r.addonId) continue;
      const q = digitsToNumber(r.qty);
      if (q <= 0) return 'Quantity addon wajib diisi';
    }
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
      const discount = digitsToNumber(discountAmount);
      const dp = digitsToNumber(dpAmount);
      const qty = digitsToNumber(fleetQty);
      const selected = selectedPriceId ? fleetPrices.find((p) => p.price_id === selectedPriceId) : undefined;
      const payload = {
        fleet_id: fleet!.id,
        ...(selectedPriceId ? { price_id: selectedPriceId } : {}),
        ...(selected ? { duration: selected.duration, rent_type: Number(rentType) } : { rent_type: Number(rentType) }),
        customer_id: customer!.id,
        pickup_datetime: pickupAt,
        dropoff_datetime: dropoffAt,
        pickup_address: pickupAddress,
        pickup_city_id: pickupCity!.id,
        fleet_qty: qty,
        price: total,
        discount_amount: discount,
        dp_amount: dp,
        addons: addonRows
          .filter((r) => r.addonId)
          .map((r) => {
            const opt = addonOptions.find((a) => a.addon_id === r.addonId);
            return {
              addon_id: r.addonId,
              addon_price: opt?.addon_price ?? 0,
              quantity: digitsToNumber(r.qty),
            };
          }),
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
    const qty = digitsToNumber(fleetQty);
    const total = digitsToNumber(totalPrice);
    const discount = digitsToNumber(discountAmount);
    const dp = digitsToNumber(dpAmount);
    const selectedDuration = selectedPriceId ? fleetPrices.find((p) => p.price_id === selectedPriceId) : undefined;
    const addonsSelected = addonRows
      .filter((r) => r.addonId && digitsToNumber(r.qty) > 0)
      .map((r) => {
        const opt = addonOptions.find((a) => a.addon_id === r.addonId);
        const price = opt?.addon_price ?? 0;
        const q = digitsToNumber(r.qty);
        return {
          name: opt?.addon_name ?? r.addonId,
          price,
          qty: q,
          subtotal: price * q,
        };
      });
    const addonsTotal = addonsSelected.reduce((acc, x) => acc + x.subtotal, 0);
    const totalTagihan = total + addonsTotal;
    const sisaTagihan = Math.max(0, totalTagihan - discount - dp);
    const pricePerUnit = selectedDuration?.price ?? 0;
    const itemsTableRows = [
      {
        item: fleet?.label ?? 'Armada',
        qty: qty,
        price: pricePerUnit,
        total: total,
      },
      ...addonsSelected.map((a) => ({
        item: a.name,
        qty: a.qty,
        price: a.price,
        total: a.subtotal,
      })),
    ];
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
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Total Tagihan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(totalTagihan)}</b></td>
          </tr>
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Potongan Harga</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(discount)}</td>
          </tr>
          <tr>
            <td colspan="4" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Uang Muka</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(dp)}</td>
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
    fleet?.id,
    rentType,
    fleetQty,
    selectedPriceId,
    customer?.id,
    pickupAt,
    dropoffAt,
    pickupAddress,
    pickupCity?.id,
    discountAmount,
    dpAmount,
    totalPrice,
    itinerary,
    addonRows,
    addonOptions,
    fleetPrices,
    daysCount,
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
                <label className="text-sm font-medium">Pilih Armada</label>
                <AsyncCombobox value={fleet} onChange={setFleet} placeholder="Cari armada..." fetcher={fleetFetcher} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <AsyncCombobox value={customer} onChange={setCustomer} placeholder="Cari customer..." fetcher={customerFetcher} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Sewa</label>
                <Select
                  value={rentType}
                  onValueChange={(v) => setRentType(v)}
                  disabled={!fleet}
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
                <label className="text-sm font-medium">Jumlah Armada</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={fleetQty}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => setFleetQty(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-12 w-24"
                    placeholder="1"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-300">unit</div>
                </div>
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

              <div className="space-y-2 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Durasi Sewa</label>
                    <Select
                      value={selectedPriceId}
                      onValueChange={(v) => {
                        setSelectedPriceId(v);
                        setTotalManual(false);
                        const found = fleetPrices.find((p) => p.price_id === v);
                        if (found && Number.isFinite(found.price) && found.price > 0) {
                          const qty = Math.max(1, digitsToNumber(fleetQty));
                          setTotalPrice(String(found.price * qty));
                        }
                      }}
                      disabled={!fleet || fleetPricesLoading || fleetPrices.length === 0}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue
                          placeholder={
                            !fleet
                              ? 'Pilih armada terlebih dahulu'
                              : fleetPricesLoading
                                ? 'Memuat...'
                                : fleetPrices.length === 0
                                  ? 'Tidak ada pilihan harga'
                                  : 'Pilih durasi'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {fleetPrices.map((p) => (
                          <SelectItem key={p.price_id} value={p.price_id}>
                            {p.duration} hari {formatRupiahFromNumber(p.price)} / unit
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Harga Total</label>
                    <Input
                      value={formatRupiahFromDigits(totalPrice)}
                      inputMode="numeric"
                      onChange={(e) => {
                        setTotalManual(true);
                        setTotalPrice(e.target.value.replace(/[^0-9]/g, ''));
                      }}
                      className="h-12"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Discount</label>
                <Input
                  value={formatRupiahFromDigits(discountAmount)}
                  inputMode="numeric"
                  onChange={(e) => setDiscountAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-12"
                  placeholder="Rp 0"
                />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Addon</span>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!fleet || addonsLoading || addonOptions.length === 0}
                onClick={() =>
                  setAddonRows((prev) => [...prev, { id: crypto.randomUUID(), addonId: '', qty: '1' }])
                }
              >
                <Plus className="h-4 w-4" />
                Tambah Addon
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!fleet ? (
              <div className="text-sm text-muted-foreground">Pilih armada terlebih dahulu untuk melihat addon.</div>
            ) : addonsLoading ? (
              <div className="text-sm text-muted-foreground">Memuat...</div>
            ) : addonOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tidak ada addon untuk armada ini.</div>
            ) : (
              <div className="space-y-4">
                {addonRows.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setAddonRows([{ id: crypto.randomUUID(), addonId: '', qty: '1' }])}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Addon
                  </Button>
                ) : null}
                {addonRows.map((row) => {
                  const selected = addonOptions.find((a) => a.addon_id === row.addonId);
                  return (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jenis Addon</label>
                        <Select
                          value={row.addonId}
                          onValueChange={(v) =>
                            setAddonRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, addonId: v } : r)))
                          }
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Pilih addon" />
                          </SelectTrigger>
                          <SelectContent>
                            {addonOptions.map((a) => (
                              <SelectItem key={a.addon_id} value={a.addon_id}>
                                {a.addon_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Harga</label>
                        <Input className="h-12" value={formatRupiahFromNumber(selected?.addon_price ?? 0)} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={row.qty}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) =>
                              setAddonRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, qty: e.target.value.replace(/[^0-9]/g, '') } : r))
                              )
                            }
                            className="h-12 w-24"
                            placeholder="1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 w-12 p-0"
                            disabled={addonRows.length <= 1}
                            onClick={() => setAddonRows((prev) => prev.filter((r) => r.id !== row.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
