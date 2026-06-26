import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Check,
  X,
  Copy,
  Calendar,
  Building2,
  Tag,
  MapPin,
  Users,
  Receipt,
  FileText,
  User,
  Clock,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';

type OrderDetail = {
  purchase_id: string;
  transaction_id?: string;
  request_id?: string | number;
  suplier_name: string;
  supplier_name?: string;
  item_name: string;
  item_sku: string;
  item_id: string;
  item_uom: string;
  item_category: number;
  item_category_label: string;
  quantity: number;
  amount: number;
  total_amount: number;
  transaction_date: string;
  garage_name: string;
  garage_city_label: string;
  status: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
};

type StatusConfig = {
  label: string;
  className: string;
  icon: React.ElementType<{ className?: string }>;
};

type CopyableFieldProps = {
  label: string;
  value: string;
  icon?: React.ElementType<{ className?: string }>;
  onCopy: () => void;
};

type DetailMetricProps = {
  label: string;
  value: string;
  date?: string;
  icon: React.ElementType<{ className?: string }>;
};

type SummaryRowProps = {
  label: string;
  value: string;
};

type HeaderPillProps = {
  label: string;
  value: string;
  href?: string;
  isLink?: boolean;
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });
};

const formatDate = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return format(d, 'd MMMM yyyy', { locale: id });
};

const formatDateTime = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return `${format(d, 'd MMMM yyyy HH:mm', { locale: id })} WIB`;
};

const categoryLabel = (category: number, label: string): string => {
  if (label) return label;
  if (category === 1) return 'Asset Armada';
  if (category === 2) return 'Asset Kantor';
  return '-';
};

