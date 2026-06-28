import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import * as LucideIcons from 'lucide-react';
import { ImagePopup } from '@/components/common/ImagePopup';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';

type FleetMeta = {
  fleet_id: string;
  fleet_type: string;
  fleet_type_label: string;
  fleet_name: string;
  capacity: number;
  capacities: string;
  engine: string;
  body: string;
  thumbnail: string;
  active?: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  description?: string;
  rating?: number;
  total_ulasan?: number;
};

type FleetPickup = { uuid: string; city_id: number; city_name: string };
type FleetPricing = { uuid: string; duration: number; rent_type: number; rent_type_label: string; price: number; disc_amount: number; disc_price: number; uom: string };
type FleetImageItem = { uuid: string; path_file: string };

type FleetUnitRow = {
  id: string;
  vehicle_id: string;
  plate_number: string;
  engine: string;
  capacity: number;
  ownership?: string;
  status?: string;
  thumbnail?: string;
  ownership_type?: string;
};

type FleetReview = {
  star: number;
  review: string;
  customer_name: string;
  created_at?: string;
  order_id: string;
};

type FleetScheduleAvailableUnit = {
  vehicle_id: string;
  plate_number: string;
  capacity: number;
};

type FleetScheduleRow = {
  date: string;
  available: boolean;
  available_units: FleetScheduleAvailableUnit[];
};

type Facility = {
  facility_name: string;
  facility_icon?: string;
};

type FleetDetailData = {
  meta: FleetMeta;
  facilities: Facility[];
  pickup: FleetPickup[];
  addon: unknown[];
  pricing: FleetPricing[];
  images: FleetImageItem[];
  reviews: FleetReview[];
};

type RevenueSummary = {
  current: { totalBooking: number; totalRevenue: number };
  previous?: { totalBooking: number; totalRevenue: number };
  currentLabel: string;
  previousLabel?: string;
};

