import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye, Download, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';

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
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [orderPeriod, setOrderPeriod] = useState<DateRange | undefined>();
  const [orderDate, setOrderDate] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [initializedDefaultRange, setInitializedDefaultRange] = useState(false);

  // client-side parsing helpers removed since filtering now handled by backend
  const formatDdMmmYyFromDate = (d: Date) => {
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

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

  const DateRangePicker: React.FC<{
    label: string;
    value: DateRange | undefined;
    onChange: (value: DateRange | undefined) => void;
    placeholder: string;
  }> = ({ label, value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const valueRef = React.useRef<DateRange | undefined>(value);
    React.useEffect(() => {
      valueRef.current = value;
    }, [value]);
    const labelText =
      value?.from && value?.to
        ? `${formatDdMmmYyFromDate(value.from)} - ${formatDdMmmYyFromDate(value.to)}`
        : value?.from
          ? `${formatDdMmmYyFromDate(value.from)} - ...`
          : '';

    return (
      <div>
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{label}</div>
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (!next) {
              const r = valueRef.current;
              if (r?.from && !r?.to) {
                setOpen(true);
                return;
              }
            }
            setOpen(next);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start font-normal h-10">
              {labelText || placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={value}
              onSelect={(range) => {
                onChange(range);
                if (range?.from && range?.to) {
                  setOpen(false);
                } else {
                  setOpen(true);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  interface Order {
    orderId: string;
    transactionId?: string;
    fleetName: string;
    duration: number;
    uom: string;
    unitQty: number;
    paymentStatus: number;
    customerName: string;
    totalAmount: number;
    // Keep these for potential filtering usage, map them if available
    title: string;
    createdAt: string;
    category: string;
    startDate: string;
    endDate: string;
    rentType?: string;
  }

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        let endpointBase = '/services/fleet/orders';
        
        // If type is explicitly tour, use tour endpoint (placeholder for now if not confirmed)
        if (type === 'tour') {
           // Assuming this endpoint exists based on convention, or falling back to fleet if it's the same table
           // For now, let's assume there's a separate endpoint or query
           endpointBase = '/services/packages/orders'; 
        }

        const op = normalizeRange(orderPeriod);
        const od = normalizeRange(orderDate);
        const qs = new URLSearchParams();
        if (searchTerm.trim()) qs.set('q', searchTerm.trim());
        if (statusFilter !== 'all') qs.set('status', statusFilter);
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
            const uomRaw = item.uom;
            const rentTypeRaw = item.rent_type;
            return {
              orderId:
                typeof orderIdRaw === 'string' || typeof orderIdRaw === 'number' ? String(orderIdRaw) : '',
              transactionId:
                typeof transactionIdRaw === 'string' || typeof transactionIdRaw === 'number'
                  ? String(transactionIdRaw)
                  : undefined,
              fleetName: typeof fleetNameRaw === 'string' ? fleetNameRaw : 'Unknown Unit',
              duration: Number.isFinite(Number(item.duration)) ? Number(item.duration) : 0,
              uom: typeof uomRaw === 'string' ? uomRaw : 'hari',
              unitQty: Number.isFinite(Number(item.unit_qty ?? item.qty)) ? Number(item.unit_qty ?? item.qty) : 0,
              paymentStatus: Number.isFinite(Number(item.payment_status)) ? Number(item.payment_status) : 0,
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
            } as Order;
          });
          setOrders(mappedOrders);
          // Default range sekarang berasal dari hari ini s/d +1 tahun
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, [type, searchTerm, statusFilter, orderPeriod, orderDate]);

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/20">Pembayaran Selesai</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/20">Menunggu Pembayaran</Badge>;
      case 3:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/20">Menunggu Persetujuan</Badge>;
      case 4:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/20">Pembayaran Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // order status calculation removed; backend filters data

  const filteredOrders = orders;

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    const next = Math.min(Math.max(1, page), Math.max(1, totalPages));
    setCurrentPage(next);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orderPeriod, orderDate]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        </div>
        {type === 'fleet' && status === 'all' && basePrefix === '/dashboard/partner' ? (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`${basePrefix}/orders/fleet/form`)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambahkan Pesanan
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Search</div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
          <DateRangePicker
            label="Order Period"
            value={orderPeriod}
            onChange={setOrderPeriod}
            placeholder="Pilih rentang"
          />
          <DateRangePicker
            label="Order Date"
            value={orderDate}
            onChange={setOrderDate}
            placeholder="Pilih rentang"
          />
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Status</div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | '1' | '2' | '3' | '4')}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="1">Sudah dibayar</SelectItem>
                <SelectItem value="2">Menunggu Pembayaran</SelectItem>
                <SelectItem value="4">Dalam Proses</SelectItem>
                <SelectItem value="3">Menunggu Persetujuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full h-10" onClick={() => {
              setSearchTerm('');
              setOrderPeriod(undefined);
              setOrderDate(undefined);
              setStatusFilter('all');
            }}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Orders ({filteredOrders.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white w-14">No</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">OrderId</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white min-w-[260px]">Nama Unit</th>
                  {type === 'fleet' && (
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Tipe</th>
                  )}
                  {type === 'fleet' && basePrefix === '/dashboard/partner' && (
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Tanggal Sewa</th>
                  )}
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Qty</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {currentOrders.map((order, idx) => (
                  <tr
                    key={order.transactionId || order.orderId || `${startIndex}-${idx}`}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{startIndex + idx + 1}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{order.fleetName}</span>
                    </td>
                    {type === 'fleet' && (
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {order.rentType || '-'}
                        </Badge>
                      </td>
                    )}
                    {type === 'fleet' && basePrefix === '/dashboard/partner' && (
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">{formatSewaRange(order.startDate, order.endDate)}</span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{order.unitQty} unit</span>
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (basePrefix === '/dashboard/partner' && type === 'fleet') {
                              navigate(`${basePrefix}/orders/fleet/detail/${order.orderId}`);
                              return;
                            }
                            navigate(`${basePrefix}/orders/detail/${order.orderId}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} dari {filteredOrders.length} order
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredOrders.filter(o => o.paymentStatus === 1).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Lunas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredOrders.filter(o => o.paymentStatus === 2 || o.paymentStatus === 3).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
            </div>
            <div>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {Number(summaryRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