const statusConfig = (status: number): StatusConfig => {
  if (status === 1) {
    return {
      label: 'Diterima',
      icon: Clock,
      className: 'rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300',
    };
  }
  if (status === 2) {
    return {
      label: 'Diproses',
      icon: Clock,
      className: 'rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    };
  }
  if (status === 3) {
    return {
      label: 'Selesai',
      icon: Check,
      className: 'rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300',
    };
  }
  if (status === 4) {
    return {
      label: 'Dibatalkan',
      icon: X,
      className: 'rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300',
    };
  }
  return {
    label: '-',
    icon: Clock,
    className: 'rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-500/10 dark:text-gray-300',
  };
};

const getString = (obj: Record<string, unknown>, key: string): string => {
  const value = obj[key];
  return typeof value === 'string' ? value : '';
};

const getNumber = (obj: Record<string, unknown>, key: string): number => {
  const value = obj[key];
  return typeof value === 'number' ? value : 0;
};

const getRequestValue = (obj: Record<string, unknown>): string | undefined => {
  const value = obj.request_id;
  if (typeof value === 'string') return value || undefined;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const CopyableField = ({ label, value, icon: Icon = Copy, onCopy }: CopyableFieldProps) => (
  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/70 dark:bg-gray-800/60">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{value || '-'}</div>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white hover:text-blue-600 dark:hover:bg-gray-700"
          onClick={onCopy}
          aria-label={`Salin ${label}`}
        >
          {Icon ? <Icon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  </div>
);

const DetailMetric = ({ label, value, date, icon: Icon }: DetailMetricProps) => (
  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/70 dark:bg-gray-800/60">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:text-blue-300 dark:ring-gray-700">
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">{value || '-'}</div>
    {date && (
      <div className="mt-1 break-words text-sm font-normal text-gray-900 dark:text-white">{date || '-'}</div>
    )}
  </div>
);

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0 dark:border-gray-700/70">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const HeaderPill = ({ label, value, href, isLink }: HeaderPillProps) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/40">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">{value || '-'}</div>
      </div>
      {isLink && href && (
        <Link to={href} className="shrink-0 mt-0.5 text-gray-400 hover:text-blue-600">
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  </div>
);

export const InventoryOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const { purchaseid } = useParams<{ purchaseid: string }>();
  const purchaseId = purchaseid ? decodeURIComponent(purchaseid) : '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!purchaseId) return;
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';

      const res = await api.post<unknown>(
        '/inventories/orders/detail',
        { purchase_id: purchaseId },
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        const payload = res.data as unknown;
        const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
        const itemCategory = getNumber(data, 'item_category');
        const itemCategoryLabel = getString(data, 'item_category_label');

        setDetail({
          purchase_id: getString(data, 'purchase_id'),
          transaction_id: getString(data, 'transaction_id'),
          request_id: getRequestValue(data),
          suplier_name: getString(data, 'suplier_name') || getString(data, 'supplier_name'),
          item_name: getString(data, 'item_name'),
          item_sku: getString(data, 'item_sku'),
          item_id: getString(data, 'item_id'),
          item_uom: getString(data, 'item_uom'),
          item_category: itemCategory,
          item_category_label: categoryLabel(itemCategory, itemCategoryLabel),
          quantity: getNumber(data, 'quantity'),
          amount: getNumber(data, 'amount'),
          total_amount: getNumber(data, 'total_amount'),
          transaction_date: getString(data, 'transaction_date'),
          garage_name: getString(data, 'garage_name'),
          garage_city_label: getString(data, 'garage_city_label'),
          status: getNumber(data, 'status'),
          created_by: getString(data, 'created_by'),
          created_at: getString(data, 'created_at'),
          updated_by: getString(data, 'updated_by'),
          updated_at: getString(data, 'updated_at'),
        });
      } else {
        setDetail(null);
      }
      setLoading(false);
    };
    load();
  }, [purchaseId]);

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: `${label} berhasil disalin.` });
    } catch {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: `Gagal menyalin ${label.toLowerCase()}.` });
    }
  };

  const handleReceive = async () => {
    if (!detail || actionLoading) return;

    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin selesaikan pesanan item ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Selesaikan Pesanan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    const token = localStorage.getItem('token') ?? '';

    try {
      const res = await api.post<unknown>(
        '/inventories/orders/completed',
        { purchase_id: purchaseId },
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Item berhasil diterima.' });
        setDetail((prev) => (prev ? { ...prev, status: 3 } : null));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!detail || actionLoading) return;

    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    const token = localStorage.getItem('token') ?? '';

    try {
      const res = await api.post<unknown>(
        '/inventories/orders/cancel',
        { purchase_id: purchaseId },
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pesanan berhasil dibatalkan.' });
        setDetail((prev) => (prev ? { ...prev, status: 4 } : null));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const requestValue = detail?.request_id ? String(detail.request_id) : '';
  const status = detail ? statusConfig(detail.status) : statusConfig(0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Detail Pemesanan</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Memuat data...</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Detail Pemesanan</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Data tidak ditemukan</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 text-center">
          <p className="text-gray-500">Data pemesanan tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <button type="button" className="hover:text-gray-900 dark:hover:text-white" onClick={() => navigate(`${basePrefix}`)}>
          Dashboard
        </button>
        <span>&gt;</span>
        <button type="button" className="hover:text-gray-900 dark:hover:text-white" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
          Pemesanan Asset
        </button>
        <span>&gt;</span>
        <span className="font-medium text-gray-900 dark:text-white">Detail</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Detail Pemesanan</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi pemesanan asset</p>
          </div>
        </div>

        {detail.status === 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="h-10 rounded-2xl bg-blue-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
              onClick={handleReceive}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              Selesaikan Order
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-2xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:bg-gray-900 dark:hover:bg-red-950/30"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Batalkan Pesanan
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.9fr] xl:divide-x xl:divide-gray-100 dark:xl:divide-gray-700/70">
          <div className="p-6">
            <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 hover:bg-blue-200/10 dark:text-blue-300">
              Pesanan {status.label}
            </Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{detail.item_name || 'Detail Pemesanan'}</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <HeaderPill label="SKU" value={detail.item_sku} isLink href={`${basePrefix}/inventories/items/detail/${detail.item_id}`} />
              <HeaderPill label="Satuan" value={detail.item_uom || 'Pcs'} />
              <HeaderPill label="Kategori" value={detail.item_category_label} />
            </div>
          </div>

          <div className="space-y-3 p-6">
            <CopyableField
              label="Purchase ID"
              value={detail.purchase_id}
              onCopy={() => void copyText(detail.purchase_id, 'Purchase ID')}
            />
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/70 dark:bg-gray-800/60">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Request ID</div>
                  <div className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{requestValue || '-'}</div>
                </div>
                <div className="flex items-center gap-1">
                  {requestValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white hover:text-blue-600 dark:hover:bg-gray-700"
                      onClick={() => void copyText(requestValue, 'Request ID')}
                      aria-label="Salin Request ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  {requestValue && (
                    <Link to={`${basePrefix}/inventories/request/detail/${encodeURIComponent(requestValue)}`} className="shrink-0 mt-0.5 text-gray-400 hover:text-blue-600">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-[#0b111a] dark:text-blue-300 dark:ring-gray-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Informasi Pemesanan</CardTitle>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Detail transaksi dan tujuan pemesanan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailMetric label="Supplier" value={detail.suplier_name} icon={Store} />
              <DetailMetric label="Tanggal Transaksi" value={formatDate(detail.transaction_date)} icon={Calendar} />
              <DetailMetric label="Kategori" value={detail.item_category_label} icon={Tag} />
              <DetailMetric label="Garasi Tujuan" value={detail.garage_name} icon={Building2} />
              <DetailMetric label="Kota" value={detail.garage_city_label} icon={MapPin} />
              <DetailMetric label="Jumlah" value={`${detail.quantity} ${detail.item_uom || 'Pcs'}`} icon={Users} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-[#0b111a] dark:text-emerald-300 dark:ring-gray-700">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Ringkasan Pembayaran</CardTitle>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Rincian biaya pemesanan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700/70 dark:bg-gray-800/60">
              <SummaryRow label="Harga per Item" value={formatCurrency(detail.amount)} />
              <SummaryRow label="Jumlah" value={`${detail.quantity} ${detail.item_uom || 'Pcs'}`} />
              <SummaryRow label="Subtotal" value={formatCurrency(detail.total_amount)} />
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Pembayaran</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(detail.total_amount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 dark:bg-[#0b111a] dark:text-purple-300 dark:ring-gray-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Informasi Tambahan</CardTitle>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Metadata transaksi</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DetailMetric label="Dibuat Oleh" value={detail.created_by} date={formatDateTime(detail.created_at)} icon={User} />
            <DetailMetric label={detail.status === 1 ? "Diselesaikan Oleh" : detail.status === 2 ? "-" : "Dibatalkan Oleh"} value={detail.updated_by} date={formatDateTime(detail.updated_at)} icon={Calendar} />
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-700/70 dark:bg-gray-800/60">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:text-blue-300 dark:ring-gray-700">
                <Copy className="h-4 w-4" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Transaction ID</div>
                  <div className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">{detail.transaction_id || detail.purchase_id || '-'}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white hover:text-blue-600 dark:hover:bg-gray-700"
                  onClick={() => void copyText(detail.transaction_id || detail.purchase_id, 'Transaction ID')}
                  aria-label="Salin Transaction ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
