import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Route,
  Star,
  Users,
} from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type OrderHistoryRow = {
  order_id: string;
  trip_start: string;
  trip_end: string;
  pickup_point: string;
  destination: string;
};

type UnitDetail = {
  unit_id: string;
  fleet_id?: string;
  fleet_name: string;
  fleet_type?: string;
  vehicle_id: string;
  plate_number: string;
  engine: string;
  capacity: number;
  production_year: number;
  transmission: string;
  thumbnail?: string;
  created_at?: string;
  pickup_points: string[];
  owner_name?: string;
  ownership_type?: string;
  owner_contact?: string;
  owner_email?: string;
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

const getNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMMM yyyy HH:mm', { locale: idLocale });
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const normalizeRange = (range: DateRange | undefined) => {
  if (!range?.from) return { start: undefined, end: undefined };
  const start = startOfDay(range.from);
  const end = endOfDay(range.to ?? range.from);
  return { start, end };
};

const toYmd = (d: Date | undefined) => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDdMmmYyFromDate = (d: Date) => {
  const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
  return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
};

const formatTripDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy', { locale: idLocale });
};

const formatTripRange = (start: string, end: string) => {
  const s = formatTripDate(start);
  const e = formatTripDate(end);
  if (s === '-' && e === '-') return '-';
  if (s !== '-' && (e === '-' || start === end)) return s;
  return `${s} - ${e}`;
};

const toPickupLabel = (raw: unknown): { title: string; subtitle?: string } => {
  if (typeof raw === 'string') return { title: raw };
  if (typeof raw === 'number') return { title: String(raw) };
  const obj = record(raw);
  const title =
    getString(obj.city_name ?? obj.name ?? obj.label ?? obj.location ?? obj.pickup_name ?? obj.area_name ?? obj.address).trim();
  const cityId = getString(obj.city_id ?? obj.id).trim();
  const uuid = getString(obj.uuid).trim();
  const subtitleParts = [cityId ? `ID: ${cityId}` : '', uuid ? `UUID: ${uuid}` : ''].filter(Boolean);
  return { title: title || '-', subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined };
};

