import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Check, ChevronsUpDown, Eye, ListChecks, Loader2, MapPinned, MessageSquareText, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

type Option = { id: string; label: string; raw?: Record<string, unknown> };

type PackageActivity = {
  time: string;
  description: string;
  location: string;
  city_id: number | undefined;
  city_name: string | undefined;
};

type PackageItinerary = {
  day: number;
  activities: PackageActivity[];
};

type PackagePricing = {
  price_id: string;
  min_pax: number;
  max_pax: number;
  price: number;
};

type PackageAddon = {
  addon_id: string;
  description: string;
  price: number;
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function formatRupiahFromNumber(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function digitsToNumber(digits: string): number {
  const clean = String(digits ?? '').replace(/[^0-9]/g, '');
  if (!clean) return 0;
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function formatRupiahFromDigits(digits: string): string {
  const clean = String(digits ?? '').replace(/[^0-9]/g, '');
  if (!clean) return '';
  const n = Number(clean);
  if (!Number.isFinite(n)) return '';
  return formatRupiahFromNumber(n);
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
        it.package_id ??
        it.fleet_id ??
        it.customer_id ??
        it.city_id ??
        it.value ??
        it.code ??
        it.key;
      const labelRaw =
        it.name ??
        it.package_name ??
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

async function fetchTourPackageList(token: string): Promise<Option[]> {
  const res = await api.get<unknown>('/services/tour-packages/list', token ? { Authorization: token } : undefined);
  if (res.status !== 'success') return [];
  const payload = res.data as unknown;
  const items = Array.isArray(payload) ? payload : [];
  return items
    .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : null))
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((x) => {
      const idRaw = x.package_id ?? x.id ?? x.packageId;
      const nameRaw = x.package_name ?? x.name ?? x.title;
      const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
      const label = typeof nameRaw === 'string' ? nameRaw : '';
      return id && label ? ({ id, label, raw: x } satisfies Option) : null;
    })
    .filter((o): o is Option => Boolean(o));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

async function fetchPackageDetail(
  token: string,
  packageId: string
): Promise<{
  itineraries: PackageItinerary[];
  pricing: PackagePricing[];
  addons: PackageAddon[];
  facilities: string[];
  min_pax: number;
}> {
  const headers = token ? { Authorization: token } : undefined;
  const res = await api.post<unknown>('/services/tour-packages/detail', { package_id: packageId }, headers);
  if (!res || res.status !== 'success') return { itineraries: [], pricing: [], addons: [], facilities: [], min_pax: 0 };

  const root = record(res.data);
  const meta = record(root.meta && typeof root.meta === 'object' ? root.meta : root);

  const itinerariesRaw = root.itineraries ?? root.itinerary ?? meta.itineraries ?? meta.itinerary;
  const toMinutes = (time: string) => {
    const hh = Number(time.slice(0, 2));
    const mm = Number(time.slice(3, 5));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return -1;
    return hh * 60 + mm;
  };
  const readActivity = (input: unknown): PackageActivity | null => {
    if (!input || typeof input !== 'object') return null;
    const ao = input as Record<string, unknown>;
    const time = typeof ao.time === 'string' ? ao.time : '';
    const description = typeof ao.description === 'string' ? ao.description : '';
    const location = typeof ao.location === 'string' ? ao.location : '';
    const city_id_raw = ao.city_id ?? ao.cityId;
    const city_name_raw = ao.city_name ?? ao.cityName;
    const city_id_num = typeof city_id_raw === 'number' ? city_id_raw : typeof city_id_raw === 'string' ? Number(city_id_raw) : undefined;
    const city_id = typeof city_id_num === 'number' && Number.isFinite(city_id_num) ? city_id_num : undefined;
    const city_name = typeof city_name_raw === 'string' ? city_name_raw : undefined;
    const city = ao.city;
    if ((city_id === undefined || city_name === undefined) && city && typeof city === 'object') {
      const co = city as Record<string, unknown>;
      const idVal = co.id;
      const nameVal = co.name;
      const idNum = typeof idVal === 'number' ? idVal : typeof idVal === 'string' ? Number(idVal) : undefined;
      const resolvedId = typeof idNum === 'number' && Number.isFinite(idNum) ? idNum : undefined;
      const resolvedName = typeof nameVal === 'string' ? nameVal : undefined;
      return { time, description, location, city_id: city_id ?? resolvedId, city_name: city_name ?? resolvedName };
    }
    return { time, description, location, city_id, city_name };
  };

  const itineraries: PackageItinerary[] = (() => {
    if (!Array.isArray(itinerariesRaw)) return [];
    const arr = itinerariesRaw as unknown[];
    const first = arr[0];
    if (first && typeof first === 'object' && 'activities' in (first as Record<string, unknown>)) {
      return arr
        .map((x, i) => {
          if (!x || typeof x !== 'object') return null;
          const obj = x as Record<string, unknown>;
          const dayRaw = obj.day ?? i + 1;
          const day = typeof dayRaw === 'number' ? dayRaw : typeof dayRaw === 'string' ? Number(dayRaw) : i + 1;
          const activitiesRaw = obj.activities;
          const activities = Array.isArray(activitiesRaw)
            ? (activitiesRaw as unknown[])
                .map((a) => readActivity(a))
                .filter((v): v is PackageActivity => v !== null && Boolean(v.time || v.description || v.location))
            : [];
          return { day: Number.isFinite(day) ? day : i + 1, activities } satisfies PackageItinerary;
        })
        .filter((v): v is PackageItinerary => v !== null);
    }

    const flat = arr
      .map((x) => readActivity(x))
      .filter((v): v is PackageActivity => v !== null && Boolean(v.time || v.description || v.location));

    let day = 1;
    let prevMin = -1;
    const byDay = new Map<number, PackageActivity[]>();
    for (const a of flat) {
      const m = toMinutes(a.time);
      if (prevMin !== -1 && m !== -1 && m < prevMin) day += 1;
      prevMin = m !== -1 ? m : prevMin;
      const list = byDay.get(day) ?? [];
      list.push(a);
      byDay.set(day, list);
    }

    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([d, activities]) => ({ day: d, activities }));
  })();

  const pricingRaw = root.pricing ?? meta.pricing;
  const pricing: PackagePricing[] = Array.isArray(pricingRaw)
    ? (pricingRaw as unknown[])
        .map((x) => {
          if (!x || typeof x !== 'object') return null;
          const obj = x as Record<string, unknown>;
          const priceIdRaw = obj.price_id ?? obj.id ?? obj.priceId;
          const price_id = typeof priceIdRaw === 'string' || typeof priceIdRaw === 'number' ? String(priceIdRaw) : '';
          const min_pax = typeof obj.min_pax === 'number' ? obj.min_pax : Number(obj.min_pax ?? 0);
          const max_pax = typeof obj.max_pax === 'number' ? obj.max_pax : Number(obj.max_pax ?? 0);
          const price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
          return price_id ? ({ price_id, min_pax, max_pax, price } satisfies PackagePricing) : null;
        })
        .filter((v): v is PackagePricing => v !== null && Boolean(v.price_id) && Number.isFinite(v.price))
    : [];

  const addonsRaw = root.addons ?? meta.addons;
  const addons: PackageAddon[] = Array.isArray(addonsRaw)
    ? (addonsRaw as unknown[])
        .map((x) => {
          if (!x || typeof x !== 'object') return null;
          const obj = x as Record<string, unknown>;
          const addonIdRaw = obj.addon_id ?? obj.id ?? obj.addonId;
          const addon_id = typeof addonIdRaw === 'string' || typeof addonIdRaw === 'number' ? String(addonIdRaw) : '';
          const description = typeof obj.description === 'string' ? obj.description : '';
          const price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
          return addon_id && description ? ({ addon_id, description, price } satisfies PackageAddon) : null;
        })
        .filter((v): v is PackageAddon => v !== null)
    : [];

  const facilitiesRaw = root.facilities ?? root.features ?? meta.facilities ?? meta.features;
  const facilities = Array.isArray(facilitiesRaw)
    ? (facilitiesRaw as unknown[]).map((x) => (typeof x === 'string' ? x : '')).filter((x) => x)
    : [];

  const minPaxRaw = root.min_pax ?? meta.min_pax ?? root.minPax ?? meta.minPax ?? 0;
  const min_pax = Number.isFinite(Number(minPaxRaw)) ? Number(minPaxRaw) : 0;

  return { itineraries, pricing, addons, facilities, min_pax };
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
    }, 250);
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

const PackageCombobox: React.FC<{
  value: Option | null;
  customValue: string;
  onValueChange: (opt: Option | null) => void;
  onCustomValueChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  options: Option[];
}> = ({ value, customValue, onValueChange, onCustomValueChange, placeholder, disabled, options }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [options, query]);

  const display = value ? value.label : customValue ? customValue : placeholder;

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
          className={cn('w-full justify-between h-12', !value && !customValue && 'text-muted-foreground')}
          disabled={disabled}
        >
          {display}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari paket wisata..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Tidak ada data</CommandEmpty>
            <CommandGroup>
              {query.trim() ? (
                <CommandItem
                  value={`__custom__:${query.trim()}`}
                  onSelect={() => {
                    const v = query.trim();
                    onValueChange(null);
                    onCustomValueChange(v);
                    setOpen(false);
                  }}
                >
                  Gunakan: {query.trim()}
                </CommandItem>
              ) : null}
              {filtered.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => {
                    onValueChange(opt);
                    onCustomValueChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value?.id === opt.id ? 'opacity-100' : 'opacity-0')} />
                  {opt.label}
                </CommandItem>
              ))}
              {value || customValue ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onValueChange(null);
                    onCustomValueChange('');
                    setOpen(false);
                  }}
                >
                  Hapus pilihan
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type ItineraryRow = {
  id: string;
  destination: string;
  city: Option | null;
};

