import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Clock, DollarSign, Download, Eye, FileSpreadsheet, Filter, MoreHorizontal, Plus, ShoppingBag, XCircle } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DateRange } from 'react-day-picker';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';

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

const getDefaultOrderPeriodRange = (): DateRange => {
  const today = new Date();
  return {
    from: startOfDay(new Date(today.getFullYear(), 0, 1)),
    to: startOfDay(today),
  };
};

const GoogleSheetsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path fill="#0F9D58" d="M14 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8z" />
    <path fill="#34A853" d="M14 2v4a2 2 0 0 0 2 2h4z" />
    <path fill="#fff" d="M8 10h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8zm6-5.5h2V16h-2z" />
  </svg>
);

interface OrdersTableProps {
  status: 'all' | 'ongoing' | 'success' | 'waiting-approval';
  type?: 'fleet' | 'tour';
  title: string;
  description: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ status, type, title, description }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [orderPeriod, setOrderPeriod] = useState<DateRange | undefined>(() => getDefaultOrderPeriodRange());
  const [orderDate, setOrderDate] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // client-side parsing helpers removed since filtering now handled by backend

  const formatDdMmmmYyyyFromDate = (d: Date) => {
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

  const summaryPeriodLabel = useMemo(() => {
    const labelFrom = (range: DateRange | undefined) => {
      const r = normalizeRange(range);
      if (!r.start || !r.end) return '';
      const s = formatDdMmmmYyyyFromDate(r.start);
      const e = formatDdMmmmYyyyFromDate(r.end);
      return s === e ? s : `${s} - ${e}`;
    };

    const a = labelFrom(orderPeriod);
    const b = labelFrom(orderDate);
    if (a && b) return a === b ? a : `${a} • ${b}`;
    return a || b || '-';
  }, [orderPeriod, orderDate]);

  const formatDdMmmYy = (value: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

  const formatSewaRange = (start: string, end: string) => {
    const s = formatDdMmmYy(start);
    const e = formatDdMmmYy(end);
    if (s === '-' && e === '-') return '-';
    return `${s} - ${e}`;
  };

  const formatSingleOrRange = (start: string, end: string) => {
    const s = formatDdMmmYy(start);
    const e = formatDdMmmYy(end);
    if (s === '-' && e === '-') return '-';
    if (s !== '-' && (e === '-' || s === e)) return s;
    return `${s} - ${e}`;
  };

  interface Order {
    orderId: string;
    orderDate: string;
    transactionId?: string;
    fleetName: string;
    fleetThumbnail?: string;
    duration: number;
    uom: string;
    unitQty: number;
    paymentStatus: number;
    status: number;
    latestPaymentStatus: string;
    totalPaymentStatus: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    // Keep these for potential filtering usage, map them if available
    title: string;
    createdAt: string;
    category: string;
    startDate: string;
    endDate: string;
    rentType?: string;
    pax?: number;
    scheduleId?: string;
  }

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let endpointBase = '/services/fleet/orders';
        
        if (type === 'tour') {
          endpointBase = '/services/tour-packages/order/list';
        }

        const op = normalizeRange(orderPeriod);
        const od = normalizeRange(orderDate);
        const qs = new URLSearchParams();
        if (searchTerm.trim()) qs.set('search', searchTerm.trim());
        if (op.start && op.end) {
          qs.set('order_date_start', toYmd(op.start));
          qs.set('order_date_end', toYmd(op.end));
        }
        if (od.start && od.end) {
          qs.set('start_date', toYmd(od.start));
          qs.set('end_date', toYmd(od.end));
        }
        const endpoint = qs.toString() ? `${endpointBase}?${qs.toString()}` : endpointBase;

        const response = await api.get<unknown>(endpoint, token ? { Authorization: token } : undefined);
        
        if (response.status === 'success') {
          const payload = response.data as unknown;
          let items: unknown[] = [];
          let revenue = 0;
          if (Array.isArray(payload)) {
            items = payload;
          } else if (payload && typeof payload === 'object') {
            const root = payload as Record<string, unknown>;
            const dataNode = root.data as unknown;
            const summaryNode =
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).summary : undefined) ??
              root.summary;
            if (summaryNode && typeof summaryNode === 'object') {
              const s = summaryNode as Record<string, unknown>;
              const r = Number(s.revenue ?? 0);
              if (Number.isFinite(r)) revenue = r;
            }
            const ordersNode =
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).orders : undefined) ??
              root.orders;
            if (Array.isArray(ordersNode)) {
              items = ordersNode;
            } else if (Array.isArray(dataNode)) {
              items = dataNode;
            }
          }
          if (Number.isFinite(revenue)) setSummaryRevenue(revenue);
          const mappedOrders = items.map((raw) => {
            const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
            const startRaw = item.start_date ?? item.startDate;
            const start = typeof startRaw === 'string' ? startRaw : new Date().toISOString();
            const endRaw = item.end_date ?? item.endDate;
            const end = typeof endRaw === 'string' ? endRaw : start;
            const transactionIdRaw = item.transaction_id ?? item.transactionId;
            const orderIdRaw = item.order_id ?? item.id;
            const fleetNameRaw = item.fleet_name ?? item.package_name ?? item.title;
            const latestPaymentStatusRaw = item.latest_payment_status ?? item.latestPaymentStatus ?? item.latest_payment_status_label ?? item.latestPaymentStatusLabel;
            const totalPaymentStatusRaw = item.total_payment_status ?? item.totalPaymentStatus ?? latestPaymentStatusRaw;
            const uomRaw = item.uom;
            const rentTypeRaw = item.rent_type;
            const orderDateRaw = item.order_date ?? item.orderDate ?? item.created_at ?? item.createdAt;
            const paxRaw =
              item.pax ??
              item.total_pax ??
              item.pax_count ??
              item.participants ??
              item.total_participants ??
              item.participant ??
              item.total_participant;
            const thumbnailRaw =
              item.thumbnail ??
              item.image ??
              item.image_url ??
              item.imageUrl ??
              item.fleet_image ??
              item.fleetImage ??
              item.package_thumbnail ??
              item.packageThumbnail ??
              item.package_image ??
              item.packageImage;
            const fleetThumbnail =
              typeof thumbnailRaw === 'string' && thumbnailRaw.trim() ? toFileUrl(thumbnailRaw.trim()) : undefined;
            const scheduleIdRaw = item.schedule_id ?? item.scheduleId;
            return {
              orderId:
                typeof orderIdRaw === 'string' || typeof orderIdRaw === 'number' ? String(orderIdRaw) : '',
              orderDate:
                typeof orderDateRaw === 'string' || typeof orderDateRaw === 'number' ? String(orderDateRaw) : '',
              transactionId:
                typeof transactionIdRaw === 'string' || typeof transactionIdRaw === 'number'
                  ? String(transactionIdRaw)
                  : undefined,
              fleetName: typeof fleetNameRaw === 'string' ? fleetNameRaw : 'Unknown Unit',
              fleetThumbnail,
              duration: Number.isFinite(Number(item.duration)) ? Number(item.duration) : 0,
              uom: typeof uomRaw === 'string' ? uomRaw : 'hari',
              unitQty: Number.isFinite(Number(item.unit_qty ?? item.qty)) ? Number(item.unit_qty ?? item.qty) : 0,
              paymentStatus: Number.isFinite(Number(item.payment_status)) ? Number(item.payment_status) : 0,
              status: Number.isFinite(Number(item.status)) ? Number(item.status) : 0,
              latestPaymentStatus:
                typeof latestPaymentStatusRaw === 'string' || typeof latestPaymentStatusRaw === 'number'
                  ? String(latestPaymentStatusRaw)
                  : '',
              totalPaymentStatus:
                typeof totalPaymentStatusRaw === 'string' || typeof totalPaymentStatusRaw === 'number'
                  ? String(totalPaymentStatusRaw)
                  : '',
              customerName:
                typeof item.customer_name === 'string'
                  ? item.customer_name
                  : typeof item.customerName === 'string'
                    ? item.customerName
                    : '-',
              customerPhone:
                typeof item.customer_phone === 'string'
                  ? item.customer_phone
                  : typeof item.customerPhone === 'string'
                    ? item.customerPhone
                    : '-',
              totalAmount: Number.isFinite(Number(item.total_amount ?? item.totalAmount)) ? Number(item.total_amount ?? item.totalAmount) : 0,
              title: typeof fleetNameRaw === 'string' ? fleetNameRaw : 'Order',
              createdAt:
                typeof item.created_at === 'string'
                  ? item.created_at
                  : typeof item.createdAt === 'string'
                    ? item.createdAt
                    : start,
              category:
                typeof item.category === 'string' ? item.category : type === 'tour' ? 'Paket Wisata' : 'Armada',
              startDate: start,
              endDate: end,
              rentType: typeof rentTypeRaw === 'string' ? rentTypeRaw : undefined,
              pax: Number.isFinite(Number(paxRaw)) ? Number(paxRaw) : undefined,
              scheduleId: scheduleIdRaw,
            } as Order;
          });
          setOrders(mappedOrders);
          // Default range sekarang berasal dari hari ini s/d +1 tahun
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [type, searchTerm, orderPeriod, orderDate]);

  const scheduleWarning = (order: Order) => {
    if (order.status === 1 && order.paymentStatus !== 2 && order.scheduleId === "") {
      return (
          <span title="Pesanan ini belum dijadwalkan">
            <CircleAlert className="ml-1 h-4 w-4 mt-1 transition-transform duration-200 hover:scale-125 text-red-500" />
          </span>
      );
    }
  }

  const getStatusBadge = (order: Order) => {
    // Logic based on order status
    if (order.status === 2) {
      return (
        <Badge className="rounded-full border-transparent bg-orange-500 px-3 py-1 font-medium text-white hover:text-white hover:bg-orange-700 dark:bg-orange-400/15 dark:text-white">
          <Clock className="mr-1.5 h-3.5 w-3.5 animate-bounce" />
          Menunggu Konfirmasi
        </Badge>
      );
    }

    if (order.status === 0) {
      return (
        <Badge className="rounded-full border-transparent bg-zinc-500/10 px-3 py-1 font-medium text-zinc-800 hover:bg-zinc-500/10 dark:bg-zinc-400/15 dark:text-zinc-200">
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Pesanan Dibatalkan
        </Badge>
      );
    }

    // Default to payment status logic if status is 1 or other
    switch (order.paymentStatus) {
      case 1:
        return (
          <Badge className="rounded-full border-transparent bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 hover:bg-emerald-500/10 dark:bg-emerald-400/15 dark:text-emerald-300">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Pembayaran Selesai
          </Badge>
        );
      case 2:
        return (
          <Badge className="rounded-full border-transparent bg-amber-500/10 px-3 py-1 font-medium text-amber-800 hover:bg-amber-500/10 dark:bg-amber-400/15 dark:text-amber-300">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Menunggu Pembayaran
          </Badge>
        );
      case 3:
        return (
          <Badge className="rounded-full border-transparent bg-sky-500/10 px-3 py-1 font-medium text-sky-800 hover:bg-sky-500/10 dark:bg-sky-400/15 dark:text-sky-300">
            <Clock className="mr-1.5 h-3.5 w-3.5 animate-bounce" />
            Menunggu Persetujuan
          </Badge>
        );
      case 4:
        return (
          <Badge className="rounded-full border-transparent bg-cyan-600 px-3 py-1 font-medium text-white hover:bg-cyan-500 dark:bg-cyan-400/15 dark:text-white">
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
            Belum Lunas
          </Badge>
        );
      case 5:
        return (
          <Badge className="rounded-full border-transparent bg-violet-500/10 px-3 py-1 font-medium text-violet-800 hover:bg-violet-500/10 dark:bg-violet-400/15 dark:text-violet-300">
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
            Refund
          </Badge>
        );
      case 6:
        return (
          <Badge className="rounded-full border-transparent bg-blue-500/10 px-3 py-1 font-medium text-white hover:bg-blue-500/10 dark:bg-blue-400/15 dark:text-white">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Menunggu Konfirmasi
          </Badge>
        );
      case 0:
        return (
          <Badge className="rounded-full border-transparent bg-zinc-500/10 px-3 py-1 font-medium text-zinc-800 hover:bg-zinc-500/10 dark:bg-zinc-400/15 dark:text-zinc-200">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Pesanan Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // order status calculation removed; backend filters data

  const filteredOrders = orders;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderPeriod, orderDate]);

  const totalOrders = filteredOrders.length;
  const completedCount = filteredOrders.filter((o) => o.paymentStatus === 1).length;
  const pendingCount = filteredOrders.filter((o) => o.paymentStatus === 2 || o.paymentStatus === 3 || o.paymentStatus === 4 || o.status === 2).length;
  const formatRupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;
  const formatIdrJt = (n: number) => {
    const jt = (Number.isFinite(n) ? n : 0) / 1_000_000;
    return `IDR ${jt.toFixed(2)} JT`;
  };

  const canAddOrder = (type === 'fleet' || type === 'tour') && status === 'all' && basePrefix === '/dashboard/partner';
  const createOrderPath =
    type === 'tour' ? `${basePrefix}/orders/tour/form` : `${basePrefix}/orders/fleet/form`;
  const goToOrder = (orderId: string) => {
    if (basePrefix === '/dashboard/partner' && type === 'fleet') {
      navigate(`${basePrefix}/orders/fleet/detail/${orderId}`);
      return;
    }
    if (type === 'tour') {
      navigate(`${basePrefix}/orders/tour/detail/${orderId}`);
      return;
    }
    navigate(`${basePrefix}/orders/detail/${orderId}`);
  };

  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      const needs = /[",\n\r]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needs ? `"${escaped}"` : escaped;
    };
    const headers = Object.keys(rows[0] ?? {});
    const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const formatExportDate = (value: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getExportStatusLabel = (statusValue: number) => {
    if (statusValue === 1) return 'diproses';
    if (statusValue === 2) return 'belum dikonfirmasi';
    return String(statusValue || '-');
  };

  const getScheduleLabel = (scheduleId: Order['scheduleId']) => {
    if (scheduleId == null) return 'belum terjadwal';
    if (typeof scheduleId === 'string' && !scheduleId.trim()) return 'belum terjadwal';
    return 'terjadwal';
  };

  const exportHeaders = [
    'No',
    'Order ID',
    'Tanggal Order',
    'Jenis Order',
    'Nama Armada',
    'Jumlah Unit',
    'Durasi',
    'Total Tagihan',
    'Nama Pelanggan',
    'No. Telepon',
    'Tanggal Keberangkatan',
    'Tanggal Kepulangan',
    'Status',
    'Status Pembayaran',
    'Terjadwal',
  ];

  const exportRows = filteredOrders.map((row, index) => [
    index + 1,
    row.orderId,
    formatExportDate(row.orderDate),
    row.rentType ?? '-',
    row.fleetName,
    row.unitQty,
    `${row.duration} hari`,
    row.totalAmount,
    row.customerName,
    row.customerPhone,
    formatExportDate(row.startDate),
    formatExportDate(row.endDate),
    getExportStatusLabel(row.status),
    row.totalPaymentStatus || row.latestPaymentStatus || '-',
    getScheduleLabel(row.scheduleId),
  ]);

  const getExportFilename = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `travego-fleet_orders-${yyyy}${mm}${dd}${hh}${min}`;
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `${getExportFilename()}.xlsx`);
  };

  const exportToGoogleSheets = async () => {
    const sheetWindow = window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
    const clipboardText = [exportHeaders.join('\t'), ...exportRows.map((row) => row.join('\t'))].join('\n');

    try {
      await copyTextToClipboard(clipboardText);
      toast({
        title: 'Berhasil',
        description: 'Data order berhasil disalin ke clipboard.',
      });
    } catch {
      toast({
        title: 'Gagal',
        description: 'Data order gagal disalin ke clipboard.',
        variant: 'destructive',
      });
    }

    if (!sheetWindow) {
      toast({
        title: 'Perhatian',
        description: 'Popup Google Sheet diblokir browser.',
        variant: 'destructive',
      });
    }
  };

  const downloadHeaderAction = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700" title="Download">
          <Download className="h-4 w-4 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[240px]">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            downloadExcel();
          }}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download ke excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            void exportToGoogleSheets();
          }}
        >
          <GoogleSheetsIcon className="mr-2 h-4 w-4" />
          Copy ke Google Sheet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderSummaryCards = () => (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="px-4 py-2.5 md:px-4 md:py-3">
          <div className="space-y-0.5">
            <div className="mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ShoppingBag className="h-4 w-4" />
              <div className="text-[11px] font-medium text-muted-foreground sm:text-sm">Jumlah Pesanan</div>
            </div>
            <div className="text-[10px] text-muted-foreground">{summaryPeriodLabel}</div>
            {loading ? (
              <div className="mt-1 h-6 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-[23px] text-base font-semibold tracking-tight text-foreground tabular-nums md:text-xl">
                {totalOrders}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm pb-0">
        <CardContent className="px-4 py-2.5 md:px-4 md:py-3">
          <div className="space-y-0.5">
            <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              <div className="text-[11px] font-medium text-muted-foreground sm:text-sm">Pesanan dalam proses</div>
            </div>
            <div className="mb-5 text-[10px] text-muted-foreground">{summaryPeriodLabel}</div>
            {loading ? (
              <div className="mt-5 h-6 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-[23px] text-base font-semibold tracking-tight text-foreground tabular-nums md:text-xl">
                {pendingCount}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm pb-0">
        <CardContent className="px-4 py-2.5 md:px-4 md:py-3">
          <div className="space-y-0.5">
            <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <div className="text-[11px] font-medium text-muted-foreground sm:text-sm">Pesanan Selesai</div>
            </div>
            <div className="text-[10px] text-muted-foreground">{summaryPeriodLabel}</div>
            {loading ? (
              <div className="mt-1 h-6 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-[23px] text-base font-semibold tracking-tight text-foreground tabular-nums md:text-xl">
                {completedCount}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm pb-0">
        <CardContent className="px-4 py-2.5 md:px-4 md:py-3">
          <div className="space-y-0.5">
            <div className="mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <DollarSign className="h-4 w-4" />
              <div className="text-[11px] font-medium text-muted-foreground sm:text-sm">Total Pendapatan</div>
            </div>
            <div className="text-[10px] text-muted-foreground">{summaryPeriodLabel}</div>
            {loading ? (
              <div className="mt-1 h-6 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <div className="mt-[23px] text-base font-semibold tracking-tight text-foreground tabular-nums md:text-xl">
                <span className="md:hidden">{formatIdrJt(summaryRevenue || 0)}</span>
                <span className="hidden md:inline">{formatRupiah(summaryRevenue || 0)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );

  type OrdersFilters = {
    q: string;
    orderPeriod: DateRange | undefined;
    orderDate: DateRange | undefined;
  };

  const filterValues: OrdersFilters = {
    q: searchTerm,
    orderPeriod,
    orderDate,
  };

  const filterFields: Array<FilterField<OrdersFilters>> = [
    {
      name: 'q',
      type: 'text',
      label: 'Search',
      placeholder: 'Cari order ID / nama pelanggan / Nama Unit',
      className: 'col-span-1 md:min-w-[220px] md:flex-[2]',
      inputClassName: 'rounded-2xl'
    },
    {
      name: 'orderPeriod',
      type: 'daterange',
      label: 'Periode Pemesanan',
      placeholder: 'Pilih rentang',
      className: 'col-span-1 md:min-w-[260px]',
      triggerClassName: 'rounded-2xl'
    },
    {
      name: 'orderDate',
      type: 'daterange',
      label: 'Tanggal Perjalanan',
      placeholder: 'Semua Tanggal Keberangkatan',
      className: 'col-span-1 md:min-w-[260px]',
      triggerClassName: 'rounded-2xl'
    },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setOrderPeriod(getDefaultOrderPeriodRange());
    setOrderDate(undefined);
  };

  const isPartnerTour = type === 'tour' && basePrefix === '/dashboard/partner';

  const packageColumn: DataTableColumn<Order> = {
    label: type === 'tour' ? 'Paket Wisata' : 'Nama Unit',
    key: 'fleetName',
    sortable: true,
    width: 320,
    render: (row) => {
      if (type === 'tour') {
        return <span className="min-w-0 truncate font-medium text-foreground">{row.fleetName}</span>;
      }
      const fallback = (row.fleetName || 'U').trim().slice(0, 1).toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-lg bg-muted">
            {row.fleetThumbnail ? (
              <img src={row.fleetThumbnail} alt={row.fleetName} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-indigo-500/15 to-sky-500/15 text-xs font-semibold text-foreground/70">
                {fallback}
              </div>
            )}
          </div>
          <span className="min-w-0 truncate font-medium text-foreground">{row.fleetName}</span>
        </div>
      );
    },
  };

  const actionsColumn: DataTableColumn<Order> = {
    label: 'Action',
    key: '__actions__',
    width: 72,
    align: 'right',
    sortable: false,
    render: (row) => (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem className="cursor-pointer" onSelect={() => goToOrder(row.orderId)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => {
                downloadCsv(`order-${row.orderId}.csv`, [
                  {
                    orderId: row.orderId,
                    transactionId: row.transactionId ?? '',
                    fleetName: row.fleetName,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    paymentStatus: row.paymentStatus,
                    latestPaymentStatus: row.latestPaymentStatus,
                    customerName: row.customerName,
                    totalAmount: row.totalAmount,
                    createdAt: row.createdAt,
                    pax: row.pax ?? '',
                  }
                ]);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  };

  const columns: Array<DataTableColumn<Order>> = isPartnerTour
    ? ([
        {
          label: 'No',
          key: '__no__',
          width: 68,
          align: 'center',
          sortable: false,
          render: (_, rowIndex) => (
            <span className="text-sm text-muted-foreground">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span>
          )
        },
        {
          label: 'Order ID',
          key: 'orderId',
          sortable: true,
          width: 180,
          render: (row) => (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 font-semibold text-blue-700 hover:text-blue-900 hover:no-underline hover:text-bold dark:text-blue-300 dark:hover:text-blue-200"
              onClick={() => goToOrder(row.orderId)}
            >
              {row.orderId}
            </Button>
          )
        },
        {
          label: 'Nama Customer',
          key: 'customerName',
          sortable: true,
          width: 240,
          render: (row) => <span className="min-w-0 truncate text-foreground">{row.customerName || '-'}</span>
        },
        packageColumn,
        {
          label: 'Tanggal Wisata',
          key: 'startDate',
          width: 220,
          render: (row) => <span className="text-foreground">{formatSingleOrRange(row.startDate, row.endDate)}</span>
        },
        {
          label: 'Jumlah Peserta',
          key: 'pax',
          width: 160,
          sortable: true,
          align: 'right',
          render: (row) => (
            <span className="text-foreground tabular-nums">{Number.isFinite(Number(row.pax)) ? `${row.pax} pax` : '-'}</span>
          )
        },
        actionsColumn,
      ] satisfies Array<DataTableColumn<Order>>)
    : ([
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span>
      )
    },
    {
      label: 'Order ID',
      key: 'orderId',
      sortable: true,
      width: 180,
      render: (row) => (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-semibold text-blue-700 hover:text-blue-900 hover:no-underline hover:text-bold dark:text-blue-300 dark:hover:text-blue-200"
          onClick={() => goToOrder(row.orderId)}
        >
          {row.orderId}
        </Button>
      )
    },
    ...(type === 'fleet' && basePrefix === '/dashboard/partner'
      ? ([
          {
            label: 'Nama Pelanggan',
            key: 'customerName',
            sortable: true,
            width: 240,
            render: (row) => <span className="min-w-0 truncate text-foreground">{row.customerName || '-'}</span>
          }
        ] as Array<DataTableColumn<Order>>)
      : []),
    packageColumn,
    {
      label: 'Jumlah Unit',
      key: 'unitQty',
      sortable: true,
      width: 220,
      render: (row) => (
        <div title={row.latestPaymentStatus || undefined} className="inline-flex">
          {row.unitQty} unit
        </div>
      )
    },
    ...(type === 'fleet' && basePrefix === '/dashboard/partner'
      ? ([
          {
            label: 'Tanggal Sewa',
            key: 'startDate',
            width: 220,
            render: (row) => <span className="text-foreground">{formatSewaRange(row.startDate, row.endDate)}</span>
          }
        ] as Array<DataTableColumn<Order>>)
      : []),
    {
      label: 'Status',
      key: 'paymentStatus',
      sortable: true,
      width: 220,
      render: (row) => (
        <div title={row.latestPaymentStatus || undefined} className="inline-flex">
          {getStatusBadge(row)} {scheduleWarning(row)}
        </div>
      )
    },
  ] satisfies Array<DataTableColumn<Order>>);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAddOrder ? (
            <Button type="button"
            className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600" onClick={() => navigate(createOrderPath)}>
              <Plus className="mr-2 h-4 w-4" />
              Pesanan Baru
            </Button>
          ) : null}
          {downloadHeaderAction}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-2xl md:hidden"
          onClick={() => setMobileFilterOpen((prev) => !prev)}
          aria-expanded={mobileFilterOpen}
          title={mobileFilterOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 md:hidden rounded-2xl text-sm"
          onClick={() => setMobileSummaryOpen((prev) => !prev)}
          aria-expanded={mobileSummaryOpen}
        >
          {mobileSummaryOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          <span className="truncate">Lihat Summary</span>
        </Button>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 md:hidden',
          mobileSummaryOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="grid grid-cols-2 gap-4 pt-1">
          {renderSummaryCards()}
        </div>
      </div>

      {/* Summary */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        {renderSummaryCards()}
      </div>

      {/* Filters */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          mobileFilterOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
        )}
      >
        <FilterBar
          fields={filterFields}
          values={filterValues}
          className="p-0"
          containerClassName="rounded-none border-0 bg-transparent pb-0 shadow-none"
          onChange={(name, value) => {
            if (name === 'q') setSearchTerm(String(value ?? ''));
            if (name === 'orderPeriod') setOrderPeriod(value as DateRange | undefined);
            if (name === 'orderDate') setOrderDate(value as DateRange | undefined);
          }}
          onReset={handleResetFilters}
          layout="responsive-grid"
          mobileDateFormat="dd MMMM"
          desktopDateFormat="dd MMM yyyy"
          dateLocale={idLocale}
          resetLabel="Reset"
          resetButtonClassName="md:inline-flex"
          resetIconOnly
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        emptyTitle="Tidak ada data order"
        emptyDescription="Coba ubah filter atau rentang tanggal."
        tableClassName="min-w-max sm:table-auto sm:min-w-full"
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ enabled: false }}
        rowKey={(row) => row.transactionId || row.orderId}
      />

      {canAddOrder ? (
        <Button
          onClick={() => navigate(createOrderPath)}
          className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
          size="icon"
          title="Tambah Order"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
};
