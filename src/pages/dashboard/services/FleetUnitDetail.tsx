import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MapPin,
  MessageCircleMore,
  Receipt,
  Route,
  Star,
  TrendingDown,
  TrendingUp,
  XCircle,
  Wallet,
} from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { CardHeaderWithBadge } from '@/components/ui/card';

type OrderHistoryRow = {
  order_id: string;
  start_date: string;
  end_date: string;
  pickup_city_label: string;
  destination_city_label: string;
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
  ownership_type?: number;
  partner_id?: string;
  partner_name?: string;
  partner_phone?: string;
  owner_contact?: string;
  owner_email?: string;
};

type UnitReview = {
  customer_name: string;
  star: number;
  created_at?: string;
  review: string;
};

type AvailabilityRow = {
  date: string;
  unit_id?: string;
  vehicle_id?: string;
  order_id?: string;
  destination?: string;
  available: boolean;
};

type RevenueSummary = {
  current: { totalBooking: number; totalRevenue: number };
  previous?: { totalBooking: number; totalRevenue: number };
  currentLabel: string;
  previousLabel?: string;
};

type PeriodPreset = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'last_12_months';

type ExpenseRow = {
  transaction_category_label: string;
  transaction_item_label: string;
  transaction_date: string;
  amount: number;
};