export const FleetUnitDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const unitIdParam = params.unit_id ?? params.id ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UnitDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'availability'>('overview');

  const [showAdModal, setShowAdModal] = useState(false);
  const [resolution, setResolution] = useState('1080x1080');
  const [textMode, setTextMode] = useState<'manual' | 'availability'>('manual');
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [orderRange, setOrderRange] = useState<DateRange | undefined>(() => {
    const to = startOfDay(new Date());
    const from = new Date(to);
    from.setDate(from.getDate() - 90);
    return { from, to };
  });
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderRows, setOrderRows] = useState<OrderHistoryRow[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const orderItemsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/fleet-units/detail/${encodeURIComponent(unitId)}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = record(res.data);
        const obj = record(payload.data && typeof payload.data === 'object' ? payload.data : payload);
        const unit_id = getString(obj.unit_id ?? obj.id ?? unitId);
        const fleet_id = getString(obj.fleet_id ?? obj.fleetId);
        const fleet_name = getString(obj.fleet_name ?? obj.fleetName ?? obj.fleet);
        const fleet_type = getString(obj.fleet_type ?? obj.fleetType ?? obj.type);
        const vehicle_id = getString(obj.vehicle_id ?? obj.vehicleId ?? obj.unit_id);
        const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate);
        const engine = getString(obj.engine ?? obj.chassis ?? obj.machine);
        const capacity = getNumber(obj.capacity);
        const production_year = getNumber(obj.production_year ?? obj.productionYear ?? obj.year);
        const transmission = getString(obj.transmission);
        const thumbnailRaw = getString(obj.thumbnail ?? obj.image ?? obj.photo);
        const created_at = getString(obj.created_at ?? obj.createdAt ?? obj.created_date ?? obj.createdDate);
        const owner_name = getString(obj.owner_name ?? obj.ownerName ?? obj.owner ?? obj.pic_name ?? obj.picName);
        const ownership_type = getString(obj.ownership_type ?? obj.ownershipType ?? obj.owner_type ?? obj.ownerType);
        const owner_contact = getString(obj.owner_contact ?? obj.ownerContact ?? obj.phone ?? obj.contact ?? obj.pic_phone ?? obj.picPhone);
        const owner_email = getString(obj.owner_email ?? obj.ownerEmail ?? obj.email ?? obj.pic_email ?? obj.picEmail);
        const pickupPointsRaw =
          obj.pickup_point ??
          obj.pickupPoint ??
          obj.pickup_points ??
          obj.pickupPoints ??
          obj.pickup_area ??
          obj.pickupArea ??
          obj.pickup;
        const pickup_points = Array.isArray(pickupPointsRaw)
          ? (pickupPointsRaw as unknown[])
              .map((x) => {
                if (typeof x === 'string') return x.trim();
                if (typeof x === 'number') return String(x).trim();
                if (x && typeof x === 'object') return toPickupLabel(x).title.trim();
                return '';
              })
              .filter((x) => x)
          : [];
        setDetail({
          unit_id,
          fleet_id: fleet_id || undefined,
          fleet_name,
          fleet_type: fleet_type || undefined,
          vehicle_id,
          plate_number,
          engine,
          capacity,
          production_year,
          transmission,
          thumbnail: thumbnailRaw ? toFileUrl(thumbnailRaw) : undefined,
          created_at: created_at || undefined,
          pickup_points,
          owner_name: owner_name || undefined,
          ownership_type: ownership_type || undefined,
          owner_contact: owner_contact || undefined,
          owner_email: owner_email || undefined,
        });
      } else {
        setDetail(null);
      }
      setLoading(false);
    };

    load();
  }, [unitIdParam]);

  useEffect(() => {
    const loadHistory = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      if (!orderRange?.from || !orderRange?.to) return;
      setOrderLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const range = normalizeRange(orderRange);
        if (!range.start || !range.end) return;
        const payload = { unit_id: unitId, start_date: toYmd(range.start), end_date: toYmd(range.end) };
        const res = await api.post<unknown>('/fleet-units/order/history', payload, token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const root = record(payload);
          const dataNode = root.data;
          const dataObj = record(dataNode);
          const itemsNode =
            (Array.isArray(dataNode) ? dataNode : undefined) ??
            (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
            (Array.isArray(dataObj.history) ? dataObj.history : undefined) ??
            (Array.isArray(dataObj.orders) ? dataObj.orders : undefined) ??
            (Array.isArray(root.items) ? root.items : undefined) ??
            (Array.isArray(root.history) ? root.history : undefined) ??
            (Array.isArray(root.orders) ? root.orders : undefined) ??
            (Array.isArray(payload) ? payload : undefined) ??
            [];

          const mapped = (itemsNode as unknown[]).map((raw) => {
            const obj = record(raw);
            const order_id = getString(obj.order_id ?? obj.orderId ?? obj.id ?? obj.transaction_id ?? obj.transactionId).trim();
            const trip_start = getString(
              obj.trip_start ?? obj.tripStart ?? obj.trip_date ?? obj.tripDate ?? obj.start_date ?? obj.startDate ?? obj.date
            ).trim();
            const trip_end = getString(obj.trip_end ?? obj.tripEnd ?? obj.end_date ?? obj.endDate).trim();
            const pickupRaw = obj.pickup_point ?? obj.pickupPoint ?? obj.pickup_location ?? obj.pickupLocation ?? obj.pickup;
            const pickup_point =
              typeof pickupRaw === 'string' || typeof pickupRaw === 'number'
                ? getString(pickupRaw).trim()
                : pickupRaw && typeof pickupRaw === 'object'
                  ? toPickupLabel(pickupRaw).title
                  : '';
            const destRaw = obj.destination ?? obj.tujuan ?? obj.dropoff ?? obj.dropoff_location ?? obj.dropoffLocation ?? obj.to;
            const destination =
              typeof destRaw === 'string' || typeof destRaw === 'number'
                ? getString(destRaw).trim()
                : destRaw && typeof destRaw === 'object'
                  ? toPickupLabel(destRaw).title
                  : '';
            return { order_id, trip_start, trip_end, pickup_point, destination };
          });

          setOrderRows(mapped);
          setOrderPage(1);
        } else {
          setOrderRows([]);
        }
      } finally {
        setOrderLoading(false);
      }
    };

    loadHistory();
  }, [orderRange, unitIdParam]);

  const orderTotalPages = Math.max(1, Math.ceil(orderRows.length / orderItemsPerPage));
  const orderPageSafe = Math.min(orderPage, orderTotalPages);
  const orderPageStart = (orderPageSafe - 1) * orderItemsPerPage;
  const orderPageEnd = orderPageStart + orderItemsPerPage;
  const orderCurrent = orderRows.slice(orderPageStart, orderPageEnd);

  const orderRangeLabel =
    orderRange?.from && orderRange?.to
      ? `${formatDdMmmYyFromDate(orderRange.from)} - ${formatDdMmmYyFromDate(orderRange.to)}`
      : orderRange?.from
        ? `${formatDdMmmYyFromDate(orderRange.from)} - ...`
        : '';

  const unitCode = detail?.vehicle_id || unitIdParam || 'BB001';
  const ownershipBadge = (() => {
    const raw = (detail?.ownership_type ?? '').toLowerCase();
    if (!raw) return { label: '-', tone: 'muted' as const };
    if (raw.includes('own') || raw.includes('milik') || raw.includes('owned')) return { label: 'Owned', tone: 'blue' as const };
    if (raw.includes('operasional') || raw.includes('koo') || raw.includes('kerjasama')) return { label: 'Kerjasama Operasional', tone: 'amber' as const };
    return { label: detail?.ownership_type ?? '-', tone: 'muted' as const };
  })();

  const lastTripDate = (() => {
    let best: Date | null = null;
    for (const row of orderRows) {
      const d1 = row.trip_end ? new Date(row.trip_end) : null;
      const d2 = row.trip_start ? new Date(row.trip_start) : null;
      const candidates = [d1, d2].filter((d): d is Date => !!d && !isNaN(d.getTime()));
      for (const d of candidates) {
        if (!best || d.getTime() > best.getTime()) best = d;
      }
    }
    return best;
  })();

  const metrics = [
    {
      key: 'totalTrips',
      label: 'Total Perjalanan',
      value: String(orderRows.length),
      icon: Route,
    },
    {
      key: 'lastTrip',
      label: 'Perjalanan Terakhir',
      value: lastTripDate ? format(lastTripDate, 'dd MMM yyyy', { locale: idLocale }) : '-',
      icon: Clock,
    },
    {
      key: 'rating',
      label: 'Rating Armada',
      value: '4.8',
      icon: Star,
    },
    {
      key: 'capacity',
      label: 'Kapasitas Kursi',
      value: detail?.capacity ? String(detail.capacity) : '-',
      icon: Users,
    },
  ] as const;

  const availabilityDates = useMemo(() => {
    const booked = new Set<string>();
    for (const row of orderRows) {
      const start = row.trip_start ? startOfDay(new Date(row.trip_start)) : null;
      const endRaw = row.trip_end || row.trip_start;
      const end = endRaw ? startOfDay(new Date(endRaw)) : null;
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) continue;
      const a = start.getTime() <= end.getTime() ? start : end;
      const b = start.getTime() <= end.getTime() ? end : start;
      const cursor = new Date(a);
      while (cursor.getTime() <= b.getTime()) {
        booked.add(toYmd(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const result: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (!booked.has(toYmd(d))) result.push(d);
    }
    return result;
  }, [orderRows]);

  const handleReservasi = (date: Date) => {
    const q = new URLSearchParams();
    q.set('unit_id', detail?.unit_id || unitIdParam);
    q.set('date', toYmd(date));
    navigate(`${basePrefix}/orders/fleet/create?${q.toString()}`);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload = {
        thumbnail_url: detail?.thumbnail ?? '',
        resolution,
        text_mode: textMode,
        text: textMode === 'manual' ? customText : '',
        unit_id: detail?.unit_id ?? unitIdParam,
      };

      const res = await api.post<unknown>('/ai/image/generate', payload, headers);
      if (res.status === 'success') {
        const root = record(res.data);
        const dataNode = root.data;
        const dataObj = record(dataNode);
        const url = getString(dataObj.url ?? dataObj.image_url ?? dataObj.result ?? root.url ?? root.image_url).trim();
        if (url) {
          setGeneratedImage(url);
        } else if (detail?.thumbnail) {
          setGeneratedImage(detail.thumbnail);
        }
      } else if (detail?.thumbnail) {
        setGeneratedImage(detail.thumbnail);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#F5F7FB]">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
              onClick={() => navigate(`${basePrefix}/fleet-units`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Detail Unit Armada</h1>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Aktif
                </span>
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500">
                <span className="text-gray-500">Unit Armada</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-gray-500">Detail Unit Armada</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="font-medium text-gray-700">{unitCode}</span>
              </div>
            </div>
          </div>

          {detail && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-white border-gray-200/70 hover:bg-white" onClick={() => setShowAdModal(true)}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Iklan
              </Button>
              <Button
                variant="outline"
                className="bg-white border-gray-200/70 hover:bg-white"
                onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(detail.unit_id)}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
          {loading ? (
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="w-full aspect-[16/10] rounded-xl bg-gray-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`main-s-${i}`} className="space-y-2">
                    <div className="h-3 rounded bg-gray-100 w-28" />
                    <div className="h-9 rounded bg-gray-100 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : !detail ? (
            <div className="py-10 text-center text-sm text-gray-500">Data unit tidak ditemukan</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="w-full">
                <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200/70 bg-gray-50">
                  {detail.thumbnail ? (
                    <img src={detail.thumbnail} alt={detail.vehicle_id || 'thumbnail'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Tidak ada foto</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                {[
                  { label: 'Tipe Armada', value: detail.fleet_name || '-' },
                  { label: 'Plat Nomor', value: detail.plate_number || '-' },
                  { label: 'Chassis', value: detail.engine || '-' },
                  { label: 'Fleet Type', value: detail.fleet_type || '-' },
                  { label: 'Transmisi', value: detail.transmission || '-' },
                  { label: 'Tahun Produksi', value: detail.production_year ? String(detail.production_year) : '-' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-200/60 bg-white px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="mt-1 font-medium text-gray-900 truncate">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs text-gray-500">{m.label}</div>
                    <div className="text-lg sm:text-xl font-semibold text-blue-600 truncate">{m.value}</div>
                  </div>
                  <div className="shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">Informasi Kepemilikan</div>
              <span
                className={[
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                  ownershipBadge.tone === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-700' : '',
                  ownershipBadge.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-800' : '',
                  ownershipBadge.tone === 'muted' ? 'border-gray-200 bg-gray-50 text-gray-700' : '',
                ].join(' ')}
              >
                {ownershipBadge.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Owner Name', value: detail?.owner_name || '-' },
                { label: 'Kontak Owner', value: detail?.owner_contact || '-' },
                { label: 'Email', value: detail?.owner_email || '-' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="mt-1 font-medium text-gray-900 truncate">{item.value}</div>
                </div>
              ))}
              <div className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
                <div className="text-xs text-gray-500">Jenis Kepemilikan</div>
                <div className="mt-1 font-medium text-gray-900 truncate">{ownershipBadge.label}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-sm font-semibold text-gray-900">Pickup Points</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(detail?.pickup_points ?? []).length === 0 ? (
                <div className="text-sm text-gray-500">Tidak ada pickup points</div>
              ) : (
                (detail?.pickup_points ?? []).map((name, idx) => (
                  <div
                    key={`p-${idx}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200/70 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 text-xs text-gray-500">Total lokasi: {(detail?.pickup_points ?? []).length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 sm:px-5 pt-4 sm:pt-5">
            <div className="relative flex items-center gap-6 border-b border-gray-200/70">
              {([
                { key: 'overview', label: 'Overview' },
                { key: 'orders', label: 'Riwayat Perjalanan' },
                { key: 'availability', label: 'Ketersediaan' },
              ] as const).map((t) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={[
                      'relative py-3 text-sm font-medium transition-colors',
                      isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                    ].join(' ')}
                  >
                    {t.label}
                    {isActive && (
                      <motion.div
                        layoutId="fleet-unit-tab-underline"
                        className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-blue-600"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4"
                >
                  {loading ? (
                    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={`ov-s-${i}`} className="rounded-2xl border border-gray-200/60 bg-white p-4">
                          <div className="h-4 w-44 rounded bg-gray-100" />
                          <div className="mt-4 space-y-3">
                            {Array.from({ length: 6 }).map((__, j) => (
                              <div key={`ov-s-${i}-${j}`} className="flex items-center justify-between gap-4">
                                <div className="h-3 w-32 rounded bg-gray-100" />
                                <div className="h-3 w-40 rounded bg-gray-100" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !detail ? (
                    <div className="py-10 text-center text-sm text-gray-500">Data unit tidak ditemukan</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-gray-200/60 bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900">Informasi Teknis</div>
                        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/60">
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-200/60">
                              {[
                                { label: 'Fleet Type', value: detail.fleet_type || '-' },
                                { label: 'Tipe Armada', value: detail.fleet_name || '-' },
                                { label: 'Plat Nomor', value: detail.plate_number || '-' },
                                { label: 'Chassis', value: detail.engine || '-' },
                                { label: 'Transmisi', value: detail.transmission || '-' },
                                { label: 'Tahun Produksi', value: detail.production_year ? String(detail.production_year) : '-' },
                                { label: 'Kapasitas Kursi', value: detail.capacity ? String(detail.capacity) : '-' },
                              ].map((row) => (
                                <tr key={row.label} className="bg-white">
                                  <td className="px-4 py-3 text-gray-500 w-1/2">{row.label}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200/60 bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900">Informasi Administratif</div>
                        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/60">
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-200/60">
                              {[
                                { label: 'Unit ID', value: detail.unit_id || '-' },
                                { label: 'Vehicle ID', value: detail.vehicle_id || '-' },
                                { label: 'Tanggal Dibuat', value: formatDate(detail.created_at) },
                                { label: 'Owner Name', value: detail.owner_name || '-' },
                                { label: 'Kontak Owner', value: detail.owner_contact || '-' },
                                { label: 'Email', value: detail.owner_email || '-' },
                              ].map((row) => (
                                <tr key={row.label} className="bg-white">
                                  <td className="px-4 py-3 text-gray-500 w-1/2">{row.label}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'orders' ? (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="w-full md:max-w-sm">
                      <div className="text-xs text-gray-500 mb-1">Tanggal Trip</div>
                      <Popover
                        open={orderPickerOpen}
                        onOpenChange={(next) => {
                          if (!next) {
                            const r = orderRange;
                            if (r?.from && !r?.to) {
                              setOrderPickerOpen(true);
                              return;
                            }
                          }
                          setOrderPickerOpen(next);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal h-10 bg-white border-gray-200/70 hover:bg-white">
                            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {orderRangeLabel || 'Pilih rentang tanggal'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            numberOfMonths={1}
                            selected={orderRange}
                            onSelect={(range) => {
                              setOrderRange(range);
                              if (range?.from && range?.to) {
                                setOrderPickerOpen(false);
                              } else {
                                setOrderPickerOpen(true);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200/70 rounded-2xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200/70 text-left">
                          <th className="py-3 px-4 font-semibold text-gray-900">Order Id</th>
                          <th className="py-3 px-4 font-semibold text-gray-900">Tanggal Trip</th>
                          <th className="py-3 px-4 font-semibold text-gray-900">Pickup Point</th>
                          <th className="py-3 px-4 font-semibold text-gray-900">Tujuan</th>
                          <th className="py-3 px-4 font-semibold text-gray-900 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {orderLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={`o-s-${i}`} className="border-b border-gray-200/60 animate-pulse">
                              {Array.from({ length: 5 }).map((__, j) => (
                                <td key={`o-s-${i}-${j}`} className="py-3 px-4">
                                  <div className="h-4 bg-gray-100 rounded w-full" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : orderCurrent.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-gray-500">
                              Tidak ada data order
                            </td>
                          </tr>
                        ) : (
                          orderCurrent.map((row, idx) => (
                            <tr key={`o-${row.order_id || idx}`} className="border-b border-gray-200/60 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900">{row.order_id || '-'}</td>
                              <td className="py-3 px-4 text-gray-700">{formatTripRange(row.trip_start, row.trip_end || row.trip_start)}</td>
                              <td className="py-3 px-4 text-gray-700">{row.pickup_point || '-'}</td>
                              <td className="py-3 px-4 text-gray-700">{row.destination || '-'}</td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="!w-auto !h-auto p-2 bg-white border-gray-200/70 hover:bg-white"
                                  disabled={!row.order_id}
                                  onClick={() =>
                                    row.order_id ? navigate(`${basePrefix}/orders/fleet/detail/${encodeURIComponent(row.order_id)}`) : undefined
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-gray-500">
                      Menampilkan {orderRows.length === 0 ? 0 : orderPageStart + 1}-{Math.min(orderPageEnd, orderRows.length)} dari {orderRows.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                        disabled={orderPageSafe <= 1}
                        className="bg-white border-gray-200/70 hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <div className="text-sm text-gray-500">
                        {orderPageSafe} / {orderTotalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderPage((p) => Math.min(orderTotalPages, p + 1))}
                        disabled={orderPageSafe >= orderTotalPages}
                        className="bg-white border-gray-200/70 hover:bg-white"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="availability"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4"
                >
                  <div className="overflow-hidden rounded-2xl border border-gray-200/70">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="px-4">Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right pr-4">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availabilityDates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="py-10 text-center text-gray-500">
                              Tidak ada tanggal tersedia
                            </TableCell>
                          </TableRow>
                        ) : (
                          availabilityDates.map((date) => (
                            <TableRow key={toYmd(date)} className="hover:bg-gray-50">
                              <TableCell className="px-4 font-medium text-gray-900">
                                {format(date, 'dd MMM yyyy', { locale: idLocale })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                  Tersedia
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white border-gray-200/70 hover:bg-white"
                                  onClick={() => handleReservasi(date)}
                                >
                                  Reservasi Tanggal Ini
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Dialog
          open={showAdModal}
          onOpenChange={(open) => {
            setShowAdModal(open);
            if (!open) {
              setIsGenerating(false);
              setGeneratedImage(null);
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Iklan Armada</DialogTitle>
              <DialogDescription>Buat gambar iklan dari thumbnail unit armada.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-gray-700">Resolusi</div>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="border-gray-200/70">
                    <SelectValue placeholder="Pilih resolusi" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1080x1080', '1080x1920', '1200x628'].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-gray-700">Preview</div>
                <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white">
                  <div className="aspect-[16/10] w-full">
                    {generatedImage || detail?.thumbnail ? (
                      <img
                        src={generatedImage || detail?.thumbnail}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Tidak ada gambar</div>
                    )}
                  </div>
                  {isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <div className="grid place-items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-gray-700">Mode Teks</div>
                <RadioGroup value={textMode} onValueChange={(v) => setTextMode(v as 'manual' | 'availability')}>
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2">
                    <RadioGroupItem value="manual" />
                    <div className="text-sm text-gray-900">Tulis Sendiri</div>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2">
                    <RadioGroupItem value="availability" />
                    <div className="text-sm text-gray-900">Berdasarkan Ketersediaan</div>
                  </label>
                </RadioGroup>
              </div>

              {textMode === 'manual' ? (
                <div className="grid gap-2">
                  <div className="text-xs font-medium text-gray-700">Teks Iklan</div>
                  <Textarea value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Tulis copy iklan..." />
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200/70 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Menggunakan data ketersediaan 30 hari ke depan.
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="bg-white border-gray-200/70 hover:bg-white"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Gambar'}
                </Button>

                {generatedImage ? (
                  <a href={generatedImage} download="iklan-armada.png">
                    <Button variant="outline" className="bg-white border-gray-200/70 hover:bg-white" type="button">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