type TourPackageOrderFormMode = 'create' | 'edit';

type TourPackageOrderInitialValues = {
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  package_id?: string;
  package_name?: string;
  start_date?: string;
  end_date?: string;
  member_pax?: number;
  official_pax?: number;
  pickup_address?: string;
  pickup_city_id?: string;
  pickup_city_name?: string;
  price_id?: string;
  addon_ids?: string[];
  special_request?: string;
  discount_amount?: number;
  additional_amount?: number;
};

type TourPackageOrderFormProps = {
  mode?: TourPackageOrderFormMode;
  orderId?: string;
  readOnly?: boolean;
  initialValues?: TourPackageOrderInitialValues;
};

export const TourPackageOrderForm: React.FC<TourPackageOrderFormProps> = ({
  mode: modeProp = 'create',
  orderId: orderIdProp,
  readOnly: readOnlyProp,
  initialValues,
}) => {
  const mode: TourPackageOrderFormMode = modeProp;
  const readOnly = Boolean(readOnlyProp);

  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [saving, setSaving] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingPackageDetail, setLoadingPackageDetail] = useState(false);

  const [pax, setPax] = useState('1');
  const [committeeCount, setCommitteeCount] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState<Option | null>(null);

  const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
  const [packageOptions, setPackageOptions] = useState<Option[]>([]);
  const [packageItineraries, setPackageItineraries] = useState<PackageItinerary[]>([]);
  const [packagePricing, setPackagePricing] = useState<PackagePricing[]>([]);
  const [packageAddons, setPackageAddons] = useState<PackageAddon[]>([]);
  const [packageFacilities, setPackageFacilities] = useState<string[]>([]);
  const [pricingKey, setPricingKey] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<PackageAddon[]>([]);

  const [customer, setCustomer] = useState<Option | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Option | null>(null);
  const [customPackageName, setCustomPackageName] = useState('');

  const [itinerary, setItinerary] = useState<ItineraryRow[]>([{ id: crypto.randomUUID(), destination: '', city: null }]);
  const [specialRequest, setSpecialRequest] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [initialAddonIds, setInitialAddonIds] = useState<string[]>([]);

  const isCustomPackage = useMemo(() => !selectedPackage && Boolean(customPackageName.trim()), [selectedPackage, customPackageName]);

  const initKeyRef = useRef('');
  useEffect(() => {
    const key = `${mode}:${orderIdProp ?? initialValues?.order_id ?? ''}`;
    if (!initialValues || initKeyRef.current === key) return;
    initKeyRef.current = key;
    if (initialValues.customer_id || initialValues.customer_name) {
      setCustomer({
        id: String(initialValues.customer_id ?? ''),
        label: String(initialValues.customer_name ?? initialValues.customer_id ?? ''),
      });
    }
    if (initialValues.package_id || initialValues.package_name) {
      setSelectedPackage(
        initialValues.package_id
          ? { id: String(initialValues.package_id), label: String(initialValues.package_name ?? initialValues.package_id) }
          : null
      );
      setCustomPackageName(initialValues.package_id ? '' : String(initialValues.package_name ?? ''));
    }
    setStartDate(String(initialValues.start_date ?? ''));
    setEndDate(String(initialValues.end_date ?? ''));
    if (typeof initialValues.member_pax === 'number') setPax(String(initialValues.member_pax));
    if (typeof initialValues.official_pax === 'number') setCommitteeCount(String(initialValues.official_pax));
    setPickupAddress(String(initialValues.pickup_address ?? ''));
    if (initialValues.pickup_city_id || initialValues.pickup_city_name) {
      setPickupCity({
        id: String(initialValues.pickup_city_id ?? ''),
        label: String(initialValues.pickup_city_name ?? initialValues.pickup_city_id ?? ''),
      });
    }
    setPricingKey(String(initialValues.price_id ?? ''));
    setSpecialRequest(String(initialValues.special_request ?? ''));
    if (typeof initialValues.discount_amount === 'number') setDiscountAmount(String(initialValues.discount_amount));
    if (typeof initialValues.additional_amount === 'number') setAdditionalAmount(String(initialValues.additional_amount));
    setInitialAddonIds(Array.isArray(initialValues.addon_ids) ? initialValues.addon_ids.map((x) => String(x)) : []);
  }, [initialValues, mode, orderIdProp]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingInit(true);
      try {
        const [customers, packages] = await Promise.all([
          fetchOptions('/services/customers', token),
          fetchTourPackageList(token),
        ]);
        if (!active) return;
        setCustomerOptions(customers);
        setPackageOptions(packages);
      } finally {
        if (active) setLoadingInit(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    const loadDetail = async () => {
      setPackageItineraries([]);
      setPackagePricing([]);
      setPackageAddons([]);
      setPackageFacilities([]);
      setPricingKey('');
      setSelectedAddons([]);
      setSpecialRequest('');
      setDiscountAmount('');
      setAdditionalAmount('');

      const opt = selectedPackage;
      if (!opt) return;

      const raw = record(opt.raw);
      const rawId = String(raw.tour_package_id ?? raw.uuid ?? '').trim();
      const valueId = String(opt.id ?? '').trim();
      const resolvedId = rawId || valueId;
      if (!resolvedId) return;

      setLoadingPackageDetail(true);
      try {
        const detail = await fetchPackageDetail(token, resolvedId);
        if (!active) return;
        setPackageItineraries(detail.itineraries);
        setPackagePricing(detail.pricing);
        setPackageAddons(detail.addons);
        setPackageFacilities(detail.facilities);
        const directMin = Number.isFinite(Number(detail.min_pax)) ? Number(detail.min_pax) : 0;
        const pricingMin = (detail.pricing ?? [])
          .map((p) => (Number.isFinite(Number(p.min_pax)) ? Number(p.min_pax) : 0))
          .filter((n) => n > 0)
          .sort((a, b) => a - b)[0];
        const resolvedMin = directMin > 0 ? directMin : pricingMin ?? 0;
        if (resolvedMin > 0) setPax(String(resolvedMin));
        if (initialAddonIds.length > 0) {
          const byId = new Map(detail.addons.map((a) => [a.addon_id, a]));
          const next = initialAddonIds.map((id) => byId.get(id)).filter((x): x is PackageAddon => Boolean(x));
          setSelectedAddons(next);
          setInitialAddonIds([]);
        }
      } finally {
        if (active) setLoadingPackageDetail(false);
      }
    };
    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedPackage, token]);

  const filterLocalOptions = useCallback((q: string, list: Option[]) => {
    const query = String(q ?? '').trim().toLowerCase();
    if (!query) return list;
    return list.filter((o) => o.label.toLowerCase().includes(query) || o.id.toLowerCase().includes(query));
  }, []);

  const customerFetcher = useCallback(async (q: string) => filterLocalOptions(q, customerOptions), [customerOptions, filterLocalOptions]);

  const cityFetcher = useCallback(
    async (q: string) => {
      const qp = `?search=${encodeURIComponent(q)}`;
      return fetchOptions(`/general/cities${qp}`, token);
    },
    [token]
  );

  const validate = (): string | null => {
    if (!customer) return 'Pilih customer terlebih dahulu';
    if (!selectedPackage && !customPackageName.trim()) return 'Pilih paket wisata atau isi nama paket';
    if (!startDate) return 'Tanggal mulai wajib diisi';
    if (!endDate) return 'Tanggal selesai wajib diisi';
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e.getTime() < s.getTime()) return 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    }
    const paxNum = Number(pax);
    if (!Number.isFinite(paxNum) || paxNum <= 0) return 'Jumlah peserta minimal 1';
    const committeeNum = Number(committeeCount);
    if (!Number.isFinite(committeeNum) || committeeNum < 0) return 'Jumlah panitia minimal 0';
    if (!pickupAddress.trim()) return 'Alamat penjemputan wajib diisi';
    if (!pickupCity) return 'Kota penjemputan wajib dipilih';
    if (selectedPackage && packagePricing.length > 0 && !pricingKey) return 'Pilih harga paket';
    if (digitsToNumber(discountAmount) < 0) return 'Discount harga tidak valid';
    if (digitsToNumber(additionalAmount) < 0) return 'Biaya tambahan tidak valid';
    if (isCustomPackage) {
      const validRows = itinerary.filter((r) => r.city && r.destination.trim());
      if (validRows.length === 0) return 'Minimal 1 itinerary wajib diisi';
      for (const r of itinerary) {
        const hasOne = Boolean(r.city) || Boolean(r.destination.trim());
        if (!hasOne) continue;
        if (!r.city) return 'Kota pada itinerary wajib dipilih';
        if (!r.destination.trim()) return 'Tujuan pada itinerary wajib diisi';
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
      const discount = digitsToNumber(discountAmount);
      const additional = digitsToNumber(additionalAmount);
      const payload: Record<string, unknown> = {
        customer_id: customer!.id,
        member_pax: Number(pax),
        official_pax: Number(committeeCount),
        start_date: startDate,
        end_date: endDate,
        pickup_address: pickupAddress.trim(),
        pickup_city_id: pickupCity!.id,
        discount_amount: discount,
        additional_amount: additional,
      };

      const editOrderId = String(orderIdProp ?? initialValues?.order_id ?? '').trim();
      if (mode === 'edit') {
        if (!editOrderId) {
          await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Order ID tidak ditemukan' });
          return;
        }
        payload.order_id = editOrderId;
      }

      if (selectedPackage) {
        payload.package_id = selectedPackage.id;
        if (pricingKey) payload.price_id = pricingKey;
        if (selectedAddons.length > 0) {
          payload.addons = selectedAddons.map((a) => a.addon_id);
        }
        if (specialRequest.trim()) payload.special_request = specialRequest.trim();
      } else {
        payload.package_name = customPackageName.trim();
        payload.itinerary = itinerary
          .filter((r) => r.city && r.destination.trim())
          .map((r) => ({
            city_id: r.city!.id,
            destination: r.destination.trim(),
          }));
        payload.special_request = specialRequest.trim();
      }

      const endpoint = mode === 'edit' ? '/tour-package/order/update' : '/tour-package/order/create';
      const res = await api.post<unknown>(endpoint, payload, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: mode === 'edit' ? 'Pesanan berhasil diperbarui.' : 'Pesanan berhasil dibuat.',
        });
        if (mode === 'edit') {
          navigate(`${basePrefix}/orders/tour/detail/${encodeURIComponent(String(orderIdProp ?? initialValues?.order_id ?? ''))}`);
        } else {
          navigate(`${basePrefix}/orders/tour`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || loadingInit || loadingPackageDetail;
  const disabled = readOnly || busy;
  const showPackageDetailItinerary = Boolean(selectedPackage && packageItineraries.length > 0);
  const showPricingSelect = Boolean(selectedPackage && packagePricing.length > 0);
  const showPackageSpecialRequest = Boolean(selectedPackage);
  const showPackageFacilities = Boolean(selectedPackage && packageFacilities.length > 0);
  const availableAddons = useMemo(() => {
    const taken = new Set(selectedAddons.map((a) => a.addon_id));
    return packageAddons.filter((a) => !taken.has(a.addon_id));
  }, [packageAddons, selectedAddons]);

  const selectedPricing = useMemo(
    () => packagePricing.find((p) => p.price_id === pricingKey) ?? null,
    [packagePricing, pricingKey]
  );
  const computedTotalTagihan = useMemo(() => {
    const paxNum = Number(pax) || 0;
    const unitPrice = selectedPricing?.price ?? 0;
    const discount = digitsToNumber(discountAmount);
    const additional = digitsToNumber(additionalAmount);
    const addonsTotal = selectedAddons.reduce((acc, a) => acc + (Number.isFinite(a.price) ? a.price : 0), 0);
    const baseTotal = unitPrice * paxNum;
    const total = baseTotal + addonsTotal + additional - discount;
    return Math.max(0, total);
  }, [additionalAmount, discountAmount, pax, selectedAddons, selectedPricing?.price]);

  const formReady = useMemo(() => validate() === null, [
    customer?.id,
    selectedPackage?.id,
    customPackageName,
    pax,
    committeeCount,
    pickupAddress,
    pickupCity?.id,
    pricingKey,
    packagePricing,
    itinerary,
    specialRequest,
    discountAmount,
    additionalAmount,
  ]);

  const onPreview = async () => {
    const err = validate();
    if (err) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: err });
      return;
    }

    const paxNum = Number(pax) || 0;
    const panitiaNum = Number(committeeCount) || 0;
    const discount = digitsToNumber(discountAmount);
    const additional = digitsToNumber(additionalAmount);
    const selectedPricing = packagePricing.find((p) => p.price_id === pricingKey) ?? null;
    const unitPrice = selectedPricing?.price ?? 0;
    const baseTotal = unitPrice * paxNum;
    const addonsTotal = selectedAddons.reduce((acc, a) => acc + (Number.isFinite(a.price) ? a.price : 0), 0);
    const totalTagihan = baseTotal + addonsTotal + additional;
    const sisaTagihan = Math.max(0, totalTagihan - discount);

    const packageName = selectedPackage?.label || customPackageName || '-';
    const customerName = customer?.label || '-';
    const pickupCityLabel = pickupCity?.label || '-';

    const itemsTableHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Item</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Qty</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Harga</th>
            <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(packageName)}</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${escapeHtml(String(paxNum))}</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(unitPrice)} /pax</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(baseTotal)}</td>
          </tr>
          ${
            selectedAddons.length > 0
              ? selectedAddons
                  .map(
                    (a) => `
          <tr>
            <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(a.description)}</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">1</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(a.price)}</td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(a.price)}</td>
          </tr>
          `
                  )
                  .join('')
              : ''
          }
        </tbody>
        <tfoot>
          ${
            additional > 0
              ? `
          <tr>
            <td colspan="3" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Biaya Tambahan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(additional)}</b></td>
          </tr>
          `
              : ''
          }
          <tr>
            <td colspan="3" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Total Tagihan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(totalTagihan)}</b></td>
          </tr>
          <tr>
            <td colspan="3" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Discount Harga</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${formatRupiahFromNumber(discount)}</td>
          </tr>
          <tr>
            <td colspan="3" style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>Sisa Tagihan</b></td>
            <td style="border:1px solid #e5e7eb;padding:8px;text-align:right"><b>${formatRupiahFromNumber(sisaTagihan)}</b></td>
          </tr>
        </tfoot>
      </table>
    `;

    const itineraryHtml =
      selectedPackage && packageItineraries.length > 0
        ? `
      <div style="margin-top:10px">
        ${packageItineraries
          .map(
            (day) => `
          <div style="margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;margin-bottom:6px">Hari ${day.day}</div>
            <div style="font-size:13px">
              ${(day.activities ?? [])
                .map((a) => {
                  const time = a.time ? a.time.slice(0, 5) : '-';
                  const city = a.city_name ? a.city_name : a.city_id ? `City ID: ${a.city_id}` : '';
                  const parts = [time, a.description || '-', a.location || '', city].filter((x) => String(x).trim());
                  return `<div style="margin:4px 0">${escapeHtml(parts.join(' • '))}</div>`;
                })
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
        : isCustomPackage
          ? `
      <div style="margin-top:10px">
        ${itinerary
          .filter((r) => r.city && r.destination.trim())
          .map((r, i) => `<div style="font-size:13px;margin:4px 0">${i + 1}. ${escapeHtml(r.destination)} • ${escapeHtml(r.city?.label ?? '-')}</div>`)
          .join('')}
      </div>
    `
          : '';

    const facilitiesHtml =
      selectedPackage && packageFacilities.length > 0
        ? `
      <div style="margin-top:10px;font-size:13px">
        ${packageFacilities.map((f) => `<span style="display:inline-block;border:1px solid #e5e7eb;border-radius:999px;padding:4px 10px;margin:0 6px 6px 0;background:#ffffff">${escapeHtml(f)}</span>`).join('')}
      </div>
    `
        : '';

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
                <div><b>Nama</b>: ${escapeHtml(customerName)}</div>
                <div><b>Jumlah Peserta</b>: ${escapeHtml(String(paxNum))}</div>
                <div><b>Jumlah Panitia</b>: ${escapeHtml(String(panitiaNum))}</div>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:8px">Penjemputan</div>
                <div><b>Alamat</b>: ${escapeHtml(pickupAddress || '-')}</div>
                <div><b>Kota</b>: ${escapeHtml(pickupCityLabel)}</div>
              </div>
            </div>
            <div style="height:1px;background:#e5e7eb;margin:12px 0"></div>
            <div style="font-size:14px;font-weight:700;margin-bottom:8px">Order Detail</div>
            ${itemsTableHtml}
            ${
              itineraryHtml
                ? `
              <div style="height:1px;background:#e5e7eb;margin:14px 0 12px 0"></div>
              <div style="font-size:14px;font-weight:700;margin-bottom:8px">Itinerary</div>
              ${itineraryHtml}
            `
                : ''
            }
            ${
              facilitiesHtml
                ? `
              <div style="height:1px;background:#e5e7eb;margin:14px 0 12px 0"></div>
              <div style="font-size:14px;font-weight:700;margin-bottom:8px">Fasilitas</div>
              ${facilitiesHtml}
            `
                : ''
            }
            ${
              specialRequest.trim()
                ? `
              <div style="height:1px;background:#e5e7eb;margin:14px 0 12px 0"></div>
              <div style="font-size:14px;font-weight:700;margin-bottom:8px">Permintaan Khusus</div>
              <div style="font-size:13px;padding:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap">${escapeHtml(
                specialRequest.trim()
              )}</div>
            `
                : ''
            }
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/orders/tour`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Form Pesanan Paket Wisata</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Tambahkan pesanan baru</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeaderWithBadge
            badgeIcon={ShoppingCart}
            title="Informasi Pesanan"
            subtitle="Lengkapi customer, paket, dan jadwal perjalanan."
          />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <AsyncCombobox
                  value={customer}
                  onChange={setCustomer}
                  placeholder="Cari customer..."
                  fetcher={customerFetcher}
                  minChars={0}
                  disabled={disabled}
                />
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Tanggal Mulai</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartDate(v);
                      if (endDate && v) {
                        const s = new Date(v);
                        const eD = new Date(endDate);
                        if (!isNaN(s.getTime()) && !isNaN(eD.getTime()) && eD.getTime() < s.getTime()) setEndDate(v);
                      }
                    }}
                    className="h-12"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paket Tour</label>
                <PackageCombobox
                  value={selectedPackage}
                  customValue={customPackageName}
                  onValueChange={(v) => {
                    setSelectedPackage(v);
                    if (v) setCustomPackageName('');
                  }}
                  onCustomValueChange={(v) => {
                    setCustomPackageName(v);
                    if (v) setSelectedPackage(null);
                  }}
                  placeholder="Pilih paket tour atau ketik nama paket baru"
                  options={packageOptions}
                  disabled={disabled}
                />
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Tanggal Selesai</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Penjemputan</label>
                <Input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="h-12"
                  placeholder="Alamat penjemputan"
                  disabled={disabled}
                />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jumlah Peserta</label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={pax}
                      onChange={(e) => setPax(e.target.value)}
                      className="h-12"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jumlah Panitia</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={committeeCount}
                      onChange={(e) => setCommitteeCount(e.target.value)}
                      className="h-12"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 col-start-1">
                    <label className="text-sm font-medium">Discount Harga</label>
                    <Input
                      value={formatRupiahFromDigits(discountAmount)}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="h-12"
                      placeholder="Rp 0"
                      disabled={disabled}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2 col-start-2">
                    <label className="text-sm font-medium">Biaya Tambahan</label>
                    <Input
                      value={formatRupiahFromDigits(additionalAmount)}
                      onChange={(e) => setAdditionalAmount(e.target.value)}
                      className="h-12"
                      placeholder="Rp 0"
                      disabled={disabled}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kota Penjemputan</label>
                <AsyncCombobox
                  value={pickupCity}
                  onChange={setPickupCity}
                  placeholder="Cari kota..."
                  fetcher={cityFetcher}
                  disabled={disabled}
                />
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Harga</label>
                  <Select
                    value={pricingKey}
                    onValueChange={(v) => setPricingKey(v)}
                    disabled={disabled || !selectedPackage || !showPricingSelect}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue
                        placeholder={
                          !selectedPackage
                            ? 'Pilih paket terlebih dahulu'
                            : loadingPackageDetail
                              ? 'Memuat harga...'
                              : showPricingSelect
                                ? 'Pilih harga'
                                : 'Harga tidak tersedia'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {packagePricing.map((p) => (
                        <SelectItem key={p.price_id} value={p.price_id}>
                          {p.min_pax} - {p.max_pax} pax • {formatCurrency(p.price)} /pax
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 text-sm">
                  <div className="text-muted-foreground">Total Tagihan</div>
                  <div className="mt-5 text-lg font-semibold text-foreground">{formatRupiahFromNumber(computedTotalTagihan)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showPackageSpecialRequest ? (
          <Card>
            <CardHeaderWithBadge
              badgeIcon={MessageSquareText}
              title="Permintaan Khusus"
              subtitle="Tambahkan addon dan catatan khusus untuk paket terpilih."
            />
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Addon</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('w-full justify-between h-12', availableAddons.length === 0 && 'text-muted-foreground')}
                      disabled={disabled || !selectedPackage || availableAddons.length === 0}
                    >
                      {availableAddons.length === 0 ? 'Tidak ada addon' : 'Tambah addon'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari addon..." />
                      <CommandList>
                        <CommandEmpty>Tidak ada data</CommandEmpty>
                        <CommandGroup>
                          {availableAddons.map((a) => {
                            const key = a.addon_id;
                            return (
                              <CommandItem
                                key={key}
                                value={a.description}
                                onSelect={() => {
                                  setSelectedAddons((prev) => [...prev, a]);
                                }}
                              >
                                <span className="flex-1">{a.description}</span>
                                <span className="text-muted-foreground">{formatCurrency(a.price)}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedAddons.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Addon dipilih</div>
                  <div className="space-y-2">
                    {selectedAddons.map((a) => {
                      const key = a.addon_id;
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.description}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(a.price)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={disabled}
                            onClick={() => setSelectedAddons((prev) => prev.filter((x) => x.addon_id !== a.addon_id))}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">Permintaan Khusus</label>
                <Textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Contoh: membutuhkan kursi bayi, meeting point khusus, dll"
                  disabled={disabled}
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showPackageDetailItinerary ? (
          <Card>
            <CardHeaderWithBadge
              badgeIcon={MapPinned}
              title="Itinerary"
              subtitle="Rangkuman itinerary dari paket wisata."
            />
            <CardContent className="pt-6">
              <div className="space-y-4">
                {packageItineraries.map((day) => (
                  <div key={day.day} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hari {day.day}</h4>
                    <div className="space-y-2">
                      {day.activities?.map((a, idx) => (
                        <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{a.time ? a.time.slice(0, 5) : '-'}</span>
                          <span className="mx-2">•</span>
                          <span>{a.description || '-'}</span>
                          {a.location ? <span className="mx-2">•</span> : null}
                          {a.location ? <span>{a.location}</span> : null}
                          {a.city_name || a.city_id ? <span className="mx-2">•</span> : null}
                          {a.city_name ? <span>{a.city_name}</span> : a.city_id ? <span>City ID: {a.city_id}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showPackageFacilities ? (
          <Card>
            <CardHeaderWithBadge
              badgeIcon={ListChecks}
              title="Fasilitas"
              subtitle="Fasilitas yang termasuk dalam paket."
            />
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {packageFacilities.map((f) => (
                  <Badge key={f} variant="outline">
                    {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isCustomPackage ? (
          <Card>
            <CardHeaderWithBadge
              badgeIcon={MapPinned}
              title="Itinerary"
              subtitle="Susun tujuan perjalanan untuk paket custom."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={disabled}
                  onClick={() => setItinerary((prev) => [...prev, { id: crypto.randomUUID(), destination: '', city: null }])}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Tujuan
                </Button>
              }
            />
            <CardContent className="pt-6 space-y-3">
              {itinerary.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium">Tujuan</label>
                    <Input
                      value={row.destination}
                      onChange={(e) =>
                        setItinerary((prev) => prev.map((r) => (r.id === row.id ? { ...r, destination: e.target.value } : r)))
                      }
                      className="h-12"
                      placeholder="Contoh: Pantai Kuta"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-5 space-y-2">
                    <label className="text-sm font-medium">Kota</label>
                    <AsyncCombobox
                      value={row.city}
                      onChange={(v) => setItinerary((prev) => prev.map((r) => (r.id === row.id ? { ...r, city: v } : r)))}
                      placeholder="Cari kota..."
                      fetcher={cityFetcher}
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={disabled || itinerary.length <= 1}
                      onClick={() => setItinerary((prev) => prev.filter((r) => r.id !== row.id))}
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {idx !== itinerary.length - 1 ? <div className="md:col-span-12 border-b" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {isCustomPackage ? (
          <Card>
            <CardHeaderWithBadge
              badgeIcon={MessageSquareText}
              title="Permintaan Khusus"
              subtitle="Catatan tambahan untuk kebutuhan perjalanan."
            />
            <CardContent className="pt-6">
              <Textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="Contoh: membutuhkan kursi bayi, meeting point khusus, dll"
                disabled={disabled}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/orders/tour`)} disabled={busy}>
            Batal
          </Button>
          <Button type="button" variant="outline" onClick={onPreview} disabled={readOnly || busy || !formReady}>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Preview Pesanan
            </span>
          </Button>
          <Button type="submit" disabled={readOnly || busy || !formReady} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Update Pesanan' : 'Buat Pesanan'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