type RevenueHistoryRow = {
  transaction_date: string;
  order_id: string;
  payment_type_label: string;
  payment_method_label: string;
  amount: number;
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

const getNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatRupiahFromNumber = (amount: number): string => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formatNumberId = (value: number): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('id-ID');
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

const formatLongDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMMM yyyy', { locale: idLocale });
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
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const params = useParams();
  const unitIdParam = params.unit_id ?? params.id ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UnitDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'orders' | 'reviews'>('overview');

  const [showAdModal, setShowAdModal] = useState(false);
  const [resolution, setResolution] = useState('1080x1080');
  const [textMode, setTextMode] = useState<'manual' | 'availability'>('manual');
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [orderRange, setOrderRange] = useState<DateRange | undefined>(undefined);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderRows, setOrderRows] = useState<OrderHistoryRow[]>([]);
  const [latestScheduleEndDate, setLatestScheduleEndDate] = useState<string>('');
  const [upcomingScheduleStartDate, setUpcomingScheduleStartDate] = useState<string>('');
  const [reviews, setReviews] = useState<UnitReview[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const orderItemsPerPage = 10;

  const [availabilityRange, setAvailabilityRange] = useState<DateRange | undefined>(() => {
    const from = startOfDay(new Date());
    const to = new Date(from);
    to.setDate(from.getDate() + 20);
    return { from, to };
  });
  const [availabilityPickerOpen, setAvailabilityPickerOpen] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityRow[]>([]);
  const [availabilityPage, setAvailabilityPage] = useState(1);
  const availabilityItemsPerPage = 5;

  const [revenuePeriod, setRevenuePeriod] = useState<PeriodPreset>('this_month');
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [revenueHistoryRows, setRevenueHistoryRows] = useState<RevenueHistoryRow[]>([]);

  const [expensePeriod, setExpensePeriod] = useState<PeriodPreset>('this_month');
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number | null>(null);
  const [expensePeriodLabel, setExpensePeriodLabel] = useState<string>('');
  const [revenuePage, setRevenuePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const itemsPerPage = 10;

  const periodOptions = useMemo(
    () => [
      { value: 'this_month', label: 'Bulan Ini' },
      { value: 'last_month', label: 'Bulan Lalu' },
      { value: 'this_year', label: 'Tahun Ini' },
      { value: 'last_year', label: 'Tahun Lalu' },
      { value: 'last_12_months', label: '1 tahun terakhir' },
    ],
    []
  );

  const getPeriodMeta = (preset: PeriodPreset, now: Date) => {
    if (preset === 'this_month') {
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        period: `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`,
        prevPeriod: `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`,
        currentLabel: format(currentMonthDate, 'MMMM yyyy', { locale: idLocale }),
        previousLabel: format(prevMonthDate, 'MMMM yyyy', { locale: idLocale }),
      };
    }

    if (preset === 'last_month') {
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        period: `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`,
        prevPeriod: `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`,
        currentLabel: format(currentMonthDate, 'MMMM yyyy', { locale: idLocale }),
        previousLabel: format(prevMonthDate, 'MMMM yyyy', { locale: idLocale }),
      };
    }

    if (preset === 'this_year') {
      const y = now.getFullYear();
      return {
        period: String(y),
        prevPeriod: String(y - 1),
        currentLabel: `Tahun ${y}`,
        previousLabel: `Tahun ${y - 1}`,
      };
    }

    if (preset === 'last_year') {
      const y = now.getFullYear() - 1;
      return {
        period: String(y),
        prevPeriod: String(y - 1),
        currentLabel: `Tahun ${y}`,
        previousLabel: `Tahun ${y - 1}`,
      };
    }

    return {
      period: 'last_12_months',
      prevPeriod: undefined,
      currentLabel: '1 tahun terakhir',
      previousLabel: '1 tahun sebelumnya',
    };
  };

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
        const ownershipTypeRaw = obj.ownership_type ?? obj.ownershipType ?? obj.owner_type ?? obj.ownerType;
        const ownership_type = getNumber(ownershipTypeRaw);
        const owner_contact = getString(obj.owner_contact ?? obj.ownerContact ?? obj.phone ?? obj.contact ?? obj.pic_phone ?? obj.picPhone);
        const owner_email = getString(obj.owner_email ?? obj.ownerEmail ?? obj.email ?? obj.pic_email ?? obj.picEmail);

        const ownershipInfo = record(obj.ownership_information ?? obj.ownershipInformation);
        const partner_id = getString(ownershipInfo.partner_id ?? ownershipInfo.partnerId ?? ownershipInfo.id).trim();
        const partner_name = getString(ownershipInfo.partner_name ?? ownershipInfo.partnerName ?? ownershipInfo.name).trim();
        const partner_phone = getString(ownershipInfo.partner_phone ?? ownershipInfo.partnerPhone ?? ownershipInfo.phone).trim();

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
          ownership_type: Number.isFinite(ownership_type) ? ownership_type : undefined,
          partner_id: partner_id || undefined,
          partner_name: partner_name || undefined,
          partner_phone: partner_phone || undefined,
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
    const loadRevenue = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setRevenueLoading(true);
      setRevenuePage(1); // Reset page on period change
      try {
        const now = new Date();
        const meta = getPeriodMeta(revenuePeriod, now);
        const period = meta.period;
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.post<unknown>('/services/fleet-units/revenue', { unit_id: unitId, period }, headers);
        if (res.status !== 'success') {
          setRevenueSummary(null);
          setRevenueHistoryRows([]);
          return;
        }
        const payload = res.data as unknown;
        const root = record(payload);
        const dataNode = root.data ?? payload;
        const dataObj = record(dataNode);
        const summaryArr: unknown[] =
          (Array.isArray(dataObj.summary) ? (dataObj.summary as unknown[]) : undefined) ??
          (Array.isArray(dataObj.data) ? (dataObj.data as unknown[]) : undefined) ??
          (Array.isArray(dataObj.items) ? (dataObj.items as unknown[]) : undefined) ??
          (Array.isArray(payload) ? (payload as unknown[]) : undefined) ??
          [];
        const list = summaryArr.map((x) => record(x));
        const first = list.length > 0 ? record(list[0]) : {};
        const second = list.length > 1 ? record(list[1]) : null;

        const current = {
          totalBooking: getNumber(first.total_booking ?? first.totalBooking ?? first.booking ?? first.bookings),
          totalRevenue: getNumber(first.total_revenue ?? first.totalRevenue ?? first.revenue),
        };

        const previous: RevenueSummary['previous'] =
          second
            ? {
                totalBooking: getNumber(second.total_booking ?? second.totalBooking ?? second.booking ?? second.bookings),
                totalRevenue: getNumber(second.total_revenue ?? second.totalRevenue ?? second.revenue),
              }
            : undefined;

        const historyArr: unknown[] =
          (Array.isArray(dataObj.history) ? (dataObj.history as unknown[]) : undefined) ??
          (Array.isArray(root.history) ? (root.history as unknown[]) : undefined) ??
          [];
        const mappedHistory = historyArr
          .map((x) => record(x))
          .map((x) => {
            const transaction_date = getString(x.transaction_date ?? x.transactionDate ?? x.date).trim();
            const order_id = getString(x.order_id ?? x.orderId ?? x.order).trim();
            const payment_type_label = getString(x.payment_type_label ?? x.paymentTypeLabel ?? x.payment_method_label ?? x.paymentMethodLabel).trim();
            const payment_method_label = getString(x.payment_method_label ?? x.paymentMethodLabel).trim();
            const amount = getNumber(x.amount ?? x.payment_amount ?? x.paymentAmount ?? x.total);
            if (!transaction_date && !order_id && !payment_type_label && !amount) return null;
            return { transaction_date, order_id, payment_type_label, payment_method_label, amount } satisfies RevenueHistoryRow;
          })
          .filter((v): v is RevenueHistoryRow => Boolean(v));

        setRevenueSummary({
          current,
          previous,
          currentLabel: getString(first.period).trim() || meta.currentLabel,
          previousLabel: previous ? getString(second?.period).trim() || meta.previousLabel : undefined,
        });
        setRevenueHistoryRows(mappedHistory);
      } finally {
        setRevenueLoading(false);
      }
    };
    loadRevenue();
  }, [revenuePeriod, unitIdParam]);

  useEffect(() => {
    const loadHistory = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setOrderLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const payload = { unit_id: unitId, start_date: '2026-01-01', end_date: new Date().toISOString().split('T')[0] };
        const res = await api.post<unknown>('/fleet-units/order/history', payload, token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const root = record(payload);
          const dataNode = root.data ?? root;
          const dataObj = record(dataNode);
          const deepDataObj = record(dataObj.data);

          const total_schedule = getNumber(
            dataObj.total_schedule ?? deepDataObj.total_schedule ?? dataObj.totalSchedule ?? deepDataObj.totalSchedule ?? dataObj.total ?? deepDataObj.total
          );
          console.log(total_schedule);
          console.log(dataObj.history);
          const latestObj = record(dataObj.latest_schedule ?? deepDataObj.latest_schedule ?? dataObj.latestSchedule ?? deepDataObj.latestSchedule);
          const upcomingObj = record(dataObj.upcoming_schedule ?? deepDataObj.upcoming_schedule ?? dataObj.upcomingSchedule ?? deepDataObj.upcomingSchedule);
          const latestEndDate = getString(latestObj.end_date ?? latestObj.endDate ?? latestObj.trip_end ?? latestObj.tripEnd).trim();
          const upcomingStartDate = getString(upcomingObj.start_date ?? upcomingObj.startDate ?? upcomingObj.trip_start ?? upcomingObj.tripStart).trim();

          const reviewsNode = (Array.isArray(dataObj.reviews) ? dataObj.reviews : undefined) ?? (Array.isArray(deepDataObj.reviews) ? deepDataObj.reviews : undefined) ?? [];
          const mappedReviews = (reviewsNode as unknown[])
            .map((raw) => {
              const obj = record(raw);
              const customer_name = getString(obj.customer_name ?? obj.customerName ?? obj.name).trim();
              const star = getNumber(obj.star ?? obj.rating ?? obj.stars);
              const created_at = getString(obj.created_at ?? obj.createdAt).trim();
              const review = getString(obj.review ?? obj.comment ?? obj.text).trim();
              if (!customer_name && !review && !created_at) return null;
              return { customer_name: customer_name || '-', star, created_at: created_at || undefined, review };
            })
            .filter((v): v is NonNullable<typeof v> => Boolean(v));

          setLatestScheduleEndDate(latestEndDate);
          setUpcomingScheduleStartDate(upcomingStartDate);
          setReviews(mappedReviews);

          const itemsNode =
            (Array.isArray(dataObj.history) ? dataObj.history : undefined) ??
            (Array.isArray(deepDataObj.history) ? deepDataObj.history : undefined) ??
            [];

          const mapped = (itemsNode as unknown[]).map((raw) => {
            const obj = record(raw);
            const order_id = getString(obj.order_id ?? obj.orderId ?? obj.id ?? obj.transaction_id ?? obj.transactionId).trim();
            const trip_start = getString(
              obj.start_date ?? obj.startDate ?? obj.trip_start ?? obj.tripStart ?? obj.trip_date ?? obj.tripDate ?? obj.date
            ).trim();
            const trip_end = getString(obj.end_date ?? obj.endDate ?? obj.trip_end ?? obj.tripEnd ?? obj.end).trim();

            const pickupCityLabel = getString(obj.pickup_city_label ?? obj.pickupCityLabel ?? obj.pickup_city_name ?? obj.pickupCityName).trim();
            const pickup_point = pickupCityLabel || '-';

            const destinationsRaw = obj.destination_city;
            const destination =
              typeof destinationsRaw === 'string' || typeof destinationsRaw === 'number'
                ? getString(destinationsRaw).trim()
                : Array.isArray(destinationsRaw)
                  ? (destinationsRaw as unknown[])
                      .map((x) => {
                        if (typeof x === 'string') return x.trim();
                        if (typeof x === 'number') return String(x).trim();
                        if (x && typeof x === 'object') return toPickupLabel(x).title.trim();
                        return '';
                      })
                      .filter((x) => x)
                      .join(', ')
                  : '';
            return { order_id, start_date: trip_start, end_date: trip_end, pickup_city_label: pickup_point, destination_city_label: destination || '-' } satisfies OrderHistoryRow;
          });

          setOrderRows(mapped);
          setOrderPage(1);
        } else {
          setOrderRows([]);
          setLatestScheduleEndDate('');
          setUpcomingScheduleStartDate('');
          setReviews([]);
        }
      } finally {
        setOrderLoading(false);
      }
    };

    loadHistory();
  }, [unitIdParam]);

  useEffect(() => {
    const loadAvailability = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      const r = normalizeRange(availabilityRange);
      if (!r.start || !r.end) return;
      setAvailabilityLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const payload = { unit_id: unitId, start_date: toYmd(r.start), end_date: toYmd(r.end) };
        const res = await api.post<unknown>('/services/schedule/daily-availibility/fleet-unit', payload, headers);
        if (res.status === 'success') {
          const arr = res.data;
          console.log({arr})
          const mapped = (arr as unknown[])
            .map((raw: unknown) => {
              const obj = record(raw);
              const date = getString(obj.date ?? obj.schedule_date ?? obj.day ?? obj.start_date).trim();
              const unit_id = getString(obj.unit_id ?? obj.unitId).trim();
              const vehicle_id = getString(obj.vehicle_id ?? obj.vehicleId).trim();
              const availableRaw = obj.available ?? obj.is_available ?? obj.status;
              const available =
                typeof availableRaw === 'boolean'
                  ? availableRaw
                  : availableRaw === 1 || availableRaw === '1'
                    ? true
                    : availableRaw === 0 || availableRaw === '0'
                      ? false
                      : Boolean(availableRaw);
              if (!date) return null;
              return { date, unit_id: unit_id || undefined, vehicle_id: vehicle_id || undefined, available, order_id: typeof obj.order_id === 'string' ? obj.order_id : undefined, destination: typeof obj.destination === 'string' ? obj.destination : undefined } satisfies AvailabilityRow;
            })
            .filter((v): v is NonNullable<typeof v> => Boolean(v));
            console.log("mapped here ", {mapped})
          setAvailabilityRows(mapped);
        } else {
          setAvailabilityRows([]);
        }
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, [availabilityRange, unitIdParam]);

  useEffect(() => {
    const loadExpenses = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setExpenseLoading(true);
      setExpensePage(1); // Reset page on period change
      try {
        const now = new Date();
        const meta = getPeriodMeta(expensePeriod, now);
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.post<unknown>('/services/fleet-units/expenses', { unit_id: unitId, period: meta.period }, headers);
        if (res.status !== 'success') {
          setExpenseRows([]);
          return;
        }

        const payload = res.data as unknown;
        const root = record(payload);
        const dataNode = root.data ?? payload;
        const dataObj = record(dataNode);
        const arr: unknown[] =
          (Array.isArray(dataNode) ? (dataNode as unknown[]) : undefined) ??
          (Array.isArray(root.data) ? (root.data as unknown[]) : undefined) ??
          (Array.isArray(dataObj.data) ? (dataObj.data as unknown[]) : undefined) ??
          (Array.isArray(root.items) ? (root.items as unknown[]) : undefined) ??
          [];

        const totalExpensesRaw = getNumber(dataObj.total_expenses ?? dataObj.totalExpenses ?? dataObj.total);
        setTotalExpenses(totalExpensesRaw);
        setExpensePeriodLabel(getString(dataObj.period ?? meta.currentLabel).trim());

        const mapped = arr
          .map((raw) => {
            const obj = record(raw);
            const transaction_category_label = getString(
              obj.transaction_category_label ?? obj.transactionCategoryLabel ?? obj.category_label ?? obj.categoryLabel ?? obj.category
            ).trim();
            const transaction_item_label = getString(
              obj.transaction_item_label ?? obj.transactionItemLabel ?? obj.item_label ?? obj.itemLabel ?? obj.item
            ).trim();
            const transaction_date = getString(obj.transaction_date ?? obj.transactionDate ?? obj.date ?? obj.created_at ?? obj.createdAt).trim();
            const amount = getNumber(obj.amount ?? obj.nominal ?? obj.total_amount ?? obj.totalAmount ?? obj.total);
            if (!transaction_category_label && !transaction_item_label && !transaction_date && !amount) return null;
            return { transaction_category_label, transaction_item_label, transaction_date, amount } satisfies ExpenseRow;
          })
          .filter((v): v is ExpenseRow => Boolean(v));

        setExpenseRows(mapped);
      } finally {
        setExpenseLoading(false);
      }
    };

    loadExpenses();
  }, [expensePeriod, unitIdParam]);

  const filteredOrderRows = useMemo(() => {
    const range = normalizeRange(orderRange);
    if (!range.start || !range.end) return orderRows;
    const start = range.start.getTime();
    const end = range.end.getTime();
    return orderRows.filter((r) => {
      const ds = r.start_date ? new Date(r.start_date) : null;
      if (!ds || isNaN(ds.getTime())) return false;
      const t = ds.getTime();
      return t >= start && t <= end;
    });
  }, [orderRange, orderRows]);

  const orderTotalPages = Math.max(1, Math.ceil(filteredOrderRows.length / orderItemsPerPage));
  const orderPageSafe = Math.min(orderPage, orderTotalPages);
  const orderPageStart = (orderPageSafe - 1) * orderItemsPerPage;
  const orderPageEnd = orderPageStart + orderItemsPerPage;
  const orderCurrent = filteredOrderRows.slice(orderPageStart, orderPageEnd);

  const orderRangeLabel =
    orderRange?.from && orderRange?.to
      ? `${formatDdMmmYyFromDate(orderRange.from)} - ${formatDdMmmYyFromDate(orderRange.to)}`
      : orderRange?.from
        ? `${formatDdMmmYyFromDate(orderRange.from)} - ...`
        : 'Semua Periode';

  const availabilityRangeLabel =
    availabilityRange?.from && availabilityRange?.to
      ? `${formatDdMmmYyFromDate(availabilityRange.from)} - ${formatDdMmmYyFromDate(availabilityRange.to)}`
      : availabilityRange?.from
        ? `${formatDdMmmYyFromDate(availabilityRange.from)} - ...`
        : 'Pilih rentang tanggal';

  const availabilityTotalPages = Math.max(1, Math.ceil(availabilityRows.length / availabilityItemsPerPage));
  const availabilityPageSafe = Math.min(availabilityPage, availabilityTotalPages);
  const availabilityPageStart = (availabilityPageSafe - 1) * availabilityItemsPerPage;
  const availabilityPageEnd = availabilityPageStart + availabilityItemsPerPage;
  const availabilityCurrent = availabilityRows.slice(availabilityPageStart, availabilityPageEnd);
  console.log({availabilityCurrent});

  // Revenue pagination
  const revenueTotalPages = Math.max(1, Math.ceil(revenueHistoryRows.length / itemsPerPage));
  const revenuePageSafe = Math.min(revenuePage, revenueTotalPages);
  const revenuePageStart = (revenuePageSafe - 1) * itemsPerPage;
  const revenuePageEnd = revenuePageStart + itemsPerPage;
  const revenueCurrent = revenueHistoryRows.slice(revenuePageStart, revenuePageEnd);

  // Expense pagination
  const expenseTotalPages = Math.max(1, Math.ceil(expenseRows.length / itemsPerPage));
  const expensePageSafe = Math.min(expensePage, expenseTotalPages);
  const expensePageStart = (expensePageSafe - 1) * itemsPerPage;
  const expensePageEnd = expensePageStart + itemsPerPage;
  const expenseCurrent = expenseRows.slice(expensePageStart, expensePageEnd);

  const unitCode = detail?.vehicle_id || unitIdParam || 'BB001';
  const metrics = [
    {
      key: 'totalExpenses',
      label: 'Total Pengeluaran',
      value: expenseLoading ? 'Memuat...' : totalExpenses !== null ? formatRupiahFromNumber(totalExpenses) : '-',
      icon: Receipt,
      periodLabel: expensePeriodLabel,
    },
    {
      key: 'nextTrip',
      label: 'Perjalanan Selanjutnya',
      value: upcomingScheduleStartDate ? formatTripDate(upcomingScheduleStartDate) : '-',
      icon: CalendarDays,
      periodLabel: latestScheduleEndDate ? formatTripDate(latestScheduleEndDate) : '-',
    },
  ] as const;

  const bookingTrend = useMemo(() => {
    const current = revenueSummary?.current.totalBooking ?? 0;
    const previous = revenueSummary?.previous?.totalBooking;
    if (previous === undefined) return null;
    const delta = current - previous;
    const percent = previous > 0 ? (delta / previous) * 100 : current > 0 ? 100 : 0;
    return { delta, percent, up: delta >= 0, current, previous };
  }, [revenueSummary]);

  const revenueTrend = useMemo(() => {
    const current = revenueSummary?.current.totalRevenue ?? 0;
    const previous = revenueSummary?.previous?.totalRevenue;
    if (previous === undefined) return null;
    const delta = current - previous;
    const percent = previous > 0 ? (delta / previous) * 100 : current > 0 ? 100 : 0;
    return { delta, percent, up: delta >= 0, current, previous };
  }, [revenueSummary]);

  const handleReservasiYmd = (dateYmd: string, unitIdOverride?: string) => {
    const q = new URLSearchParams();
    q.set('unit_id', unitIdOverride || detail?.unit_id || unitIdParam);
    q.set('date', dateYmd);
    navigate(`${basePrefix}/orders/fleet/form?${q.toString()}`);
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
    <div className="">
      <div className="space-y-5 p-2 sm:p-6">
        <div className="sm:hidden space-y-3">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
              onClick={() => navigate(`${basePrefix}/fleet-units`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {detail ? (
              <Button
                variant="outline"
                className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(detail.unit_id)}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Informasi
              </Button>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">Detail Unit Armada</h1>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Aktif
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <span className="text-gray-500">Unit Armada</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-gray-500">Detail Unit Armada</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="font-medium text-gray-700">{unitCode}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-start justify-between gap-4">
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
                <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-gray-900">Detail Unit Armada</h1>
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

          {detail ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-blue-500 rounded-2xl text-white border-blue-500 hover:bg-blue-600"
                onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(detail.unit_id)}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Informasi
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            {loading ? (
              <div className="animate-pulse w-full aspect-[16/10] rounded-xl bg-gray-100" />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200/70 bg-gray-50">
                {detail?.thumbnail ? (
                  <img src={detail.thumbnail} alt={detail.vehicle_id || 'thumbnail'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Tidak ada foto</div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4 sm:p-5">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`main-s-${i}`} className="space-y-2">
                      <div className="h-3 rounded bg-gray-100 w-28" />
                      <div className="h-9 rounded bg-gray-100 w-full" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`stat-s-${i}`} className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="h-3 rounded bg-gray-100 w-24" />
                          <div className="h-5 rounded bg-gray-100 w-20" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !detail ? (
              <div className="py-10 text-center text-sm text-gray-500">Data unit tidak ditemukan</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:bg-[#080b11] dark:border-black dark:border-white/10 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-white dark:bg-[#1c2633]" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-600">Total Pesanan</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-white/60 dark:truncate truncate-title">{revenueSummary?.currentLabel ?? 'Periode saat ini'}</div>
                          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white dark:truncate truncate-title">
                            {revenueLoading ? (
                              <span className="inline-flex items-center text-sm text-gray-500 dark:text-white">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memuat...
                              </span>
                            ) : (
                              formatNumberId(revenueSummary?.current.totalBooking ?? 0)
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 h-10 w-10 rounded-full bg-blue-100/70 dark:bg-black flex items-center justify-center">
                          <Route className="h-5 w-5 text-blue-700 dark:text-[#D1D5DB]" />
                        </div>
                      </div>

                      {bookingTrend ? (
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-gray-500 min-w-0">
                            <span className="truncate">vs {revenueSummary?.previousLabel ?? 'Periode sebelumnya'}</span>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <span className="font-medium text-gray-700">{formatNumberId(bookingTrend.previous)}</span>
                          </div>
                          <div
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                              bookingTrend.up ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                            ].join(' ')}
                          >
                            {bookingTrend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {`${bookingTrend.up ? '+' : ''}${bookingTrend.percent.toFixed(1)}%`}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-gray-400">Data periode sebelumnya tidak tersedia</div>
                      )}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:bg-[#080b11] dark:border-black dark:border-white/10 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-white dark:bg-[#1c2633]" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-600">Total Pendapatan</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-white/60 dark:truncate truncate-title">{revenueSummary?.currentLabel ?? 'Periode saat ini'}</div>
                          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white dark:truncate truncate-title">
                            {revenueLoading ? (
                              <span className="inline-flex items-center text-sm text-gray-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memuat...
                              </span>
                            ) : (
                              formatRupiahFromNumber(revenueSummary?.current.totalRevenue ?? 0)
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 h-10 w-10 rounded-full bg-emerald-100/70 dark:bg-black flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-emerald-700 dark:text-[#D1D5DB]" />
                        </div>
                      </div>

                      {revenueTrend ? (
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-gray-500 min-w-0">
                            <span className="truncate">vs {revenueSummary?.previousLabel ?? 'Periode sebelumnya'}</span>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <span className="font-medium text-gray-700">{formatRupiahFromNumber(revenueTrend.previous)}</span>
                          </div>
                          <div
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                              revenueTrend.up ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                            ].join(' ')}
                          >
                            {revenueTrend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {`${revenueTrend.up ? '+' : ''}${revenueTrend.percent.toFixed(1)}%`}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-gray-400">Data periode sebelumnya tidak tersedia</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:grid grid-cols-2 gap-4">
                  {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.key} className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs text-gray-500">{m.label}</div>
                            <div className={`text-lg ${m.key == 'nextTrip' ? 'text-blue-600 font-semibold' : 'text-blue-800 font-bold'} dark:text-white truncate`}>{m.value}</div>
                            {m.periodLabel ? (
                              <div className="text-xs text-gray-500">{m.key == 'nextTrip' ? 'Sebelumnya: ' : 'Periode: '}: {m.periodLabel}</div>
                            ) : null}
                          </div>
                          <div className="shrink-0 h-10 w-10 rounded-full bg-blue-50 dark:bg-black flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-[#D1D5DB]" />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-400">{m.key == 'nextTrip' ? 'Berdasarkan jadwal armada' : 'Berdasarkan catatan pengeluaran'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 sm:px-5 pt-4 sm:pt-5">
            <div className="border-b border-gray-200/70 pb-4">
              <div className="rounded-[22px] border border-[#E9EEF7] bg-white/80 dark:bg-black/50 dark:border-[#333] p-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth">
                  {([
                    { key: 'overview', label: 'Overview', icon: FileText },
                    { key: 'schedule', label: 'Jadwal Armada', icon: CalendarDays },
                    { key: 'orders', label: 'Riwayat Perjalanan', icon: Clock },
                    { key: 'reviews', label: 'Ulasan', icon: MessageCircleMore },
                  ] as const).map((t) => {
                    const isTabActive = activeTab === t.key;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={[
                          'relative isolate inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                          'outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                          isTabActive
                            ? 'text-white shadow-sm'
                            : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#EEF3FF] dark:hover:bg-[#333] dark:hover:text-[#D1D5DB] hover:-translate-y-[1px]',
                        ].join(' ')}
                      >
                        {isTabActive ? (
                          <motion.span
                            layoutId="fleet-unit-active-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#295BFF] shadow-[0_10px_24px_-14px_rgba(79,107,255,0.75)] ring-1 ring-white/30"
                            transition={{ duration: 0.25 }}
                          />
                        ) : null}
                        <Icon className={['h-4 w-4', isTabActive ? 'text-white dark:text-[#D1D5DB]' : 'text-[#64748B] dark:text-[#D1D5DB]'].join(' ')} />
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
                        <div key={`ov-s-${i}`} className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
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
                      <div className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-5">Informasi Teknis</div>
                        {/* <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/60"> */}
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-200/60">
                              {[
                                { label: 'Jenis Armada', value: detail.fleet_type || '-' },
                                { label: 'Nama Armada', value: detail.fleet_name || '-' },
                                { label: 'Chassis', value: detail.engine || '-' },
                                { label: 'Transmisi', value: detail.transmission || '-' },
                                { label: 'Tahun Produksi', value: detail.production_year ? String(detail.production_year) : '-' },
                                { label: 'Kapasitas Kursi', value: detail.capacity ? `${String(detail.capacity)} seat` : '-' },
                              ].map((row) => (
                                <tr key={row.label} className="bg-white">
                                  <td className="py-3 text-gray-500 w-1/2">{row.label}</td>
                                  <td className="py-3 font-medium text-gray-900 dark:text-white">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        {/* </div> */}

                        <div className="hidden mt-4">
                          <div className="text-xs font-semibold text-gray-700">Pickup Points</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(detail?.pickup_points ?? []).length === 0 ? (
                              <div className="text-sm text-gray-500">Tidak ada pickup points</div>
                            ) : (
                              (detail?.pickup_points ?? []).map((name, idx) => (
                                <div
                                  key={`p-tech-${idx}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200/70 bg-white text-gray-800 dark:bg-[#333] dark:text-[#D1D5DB] hover:bg-gray-50 transition-colors"
                                >
                                  <MapPin className="h-4 w-4 text-gray-500 dark:text-[#D1D5DB]" />
                                  <span className="text-sm font-medium">{name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200/60 bg-white p-2 sm:p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-5">Informasi Administratif</div>
                          <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-200/60">
                              {(() => {
                                const isKo = Number(detail.ownership_type ?? 0) === 1;
                                const ownerLabel = isKo ? (detail.partner_name || '-') : (detail.owner_name || '-');
                                const ownerValue = isKo && detail.partner_id ? (
                                  <button
                                    type="button"
                                    className="text-blue-600 dark:text-[#D1D5DB] hover:no-underline text-bold"
                                    onClick={() =>
                                      navigate(
                                        `${basePrefix}/partner-operations/detail/${encodeURIComponent(String(detail.partner_id ?? ''))}`,
                                        { state: { partner_id: detail.partner_id, partner_name: detail.partner_name, partner_phone: detail.partner_phone } }
                                      )
                                    }
                                  >
                                    {ownerLabel} <Eye className="inline-block w-4 h-4 ml-1 dark:text-[#D1D5DB]" />
                                  </button>
                                ) : (
                                  ownerLabel
                                );

                                const rows = [
                                  { label: 'Plat Nomor', value: detail.plate_number || '-' },
                                  { label: 'Vehicle ID', value: detail.vehicle_id || '-' },
                                  { label: 'Tanggal Dibuat', value: formatDate(detail.created_at) },
                                  { label: 'Owner Name', value: ownerValue },
                                ] as Array<{ label: string; value: React.ReactNode }>;

                                if (isKo) {
                                  rows.push({ label: 'Kontak Owner', value: detail.partner_phone || '-' });
                                }

                                return rows;
                              })().map((row) => (
                                <tr key={row.label} className="bg-white">
                                  <td className="py-3 text-gray-500 w-1/2">{row.label}</td>
                                  <td className="py-3 font-medium text-gray-900 dark:text-white">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      </div>
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
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="w-full md:max-w-sm">
                      <div className="text-xs text-gray-500 mb-1">Tanggal</div>
                      <Popover
                        open={availabilityPickerOpen}
                        onOpenChange={(next) => {
                          if (!next) {
                            const r = availabilityRange;
                            if (r?.from && !r?.to) {
                              setAvailabilityPickerOpen(true);
                              return;
                            }
                          }
                          setAvailabilityPickerOpen(next);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal h-10 bg-white border-gray-500/70 hover:bg-white rounded-2xl">
                            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {availabilityRangeLabel}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            numberOfMonths={1}
                            selected={availabilityRange}
                            onSelect={(range) => {
                              setAvailabilityRange(range);
                              setAvailabilityPage(1);
                              if (range?.from && range?.to) {
                                setAvailabilityPickerOpen(false);
                              } else {
                                setAvailabilityPickerOpen(true);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white">
                    <div className="overflow-auto">
                      <Table className="min-w-[460px]">
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-[20px] px-4 whitespace-nowrap">No</TableHead>
                            <TableHead className="px-4 whitespace-nowrap w-[90px]">Tanggal</TableHead>
                            <TableHead className="px-4 whitespace-nowrap w-[170px]">Order ID</TableHead>
                            <TableHead className="px-4 whitespace-nowrap w-[170px]">Tujuan</TableHead>
                            <TableHead className="whitespace-nowrap w-[170px]">Status</TableHead>
                            <TableHead className="text-right pr-4 whitespace-nowrap w-[120px]">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availabilityLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                              <TableRow key={`a-tab-s-${i}`}>
                                <TableCell className="px-4">
                                  <Skeleton className="h-4 w-8" />
                                </TableCell>
                                <TableCell className="px-4">
                                  <Skeleton className="h-4 w-36" />
                                </TableCell>
                                <TableCell className="px-4">
                                  <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell className="px-4">
                                  <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-28" />
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                  <Skeleton className="h-9 w-40 ml-auto" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : availabilityCurrent.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-10 text-center text-gray-500">
                                Tidak ada data ketersediaan
                              </TableCell>
                            </TableRow>
                          ) : (
                            availabilityCurrent.map((row, idx) => {
                              const d = row.date ? new Date(row.date) : null;
                              const dateLabel = d && !isNaN(d.getTime()) ? format(d, 'dd MMMM yyyy', { locale: idLocale }) : row.date || '-';
                              const dateYmd = d && !isNaN(d.getTime()) ? toYmd(startOfDay(d)) : row.date;
                              return (
                                <TableRow key={`${row.date}-${idx}`} className="hover:bg-gray-50">
                                  <TableCell className="px-4 text-gray-700">{availabilityPageStart + idx + 1}</TableCell>
                                  <TableCell className="px-4 font-medium dark:text-[#D1D5DB] whitespace-nowrap">{dateLabel}</TableCell>
                                  <TableCell className="px-4 dark:text-white/80 whitespace-nowrap">{row.order_id || '-'}</TableCell>
                                  <TableCell className="px-4 dark:text-white/80 whitespace-nowrap">{row.destination || '-'}</TableCell>
                                  <TableCell>
                                    {row.available ? (
                                      <Badge variant="outline" className="border-green-200 bg-green-500 text-white inline-flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Tersedia
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-rose-200 bg-rose-50 dark:text-white/80 text-rose-700 inline-flex items-center gap-1.5">
                                        <XCircle className="h-4 w-4" />
                                        Tidak Tersedia
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right pr-4 whitespace-nowrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white border-gray-200/70 hover:bg-white whitespace-nowrap"
                                      disabled={!row.available || !dateYmd}
                                      onClick={() => (dateYmd ? handleReservasiYmd(dateYmd, row.unit_id) : undefined)}
                                    >
                                      Reservasi Sekarang
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-200/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        Menampilkan {availabilityRows.length === 0 ? 0 : availabilityPageStart + 1}-{Math.min(availabilityPageEnd, availabilityRows.length)} dari{' '}
                        {availabilityRows.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAvailabilityPage((p) => Math.max(1, p - 1))}
                          disabled={availabilityPageSafe <= 1}
                          className="bg-white border-gray-200/70 hover:bg-white"
                        >
                          Prev
                        </Button>
                        <div className="text-sm text-gray-500">
                          {availabilityPageSafe} / {availabilityTotalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAvailabilityPage((p) => Math.min(availabilityTotalPages, p + 1))}
                          disabled={availabilityPageSafe >= availabilityTotalPages}
                          className="bg-white border-gray-200/70 hover:bg-white"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
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
                          <Button variant="outline" className="w-full justify-start font-normal h-10 bg-white border-gray-500/70 hover:bg-white rounded-2xl">
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

                  <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white">
                    <div className="overflow-auto">
                      <Table className="min-w-[1100px]">
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap w-[160px]">Order Id</TableHead>
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap w-[220px]">Tanggal Trip</TableHead>
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap w-[220px]">Pickup Point</TableHead>
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap w-[220px]">Tujuan</TableHead>
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap w-[200px]">Pengemudi</TableHead>
                            <TableHead className="py-3 px-4 font-semibold whitespace-nowrap text-right w-[220px] pr-4">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={`o-s-${i}`}>
                                {Array.from({ length: 6 }).map((__, j) => (
                                  <TableCell key={`o-s-${i}-${j}`} className="py-3 px-4">
                                    <Skeleton className="h-4 w-full" />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : orderCurrent.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                                Tidak ada data order
                              </TableCell>
                            </TableRow>
                          ) : (
                            orderCurrent.map((row, idx) => (
                              <TableRow key={`o-${row.order_id || idx}`} className="hover:bg-gray-50">
                                <TableCell className="py-3 px-4 font-medium dark:text-white/80 whitespace-nowrap">{row.order_id || '-'}</TableCell>
                                <TableCell className="py-3 px-4 text-gray-700 dark:text-[#D1D5DB] whitespace-nowrap">{formatTripRange(row.start_date, row.end_date || row.start_date)}</TableCell>
                                <TableCell className="py-3 px-4 text-gray-700 dark:text-[#D1D5DB] whitespace-nowrap">{row.pickup_city_label || '-'}</TableCell>
                                <TableCell className="py-3 px-4 text-gray-700 dark:text-[#D1D5DB] whitespace-nowrap">{row.destination_city_label || '-'}</TableCell>
                                <TableCell className="py-3 px-4 text-gray-700 dark:text-white/80 whitespace-nowrap">-</TableCell>
                                <TableCell className="py-3 px-4 text-right whitespace-nowrap pr-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white border-gray-200/70 hover:bg-white whitespace-nowrap"
                                    disabled={!row.order_id}
                                    onClick={() =>
                                      row.order_id ? navigate(`${basePrefix}/orders/fleet/detail/${encodeURIComponent(row.order_id)}`) : undefined
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2 inline-block" /> Lihat Pesanan
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-gray-500">
                      Menampilkan {filteredOrderRows.length === 0 ? 0 : orderPageStart + 1}-{Math.min(orderPageEnd, filteredOrderRows.length)} dari {filteredOrderRows.length}
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
                        className="bg-white border-gray-500/70 hover:bg-white rounded-2xl"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MessageCircleMore className="h-4 w-4 text-violet-600" />
                      Ulasan
                    </div>
                    <div className="text-xs text-gray-500">{reviews.length} ulasan</div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 text-center text-sm text-gray-500">
                      Belum ada ulasan
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[800px] overflow-auto scroll-smooth pr-1">
                      {reviews.map((r, idx) => (
                        <div key={`${r.customer_name}-${idx}`} className="rounded-2xl border border-gray-200/70 bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{r.customer_name || '-'}</div>
                              <div className="mt-0.5 text-xs text-gray-500">{r.created_at ? formatDate(r.created_at) : '-'}</div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const filled = i < Math.round(r.star || 0);
                                return (
                                  <Star
                                    key={i}
                                    className={['h-4 w-4', filled ? 'text-amber-500' : 'text-gray-300'].join(' ')}
                                    fill={filled ? 'currentColor' : 'none'}
                                  />
                                );
                              })}
                            </div>
                          </div>
                          {r.review ? <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{r.review}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow h-full min-h-[420px] flex flex-col">
              <div>
                <CardHeaderWithBadge
                  className=""
                  badgeIcon={<Wallet className="h-3 w-3 sm:h-6 sm:w-6" />}
                  title="Pendapatan"
                  subtitle="Pantau pendapatan di sini."
                />
                <div className="flex justify-end gap-2">
                  <Select value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as PeriodPreset)}>
                    <SelectTrigger className="border-gray-500/70 bg-white h-9 w-[190px] rounded-2xl">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-white border-gray-500/70 hover:bg-white"
                        aria-label="Export"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-56">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Download Excel (.xls)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Export Google Sheet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-3 flex-1 flex flex-col">
                <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/70 overflow-hidden flex-1 flex flex-col">
                  <Table className="min-w-[460px]">
                    <TableHeader className="bg-gray-50/80 dark:bg-[#1c2633] dark:border-white/10 dark:text-[#D1D5DB]">
                      <TableRow>
                        <TableHead className="whitespace-nowrap px-4">Tanggal</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Order ID</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Metode</TableHead>
                        <TableHead className="text-right px-4 whitespace-nowrap">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={`rev-s-${i}`}>
                            <TableCell className="px-4">
                              <Skeleton className="h-4 w-28" />
                            </TableCell>
                            <TableCell className="px-4">
                              <Skeleton className="h-4 w-44" />
                            </TableCell>
                            <TableCell className="px-4">
                              <Skeleton className="h-4 w-28" />
                            </TableCell>
                            <TableCell className="text-right px-4">
                              <Skeleton className="h-4 w-28 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : revenueHistoryRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-sm text-gray-500">
                            Tidak ada riwayat pendapatan
                          </TableCell>
                        </TableRow>
                      ) : (
                        revenueCurrent.map((row, idx) => (
                          <TableRow key={`rev-${row.transaction_date}-${row.order_id}-${idx}`}>
                            <TableCell className="px-4 text-foreground whitespace-nowrap">
                              {formatLongDate(row.transaction_date) !== '-' ? formatLongDate(row.transaction_date) : row.transaction_date || '-'}
                            </TableCell>
                            <TableCell className="px-4 text-foreground whitespace-nowrap">{row.order_id || '-'}</TableCell>
                            <TableCell className="px-4 text-foreground whitespace-nowrap">{row.payment_method_label || '-'}</TableCell>
                            <TableCell className="px-4 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                              {formatRupiahFromNumber(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {!revenueLoading && revenueHistoryRows.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200/70 dark:border-white/10">
                      <div className="text-sm text-gray-500">
                        Showing {revenuePageStart + 1} to {Math.min(revenuePageEnd, revenueHistoryRows.length)} of {revenueHistoryRows.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={revenuePageSafe <= 1}
                          onClick={() => setRevenuePage(prev => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                          {revenuePageSafe} / {revenueTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={revenuePageSafe >= revenueTotalPages}
                          onClick={() => setRevenuePage(prev => Math.min(revenueTotalPages, prev + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow h-full min-h-[420px] flex flex-col">
              <div>
                <CardHeaderWithBadge
                  className=""
                  badgeIcon={<TrendingDown className="h-3 w-3 sm:h-6 sm:w-6" />}
                  title="Pengeluaran"
                  subtitle="Pantau pengeluaran di sini."
                />
                <div className="flex justify-end gap-2">
                  <Select value={expensePeriod} onValueChange={(v) => setExpensePeriod(v as PeriodPreset)}>
                    <SelectTrigger className="border-gray-500/70 bg-white h-9 w-[190px] rounded-2xl">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-white border-gray-500/70 hover:bg-white"
                        aria-label="Export"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-56">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Download Excel (.xls)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Export Google Sheet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="mt-3 flex-1 flex flex-col">
                <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/70 overflow-hidden flex-1 flex flex-col">
                  <Table className="min-w-[480px]">
                    <TableHeader className="bg-gray-50/80 dark:bg-[#1c2633] dark:border-white/10 dark:text-[#D1D5DB]">
                      <TableRow>
                        <TableHead className="whitespace-nowrap px-4">Item Transaksi</TableHead>
                        <TableHead className="whitespace-nowrap px-4">Tanggal Transaksi</TableHead>
                        <TableHead className="text-right px-4 whitespace-nowrap">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={`ex-s-${i}`}>
                            <TableCell className="px-4">
                              <Skeleton className="h-4 w-44" />
                            </TableCell>
                            <TableCell className="px-4">
                              <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell className="text-right px-4">
                              <Skeleton className="h-4 w-28 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : expenseRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-10 text-center text-sm text-gray-500">
                            Tidak ada data pengeluaran
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenseCurrent.map((row, idx) => (
                          <TableRow key={`ex-${row.transaction_date}-${idx}`}>
                            <TableCell className="px-4 text-foreground whitespace-nowrap">{row.transaction_item_label || '-'}</TableCell>
                            <TableCell className="px-4 text-foreground whitespace-nowrap">{formatTripDate(row.transaction_date) !== '-' ? formatTripDate(row.transaction_date) : row.transaction_date || '-'}</TableCell>
                            <TableCell className="px-4 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">{formatRupiahFromNumber(row.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {!expenseLoading && expenseRows.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200/70 dark:border-white/10">
                      <div className="text-sm text-gray-500">
                        Showing {expensePageStart + 1} to {Math.min(expensePageEnd, expenseRows.length)} of {expenseRows.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={expensePageSafe <= 1}
                          onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                          {expensePageSafe} / {expenseTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={expensePageSafe >= expenseTotalPages}
                          onClick={() => setExpensePage(prev => Math.min(expenseTotalPages, prev + 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