export const FleetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const [fleet, setFleet] = useState<FleetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'units' | 'pricing' | 'schedule' | 'review'>('info');

  const [unitsLoading, setUnitsLoading] = useState(false);
  const [units, setUnits] = useState<FleetUnitRow[]>([]);
  const [unitSearch, setUnitSearch] = useState('');

  const [showAdModal, setShowAdModal] = useState(false);
  const [resolution, setResolution] = useState('1080x1080');
  const [textMode, setTextMode] = useState<'manual' | 'availability'>('manual');
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const toYmd = (d: Date | null) => {
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

  const [scheduleRange, setScheduleRange] = useState<DateRange | undefined>(() => {
    const from = startOfDay(new Date());
    const to = new Date(from);
    to.setDate(from.getDate() + 19);
    return { from, to };
  });
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<FleetScheduleRow[]>([]);
  const [schedulePage, setSchedulePage] = useState(1);
  const scheduleItemsPerPage = 10;
  const [scheduleUnitsOpen, setScheduleUnitsOpen] = useState(false);
  const [scheduleUnitsDate, setScheduleUnitsDate] = useState('');
  const [scheduleUnits, setScheduleUnits] = useState<FleetScheduleAvailableUnit[]>([]);

  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);

  const filteredUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => {
      const text = [u.vehicle_id, u.plate_number, u.engine, u.ownership, u.status].filter(Boolean).join(' ').toLowerCase();
      return text.includes(q);
    });
  }, [unitSearch, units]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd MMMM yyyy HH:mm', { locale: idLocale });
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const token = localStorage.getItem('token') ?? '';
      const res = await api.post<unknown>('/services/fleet/detail', { fleet_id: id }, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const getNumber = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        const p = record(payload);
        const meta = p.meta as unknown;
        const facilities = p.facilities as unknown;
        const pickup = p.pickup as unknown;
        const addon = p.addon as unknown;
        const pricing = p.pricing as unknown;
        const images = p.images as unknown;
        const reviewsNode = p.reviews ?? record(p.data).reviews ?? record(record(p.data).data).reviews;

        const activeRaw = (meta as { active?: unknown; status?: unknown })?.active ?? (meta as { status?: unknown })?.status;
        const active =
          typeof activeRaw === 'boolean'
            ? activeRaw
            : activeRaw === 1 || activeRaw === '1'
              ? true
              : activeRaw === 0 || activeRaw === '0'
                ? false
                : undefined;

        const metaObj: FleetMeta = {
          fleet_id: typeof (meta as { fleet_id?: unknown })?.fleet_id === 'string' ? (meta as { fleet_id?: unknown }).fleet_id as string : '',
          fleet_type: typeof (meta as { fleet_type?: unknown })?.fleet_type === 'string' ? (meta as { fleet_type?: unknown }).fleet_type as string : '',
          fleet_type_label: typeof (meta as { fleet_type_label?: unknown })?.fleet_type_label === 'string' ? (meta as { fleet_type_label?: unknown }).fleet_type_label as string : '',
          fleet_name: typeof (meta as { fleet_name?: unknown })?.fleet_name === 'string' ? (meta as { fleet_name?: unknown }).fleet_name as string : '',
          capacity: typeof (meta as { capacity?: unknown })?.capacity === 'number' ? (meta as { capacity?: unknown }).capacity as number : 0,
          engine: typeof (meta as { engine?: unknown })?.engine === 'string' ? (meta as { engine?: unknown }).engine as string : '',
          body: typeof (meta as { body?: unknown })?.body === 'string' ? (meta as { body?: unknown }).body as string : '',
          thumbnail: typeof (meta as { thumbnail?: unknown })?.thumbnail === 'string' ? toFileUrl((meta as { thumbnail?: unknown }).thumbnail as string) : '',
          active,
          created_at: typeof (meta as { created_at?: unknown })?.created_at === 'string' ? (meta as { created_at?: unknown }).created_at as string : '',
          created_by: typeof (meta as { created_by?: unknown })?.created_by === 'string' ? (meta as { created_by?: unknown }).created_by as string : '',
          updated_at: typeof (meta as { updated_at?: unknown })?.updated_at === 'string' ? (meta as { updated_at?: unknown }).updated_at as string : '',
          updated_by: typeof (meta as { updated_by?: unknown })?.updated_by === 'string' ? (meta as { updated_by?: unknown }).updated_by as string : '',
          description: typeof (meta as { description?: unknown })?.description === 'string' ? (meta as { description?: unknown }).description as string : '',
          rating: typeof (meta as { rating?: unknown })?.rating === 'number' ? (meta as { rating?: unknown }).rating as number : 0,
          capacities: typeof (meta as { capacities?: unknown })?.capacities === 'string' ? (meta as { capacities?: unknown }).capacities as string : '',
          total_ulasan: getNumber(
            (meta as Record<string, unknown>)?.total_ulasan ??
              (meta as Record<string, unknown>)?.totalUlasan ??
              (meta as Record<string, unknown>)?.total_reviews ??
              (meta as Record<string, unknown>)?.totalReviews
          ),
        };

        const facilitiesArr = Array.isArray(facilities)
          ? (facilities as unknown[])
              .map((x) => {
                const record = (v: unknown): Record<string, unknown> =>
                  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
                const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
                const obj = record(x);
                const facility_name = getString(obj.facility_name ?? obj.name).trim();
                const facility_icon = getString(obj.facility_icon ?? obj.icon).trim();
                return facility_name ? { facility_name, facility_icon: facility_icon || undefined } : null;
              })
              .filter((v): v is Facility => Boolean(v))
          : [];
        const pickupArr = Array.isArray(pickup)
          ? (pickup as unknown[])
              .map((x) => {
                const obj = x as Record<string, unknown>;
                const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
                const city_id = typeof obj.city_id === 'number' ? obj.city_id : 0;
                const city_name = typeof obj.city_name === 'string' ? obj.city_name : '';
                return uuid && city_name ? { uuid, city_id, city_name } : null;
              })
              .filter((v): v is FleetPickup => Boolean(v))
          : [];
        const pricingArr = Array.isArray(pricing)
          ? (pricing as unknown[])
              .map((x) => {
                const obj = x as Record<string, unknown>;
                const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
                const duration = typeof obj.duration === 'number' ? obj.duration : 0;
                const rent_type = typeof obj.rent_type === 'number' ? obj.rent_type : 0;
                const rent_type_label = typeof obj.rent_type_label === 'string' ? obj.rent_type_label : '';
                const price = typeof obj.price === 'number' ? obj.price : 0;
                const disc_amount = typeof obj.disc_amount === 'number' ? obj.disc_amount : 0;
                const disc_price = typeof obj.disc_price === 'number' ? obj.disc_price : 0;
                const uom = typeof obj.uom === 'string' ? obj.uom : 'hari';
                return uuid ? { uuid, duration, rent_type, rent_type_label, price, disc_amount, disc_price, uom } : null;
              })
              .filter((v): v is FleetPricing => Boolean(v))
          : [];
        const imagesRaw = Array.isArray(images)
          ? (images as unknown[])
          : Array.isArray((meta as unknown as { images?: unknown[] })?.images)
            ? ((meta as unknown as { images?: unknown[] }).images as unknown[])
            : [];
        const imagesArr = imagesRaw
          .map((x) => {
            const obj = x as Record<string, unknown>;
            const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
            const path_file = typeof obj.path_file === 'string' ? toFileUrl(obj.path_file) : '';
            return path_file ? { uuid: uuid || `${Math.random()}`.slice(2), path_file } : null;
          })
          .filter((v): v is FleetImageItem => Boolean(v));

        const reviewsRaw = Array.isArray(reviewsNode) ? (reviewsNode as unknown[]) : [];
        const reviewsArr = reviewsRaw
          .map((x) => {
            const obj = record(x);
            const star = getNumber(obj.star ?? obj.rating ?? obj.stars);
            const review = getString(obj.review ?? obj.comment ?? obj.text).trim();
            const customer_name = getString(obj.customer_name ?? obj.customerName ?? obj.name).trim();
            const created_at = getString(obj.created_at ?? obj.createdAt).trim();
            const order_id = getString(obj.order_id ?? obj.orderId ?? obj.transaction_id ?? obj.transactionId).trim();
            if (!review && !customer_name && !order_id) return null;
            return created_at
              ? ({ star, review, customer_name: customer_name || '-', created_at, order_id } satisfies FleetReview)
              : ({ star, review, customer_name: customer_name || '-', order_id } satisfies FleetReview);
          })
          .filter((v): v is FleetReview => v !== null);

        setFleet({
          meta: { ...metaObj, total_ulasan: metaObj.total_ulasan || reviewsArr.length },
          facilities: facilitiesArr,
          pickup: pickupArr,
          addon: Array.isArray(addon) ? addon : [],
          pricing: pricingArr,
          images: imagesArr,
          reviews: reviewsArr,
        });
      }
      setLoading(false);
    };
    load();
  }, [id, reloadNonce]);

  useEffect(() => {
    const loadSchedule = async () => {
      const fleetId = fleet?.meta?.fleet_id;
      if (!fleetId) return;
      const fromRaw = scheduleRange?.from;
      if (!fromRaw) return;
      const start = startOfDay(new Date(fromRaw));
      const end = new Date(scheduleRange?.to ?? fromRaw);
      end.setHours(23, 59, 59, 999);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      setSchedulePage(1);
      setScheduleLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const payload = { fleet_id: fleetId, start_date: toYmd(start), end_date: toYmd(end) };
        const res = await api.post<unknown>('/services/schedule/daily-availibility/fleet', payload, headers);
        if (res.status === 'success') {
          const record = (v: unknown): Record<string, unknown> =>
            v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
          const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
          const getNumber = (v: unknown) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          };

          const root = record(res.data as unknown);
          const dataNode = root.data ?? root;
          const dataObj = record(dataNode);
          const deep = record(dataObj.data);
          const schedulesNode =
            (Array.isArray(dataObj.schedules) ? (dataObj.schedules as unknown[]) : undefined) ??
            (Array.isArray(deep.schedules) ? (deep.schedules as unknown[]) : undefined) ??
            [];

          const mapped = schedulesNode
            .map((raw) => {
              const obj = record(raw);
              const date = getString(obj.date ?? obj.schedule_date ?? obj.day ?? obj.start_date).trim();
              const availableRaw = obj.available ?? obj.is_available ?? obj.status;
              const available =
                typeof availableRaw === 'boolean'
                  ? availableRaw
                  : availableRaw === 1 || availableRaw === '1'
                    ? true
                    : availableRaw === 0 || availableRaw === '0'
                      ? false
                      : Boolean(availableRaw);
              const unitsNode = Array.isArray(obj.available_units) ? (obj.available_units as unknown[]) : [];
              const available_units = unitsNode
                .map((u) => {
                  const uo = record(u);
                  const vehicle_id = getString(uo.vehicle_id ?? uo.vehicleId ?? uo.id).trim();
                  const plate_number = getString(uo.plate_number ?? uo.plateNumber ?? uo.plate).trim();
                  const capacity = getNumber(uo.capacity ?? uo.seat ?? uo.seats);
                  if (!vehicle_id && !plate_number) return null;
                  return { vehicle_id: vehicle_id || '-', plate_number: plate_number || '-', capacity } satisfies FleetScheduleAvailableUnit;
                })
                .filter((v): v is FleetScheduleAvailableUnit => Boolean(v));
              if (!date) return null;
              return { date, available, available_units } satisfies FleetScheduleRow;
            })
            .filter((v): v is FleetScheduleRow => Boolean(v));

          setScheduleRows(mapped);
        } else {
          setScheduleRows([]);
        }
      } finally {
        setScheduleLoading(false);
      }
    };

    loadSchedule();
  }, [fleet?.meta?.fleet_id, scheduleRange]);

  useEffect(() => {
    const loadRevenue = async () => {
      const fleetId = fleet?.meta?.fleet_id;
      if (!fleetId) return;
      setRevenueLoading(true);
      try {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const currentLabel = format(currentMonthDate, 'MMMM yyyy', { locale: idLocale });
        const previousLabel = format(prevMonthDate, 'MMMM yyyy', { locale: idLocale });
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.post<unknown>('/services/fleet/revenue', { fleet_id: fleetId, period }, headers);
        if (res.status !== 'success') {
          setRevenueSummary(null);
          return;
        }

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getNumber = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        const root = record(payload);
        const list = (Array.isArray(root.data) ? (root.data as unknown[]) : Array.isArray(payload) ? (payload as unknown[]) : []) as unknown[];
        const first = list.length > 0 ? record(list[0]) : {};
        const second = list.length > 1 ? record(list[1]) : null;
        const current = {
          totalBooking: getNumber(first.total_booking ?? first.totalBooking ?? first.booking_total ?? first.bookingTotal),
          totalRevenue: getNumber(first.total_revenue ?? first.totalRevenue ?? first.revenue_total ?? first.revenueTotal),
        };
        const previous = second
          ? {
              totalBooking: getNumber(second.total_booking ?? second.totalBooking ?? second.booking_total ?? second.bookingTotal),
              totalRevenue: getNumber(second.total_revenue ?? second.totalRevenue ?? second.revenue_total ?? second.revenueTotal),
            }
          : undefined;
        setRevenueSummary({
          current,
          previous,
          currentLabel,
          previousLabel: previous ? previousLabel : undefined,
        });
      } finally {
        setRevenueLoading(false);
      }
    };

    loadRevenue();
  }, [fleet?.meta?.fleet_id]);

  const scheduleRangeLabel =
    scheduleRange?.from && scheduleRange?.to
      ? `${formatDdMmmYyFromDate(scheduleRange.from)} - ${formatDdMmmYyFromDate(scheduleRange.to)}`
      : scheduleRange?.from
        ? `${formatDdMmmYyFromDate(scheduleRange.from)} - ...`
        : 'Pilih rentang tanggal';

  const scheduleTotalPages = Math.max(1, Math.ceil(scheduleRows.length / scheduleItemsPerPage));
  const schedulePageSafe = Math.min(schedulePage, scheduleTotalPages);
  const schedulePageStart = (schedulePageSafe - 1) * scheduleItemsPerPage;
  const schedulePageEnd = schedulePageStart + scheduleItemsPerPage;
  const scheduleCurrent = scheduleRows.slice(schedulePageStart, schedulePageEnd);

  useEffect(() => {
    const loadUnits = async () => {
      if (!id) return;
      setUnitsLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const qs = new URLSearchParams();
        qs.set('fleet_id', id);
        qs.set('page', '1');
        qs.set('limit', '200');
        const res = await api.get<unknown>(`/services/fleet-units?${qs.toString()}`, headers);
        if (res.status !== 'success') {
          setUnits([]);
          return;
        }

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const getNumber = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
            ? ((payload as Record<string, unknown>).items as unknown[])
            : payload && typeof payload === 'object' && payload && typeof (payload as Record<string, unknown>).data === 'object'
              ? Array.isArray(((payload as Record<string, unknown>).data as Record<string, unknown>).items)
                ? ((((payload as Record<string, unknown>).data as Record<string, unknown>).items as unknown[]) ?? [])
                : []
              : [];

        const mapped = list
          .map((raw, i) => {
            const obj = record(raw);
            const idRaw = obj.id ?? obj.unit_id ?? obj.vehicle_id ?? i;
            const idValue = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : String(i);
            const vehicle_id = getString(obj.vehicle_id ?? obj.unit_id).trim();
            const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate).trim();
            const engine = getString(obj.engine ?? obj.chassis ?? obj.machine).trim();
            const capacity = getNumber(obj.capacity);
            const ownership = getString(obj.ownership ?? obj.ownership_type ?? obj.ownershipType ?? obj.owner_type).trim();
            const status = getString(obj.status ?? obj.unit_status ?? obj.availability).trim();
            const thumbnail = getString(obj.thumbnail ?? obj.image ?? obj.photo).trim();
            return {
              id: idValue,
              vehicle_id,
              plate_number,
              engine,
              capacity,
              ownership: ownership || undefined,
              status: status === '1' ? 'Available' : 'On Duty',
              thumbnail: thumbnail ? toFileUrl(thumbnail) : undefined,
            } satisfies FleetUnitRow;
          })
          .filter((x) => x.vehicle_id || x.id);

        setUnits(mapped);
      } finally {
        setUnitsLoading(false);
      }
    };

    loadUnits();
  }, [id, reloadNonce]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200/60 p-4">
              <Skeleton className="h-4 w-40" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200/60 p-4">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fleet) {
    return (
      <div className="bg-[#F5F7FB] p-4 sm:p-6">
        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-8 text-center text-sm text-gray-600">
          Armada tidak ditemukan
        </div>
      </div>
    );
  }

  const handleActivate = async () => {
    if (fleet.meta.active === true) return;
    const result = await Swal.fire({
      title: 'Aktifkan armada?',
      text: 'Armada akan diset menjadi aktif.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, aktifkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/fleet/active', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Armada berhasil diaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleInactive = async () => {
    if (fleet.meta.active === false) return;
    const result = await Swal.fire({
      title: 'Nonaktifkan armada?',
      text: 'Armada akan diset menjadi tidak aktif.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, nonaktifkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/fleet/inactive', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Armada berhasil dinonaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus armada?',
      text: 'Data yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/fleet/delete', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Armada berhasil dihapus.' });
      navigate(`${basePrefix}/services/fleet`);
    }
  };

  const isActive = fleet.meta.active !== false;
  const fleetTitle = fleet.meta.fleet_name || 'Detail Armada';
  const galleryPopupImages = [
    fleet.meta.thumbnail,
    ...fleet.images.map((x) => x.path_file),
  ].filter((x, i, arr) => Boolean(x) && arr.indexOf(x) === i);

  const unitOwnership = (value?: string) => {
    const raw = (value === '1' ? 'Partnership' : 'In-House').toLowerCase();

    if (raw.includes('in-house') || raw.includes('owned') || raw.includes('milik')) return { label: 'In-House', tone: 'green' as const };
    if (raw.includes('partner') || raw.includes('kerjasama') || raw.includes('operasional')) return { label: 'Partnership', tone: 'orange' as const };
    if (!raw) return { label: 'In-House', tone: 'green' as const };
    return { label: value ?? '-', tone: 'orange' as const };
  };

  const unitStatus = (value?: string) => {
    const raw = (value ?? '').toLowerCase();
    if (raw.includes('duty') || raw.includes('on')) return { label: 'On Duty', tone: 'blue' as const };
    if (!raw) return { label: 'Available', tone: 'green' as const };
    if (raw.includes('avail') || raw.includes('tersedia')) return { label: 'Available', tone: 'green' as const };
    return { label: value ?? '-', tone: 'blue' as const };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload = {
        thumbnail_url: fleet.meta.thumbnail ?? '',
        resolution,
        text_mode: textMode,
        text: textMode === 'manual' ? customText : '',
        fleet_id: fleet.meta.fleet_id,
        fleet_name: fleet.meta.fleet_name,
      };

      const res = await api.post<unknown>('/ai/image/generate', payload, headers);
      if (res.status === 'success') {
        const root = (res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {}) as Record<string, unknown>;
        const dataNode = root.data;
        const dataObj = dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>) : {};
        const urlRaw = (dataObj.url ?? dataObj.image_url ?? dataObj.result ?? root.url ?? root.image_url) as unknown;
        const url = typeof urlRaw === 'string' ? urlRaw : '';
        if (url) setGeneratedImage(url);
        else if (fleet.meta.thumbnail) setGeneratedImage(fleet.meta.thumbnail);
      } else if (fleet.meta.thumbnail) {
        setGeneratedImage(fleet.meta.thumbnail);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const RatioIcon = ({ ratio, className }: { ratio: string; className?: string }) => {
    if (ratio === '1080x1080') return <LucideIcons.Square className={className} />;
    if (ratio === '1920x1080') return <LucideIcons.RectangleHorizontal className={className} />;
    return <LucideIcons.RectangleVertical className={className} />;
  };

  return (
    <div className="">
      <div className="space-y-5 p-2 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4">
            <div className="flex flex-wrap sm:flex-nowrap items-start gap-3 min-w-0 flex-1">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
                onClick={() => navigate(-1)}
              >
                <LucideIcons.ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 w-full sm:w-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white/60 dark:truncate truncate-title">{fleetTitle}</h1>
                  <span
                    className={clsx(
                      'hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                      isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                    )}
                  >
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="mt-1 text-xs sm:text-sm text-gray-500">
                  <span className="text-gray-500">Daftar Armada</span>
                  <span className="mx-2 text-gray-300">/</span>
                  <span className="font-medium text-gray-700">{fleet.meta.fleet_name || '-'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 ml-auto sm:ml-0 sm:flex-wrap sm:justify-end">
              <Button
                variant="outline"
                className="hidden sm:inline-flex w-full sm:w-auto bg-white border-purple-200 text-purple-700 hover:bg-white"
                onClick={() => setShowAdModal(true)}
              >
                <LucideIcons.Image className="h-4 w-4 mr-2" />
                Buat Gambar Iklan
                <span className="ml-2 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                  AI
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Menu"
                    variant="outline"
                    className="h-10 w-10 p-0 bg-white border-gray-200/70 hover:bg-white sm:h-9 sm:w-auto sm:px-4 sm:py-2"
                  >
                    <span className="hidden sm:inline">Menu</span>
                    <LucideIcons.MoreVertical className="h-4 w-4 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuItem onClick={() => setShowAdModal(true)} className="cursor-pointer sm:hidden">
                    <LucideIcons.Image className="h-4 w-4 mr-2" />
                    Buat Gambar Iklan
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate(`${basePrefix}/services/fleet/edit/${encodeURIComponent(fleet.meta.fleet_id)}`)}
                    className="cursor-pointer"
                  >
                    <LucideIcons.Edit className="h-4 w-4 mr-2" />
                    Edit Armada
                  </DropdownMenuItem>

                  {isActive ? (
                    <DropdownMenuItem onClick={handleInactive} className="cursor-pointer">
                      <LucideIcons.Ban className="h-4 w-4 mr-2" />
                      Nonaktifkan
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleActivate} className="cursor-pointer">
                      Aktifkan
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="cursor-pointer text-red-700 focus:text-red-700"
                  >
                    <LucideIcons.Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="order-1 rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 dark:text-white/60">Total Pesanan</div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-white">{revenueSummary?.currentLabel || '-'}</div>
                  </div>
                  {!revenueLoading && revenueSummary?.previous && revenueSummary.previous.totalBooking > 0 ? (
                    (() => {
                      const cur = revenueSummary.current.totalBooking;
                      const prev = revenueSummary.previous?.totalBooking ?? 0;
                      const pct = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
                      const up = pct >= 0;
                      const Icon = up ? LucideIcons.TrendingUp : LucideIcons.TrendingDown;
                      return (
                        <div
                          className={clsx(
                            'shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold',
                            up ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {`${Math.abs(pct).toFixed(0)}%`}
                        </div>
                      );
                    })()
                  ) : null}
                </div>
                <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white/60">
                  {revenueLoading ? <Skeleton className="h-7 w-24 dark:text-white" /> : String(revenueSummary?.current.totalBooking ?? 0)}
                </div>
                {!revenueLoading && revenueSummary?.previous ? (
                  <div className="mt-2 text-xs text-gray-500">
                    {(revenueSummary.previousLabel || '') + ':'} {String(revenueSummary.previous.totalBooking)} pesanan
                  </div>
                ) : null}
              </div>

              <div className="order-3 col-span-2 sm:col-span-1 sm:order-2 rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 dark:text-white/60">Total Pendapatan</div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-white/60">{revenueSummary?.currentLabel || '-'}</div>
                  </div>
                  {!revenueLoading && revenueSummary?.previous && revenueSummary.previous.totalRevenue > 0 ? (
                    (() => {
                      const cur = revenueSummary.current.totalRevenue;
                      const prev = revenueSummary.previous?.totalRevenue ?? 0;
                      const pct = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
                      const up = pct >= 0;
                      const Icon = up ? LucideIcons.TrendingUp : LucideIcons.TrendingDown;
                      return (
                        <div
                          className={clsx(
                            'shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold',
                            up ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {`${Math.abs(pct).toFixed(0)}%`}
                        </div>
                      );
                    })()
                  ) : null}
                </div>
                <div className="mt-2 text-md sm:text-2xl font-semibold text-blue-600 dark:text-white/60">
                  {revenueLoading ? <Skeleton className="h-7 w-40 dark:text-white/60" /> : formatCurrency(revenueSummary?.current.totalRevenue ?? 0)}
                </div>
                {!revenueLoading && revenueSummary?.previous ? (
                  <div className="mt-2 text-xs text-gray-500">
                    {(revenueSummary.previousLabel || '') + ':'} {formatCurrency(revenueSummary.previous.totalRevenue)}
                  </div>
                ) : null}
              </div>

              <div className="order-2 sm:order-3 rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Ulasan</div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-white/60">Sepanjang waktu</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white/60">
                      {Number(fleet.meta.rating ?? 0).toFixed(1)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{Number(fleet.meta.total_ulasan ?? 0)} ulasan</div>
                  </div>
                  <div className="shrink-0 h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <LucideIcons.Star className="h-5 w-5 text-amber-500" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/70 dark:border-[#1F2937] bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5">
                <div className="border-b border-gray-200/70 pb-4">
                  <div className="rounded-[22px] border border-[#E9EEF7] dark:border-[#1F2937] bg-white/80 p-1.5 dark:bg-[#1F2937] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
                    <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth">
                      {([
                        { key: 'info', label: 'Informasi Armada', icon: LucideIcons.FileText },
                        { key: 'units', label: 'Armada', icon: LucideIcons.LayoutGrid },
                        { key: 'pricing', label: 'Harga Sewa', icon: LucideIcons.Tag },
                        { key: 'schedule', label: 'Jadwal Armada', icon: LucideIcons.CalendarDays },
                        { key: 'review', label: 'Ulasan', icon: LucideIcons.MessageCircleMore },
                      ] as const).map((t) => {
                        const isTabActive = activeTab === t.key;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveTab(t.key)}
                            className={clsx(
                              'relative isolate inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                              'outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                              isTabActive
                                ? 'text-white shadow-sm'
                                : 'text-[#64748B] dark:text-white/60 hover:text-[#1E293B] hover:bg-[#EEF3FF] dark:hover:bg-[#1F2937] dark:hover:text-white hover:-translate-y-[1px]'
                            )}
                          >
                            {isTabActive ? (
                              <motion.span
                                layoutId="fleet-detail-active-pill"
                                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#295BFF] shadow-[0_10px_24px_-14px_rgba(79,107,255,0.75)] ring-1 ring-white/30"
                                transition={{ duration: 0.25 }}
                              />
                            ) : null}
                            <Icon className={clsx('h-4 w-4', isTabActive ? 'text-white' : 'text-[#64748B]')} />
                            <span className="whitespace-nowrap">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'info' ? (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="pt-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Spesifikasi', value: [fleet.meta.body, fleet.meta.engine].filter(Boolean).join(' - ') || '-' },
                          { label: 'Tipe', value: fleet.meta.fleet_type_label || '-' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-gray-200/60 bg-white px-4 py-3 dark:text-white">
                            <div className="text-xs text-gray-500 dark:text-white/60">{item.label}</div>
                            <div className="mt-1 font-medium text-gray-900 dark:text-white">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white/60">Deskripsi</div>
                        {fleet.meta.description ? (
                          <div
                            className="mt-3 max-h-[500px] overflow-auto scroll-smooth pr-2 text-sm text-gray-900 dark:text-white"
                            dangerouslySetInnerHTML={{ __html: fleet.meta.description || '' }}
                          />
                        ) : (
                          <div className="mt-3 text-sm text-gray-500 dark:text-white/60">-</div>
                        )}
                      </div>


                      <div className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white/60">Fasilitas</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {fleet.facilities.length > 0 ? (
                            fleet.facilities.map((f, i) => {
                              const IconComponent = f.facility_icon && 
                                (LucideIcons as any)[f.facility_icon] 
                                ? (LucideIcons as any)[f.facility_icon] 
                                : null;
                              return (
                                <span key={`${f.facility_name}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-[#0b111a] dark:text-white">
                                  {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                                  {f.facility_name}
                                </span>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-white/60">-</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white/60">Pickup Points</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {fleet.pickup.length > 0 ? (
                            fleet.pickup.map((p) => (
                              <span key={p.uuid} className="inline-flex items-center rounded-full border border-gray-200/70 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors dark:bg-[#0b111a] dark:border-gray-600 dark:text-white">
                                {p.city_name}
                              </span>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-white/60">-</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'units' ? (
                    <motion.div
                      key="units"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="pt-4 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <Input
                            value={unitSearch}
                            onChange={(e) => setUnitSearch(e.target.value)}
                            placeholder="Cari Vehicle ID / Plate / Engine..."
                            className="bg-white border-gray-200/70"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {unitsLoading ? 'Memuat...' : `${filteredUnits.length} unit`}
                        </div>
                      </div>

                      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200/70">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="px-4">Unit ID</TableHead>
                              <TableHead>Plat Nomor</TableHead>
                              <TableHead>Mesin</TableHead>
                              <TableHead className="text-center">Kapasitas</TableHead>
                              <TableHead>Kepemilikan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unitsLoading ? (
                              Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`u-s-${i}`}>
                                  {Array.from({ length: 7 }).map((__, j) => (
                                    <TableCell key={`u-s-${i}-${j}`} className={clsx(j === 0 ? 'px-4' : '', j === 6 ? 'pr-4' : '')}>
                                      <Skeleton className="h-4 w-full" />
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                            ) : filteredUnits.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-gray-500 dark:text-white/60">
                                  Tidak ada data unit
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUnits.map((u) => {
                                const own = unitOwnership(u.ownership);
                                return (
                                  <TableRow key={u.id} className="hover:bg-gray-50">
                                    <TableCell className="px-4 font-medium">
                                      {u.vehicle_id ? (
                                        <Link
                                          to={`${basePrefix}/fleet-units/detail/${encodeURIComponent(u.id)}`}
                                          className="text-blue-600 dark:text-white hover:no-underline hover:text-bold"
                                        >
                                          {u.vehicle_id}
                                        </Link>
                                      ) : (
                                        <span className="text-gray-900 dark:text-white/60">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-gray-700 dark:text-white/60">{u.plate_number || '-'}</TableCell>
                                    <TableCell className="text-gray-700 dark:text-white/60">{u.engine || '-'}</TableCell>
                                    <TableCell className="text-center text-gray-700 dark:text-white/60">{u.capacity || '-'} seat</TableCell>
                                    <TableCell>
                                      <span
                                        className={clsx(
                                          'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                                          own.tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-orange-200 bg-orange-50 text-orange-800'
                                        )}
                                      >
                                        {own.label}
                                      </span>
                                    </TableCell>
                                    
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="md:hidden space-y-3">
                        {unitsLoading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div key={`uc-s-${i}`} className="rounded-2xl border border-gray-200/70 bg-white p-4">
                              <div className="flex gap-3">
                                <Skeleton className="h-14 w-20 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-44" />
                                </div>
                                <Skeleton className="h-9 w-9 rounded-xl" />
                              </div>
                            </div>
                          ))
                        ) : filteredUnits.length === 0 ? (
                          <div className="rounded-2xl border border-gray-200/70 bg-white p-6 text-center text-sm text-gray-500">
                            Tidak ada data unit
                          </div>
                        ) : (
                          filteredUnits.map((u) => {
                            const own = unitOwnership(u.ownership);
                            const st = unitStatus(u.status);
                            return (
                              <div key={u.id} className="rounded-2xl border border-gray-200/70 bg-white p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                  <div className="h-14 w-20 rounded-xl overflow-hidden border border-gray-200/70 bg-gray-50 shrink-0">
                                    {u.thumbnail || fleet.meta.thumbnail ? (
                                      <img src={u.thumbnail || fleet.meta.thumbnail} alt={u.vehicle_id} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full grid place-items-center text-xs text-gray-500">-</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        {u.vehicle_id ? (
                                          <Link
                                            to={`${basePrefix}/fleet-units/detail/${encodeURIComponent(u.id)}`}
                                            className="font-semibold text-gray-900 truncate hover:no-underline text-bold"
                                          >
                                            {u.vehicle_id}
                                          </Link>
                                        ) : (
                                          <div className="font-semibold text-gray-900 truncate">-</div>
                                        )}
                                        <div className="mt-0.5 text-xs text-gray-500 truncate">
                                          {u.plate_number || '-'} • {u.engine || '-'}
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="icon" className="bg-white border-gray-200/70 hover:bg-white">
                                            <LucideIcons.MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => navigate(`${basePrefix}/fleet-units/detail/${encodeURIComponent(u.id)}`)}>
                                            Detail
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(u.id)}`)}>
                                            Edit
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span
                                        className={clsx(
                                          'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                                          own.tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-orange-200 bg-orange-50 text-orange-800'
                                        )}
                                      >
                                        {own.label}
                                      </span>
                                      <span className="inline-flex items-center gap-2 text-xs text-gray-700">
                                        <span className={clsx('h-2 w-2 rounded-full', st.tone === 'green' ? 'bg-emerald-500' : 'bg-blue-500')} />
                                        {st.label}
                                      </span>
                                      <span className="text-xs text-gray-500">{u.capacity ? `${u.capacity} kursi` : '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  ) : activeTab === 'pricing' ? (
                    <motion.div
                      key="pricing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="pt-4"
                    >
                      {fleet.pricing.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 text-center text-sm text-gray-500">
                          Tidak ada harga sewa
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {fleet.pricing.map((pr) => (
                            <div
                              key={pr.uuid}
                              className="rounded-xl border border-gray-200/70 bg-white p-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
                            >
                              <div className="text-sm font-semibold text-gray-900">{pr.rent_type_label}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                Durasi {pr.duration} {pr.uom}
                              </div>
                              {pr.disc_price > 0 ? (
                                <div className="mt-3">
                                  <div className="text-sm text-gray-500 line-through">{formatCurrency(pr.price)}</div>
                                  <div className="text-lg font-semibold text-blue-600">{formatCurrency(pr.disc_price)}</div>
                                </div>
                              ) : (
                                <div className="mt-3 text-lg font-semibold text-blue-600">{formatCurrency(pr.price)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'schedule' ? (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="pt-4 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">Jadwal Armada</div>
                          <div className="mt-1 text-xs text-gray-500">{scheduleRows.length} data</div>
                        </div>
                        <div className="w-full md:max-w-sm">
                          <div className="text-xs text-gray-500 mb-1">Tanggal</div>
                          <Popover
                            open={schedulePickerOpen}
                            onOpenChange={(next) => {
                              if (!next) {
                                const r = scheduleRange;
                                if (r?.from && !r?.to) {
                                  setSchedulePickerOpen(true);
                                  return;
                                }
                              }
                              setSchedulePickerOpen(next);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start font-normal h-10 bg-white border-gray-200/70 hover:bg-white">
                                <LucideIcons.Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                {scheduleRangeLabel}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="range"
                                numberOfMonths={1}
                                selected={scheduleRange}
                                onSelect={(range) => {
                                  setScheduleRange(range);
                                  if (range?.from && range?.to) {
                                    setSchedulePickerOpen(false);
                                  } else {
                                    setSchedulePickerOpen(true);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200/70 bg-white overflow-x-auto">
                        <Table className="min-w-[720px]">
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="px-4 w-14 whitespace-nowrap">No</TableHead>
                              <TableHead className="whitespace-nowrap w-56">Tanggal</TableHead>
                              <TableHead className="whitespace-nowrap w-44">Status</TableHead>
                              <TableHead className="text-center whitespace-nowrap w-32">Jumlah Unit</TableHead>
                              <TableHead className="text-right pr-4 whitespace-nowrap w-20">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scheduleLoading ? (
                              Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={`sch-s-${i}`}>
                                  <TableCell className="px-4">
                                    <Skeleton className="h-4 w-6" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-40" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-28" />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Skeleton className="h-4 w-10 mx-auto" />
                                  </TableCell>
                                  <TableCell className="text-right pr-4">
                                    <Skeleton className="h-9 w-10 ml-auto" />
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : scheduleCurrent.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                                  Tidak ada jadwal
                                </TableCell>
                              </TableRow>
                            ) : (
                              scheduleCurrent.map((row, idx) => {
                                const d = row.date ? new Date(row.date) : null;
                                const dateLabel =
                                  d && !isNaN(d.getTime()) ? format(d, 'dd MMMM yyyy', { locale: idLocale }) : row.date || '-';
                                const unitCount = row.available_units?.length ?? 0;
                                return (
                                  <TableRow key={`${row.date}-${idx}`} className="hover:bg-gray-50">
                                    <TableCell className="px-4 text-gray-700">{schedulePageStart + idx + 1}</TableCell>
                                    <TableCell className="font-medium text-gray-900 dark:text-white/80 whitespace-nowrap">{dateLabel}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      {row.available ? (
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 inline-flex items-center gap-1.5">
                                          <LucideIcons.CheckCircle2 className="h-4 w-4" />
                                          Tersedia
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 inline-flex items-center gap-1.5">
                                          <LucideIcons.XCircle className="h-4 w-4" />
                                          Tidak Tersedia
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-700 dark:text-white/80 whitespace-nowrap">{unitCount} unit</TableCell>
                                    <TableCell className="text-right pr-4">
                                      {unitCount > 0 ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="bg-white border-gray-200/70 hover:bg-white"
                                          onClick={() => {
                                            setScheduleUnitsDate(dateLabel);
                                            setScheduleUnits(row.available_units);
                                            setScheduleUnitsOpen(true);
                                          }}
                                        >
                                          <LucideIcons.Eye className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="text-sm text-gray-500">
                          Menampilkan {scheduleRows.length === 0 ? 0 : schedulePageStart + 1}-{Math.min(schedulePageEnd, scheduleRows.length)} dari {scheduleRows.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                            disabled={schedulePageSafe <= 1}
                            className="bg-white border-gray-200/70 hover:bg-white"
                          >
                            Prev
                          </Button>
                          <div className="text-sm text-gray-500">
                            {schedulePageSafe} / {scheduleTotalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSchedulePage((p) => Math.min(scheduleTotalPages, p + 1))}
                            disabled={schedulePageSafe >= scheduleTotalPages}
                            className="bg-white border-gray-200/70 hover:bg-white"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="pt-4 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <LucideIcons.MessageCircleMore className="h-4 w-4 text-violet-600" />
                          Ulasan
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">{fleet.reviews.length} ulasan</div>
                          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                            <LucideIcons.Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                            {Number(fleet.meta.rating ?? 0).toFixed(1)}
                          </div>
                        </div>
                      </div>

                      {fleet.reviews.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 text-center text-sm text-gray-500">
                          Belum ada ulasan
                        </div>
                      ) : (
                        <div className="max-h-[800px] overflow-auto scroll-smooth space-y-3 pr-1">
                          {fleet.reviews.map((r, idx) => (
                            <div key={`${r.order_id || 'review'}-${idx}`} className="rounded-2xl border border-gray-200/70 bg-white p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{r.customer_name || '-'}</div>
                                  <div className="mt-0.5 text-xs text-gray-500">
                                    {r.created_at ? formatDate(r.created_at) : '-'}
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const filled = i < Math.round(r.star || 0);
                                    return (
                                      <LucideIcons.Star
                                        key={i}
                                        className={clsx('h-4 w-4', filled ? 'text-amber-500' : 'text-gray-300')}
                                        fill={filled ? 'currentColor' : 'none'}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {r.review ? <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{r.review}</div> : null}

                              {r.order_id ? (
                                <div className="mt-3 text-xs text-gray-500">
                                  Order ID:{' '}
                                  <Link
                                    to={`${basePrefix}/orders/fleet/detail/${encodeURIComponent(r.order_id)}`}
                                    className="text-blue-600 hover:no-underline hover:text-bold"
                                  >
                                    {r.order_id}
                                  </Link>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
                  <div className="text-xs text-gray-500">Dibuat Oleh</div>
                  <div className="mt-1 font-medium text-xs sm:text-sm text-gray-900 truncate dark:text-white/60">{fleet.meta.created_by || '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:contents">
                  <div className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
                    <div className="text-xs text-gray-500">Tanggal Dibuat</div>
                    <div className="text-xs sm:text-sm mt-1 font-medium text-gray-900 truncate dark:text-white/60">{formatDate(fleet.meta.created_at)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
                    <div className="text-xs text-gray-500">Tanggal Diperbarui</div>
                    <div className="text-xs sm:text-sm mt-1 font-medium text-gray-900 truncate dark:text-white/60">{formatDate(fleet.meta.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="text-sm font-semibold text-gray-900">Galeri</div>
              <div className='border-gray-300 mb-5 border mt-2'></div>
              <div className="mt-4 space-y-4">
                <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200/70 bg-gray-50">
                  {fleet.meta.thumbnail ? (
                    <img src={fleet.meta.thumbnail} alt={fleet.meta.fleet_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-sm text-gray-500">Tidak ada foto</div>
                  )}
                </div>

                {fleet.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {fleet.images.slice(0, 4).map((img, idx) => (
                      <button
                        key={img.uuid}
                        type="button"
                        className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200/70 bg-gray-50 hover:shadow-sm transition-shadow"
                        onClick={() => {
                          const popupIndex = galleryPopupImages.indexOf(img.path_file);
                          setSelectedImageIndex(popupIndex >= 0 ? popupIndex : 0);
                          setIsPopupOpen(true);
                        }}
                      >
                        <img src={img.path_file} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Tidak ada gambar</div>
                )}

                <Button
                  variant="outline"
                  className="w-full bg-white border-gray-200/70 hover:border-gray-500"
                  onClick={() => {
                    setSelectedImageIndex(0);
                    setIsPopupOpen(true);
                  }}
                  disabled={galleryPopupImages.length === 0}
                >
                  Lihat semua galeri
                </Button>
              </div>
            </div>
          </div>
        </div>

      <Dialog open={scheduleUnitsOpen} onOpenChange={setScheduleUnitsOpen}>
        <DialogContent className="max-w-lg">
          <AnimatePresence mode="wait">
            {scheduleUnitsOpen ? (
              <motion.div
                key="schedule-units-modal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle>Armada Yang Tersedia</DialogTitle>
                  <DialogDescription>{scheduleUnitsDate}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="px-4 w-14">No</TableHead>
                        <TableHead>Vehicle ID</TableHead>
                        <TableHead>Plate Number</TableHead>
                        <TableHead className="text-center">Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduleUnits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-gray-500">
                            Tidak ada unit tersedia
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduleUnits.map((u, idx) => (
                          <TableRow key={`${u.vehicle_id}-${idx}`} className="hover:bg-gray-50">
                            <TableCell className="px-4 text-gray-700">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-gray-900">{u.vehicle_id || '-'}</TableCell>
                            <TableCell className="text-gray-700">{u.plate_number || '-'}</TableCell>
                            <TableCell className="text-center text-gray-700">{u.capacity ?? 0}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

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
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl shadow-2xl border-0 max-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white flex flex-col max-h-[80vh]"
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/18 via-fuchsia-500/10 to-indigo-600/18" />
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-500/15 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-fuchsia-500/10 blur-2xl" />

                <div className="relative px-5 pt-5 pb-4">
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/25">
                        <LucideIcons.Sparkles className="h-5 w-5 text-white" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate">Generate Iklan Armada</span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-violet-700 backdrop-blur">
                            AI
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-normal text-gray-600">
                          Desain iklan instan dengan style modern—tinggal pilih format dan teks.
                        </div>
                      </div>
                    </DialogTitle>
                    <DialogDescription className="sr-only">Buat gambar iklan dari thumbnail armada.</DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 pb-5 grid gap-5">
                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-gray-700">Ratio</div>
                  <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                    {[
                      { label: '1:1', value: '1080x1080' },
                      { label: '4:5', value: '1080x1350' },
                      { label: '3:4', value: '1080x1440' },
                      { label: '16:9', value: '1920x1080' },
                      { label: '9:16', value: '1080x1920' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setResolution(r.value)}
                        className={clsx(
                          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors',
                          resolution === r.value
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <RatioIcon ratio={r.value} className="h-3 w-3" />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-gray-700">Preview</div>
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                      Preview AI
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white">
                    <div className="aspect-square w-full p-3 flex items-center justify-center border-2">
                      <div
                        className={clsx(
                          'w-full max-w-full max-h-full',
                          resolution === '1080x1080' ? 'aspect-square' : '',
                          resolution === '1080x1350' ? 'aspect-[4/5]' : '',
                          resolution === '1080x1440' ? 'aspect-[3/4]' : '',
                          resolution === '1920x1080' ? 'aspect-[16/9]' : '',
                          resolution === '1080x1920' ? 'aspect-[9/16]' : ''
                        )}
                      >
                        {generatedImage || fleet.meta.thumbnail ? (
                          <div className="h-full w-full overflow-hidden rounded-xl bg-gray-50">
                            <img
                              src={generatedImage || fleet.meta.thumbnail}
                              alt="preview"
                              className="h-full w-full rounded-xl object-contain transition-transform duration-300 hover:scale-[1.02]"
                            />
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Tidak ada gambar</div>
                        )}
                      </div>
                    </div>

                    {isGenerating ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <div className="grid place-items-center gap-2">
                          <LucideIcons.Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-gray-700">Mode Teks</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'manual' as const, title: 'Tulis Sendiri', desc: 'Masukkan copy iklan sesuai kebutuhan.' },
                      { key: 'availability' as const, title: 'Berdasarkan Ketersediaan', desc: 'AI menyesuaikan dengan status ketersediaan.' },
                    ].map((opt) => {
                      const active = textMode === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setTextMode(opt.key)}
                          className={clsx(
                            'rounded-2xl border px-4 py-3 text-left transition-all',
                            active ? 'border-violet-300 bg-violet-50/60' : 'border-gray-200/70 bg-white hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={clsx('text-sm font-semibold', active ? 'text-violet-700' : 'text-gray-900')}>{opt.title}</div>
                              <div className="mt-1 text-xs text-gray-600">{opt.desc}</div>
                            </div>
                            <span
                              className={clsx(
                                'inline-flex h-6 w-6 items-center justify-center rounded-full border',
                                active ? 'border-violet-300 bg-white text-violet-700' : 'border-gray-200 text-gray-400'
                              )}
                            >
                              <LucideIcons.Check className={clsx('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-0')} />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {textMode === 'manual' ? (
                  <div className="grid gap-2">
                    <div className="text-xs font-semibold text-gray-700">Teks Iklan</div>
                    <div className="relative">
                      <Textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Contoh: Sewa Jetbus nyaman untuk wisata, harga spesial minggu ini..."
                        className="min-h-28 rounded-2xl border-gray-200/70 bg-white focus-visible:ring-violet-500"
                      />
                      <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-gray-500">
                        {customText.length} karakter
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Tips AI: gunakan 1 headline singkat + 1 benefit utama + CTA (contoh: “Chat untuk booking”).
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-violet-200/60 bg-violet-50/40 px-4 py-3 text-sm text-violet-800">
                    AI akan merangkai copy berdasarkan ketersediaan armada dan format iklan yang dipilih.
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-4 border-t border-gray-200/70 bg-white/90 backdrop-blur">
                <div className="grid gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={clsx(
                      'w-full h-11 rounded-2xl text-white',
                      'bg-gradient-to-r from-violet-600 to-fuchsia-600',
                      'shadow-lg shadow-violet-600/25',
                      'hover:shadow-xl hover:shadow-violet-600/30 hover:scale-[1.01] transition-all'
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <LucideIcons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <LucideIcons.Sparkles className="h-4 w-4 mr-2" />
                        Generate Gambar
                      </>
                    )}
                  </Button>

                  {generatedImage ? (
                    <a href={generatedImage} download="iklan-armada.png" className="w-full">
                      <Button variant="outline" className="w-full bg-white border-violet-200 text-violet-700 hover:bg-white" type="button">
                        <LucideIcons.Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        <ImagePopup
          images={galleryPopupImages}
          currentIndex={selectedImageIndex}
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onImageChange={(i) => setSelectedImageIndex(i)}
          itemType="fleet"
          itemId={fleet.meta.fleet_id}
        />
      </div>
    </div>
  );
};
