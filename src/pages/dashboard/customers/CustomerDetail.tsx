import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Building2, Calendar, Clock, CreditCard, Mail, MapPin, Package, Pencil, Phone, ReceiptText, User, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CustomerDetailData = {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_telephone: string;
  customer_bod: string;
  customer_company: string;
  customer_address: string;
  customer_city_name: string;
};

type OrderRow = {
  id: string;
  orderType: number;
  orderTypeLabel: string;
  orderId: string;
  date: string;
  total: number;
  orderStatusCode: number;
  orderStatusLabel: string;
  paymentStatusLabel: string;
};

function formatDateTime(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDateOnly(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function fetchOrdersSilent(path: string, token: string, payload: { customer_id: string }): Promise<unknown> {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
  const url = path.startsWith('http') ? path : `${base.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) return null;
  return json;
}

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersVisible, setOrdersVisible] = useState(6);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<unknown>(`/services/customers/detail/${encodeURIComponent(id)}`, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>;

        const customer_id = String(data.customer_id ?? data.id ?? id ?? '');
        const customer_name = String(data.customer_name ?? data.name ?? '');
        const customer_email = String(data.customer_email ?? data.email ?? '');
        const customer_phone = String(data.customer_phone ?? data.phone ?? '');
        const customer_telephone = String(data.customer_telephone ?? data.telephone ?? data.customer_tel ?? '');
        const customer_bod = String(data.customer_bod ?? data.date_of_birth ?? data.customer_dob ?? data.dob ?? '');
        const customer_company = String(data.customer_company ?? data.company_name ?? data.customer_company_name ?? '');
        const customer_address = String(data.customer_address ?? data.address ?? '');
        const customer_city_name = String(data.customer_city_name ?? data.city ?? data.city_label ?? '');

        setCustomer({
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_telephone,
          customer_bod,
          customer_company,
          customer_address,
          customer_city_name,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingOrders(true);
      try {
        const json = await fetchOrdersSilent('/services/customers/orders', token, { customer_id: id });
        const root = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
        const data = root.data as unknown;

        const toRecord = (v: unknown): Record<string, unknown> =>
          v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

        const toStringSafe = (v: unknown): string =>
          typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

        const toNumberSafe = (v: unknown): number => {
          const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : typeof v === 'bigint' ? Number(v) : NaN;
          return Number.isFinite(n) ? n : 0;
        };

        const normalizeRow = (orderId: string, raw: Record<string, unknown>): OrderRow => {
          const orderTypeRaw = raw.order_type ?? raw.orderType ?? raw.type ?? raw.category;
          const orderTypeStr = toStringSafe(orderTypeRaw).trim();
          const orderTypeCodeFromRaw = toNumberSafe(orderTypeRaw);
          const orderType =
            orderTypeCodeFromRaw === 1 || orderTypeCodeFromRaw === 2
              ? orderTypeCodeFromRaw
              : orderTypeStr.toLowerCase().includes('tour')
                ? 2
                : orderTypeStr.toLowerCase().includes('fleet')
                  ? 1
                  : 0;

          const orderTypeLabel =
            toStringSafe(raw.order_type_label ?? raw.orderTypeLabel ?? raw.order_type_str ?? raw.orderTypeStr).trim() ||
            (orderType === 1 ? 'Fleet Order' : orderType === 2 ? 'Tour Order' : orderTypeStr || '-');

          const createdAt = toStringSafe(raw.created_at ?? raw.order_date ?? raw.createdAt ?? raw.date).trim();
          const total = toNumberSafe(raw.total_amount ?? raw.total ?? raw.total_bill ?? raw.totalAmount);

          const orderStatusCode = toNumberSafe(raw.order_status ?? raw.orderStatus ?? raw.status_code ?? raw.statusCode);
          const orderStatusLabel =
            toStringSafe(raw.order_status_str ?? raw.orderStatusStr ?? raw.status_str ?? raw.statusStr ?? raw.status).trim() || '-';

          const paymentStatusLabel =
            toStringSafe(raw.payment_status_str ?? raw.paymentStatusStr ?? raw.payment_status_label ?? raw.paymentStatusLabel ?? raw.payment_status ?? raw.paymentStatus).trim() || '-';

          return {
            id: orderId || crypto.randomUUID(),
            orderId: orderId || '-',
            orderType,
            orderTypeLabel,
            date: createdAt,
            total,
            orderStatusCode,
            orderStatusLabel,
            paymentStatusLabel,
          };
        };

        let mapped: OrderRow[] = [];
        if (Array.isArray(data)) {
          mapped = data
            .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
            .filter((it): it is Record<string, unknown> => Boolean(it))
            .map((it) => {
              const orderId =
                toStringSafe(it.order_id ?? it.orderId ?? it.id ?? it.uuid ?? it.number).trim() || crypto.randomUUID();
              return normalizeRow(orderId, it);
            });
        } else if (data && typeof data === 'object') {
          const obj = toRecord(data);
          const directOrderId = toStringSafe(obj.order_id ?? obj.orderId ?? obj.id ?? obj.uuid).trim();
          const looksLikeSingleOrder = Boolean(
            directOrderId ||
              obj.created_at ||
              obj.order_status !== undefined ||
              obj.payment_status !== undefined ||
              obj.payment_status_str ||
              obj.total_amount !== undefined
          );

          if (looksLikeSingleOrder) {
            mapped = [normalizeRow(directOrderId || crypto.randomUUID(), obj)];
          } else {
            mapped = Object.entries(obj)
              .map(([orderId, value]) => normalizeRow(String(orderId), toRecord(value)))
              .filter((x) => x.orderId && x.orderId !== '-');
          }
        }

        setOrders(mapped);
        setOrdersVisible(6);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [id, token]);

  const addressText = useMemo(() => {
    const a = customer?.customer_address ?? '';
    const c = customer?.customer_city_name ?? '';
    if (a && c) return `${a}, ${c}`;
    return a || c || '-';
  }, [customer?.customer_address, customer?.customer_city_name]);

  const initials = useMemo(() => {
    const name = String(customer?.customer_name ?? '').trim();
    if (!name) return 'NA';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? 'N';
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : (parts[0]?.[1] ?? '');
    return `${first}${second}`.toUpperCase();
  }, [customer?.customer_name]);

  const ordersSorted = useMemo(() => {
    const list = [...orders];
    list.sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      if (!Number.isFinite(ta) && !Number.isFinite(tb)) return String(b.orderId).localeCompare(String(a.orderId));
      if (!Number.isFinite(ta)) return 1;
      if (!Number.isFinite(tb)) return -1;
      return tb - ta;
    });
    return list;
  }, [orders]);

  const totalOrders = ordersSorted.length;
  const totalAmount = useMemo(() => ordersSorted.reduce((sum, o) => sum + (Number.isFinite(o.total) ? o.total : 0), 0), [ordersSorted]);

  const customerSinceText = useMemo(() => {
    const oldest = [...ordersSorted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    if (!oldest?.date) return '-';
    return formatDateOnly(oldest.date);
  }, [ordersSorted]);

  const latestOrder = useMemo(() => ordersSorted[0] ?? null, [ordersSorted]);

  const preferredService = useMemo(() => {
    if (ordersSorted.length === 0) return '-';
    const map = new Map<string, number>();
    ordersSorted.forEach((o) => {
      const k = String(o.orderTypeLabel || '-');
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    let best = '-';
    let bestCount = 0;
    for (const [k, v] of map.entries()) {
      if (v > bestCount) {
        best = k;
        bestCount = v;
      }
    }
    return best;
  }, [ordersSorted]);

  const lastUpdatedText = useMemo(() => (latestOrder?.date ? formatDateTime(latestOrder.date) : '-'), [latestOrder?.date]);

  const statusBadge = (order: OrderRow) => {
    if (order.orderStatusCode === 2) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-100">
          <AlertTriangle className="h-4 w-4" />
          Belum Dikonfirmasi
        </span>
      );
    }

    if (order.orderStatusCode === 0) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-100">
          <XCircle className="h-4 w-4" />
          {order.orderStatusLabel && order.orderStatusLabel !== '-' ? order.orderStatusLabel : 'Dibatalkan'}
        </span>
      );
    }

    if (order.orderStatusCode === 1) {
      const payment = String(order.paymentStatusLabel ?? '').trim();
      const paymentLc = payment.toLowerCase();

      if (paymentLc === 'paid') {
        return (
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-100">
            <BadgeCheck className="h-4 w-4" />
            PAID
          </span>
        );
      }

      const isPending = ['waiting', 'pending', 'review', 'approval', 'process', 'proses'].some((x) => paymentLc.includes(x));

      return (
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border',
            isPending ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-700 border-slate-200'
          )}
        >
          <Clock className="h-4 w-4" />
          {payment || '-'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
        {order.orderStatusLabel || '-'}
      </span>
    );
  };

  const orderDetailLink = (order: OrderRow) => {
    if (order.orderType === 2) return `/dashboard/orders/tour/detail/${encodeURIComponent(order.orderId)}`;
    return `/dashboard/orders/fleet/detail/${encodeURIComponent(order.orderId)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in-0 duration-300">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => navigate(`${basePrefix}/customers`)}
              title="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">Detail Pelanggan</h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1 truncate">Informasi lengkap dan riwayat aktivitas pelanggan</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => navigate(`${basePrefix}/customers/edit/${encodeURIComponent(customer?.customer_id || id || '')}`)}
            className="w-full sm:w-auto text-sm h-10 px-4 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 font-semibold transition-all duration-300"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#295BFF]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Total Pesanan</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalOrders}</div>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#295BFF]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Total Transaksi</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#295BFF]">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Bergabung Sejak</div>
                <div className="text-2xl font-bold text-slate-900">{customerSinceText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeaderWithBadge
              className="p-6 pb-4 mb-5"
              badgeIcon={User}
              title="Informasi Pelanggan"
              subtitle="Data profil customer."
              actions={
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-semibold shrink-0">
                  <BadgeCheck className="h-4 w-4" />
                  Aktif
                </span>
              }
            />

            <CardContent className="p-6 pt-0">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : !customer ? (
                <div className="text-sm text-slate-600">Data customer tidak tersedia.</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold text-slate-900 truncate">{customer.customer_name || '-'}</div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="break-words">{customer.customer_email || '-'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{customer.customer_phone || '-'}</span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{customer.customer_company || '-'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">Email</div>
                          <div className="font-semibold text-slate-900 break-words">{customer.customer_email || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">Nomor HP</div>
                          <div className="font-semibold text-slate-900">{customer.customer_phone || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">Nomor Telepon</div>
                          <div className="font-semibold text-slate-900">{customer.customer_telephone || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">Tanggal Lahir</div>
                          <div className="font-semibold text-slate-900">{formatDateOnly(customer.customer_bod)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">Alamat</div>
                          </div>
                          <div className="font-semibold text-slate-900 break-words whitespace-pre-wrap">{addressText}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-xs font-semibold text-amber-700">Catatan Internal</div>
                    <div className="text-sm text-amber-800 mt-1">Belum ada catatan internal untuk pelanggan ini.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeaderWithBadge
              className="p-6 pb-4"
              badgeIcon={ReceiptText}
              title="Riwayat Pesanan"
              subtitle="Aktivitas transaksi terbaru pelanggan."
            />

            <CardContent className="p-6 pt-0">
              {loadingOrders ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : totalOrders === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="mt-4 text-lg font-bold text-slate-900">Belum ada riwayat pesanan</div>
                  <div className="mt-1 text-sm text-slate-500">Riwayat transaksi pelanggan akan muncul di sini.</div>
                  <Button
                    type="button"
                    className="mt-5 h-12 px-6 rounded-2xl bg-gradient-to-r from-[#295BFF] to-blue-500 text-white font-bold shadow-[0_12px_24px_rgba(41,91,255,0.25)] hover:-translate-y-1 transition-all duration-300"
                    onClick={() => navigate(`${basePrefix}/orders/fleet/form`)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Buat Pesanan Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ordersSorted.slice(0, ordersVisible).map((o) => (
                    <div
                      key={o.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-bold text-slate-900">{o.orderId}</div>
                            {statusBadge(o)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              {formatDateTime(o.date)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <ReceiptText className="h-4 w-4 text-slate-400" />
                              {o.orderTypeLabel || '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total</div>
                            <div className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(o.total)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl"
                            onClick={() => navigate(orderDetailLink(o))}
                          >
                            Detail
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {ordersVisible < totalOrders ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-dashed hover:border-blue-300 hover:bg-blue-50 transition-all"
                      onClick={() => setOrdersVisible((v) => v + 6)}
                    >
                      Muat lebih banyak
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center text-[#295BFF]">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-slate-900">Ringkasan Aktivitas</div>
                  <div className="text-sm text-slate-500">Info cepat pelanggan</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Latest Activity</div>
                  <div className="mt-1 font-semibold text-slate-900">{latestOrder ? `Order ${latestOrder.orderId}` : '-'}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Last Login</div>
                  <div className="mt-1 font-semibold text-slate-900">-</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Total Booking</div>
                  <div className="mt-1 font-semibold text-slate-900 tabular-nums">{totalOrders} pesanan</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Preferred Service</div>
                  <div className="mt-1 font-semibold text-slate-900">{preferredService}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Last Updated</div>
                  <div className="mt-1 font-semibold text-slate-900">{lastUpdatedText}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
