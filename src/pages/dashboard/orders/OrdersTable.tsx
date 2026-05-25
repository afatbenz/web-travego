import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Download, Eye, Filter, MoreHorizontal, Plus, ShoppingBag, XCircle } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DateRange } from 'react-day-picker';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { id as idLocale } from 'date-fns/locale';

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
  const [orderPeriod, setOrderPeriod] = useState<DateRange | undefined>();
  const [orderDate, setOrderDate] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializedDefaultRange, setInitializedDefaultRange] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // client-side parsing helpers removed since filtering now handled by backend
  useEffect(() => {
    if (!initializedDefaultRange) {
      const today = new Date();
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      const from = startOfDay(lastYear);
      const to = startOfDay(today);
      setOrderPeriod({ from, to });
      setOrderDate({ from, to });
      setInitializedDefaultRange(true);
    }
  }, [initializedDefaultRange]);

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
    transactionId?: string;
    fleetName: string;
    fleetThumbnail?: string;
    duration: number;
    uom: string;
    unitQty: number;
    paymentStatus: number;
    status: number;
    latestPaymentStatus: string;
    customerName: string;
    totalAmount: number;
    // Keep these for potential filtering usage, map them if available
    title: string;
    createdAt: string;
    category: string;
    startDate: string;
    endDate: string;
    rentType?: string;
    pax?: number;
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
        if (searchTerm.trim()) qs.set('q', searchTerm.trim());
        if (op.start && op.end) {
          qs.set('period_from', toYmd(op.start));
          qs.set('period_to', toYmd(op.end));
        }
        if (od.start && od.end) {
          qs.set('created_from', toYmd(od.start));
          qs.set('created_to', toYmd(od.end));
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
            const uomRaw = item.uom;
            const rentTypeRaw = item.rent_type;
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
            return {
              orderId:
                typeof orderIdRaw === 'string' || typeof orderIdRaw === 'number' ? String(orderIdRaw) : '',
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
              customerName:
                typeof item.customer_name === 'string'
                  ? item.customer_name
                  : typeof item.customerName === 'string'
                    ? item.customerName
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

  const getStatusBadge = (order: Order) => {
    // Logic based on order status
    if (order.status === 2) {
      return (
        <Badge className="rounded-full border-transparent bg-blue-500/50 px-3 py-1 font-medium text-white hover:text-white hover:bg-blue-700/50 dark:bg-blue-400/15 dark:text-white">
          <Clock className="mr-1.5 h-3.5 w-3.5" />
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
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Menunggu Persetujuan
          </Badge>
        );
      case 4:
        return (
          <Badge className="rounded-full border-transparent bg-rose-500/10 px-3 py-1 font-medium text-rose-800 hover:bg-rose-500/10 dark:bg-rose-400/15 dark:text-rose-300">
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
  const pendingCount = filteredOrders.filter((o) => o.paymentStatus === 2 || o.paymentStatus === 3).length;
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
      placeholder: 'Cari order...',
      className: 'col-span-2 md:min-w-[220px] md:flex-[2]'
    },
    {
      name: 'orderPeriod',
      type: 'daterange',
      label: 'Order Period',
      placeholder: 'Pilih rentang',
      className: 'col-span-1 md:min-w-[260px]'
    },
    {
      name: 'orderDate',
      type: 'daterange',
      label: 'Order Date',
      placeholder: 'Pilih rentang',
      className: 'col-span-1 md:min-w-[260px]'
    },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setOrderPeriod(undefined);
    setOrderDate(undefined);
  };

  const getRentTypeBadge = (rentType: string | undefined) => {
    const raw = (rentType ?? '').trim();
    if (!raw) {
      return (
        <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
          -
        </Badge>
      );
    }
    const k = raw.toLowerCase();
    const cls =
      k.includes('hour') || k.includes('jam')
        ? 'bg-amber-500/10 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'
        : k.includes('day') || k.includes('hari')
          ? 'bg-sky-500/10 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300'
          : k.includes('week') || k.includes('minggu')
            ? 'bg-violet-500/10 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300'
            : k.includes('month') || k.includes('bulan')
              ? 'bg-emerald-500/10 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300'
              : 'bg-zinc-500/10 text-zinc-800 dark:bg-zinc-400/15 dark:text-zinc-200';
    return (
      <Badge className={cn('rounded-full border-transparent px-3 py-1 font-medium hover:bg-transparent', cls)}>
        {raw}
      </Badge>
    );
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
          {getStatusBadge(row)}
        </div>
      )
    },
    actionsColumn,
  ] satisfies Array<DataTableColumn<Order>>);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className={cn('flex items-center gap-3', canAddOrder ? 'justify-between' : 'justify-end')}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          title={filterOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {canAddOrder ? (
          <Button
            type="button"
            className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40"
            onClick={() => navigate(createOrderPath)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambahkan Pesanan
          </Button>
        ) : null}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <ShoppingBag className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Order</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {totalOrders}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Pending</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {pendingCount}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Selesai</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {completedCount}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <DollarSign className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Revenue</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  <span className="md:hidden">{formatIdrJt(summaryRevenue || 0)}</span>
                  <span className="hidden md:inline">{formatRupiah(summaryRevenue || 0)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
          filterOpen ? 'max-h-[720px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
        }`}
      >
        <div className="pt-1">
          <FilterBar
            fields={filterFields}
            values={filterValues}
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
            resetButtonClassName="hidden md:inline-flex md:w-auto"
          />
        </div>
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
        sorting={{ initialSort: { key: 'createdAt', direction: 'desc' } }}
        rowKey={(row) => row.transactionId || row.orderId}
      />

      {canAddOrder ? (
        <Button
          onClick={() => navigate(createOrderPath)}
          className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
          size="icon"
          title="Tambah Order"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
};
