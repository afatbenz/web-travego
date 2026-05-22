import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Package, Car, Calendar, Users, MapPin, Phone, Mail, CreditCard, CheckCircle, Loader2, Pencil, MoreHorizontal, Ban, Printer } from 'lucide-react';
import { api, toFileUrl, uploadCommon } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Upload, X } from 'lucide-react';
import Swal from 'sweetalert2';

type ItineraryDay = {
  day: number;
  date: string;
  activities: string[];
};

type FleetItem = {
  fleet_id: string;
  fleet_name: string;
  fleet_type: string;
  quantity: number;
  price: number;
  addon_amount: number;
  addons: Array<{ addon_name: string; addon_price: number }>;
  charge_amount: number;
  discount: number;
  sub_total: number;
  order_id: string;
  order_item_id: string;
  price_id: string;
};

type OrderData = {
  id: string;
  fleetId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  category: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: number;
  status: string;
  totalAmount: number;
  remainingAmount: number;
  additionalAmount: number;
  originalAmount: number;
  discount: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string;
  pickupLocation: string;
  pickupTime: string;
  itinerary: ItineraryDay[];
  facilities: string[];
  additionalRequests: string;
  notes: string;
  order_id: string;
  rent_type_label: string;
  fleets: FleetItem[];
  pickup: {
    city_label: string;
    start_date: string;
    end_date: string;
    pickup_location: string;
    pickup_city: string;
  };
  scheduled: boolean;
  rawStatus?: number;
  rawPaymentStatus?: number;
  lastPaymentAmount?: number;
  lastPaymentMethod?: string;
};

type PaymentHistoryRow = {
  id: string;
  payment_type: number;
  payment_type_label: string;
  payment_method: number;
  payment_method_label: string;
  payment_amount: number;
  remaining_amount: number;
  payment_date: string;
  evidence_file: string;
  bank_name: string;
  bank_account: string;
};

type ScheduleDetailFleetRow = {
  fleetName: string;
  unitId: string;
  plateNumber: string;
  driverNames: string[];
  crewNames: string[];
};

type ScheduleDetailData = {
  scheduleId: string;
  departureTime: string;
  arrivalTime: string;
  destinationText: string;
  fleets: ScheduleDetailFleetRow[];
};

const createEmptyOrderData = (id: string): OrderData => ({
  id,
  fleetId: '',
  customerName: '-',
  customerEmail: '-',
  customerPhone: '-',
  customerAddress: '-',
  category: 'Armada',
  title: 'Order',
  description: '-',
  startDate: '',
  endDate: '',
  participants: 0,
  status: 'pending',
  totalAmount: 0,
  remainingAmount: 0,
  additionalAmount: 0,
  originalAmount: 0,
  discount: 0,
  createdAt: '',
  paymentStatus: 'pending',
  paymentMethod: '-',
  paymentDate: '',
  pickupLocation: '-',
  pickupTime: '-',
  itinerary: [],
  facilities: [],
  additionalRequests: '-',
  notes: '-',
  scheduled: false,
  rawStatus: 0,
  rawPaymentStatus: 0,
  lastPaymentAmount: 0,
  lastPaymentMethod: '-',
});

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const routeOrderId = params.transaction_id ?? params.order_id ?? params.id ?? '';
  const orderId = params.order_id;
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [orderData, setOrderData] = useState<OrderData>(() => createEmptyOrderData(routeOrderId || '-'));
  const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [paymentStatusOptions, setPaymentStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [bankOptions, setBankOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetailData | null>(null);
  const [loadingScheduleDetail, setLoadingScheduleDetail] = useState(false);
  const [orderInfoTab, setOrderInfoTab] = useState<'overview' | 'itinerary' | 'facilities' | 'schedule'>('overview');
  const [paymentTab, setPaymentTab] = useState<'summary' | 'history'>('summary');
  const fetchedPaymentHistoryFor = useRef<string>('');
  const fetchedScheduleFor = useRef<string>('');
  const [paymentForm, setPaymentForm] = useState({
    status: '',
    method: '',
    amount: '',
    proof: null as File | null,
    proofPreview: '',
    evidence: '',
    bankId: '',
    bankAccount: '',
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const showScheduleButton = (() => {
    const s = String(orderData.paymentStatus ?? '').toLowerCase().trim();
    // Jika sisa pembayaran masih sama dengan total biaya, berarti belum ada pembayaran sama sekali
    if (orderData.remainingAmount === orderData.totalAmount) return false;
    return s === 'pending' || s === 'paid' || s === 'lunas' || s === 'success';
  })();

  const isEditDisabled = (() => {
    const raw = String(orderData.pickup?.start_date ?? orderData.startDate ?? '').trim();
    if (!raw) return false;
    const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return false;
    const startDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return startDay.getTime() <= today.getTime();
  })();

  const isPaymentDisabled = (() => {
    const s = String(orderData.paymentStatus ?? '').toLowerCase().trim();
    return s === 'paid' || s === 'lunas' || s === 'success';
  })();

  const isWaitingConfirmation = orderData.rawStatus === 1 && orderData.rawPaymentStatus === 3;
  const isWaitingOrderConfirmation = orderData.rawStatus === 2 && orderData.rawPaymentStatus === 2;

  const scheduleUrlSuffix = (() => {
    const qs = new URLSearchParams();
    if (orderData.id) qs.set('order_id', orderData.id);
    if (orderData.fleetId) qs.set('fleet_id', orderData.fleetId);
    return qs.toString() ? `?${qs.toString()}` : '';
  })();

  const onEditOrder = () => {
    const resolvedId = (orderData.id || orderId || routeOrderId || '').trim();
    navigate(`${basePrefix}/orders/fleet/form?order_id=${encodeURIComponent(resolvedId)}`);
  };

  const onViewScheduleArmadaTim = () => {
    if (!showScheduleButton) return;
    const resolvedId = (orderData.id || orderId || '').trim();
    if (!resolvedId) return;
    if (orderData.scheduled) {
      navigate(`${basePrefix}/team/schedule-fleet/detail/${encodeURIComponent(resolvedId)}`);
      return;
    }
    navigate(`${basePrefix}/team/schedule-armada/add${scheduleUrlSuffix}`);
  };

  const onCancelOrder = async () => {
    const resolvedId = (orderData.id || orderId || routeOrderId || '').trim();
    if (!resolvedId) return;
    const result = await Swal.fire({
      title: 'Batalkan pesanan?',
      input: 'textarea',
      inputLabel: 'Alasan pembatalan',
      inputPlaceholder: 'Tulis alasan pembatalan...',
      inputAttributes: { autocapitalize: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Batalkan',
      cancelButtonText: 'Batal',
      preConfirm: (reason) => {
        const v = String(reason ?? '').trim();
        if (!v) {
          Swal.showValidationMessage('Alasan wajib diisi');
          return false;
        }
        return v;
      },
    });
    if (!result.isConfirmed) return;
    const reason = String(result.value ?? '').trim();
    const token = localStorage.getItem('token') ?? '';
    const res = await api.post<unknown>(
      '/services/fleet/order/cancel',
      { order_id: resolvedId, reason },
      token ? { Authorization: token } : undefined
    );
    if (res && res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pesanan dibatalkan.' });
      navigate(`${basePrefix}/orders/fleet`);
      return;
    }
    await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan pesanan.' });
  };

  const escapeHtml = (value: string) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const onPrintSuratPesanan = async () => {
    const resolvedId = (orderData.id || orderId || routeOrderId || '').trim();
    if (!resolvedId) return;
    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      try {
        popup.opener = null;
      } catch {
        void 0;
      }
      try {
        popup.document.open();
        popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Memproses Surat</title>
    <style>
      body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #0b1220; color: #e5e7eb; }
      .wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding: 24px; }
      .card { width: min(560px, 100%); background: rgba(17, 24, 39, 0.75); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; }
      .title { font-weight: 800; font-size: 18px; margin: 0 0 10px 0; }
      .desc { margin: 0; line-height: 1.5; color: #cbd5e1; }
      .row { display:flex; gap: 12px; align-items:center; margin-top: 14px; }
      .spinner { width: 18px; height: 18px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.18); border-top-color: #ffffff; animation: spin 0.9s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .hint { margin-top: 12px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="title">Surat sedang diproses</div>
        <p class="desc">Surat sedang diproses. Mohon tunggu dan izinkan popup.</p>
        <div class="row">
          <div class="spinner"></div>
          <div>Menunggu respon server...</div>
        </div>
        <div class="hint">Tab ini akan otomatis terbuka ke dokumen setelah proses selesai.</div>
      </div>
    </div>
  </body>
</html>`);
        popup.document.close();
      } catch {
        void 0;
      }
    }
    void Swal.fire({
      title: 'Surat sedang diproses',
      text: 'Surat sedang diproses. Mohon tunggu dan izinkan popup',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const token = localStorage.getItem('token') ?? '';
    const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api').replace(/\/+$/, '');
    const url = `${base}/services/print-management/fleet/order`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/pdf, application/octet-stream, application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({ order_id: resolvedId }),
      });

      const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
      if (!res.ok) throw new Error('PRINT_FAILED');

      if (contentType.includes('application/json')) {
        const json = (await res.json().catch(() => null)) as unknown;
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const root = record(json);
        const dataNode = record(root.data);
        const urlCandidate =
          String(dataNode.url ?? dataNode.file_url ?? dataNode.fileUrl ?? dataNode.path ?? dataNode.file ?? root.url ?? root.path ?? '').trim();
        if (urlCandidate) {
          const finalUrl = toFileUrl(urlCandidate);
          await wait(700);
          if (popup) popup.location.href = finalUrl;
          else window.open(finalUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Surat pesanan berhasil digenerate.' });
        if (popup) popup.close();
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      await wait(700);
      if (popup) popup.location.href = blobUrl;
      else {
        const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          await Swal.fire({ icon: 'warning', title: 'Popup diblokir', text: 'Izinkan popup untuk melihat dokumen.' });
        }
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      if (popup) popup.close();
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal generate surat pesanan.' });
    } finally {
      Swal.close();
    }
  };

  const onPrintInvoice = async () => {
    const resolvedOrderId = (orderData.id || orderId || routeOrderId || '').trim();
    if (!resolvedOrderId) return;

    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const startedAt = Date.now();

    const popup = window.open('about:blank', '_blank');
    if (popup) {
      try {
        popup.opener = null;
      } catch {
        void 0;
      }
      try {
        popup.document.open();
        popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice</title>
    <style>
      body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #0b1220; color: #e5e7eb; }
      .wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding: 24px; }
      .card { width: min(560px, 100%); background: rgba(17, 24, 39, 0.75); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; }
      .title { font-weight: 800; font-size: 18px; margin: 0 0 10px 0; }
      .desc { margin: 0; line-height: 1.5; color: #cbd5e1; }
      .row { display:flex; gap: 12px; align-items:center; margin-top: 14px; }
      .spinner { width: 18px; height: 18px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.18); border-top-color: #ffffff; animation: spin 0.9s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .hint { margin-top: 12px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="title">Invoice sedang disiapkan</div>
        <p class="desc">Mohon tunggu. Tab ini akan terbuka otomatis setelah invoice siap.</p>
        <div class="row">
          <div class="spinner"></div>
          <div>Menunggu respon server...</div>
        </div>
        <div class="hint">Pastikan popup diizinkan.</div>
      </div>
    </div>
  </body>
</html>`);
        popup.document.close();
      } catch {
        void 0;
      }
    }

    try {
      const token = localStorage.getItem('token') ?? '';
      const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api').replace(/\/+$/, '');
      const url = `${base}/services/print-management/fleet/invoice`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/pdf, application/octet-stream, application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({ order_id: resolvedOrderId }),
      });

      if (!res.ok) throw new Error('INVOICE_PRINT_FAILED');

      const waitMs = Math.max(0, 5000 - (Date.now() - startedAt));
      const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

      if (contentType.includes('application/json')) {
        const json = (await res.json().catch(() => null)) as unknown;
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const root = record(json);
        const dataNode = record(root.data);
        const urlCandidate =
          String(dataNode.url ?? dataNode.file_url ?? dataNode.fileUrl ?? dataNode.path ?? dataNode.file ?? root.url ?? root.path ?? '').trim();
        if (!urlCandidate) throw new Error('INVOICE_URL_EMPTY');

        await wait(waitMs);
        const finalUrl = toFileUrl(urlCandidate);
        if (popup) popup.location.href = finalUrl;
        else window.open(finalUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      await wait(waitMs);
      if (popup) popup.location.href = blobUrl;
      else window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch {
      if (popup) popup.close();
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyiapkan invoice.' });
    }
  };

  const canRefund = (() => {
    const status = String(orderData.paymentStatus ?? '').toLowerCase().trim();
    const isPaid = status === 'paid' || status === 'lunas' || status === 'success';
    if (!isPaid) return false;
    const startRaw = String(orderData.startDate ?? '').trim();
    if (!startRaw) return false;
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) return false;
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return startDay.getTime() > today.getTime();
  })();

  const fetchPaymentHistory = useCallback(
    async (resolvedOrderId: string) => {
      setLoadingPaymentHistory(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.post<unknown>(
          '/services/order/payment-history',
          { order_id: resolvedOrderId },
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setPaymentHistory([]);
          return [];
        }

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const toNumberSafe = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        let items: unknown[] = [];
        if (Array.isArray(payload)) items = payload;
        else if (payload && typeof payload === 'object') {
          const root = payload as Record<string, unknown>;
          const dataNode = root.data as unknown;
          const listNode =
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).items : undefined) ??
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).rows : undefined) ??
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).history : undefined) ??
            root.items ??
            root.rows ??
            root.history;
          if (Array.isArray(listNode)) items = listNode;
          else if (Array.isArray(dataNode)) items = dataNode;
        }

        const mapped = items.map((raw, idx) => {
          const o = record(raw);
          const id =
            toStringSafe(o.id ?? o.payment_id ?? o.paymentId ?? o.transaction_id ?? o.transactionId ?? idx).trim() ||
            `row-${idx}`;
          return {
            id,
            payment_type: toNumberSafe(o.payment_type ?? o.paymentType ?? o.type),
            payment_type_label: toStringSafe(o.payment_type_label ?? o.paymentTypeLabel ?? o.type_label ?? o.typeLabel).trim(),
            payment_method: toNumberSafe(o.payment_method ?? o.paymentMethod ?? o.method),
            payment_method_label: toStringSafe(
              o.payment_method_label ?? o.paymentMethodLabel ?? o.method_label ?? o.methodLabel
            ).trim(),
            payment_amount: toNumberSafe(o.payment_amount ?? o.paymentAmount ?? o.amount),
            remaining_amount: toNumberSafe(
              o.remaining_amount ?? o.remainingAmount ?? o.sisa_tagihan ?? o.remaining_payment ?? o.remainingPayment
            ),
            payment_date: toStringSafe(o.payment_date ?? o.paymentDate ?? o.created_at ?? o.createdAt).trim(),
            evidence_file: toStringSafe(o.evidence_file ?? o.evidenceFile ?? o.evidence ?? o.proof ?? o.file ?? o.path).trim(),
            bank_name: toStringSafe(o.bank_name ?? o.bankName ?? o.bank).trim(),
            bank_account: toStringSafe(o.bank_account ?? o.bankAccount).trim(),
          } satisfies PaymentHistoryRow;
        });

        const filtered = mapped.filter(
          (x) =>
            x.payment_type ||
            x.payment_method ||
            x.payment_amount ||
            x.remaining_amount ||
            x.payment_date ||
            x.evidence_file ||
            x.payment_type_label ||
            x.payment_method_label
        );

        setPaymentHistory(filtered);
        return filtered;
      } finally {
        setLoadingPaymentHistory(false);
      }
    },
    []
  );

  useEffect(() => {
    setOrderData(createEmptyOrderData(routeOrderId || '-'));
  }, [routeOrderId]);

  const fetchDetail = useCallback(async () => {
    if (!orderId) return;
    const token = localStorage.getItem('token');
    const response = await api.get<unknown>(`/services/fleet/order/detail/${orderId}`, token ? { Authorization: token } : undefined);
    if (response.status !== 'success') return;

    const record = (v: unknown): Record<string, unknown> =>
      v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    const root = record(response.data);
    const detail = record(root.order ?? root.transaction ?? root.detail ?? root);

    const getString = (v: unknown, fallback: string) =>
      typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : fallback;
    const getNumber = (v: unknown, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const pickup = record(detail.pickup);
    const customer = record(detail.customer);
    const payment = record(detail.payment);
    const hasPaymentInfoRaw = detail.payment && typeof detail.payment === 'object' && !Array.isArray(detail.payment);
    const hasPaymentInfo = hasPaymentInfoRaw && Object.keys(detail.payment as Record<string, unknown>).length > 0;
    const addonsRaw = detail.addon;
    const addons = Array.isArray(addonsRaw) ? (addonsRaw as unknown[]) : [];

    const normalizePaymentStatus = (raw: unknown): 'paid' | 'pending' | 'failed' => {
      if (raw === 1 || raw === '1' || raw === 'paid' || raw === 'lunas') return 'paid';
      if (raw === 4 || raw === '4' || raw === 'failed' || raw === 'gagal') return 'failed';
      if (raw === 2 || raw === '2' || raw === 3 || raw === '3') return 'pending';
      if (typeof raw === 'string') {
        const s = raw.toLowerCase().trim();
        if (s === 'paid' || s === 'lunas' || s === 'success') return 'paid';
        if (s === 'failed' || s === 'gagal' || s === 'cancelled') return 'failed';
        if (s === '' || s === 'pending' || s === 'unpaid') return 'pending';
      }
      return 'pending';
    };

    const paymentStatus = normalizePaymentStatus(detail.payment_status ?? payment.status ?? payment.payment_status);

    const rawStatus = getNumber(detail.status, 0);
    const rawPaymentStatus = getNumber(detail.payment_status ?? payment.status ?? payment.payment_status, 0);

    const lastPaymentAmount = getNumber(payment.payment_amount ?? payment.amount ?? detail.payment_amount ?? detail.amount, 0);
    const lastPaymentMethod = getString(payment.payment_method_label ?? payment.method_label ?? detail.payment_method_label ?? detail.method_label, '-');

    const quantity = getNumber(detail.quantity ?? detail.qty ?? detail.unit_qty ?? detail.unitQty, 0);

    const startDate = getString(pickup.start_date ?? pickup.startDate, '');
    const endDate = getString(pickup.end_date ?? pickup.endDate, '');
    const createdAt = getString(detail.order_date ?? detail.created_at ?? detail.createdAt, startDate || endDate || '');
    const paymentDate = getString(payment.payment_date ?? payment.paymentDate ?? detail.payment_date ?? detail.paymentDate, createdAt);

    const customerCity = getString(customer.city_label ?? customer.customer_city ?? customer.city, '');
    const customerAddressRaw = getString(customer.customer_address ?? customer.address, '-');
    const customerAddress = customerCity ? `${customerAddressRaw}, ${customerCity}` : customerAddressRaw;

    const pickupCityLabel = getString(pickup.city_label ?? pickup.pickup_city_label ?? '', '');
    const pickupLocationRaw = getString(pickup.pickup_location ?? pickup.pickupLocation, '-');
    const pickupLocation = pickupCityLabel ? `${pickupLocationRaw}, ${pickupCityLabel}` : pickupLocationRaw;

    const duration = getNumber(detail.duration, 0);
    const durationUom = getString(detail.duration_uom ?? detail.uom, '');
    const rentTypeLabel = getString(detail.rent_type_label ?? detail.rentTypeLabel, '');
    const fallbackDescriptionParts = [
      duration > 0 ? `Sewa ${duration}${durationUom ? ` ${durationUom}` : ''}` : '',
      rentTypeLabel,
    ].filter(Boolean);
    const description = fallbackDescriptionParts.length ? fallbackDescriptionParts.join(' • ') : '-';

    const facilities = addons
      .map((a) => (a && typeof a === 'object' ? (a as Record<string, unknown>) : {}))
      .map((a) => {
        const name = getString(a.addon_name ?? a.name, '');
        const priceValue = getNumber(a.addon_price ?? a.price, 0);
        if (!name) return '';
        if (priceValue > 0) return `${name} - Rp ${priceValue.toLocaleString('id-ID')}`;
        return name;
      })
      .filter(Boolean);

    const rawItinerary = Array.isArray(detail.itinerary) ? (detail.itinerary as unknown[]) : [];
    const groupedItinerary: Record<number, ItineraryDay> = {};

    rawItinerary.forEach((raw) => {
       const item = record(raw);
       const dayNum = getNumber(item.day, 1);
       const activityRaw = item.destination ?? item.activities ?? item.activity;
       if (!activityRaw) return;

       if (!groupedItinerary[dayNum]) {
         let dayDate = getString(item.date, '');
         if (!dayDate && startDate) {
           const baseDate = new Date(startDate);
           if (!isNaN(baseDate.getTime())) {
             baseDate.setDate(baseDate.getDate() + (dayNum - 1));
             dayDate = baseDate.toISOString().split('T')[0];
           }
         }

         groupedItinerary[dayNum] = {
           day: dayNum,
           date: dayDate,
           activities: [],
         };
       }
       
       if (Array.isArray(activityRaw)) {
          groupedItinerary[dayNum].activities.push(...activityRaw.map((a) => getString(a, '')).filter((s) => s));
        } else {
          const cityName = getString(item.city_label ?? item.city_name ?? '', '');
          const destination = getString(activityRaw, '');
          const activityText = cityName ? `${destination}, ${cityName}` : destination;
          if (activityText) groupedItinerary[dayNum].activities.push(activityText);
        }
     });

    const itinerary = Object.values(groupedItinerary).sort((a, b) => a.day - b.day);

    const fleetsRaw = detail.fleets;
    const fleets: FleetItem[] = Array.isArray(fleetsRaw)
      ? fleetsRaw.map((fleet: unknown) => {
          const f = record(fleet);
          const quantity = getNumber(f.quantity ?? f.qty, 0);
          const price = getNumber(f.price, 0);
          const chargeAmount = getNumber(f.charge_amount ?? f.chargeAmount, 0);
          const discountAmount = getNumber(f.discount, 0);
          const addonAmount = getNumber(f.addon_amount ?? f.addonAmount, 0);

          const addonsRaw = f.addons ?? f.addon;
          const addonsArr = Array.isArray(addonsRaw) ? (addonsRaw as unknown[]) : [];
          const addons = addonsArr
            .map((a) => record(a))
            .map((a) => {
              const addon_name = getString(a.addon_name ?? a.addonName ?? a.name ?? a.title, '').trim();
              const addon_price = getNumber(a.addon_price ?? a.addonPrice ?? a.price, 0);
              return addon_name ? { addon_name, addon_price } : null;
            })
            .filter((x): x is { addon_name: string; addon_price: number } => Boolean(x));

          const subTotalFromRes = getNumber(f.sub_total ?? f.subTotal, NaN);
          const computedSubTotal = Math.max(0, (price + addonAmount + chargeAmount - discountAmount) * quantity);
          const subTotal = Number.isFinite(subTotalFromRes) ? subTotalFromRes : computedSubTotal;

          return {
            fleet_id: getString(f.fleet_id ?? f.fleetId, ''),
            fleet_name: getString(f.fleet_name ?? f.fleetName, ''),
            fleet_type: getString(f.fleet_type ?? f.fleetType, ''),
            quantity,
            price,
            addon_amount: addonAmount,
            addons,
            charge_amount: chargeAmount,
            discount: discountAmount,
            sub_total: subTotal,
            order_id: getString(f.order_id ?? f.orderId, ''),
            order_item_id: getString(f.order_item_id ?? f.orderItemId, ''),
            price_id: getString(f.price_id ?? f.priceId, ''),
          };
        })
      : [];

    const discountSum = fleets.reduce((acc, f) => acc + (Number.isFinite(f.discount) ? f.discount : 0), 0);
    const chargeSum = fleets.reduce((acc, f) => acc + (Number.isFinite(f.charge_amount) ? f.charge_amount : 0), 0);
    const addonSum = fleets.reduce((acc, f) => acc + (Number.isFinite(f.addon_amount) ? f.addon_amount : 0), 0);
    const originalSum = fleets.reduce((acc, f) => acc + (Number.isFinite(f.price) ? f.price : 0) * (Number.isFinite(f.quantity) ? f.quantity : 0), 0);
    const computedTotalFallback = Math.max(0, originalSum + addonSum + chargeSum - discountSum);
    const totalFromRes = getNumber(detail.total_amount ?? detail.totalAmount, computedTotalFallback);

    const remainingAmountRaw = hasPaymentInfo
      ? getNumber(
          payment.payment_remaining ??
            payment.paymentRemaining ??
            payment.remaining_amount ??
            payment.remainingAmount ??
            detail.payment_remaining ??
            detail.paymentRemaining,
          totalFromRes
        )
      : totalFromRes;
    const remainingAmount = hasPaymentInfo ? Math.min(remainingAmountRaw, totalFromRes) : totalFromRes;

    const next: OrderData = {
      ...createEmptyOrderData(orderId),
      id: getString(detail.order_id ?? detail.id, orderId),
      fleetId: getString(detail.fleet_id ?? detail.fleetId, ''),
      customerName: getString(customer.customer_name ?? customer.customerName, '-'),
      customerEmail: getString(customer.customer_email ?? customer.customerEmail, '-'),
      customerPhone: getString(customer.customer_phone ?? customer.customerPhone, '-'),
      customerAddress,
      category: getString(detail.rent_type_label, 'Armada'),
      title: getString(detail.fleet_name ?? detail.package_name ?? detail.title, 'Order'),
      description,
      startDate,
      endDate,
      participants: quantity,
      status: getString(detail.status, paymentStatus === 'paid' ? 'success' : 'pending'),
      totalAmount: totalFromRes,
      remainingAmount,
      additionalAmount: chargeSum,
      originalAmount: originalSum,
      discount: discountSum,
      createdAt,
      paymentStatus,
      paymentMethod: getString(
        payment.payment_method_label ??
          payment.paymentMethodLabel ??
          detail.payment_method_label ??
          detail.paymentMethodLabel ??
          payment.payment_method ??
          payment.paymentMethod ??
          detail.payment_method ??
          detail.paymentMethod,
        '-'
      ),
      paymentDate,
      pickupLocation,
      pickupTime: getString(pickup.pickup_time ?? pickup.pickupTime, '-'),
      itinerary,
      facilities: facilities.length ? facilities : Array.isArray(detail.facilities) ? (detail.facilities as string[]) : [],
      additionalRequests: getString(detail.additional_request ?? detail.additional_requests ?? detail.additionalRequests, '-'),
      notes: getString(detail.notes, '-'),
      order_id: getString(detail.order_id ?? detail.id, orderId),
      rent_type_label: getString(detail.rent_type_label ?? detail.rentTypeLabel, ''),
      fleets,
      pickup: {
        city_label: getString(pickup.city_label ?? pickup.cityLabel, ''),
        start_date: getString(pickup.start_date ?? pickup.startDate, ''),
        end_date: getString(pickup.end_date ?? pickup.endDate, ''),
        pickup_location: getString(pickup.pickup_location ?? pickup.pickupLocation, ''),
        pickup_city: getString(pickup.pickup_city ?? pickup.pickupCity, ''),
      },
      scheduled: Boolean(detail.scheduled ?? false),
      rawStatus,
      rawPaymentStatus,
      lastPaymentAmount,
      lastPaymentMethod,
    };

    setOrderData(next);
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    const resolvedOrderId = (orderId || routeOrderId || orderData.id || '').trim();
    if (!resolvedOrderId) return;
    if (paymentTab !== 'history') return;
    if (fetchedPaymentHistoryFor.current === resolvedOrderId) return;
    fetchedPaymentHistoryFor.current = resolvedOrderId;
    fetchPaymentHistory(resolvedOrderId);
  }, [orderId, orderData.id, fetchPaymentHistory, paymentTab, routeOrderId]);

  const loadScheduleDetail = useCallback(async (resolvedOrderId: string) => {
    const record = (v: unknown): Record<string, unknown> =>
      v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

    setLoadingScheduleDetail(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(
        `/services/schedule/detail/${encodeURIComponent(resolvedOrderId)}`,
        token ? { Authorization: token } : undefined
      );
      if (res.status !== 'success') {
        setScheduleDetail(null);
        return;
      }

      const root = record(res.data);
      const detail = record(root.data ?? root.schedule ?? root.detail ?? root);
      const scheduleId = toStringSafe(detail.schedule_id ?? detail.scheduleId ?? root.schedule_id ?? root.scheduleId).trim();
      const departureTime = toStringSafe(detail.departure_time ?? detail.departureTime ?? detail.start_at ?? detail.startAt).trim();
      const arrivalTime = toStringSafe(detail.arrival_time ?? detail.arrivalTime ?? detail.end_at ?? detail.endAt).trim();

      let destinationText = '';
      const itineraryRaw = detail.itinerary;
      if (Array.isArray(itineraryRaw)) {
        const labels = itineraryRaw
          .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
          .map((x) => {
            const o = x as Record<string, unknown>;
            return toStringSafe(o.city_label ?? o.cityLabel).trim();
          })
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i);
        destinationText = labels.join(' - ');
      }

      const fleetsRaw = Array.isArray(detail.fleets) ? detail.fleets : Array.isArray(root.fleets) ? root.fleets : [];
      const fleets = fleetsRaw
        .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
        .map((x) => record(x))
        .map((o) => {
          const normalizeStringList = (raw: unknown) => {
            if (Array.isArray(raw)) return raw.map((v) => toStringSafe(v).trim()).filter(Boolean);
            const s = toStringSafe(raw).trim();
            return s ? [s] : [];
          };
          const normalizeNameList = (raw: unknown) => {
            if (Array.isArray(raw)) {
              if (raw.length > 0 && raw.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
                return (raw as Array<Record<string, unknown>>)
                  .map((x) => record(x))
                  .map((p) => toStringSafe(p.driver_name ?? p.driverName ?? p.crew_name ?? p.crewName ?? p.name ?? p.fullname).trim())
                  .filter(Boolean);
              }
              return raw.map((v) => toStringSafe(v).trim()).filter(Boolean);
            }
            const s = toStringSafe(raw).trim();
            return s ? [s] : [];
          };

          const fleetName = toStringSafe(o.fleet_name ?? o.fleetName ?? o.name).trim();
          const unitId = toStringSafe(o.vehicle_id ?? o.vehicleId).trim();
          const plateNumber = toStringSafe(o.plate_number ?? o.vehicleId).trim();
          const driverRaw = o.driver_id ?? o.driverId ?? o.drivers ?? o.driver;
          const crewRaw = o.crew_ids ?? o.crewIds ?? o.crews ?? o.crew;
          const driverNameRaw = o.driver_name ?? o.driverName ?? o.driver_names ?? o.driverNames;
          const crewNameRaw = o.crew_name ?? o.crewName ?? o.crew_names ?? o.crewNames;

          const driverNames = (() => {
            const names = normalizeNameList(driverNameRaw);
            if (names.length > 0) return names;
            const fromDriverObjOrList = normalizeNameList(driverRaw);
            if (fromDriverObjOrList.length > 0) return fromDriverObjOrList;
            return normalizeStringList(driverRaw);
          })();

          const crewNames = (() => {
            const names = normalizeNameList(crewNameRaw);
            if (names.length > 0) return names;
            const fromCrewObjOrList = normalizeNameList(crewRaw);
            if (fromCrewObjOrList.length > 0) return fromCrewObjOrList;
            return normalizeStringList(crewRaw);
          })();

          return { fleetName, unitId, plateNumber, driverNames, crewNames } satisfies ScheduleDetailFleetRow;
        });

      setScheduleDetail({
        scheduleId,
        departureTime,
        arrivalTime,
        destinationText,
        fleets,
      });
    } finally {
      setLoadingScheduleDetail(false);
    }
  }, []);

  useEffect(() => {
    const resolvedOrderId = (orderId || routeOrderId || orderData.id || '').trim();
    if (!resolvedOrderId) return;
    if (!orderData.scheduled) {
      setScheduleDetail(null);
      return;
    }
    if (orderInfoTab !== 'schedule') return;
    if (fetchedScheduleFor.current === resolvedOrderId) return;
    fetchedScheduleFor.current = resolvedOrderId;
    loadScheduleDetail(resolvedOrderId);
  }, [loadScheduleDetail, orderData.id, orderData.scheduled, orderId, orderInfoTab, routeOrderId]);

  useEffect(() => {
    const resolvedOrderId = (orderId || routeOrderId || orderData.id || '').trim();
    if (!resolvedOrderId) return;
    if (fetchedPaymentHistoryFor.current && fetchedPaymentHistoryFor.current !== resolvedOrderId) {
      fetchedPaymentHistoryFor.current = '';
      setPaymentHistory([]);
    }
    if (fetchedScheduleFor.current && fetchedScheduleFor.current !== resolvedOrderId) {
      fetchedScheduleFor.current = '';
      setScheduleDetail(null);
    }
  }, [orderId, orderData.id, routeOrderId]);

  useEffect(() => {
    if (orderInfoTab === 'schedule' && !orderData.scheduled) {
      setOrderInfoTab('overview');
    }
  }, [orderData.scheduled, orderInfoTab]);

  useEffect(() => {
    if (!isUpdatePaymentOpen) return;
    if (paymentStatusOptions.length > 0 && paymentMethodOptions.length > 0 && bankOptions.length > 0) return;
    const loadOptions = async () => {
      setLoadingPaymentOptions(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const [statusRes, methodRes, bankRes] = await Promise.all([
          api.get<unknown>('/general/payment-status', token ? { Authorization: token } : undefined),
          api.get<unknown>('/general/payment-method', token ? { Authorization: token } : undefined),
          api.get<unknown>('/general/bank-list', token ? { Authorization: token } : undefined),
        ]);

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

        const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

        const normalizeList = (res: unknown) => {
          const r = res as { status?: string; data?: unknown };
          if (r?.status !== 'success') return [];
          const payload = r.data as unknown;
          if (Array.isArray(payload)) return payload;
          if (payload && typeof payload === 'object') {
            const root = payload as Record<string, unknown>;
            const dataNode = root.data as unknown;
            const listNode =
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).items : undefined) ??
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).list : undefined) ??
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).rows : undefined) ??
              (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).data : undefined) ??
              root.items ??
              root.list ??
              root.rows;
            if (Array.isArray(listNode)) return listNode;
            if (Array.isArray(dataNode)) return dataNode;
          }
          return [];
        };

        const statusItems = normalizeList(statusRes);
        const methodItems = normalizeList(methodRes);
        const bankItems = normalizeList(bankRes);

        const mapOptions = (items: unknown[]) =>
          items
            .map((raw) => record(raw))
            .map((o) => {
              const value =
                toStringSafe(o.code ?? o.value ?? o.key ?? o.id ?? o.payment_status ?? o.paymentStatus).trim();
              const label =
                toStringSafe(o.name ?? o.label ?? o.title ?? o.payment_status_name ?? o.paymentStatusName).trim() || value;
              return value ? { value, label } : null;
            })
            .filter((x): x is { value: string; label: string } => Boolean(x));

        const mapBankOptions = (items: unknown[]) =>
          items
            .map((raw) => record(raw))
            .map((o) => {
              const value = toStringSafe(o.bank_id ?? o.id ?? o.code ?? o.value ?? o.key).trim();
              const label =
                toStringSafe(o.bank_name ?? o.name ?? o.label ?? o.title).trim() ||
                toStringSafe(o.account_name ?? '').trim() ||
                value;
              return value ? { value, label } : null;
            })
            .filter((x): x is { value: string; label: string } => Boolean(x));

        const statuses = mapOptions(statusItems);
        const methods = mapOptions(methodItems);
        const banks = mapBankOptions(bankItems);

        if (statuses.length > 0) setPaymentStatusOptions(statuses);
        if (methods.length > 0) setPaymentMethodOptions(methods);
        if (banks.length > 0) setBankOptions(banks);
      } finally {
        setLoadingPaymentOptions(false);
      }
    };
    loadOptions();
  }, [isUpdatePaymentOpen, paymentStatusOptions.length, paymentMethodOptions.length, bankOptions.length]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Lunas</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Selesai</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Berlangsung</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Menunggu</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === 'Paket Wisata' ? <Package className="h-5 w-5" /> : <Car className="h-5 w-5" />;
  };

  const formatRupiahInput = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    if (!number) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(number));
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const methodValue = String(paymentForm.method).trim();
    const paymentMethodLabel = paymentMethodOptions.find((m) => m.value === methodValue)?.label ?? methodValue;
    const methodLabelLower = paymentMethodLabel.toLowerCase();
    const paymentMethodInt = Number(methodValue);
    if (!Number.isFinite(paymentMethodInt)) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Metode pembayaran tidak valid.' });
      return;
    }

    const isTransfer = paymentMethodInt === 1002 || methodLabelLower.includes('transfer');

    if (canRefund) {
      if (!paymentForm.method || !paymentForm.amount) {
        await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Mohon lengkapi semua field yang wajib diisi.' });
        return;
      }
      if (isTransfer) {
        const bankIdNum = Number(paymentForm.bankId);
        if (!Number.isFinite(bankIdNum)) {
          await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Mohon pilih bank.' });
          return;
        }
        if (!paymentForm.bankAccount.trim()) {
          await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Mohon isi account name.' });
          return;
        }
      }

      setIsSubmittingPayment(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const resolvedOrderId = orderId || routeOrderId || orderData.id;
        if (!resolvedOrderId) {
          await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Order ID tidak ditemukan.' });
          return;
        }

        const bankIdNum = Number(paymentForm.bankId);
        const refundPayload = {
          order_id: resolvedOrderId,
          order_type: 1,
          payment_method: paymentMethodInt,
          bank_id: isTransfer && Number.isFinite(bankIdNum) ? bankIdNum : undefined,
          account_name: isTransfer && paymentForm.bankAccount.trim() ? paymentForm.bankAccount.trim() : undefined,
        };

        const refundRes = await api.post<unknown>(
          '/services/order/payment-refund',
          refundPayload,
          token ? { Authorization: token } : undefined
        );

        if (refundRes.status !== 'success') {
          await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat mengajukan refund.' });
          return;
        }

        await fetchPaymentHistory(resolvedOrderId);

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getStringSafe = (v: unknown, fallback: string) =>
          typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : fallback;
        const getNumberSafe = (v: unknown, fallback: number) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : fallback;
        };

        const detailRes = await api.get<unknown>(
          `/services/fleet/order/detail/${encodeURIComponent(resolvedOrderId)}`,
          token ? { Authorization: token } : undefined
        );
        if (detailRes.status === 'success') {
          const root = record(detailRes.data);
          const detail = record(root.order ?? root.transaction ?? root.detail ?? root);
          const paymentObj = record(detail.payment);
          const hasPaymentInfoRaw = detail.payment && typeof detail.payment === 'object' && !Array.isArray(detail.payment);
          const hasPaymentInfo = hasPaymentInfoRaw && Object.keys(detail.payment as Record<string, unknown>).length > 0;
          const totalFromRes = getNumberSafe(detail.total_amount ?? detail.totalAmount, orderData.totalAmount);
          const remaining = hasPaymentInfo
            ? getNumberSafe(
                paymentObj.payment_remaining ??
                  paymentObj.paymentRemaining ??
                  paymentObj.remaining_amount ??
                  paymentObj.remainingAmount ??
                  detail.payment_remaining ??
                  detail.paymentRemaining,
                totalFromRes
              )
            : totalFromRes;

          setOrderData((prev) => ({
            ...prev,
            paymentMethod: getStringSafe(
              paymentObj.payment_method_label ??
                paymentObj.paymentMethodLabel ??
                detail.payment_method_label ??
                detail.paymentMethodLabel,
              prev.paymentMethod
            ),
            paymentDate: getStringSafe(
              paymentObj.payment_date ?? paymentObj.paymentDate ?? detail.payment_date ?? detail.paymentDate,
              prev.paymentDate
            ),
            remainingAmount: remaining,
          }));
        }

        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Refund berhasil diajukan.' });
        setIsUpdatePaymentOpen(false);
        setPaymentForm({
          status: '',
          method: '',
          amount: '',
          proof: null,
          proofPreview: '',
          evidence: '',
          bankId: '',
          bankAccount: '',
        });
      } catch {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat mengajukan refund.' });
      } finally {
        setIsSubmittingPayment(false);
      }
      return;
    }

    if (!paymentForm.status || !paymentForm.method || !paymentForm.amount) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Mohon lengkapi semua field yang wajib diisi.' });
      return;
    }
    const paymentTypeInt = Number(String(paymentForm.status).trim());
    if (!Number.isFinite(paymentTypeInt)) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Status pembayaran tidak valid.' });
      return;
    }

    const isQris = methodLabelLower.includes('qris');
    const needsEvidence = isTransfer || isQris;
    if (needsEvidence && !paymentForm.proof) {
      await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Mohon upload bukti pembayaran.' });
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const record = (v: unknown): Record<string, unknown> =>
        v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
      let evidence = '';
      if (paymentForm.proof) {
        const uploadRes = await uploadCommon('payment', [paymentForm.proof], token);
        if (uploadRes.status !== 'success') {
          await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal upload bukti pembayaran.' });
          return;
        }

        const data = record(uploadRes.data);
        const filesRaw = data.files;
        evidence =
          Array.isArray(filesRaw) && filesRaw.length > 0
            ? (typeof filesRaw[0] === 'string' ? filesRaw[0] : typeof filesRaw[0] === 'number' ? String(filesRaw[0]) : '')
            : (typeof data.file === 'string' ? data.file : typeof data.path === 'string' ? data.path : '');

        if (!evidence) {
          await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Bukti pembayaran tidak valid.' });
          return;
        }
      }

      const paymentAmountStr = paymentForm.amount.replace(/[^0-9]/g, '');
      const paymentAmountInt = Number(paymentAmountStr);
      if (!Number.isFinite(paymentAmountInt) || paymentAmountInt <= 0) {
        await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Nominal pembayaran tidak valid.' });
        return;
      }
      const resolvedOrderId = orderId || routeOrderId || orderData.id;
      if (!resolvedOrderId) {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Order ID tidak ditemukan.' });
        return;
      }
      const paymentPayload = {
        order_id: resolvedOrderId,
        order_type: 1,
        payment_type: paymentTypeInt,
        payment_method: paymentMethodInt,
        payment_amount: paymentAmountInt,
        evidence_file: evidence || undefined,
        bank_id: isTransfer && paymentForm.bankId && Number.isFinite(Number(paymentForm.bankId)) ? Number(paymentForm.bankId) : undefined,
        bank_account: isTransfer && paymentForm.bankAccount.trim() ? paymentForm.bankAccount.trim() : undefined,
      };

      const payRes = await api.post<unknown>(
        '/services/order/payment',
        paymentPayload,
        token ? { Authorization: token } : undefined
      );

      if (payRes.status !== 'success') {
        if (payRes.statusCode === 400 && payRes.message === 'DOWN_PAYMENT_NOT_FOUND') {
          await Swal.fire({
            icon: 'error',
            title: 'Pembayaran Gagal Diperbarui',
            text: 'Order ini belum memiliki pembayaran DP',
          });
          return;
        }
        if (payRes.statusCode === 400 && payRes.message === 'DOWN_PAYMENT_ALREADY_EXIST') {
          await Swal.fire({
            icon: 'error',
            title: 'Pembayaran Gagal Diperbarui',
            text: 'Pembayaran uang muka sudah dilakukan',
          });
          return;
        }
        if (payRes.statusCode === 400 && payRes.message === 'PAYMENT_AMOUNT_UNREACHABLE') {
          await Swal.fire({
            icon: 'error',
            title: 'Pembayaran Gagal Diperbarui',
            text: 'Nominal pembayaran tidak sesuai',
          });
          return;
        }
        if (payRes.statusCode === 400 && payRes.message === 'PAYMENT_AMOUNT_MAX_EXCEEDED') {
          await Swal.fire({
            icon: 'error',
            title: 'Pembayaran Gagal Diperbarui',
            text: 'Nominal uang muka melebihi total tagihan',
          });
          return;
        }
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memperbarui pembayaran.' });
        return;
      }

      const getStringSafe = (v: unknown, fallback: string) =>
        typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : fallback;
      const getNumberSafe = (v: unknown, fallback: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
      const payData = record(payRes.data);
      const payDataInner = record(payData.data);
      const invoiceNumber = getStringSafe(
        payData.invoice_number ??
          payData.invoiceNumber ??
          payDataInner.invoice_number ??
          payDataInner.invoiceNumber,
        ''
      ).trim();

      if (invoiceNumber) {
        void Swal.fire({
          title: 'Memuat invoice...',
          text: 'Memuat invoice...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        try {
          const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api').replace(/\/+$/, '');
          const url = `${base}/services/print-management/fleet/invoice`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/pdf, application/octet-stream, application/json',
              'Content-Type': 'application/json',
              ...(token ? { Authorization: token } : {}),
            },
            body: JSON.stringify({ invoice_number: invoiceNumber, order_id: resolvedOrderId }),
          });

          const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
          if (!res.ok) throw new Error('INVOICE_PRINT_FAILED');

          if (contentType.includes('application/json')) {
            const json = (await res.json().catch(() => null)) as unknown;
            const root = record(json);
            const dataNode = record(root.data);
            const urlCandidate = getStringSafe(
              dataNode.url ??
                dataNode.file_url ??
                dataNode.fileUrl ??
                dataNode.path ??
                dataNode.file ??
                root.url ??
                root.path,
              ''
            ).trim();
            if (urlCandidate) {
              await wait(700);
              window.open(toFileUrl(urlCandidate), '_blank', 'noopener,noreferrer');
            }
          } else {
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            await wait(700);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
          }
        } catch {
          await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat invoice.' });
        } finally {
          Swal.close();
        }
      }

      let refreshedPaymentDate = '';
      let refreshedRemainingAmount: number | null = null;
      let refreshedPaymentMethodLabel = paymentMethodLabel;
      let refreshedPaymentStatus: string | null = null;

      const detailRes = await api.get<unknown>(
        `/services/fleet/order/detail/${encodeURIComponent(resolvedOrderId)}`,
        token ? { Authorization: token } : undefined
      );
      if (detailRes.status === 'success') {
        const root = record(detailRes.data);
        const detail = record(root.order ?? root.transaction ?? root.detail ?? root);
        const paymentObj = record(detail.payment);
        const hasPaymentInfoRaw = detail.payment && typeof detail.payment === 'object' && !Array.isArray(detail.payment);
        const hasPaymentInfo = hasPaymentInfoRaw && Object.keys(detail.payment as Record<string, unknown>).length > 0;

        const totalFromRes = getNumberSafe(detail.total_amount ?? detail.totalAmount, orderData.totalAmount);
        const remaining = hasPaymentInfo
          ? getNumberSafe(
              paymentObj.payment_remaining ??
                paymentObj.paymentRemaining ??
                paymentObj.remaining_amount ??
                paymentObj.remainingAmount ??
                detail.payment_remaining ??
                detail.paymentRemaining,
              totalFromRes
            )
          : totalFromRes;

        refreshedRemainingAmount = remaining;
        refreshedPaymentMethodLabel = getStringSafe(
          paymentObj.payment_method_label ??
            paymentObj.paymentMethodLabel ??
            detail.payment_method_label ??
            detail.paymentMethodLabel,
          refreshedPaymentMethodLabel
        );
        refreshedPaymentDate = getStringSafe(paymentObj.payment_date ?? paymentObj.paymentDate ?? detail.payment_date ?? detail.paymentDate, '');
        refreshedPaymentStatus = getStringSafe(detail.payment_status ?? paymentObj.status ?? paymentObj.payment_status, '');
      }

      const history = await fetchPaymentHistory(resolvedOrderId);
      let latestHistoryDate = '';
      let latestHistoryRemaining: number | null = null;
      if (history.length > 0) {
        const sorted = [...history].sort((a, b) => {
          const ta = new Date(a.payment_date).getTime();
          const tb = new Date(b.payment_date).getTime();
          return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
        });
        latestHistoryDate = sorted[0]?.payment_date ?? '';
        latestHistoryRemaining = Number.isFinite(sorted[0]?.remaining_amount) ? sorted[0]!.remaining_amount : null;
      }

      const nextRemainingAmount =
        typeof refreshedRemainingAmount === 'number'
          ? refreshedRemainingAmount
          : typeof latestHistoryRemaining === 'number'
            ? latestHistoryRemaining
            : orderData.remainingAmount;

      const nextPaymentDate = refreshedPaymentDate || latestHistoryDate || orderData.paymentDate;
      const nextPaymentMethod = refreshedPaymentMethodLabel || paymentMethodLabel;
      const nextPaymentStatus =
        typeof refreshedPaymentStatus === 'string' && refreshedPaymentStatus
          ? refreshedPaymentStatus
          : nextRemainingAmount <= 0
            ? 'paid'
            : 'pending';

      setOrderData((prev) => ({
        ...prev,
        paymentMethod: nextPaymentMethod,
        paymentStatus: nextPaymentStatus,
        paymentDate: nextPaymentDate,
        remainingAmount: nextRemainingAmount,
      }));

      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pembayaran berhasil diperbarui.' });
      setIsUpdatePaymentOpen(false);
      if (paymentForm.proofPreview && paymentForm.proofPreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(paymentForm.proofPreview);
        } catch {
          void 0;
        }
      }
      setPaymentForm({
        status: '',
        method: '',
        amount: '',
        proof: null,
        proofPreview: '',
        evidence: '',
        bankId: '',
        bankAccount: '',
      });
    } catch {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memperbarui pembayaran.' });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (value: string) => {
    if (!value) return '-';
    const raw = value.trim();
    let d: Date | null = null;

    const m1 = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m1) {
      const y = Number(m1[1]);
      const mo = Number(m1[2]) - 1;
      const day = Number(m1[3]);
      d = new Date(y, mo, day, 0, 0, 0, 0);
    }

    const m2 = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!d && m2) {
      const y = Number(m2[1]);
      const mo = Number(m2[2]) - 1;
      const day = Number(m2[3]);
      const hh = Number(m2[4]);
      const mm = Number(m2[5]);
      const ss = Number(m2[6] ?? 0);
      d = new Date(y, mo, day, hh, mm, ss, 0);
    }

    if (!d) {
      const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime())) d = parsed;
    }

    if (!d || isNaN(d.getTime())) return '-';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()] ?? '';
    const yyyy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mmm} ${yyyy} ${hh}:${mm}`.trim();
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentTypeLabel = (value: number) => {
    const key = String(value);
    return paymentStatusOptions.find((s) => s.value === key)?.label ?? key;
  };

  const getPaymentMethodLabel = (value: number) => {
    const key = String(value);
    return paymentMethodOptions.find((m) => m.value === key)?.label ?? key;
  };

  const paymentTimelineItems = (() => {
    if (paymentHistory.length === 0) return [];
    const grouped: Record<
      string,
      { label: string; totalAmount: number; lastDateRaw: string; lastTs: number }
    > = {};
    for (const h of paymentHistory) {
      const label = (h.payment_type_label || getPaymentTypeLabel(h.payment_type) || 'Pembayaran').trim() || 'Pembayaran';
      if (!grouped[label]) grouped[label] = { label, totalAmount: 0, lastDateRaw: '', lastTs: 0 };
      grouped[label].totalAmount += Number.isFinite(h.payment_amount) ? h.payment_amount : 0;

      const raw = (h.payment_date || '').trim();
      const candidate = raw.includes('T') ? raw : raw ? raw.replace(' ', 'T') : '';
      const ts = candidate ? new Date(candidate).getTime() : 0;
      if (Number.isFinite(ts) && ts > grouped[label].lastTs) {
        grouped[label].lastTs = ts;
        grouped[label].lastDateRaw = raw;
      } else if (!grouped[label].lastDateRaw && raw) {
        grouped[label].lastDateRaw = raw;
      }
    }
    return Object.values(grouped).sort((a, b) => (a.lastTs || 0) - (b.lastTs || 0));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="!w-auto !h-auto p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detail Pesanan
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Informasi lengkap pesanan pelanggan
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-200 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              onClick={onEditOrder}
              disabled={isEditDisabled}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Pesanan
            </Button>
            {orderData.rawStatus === 1 && !isWaitingConfirmation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                onClick={() => setIsUpdatePaymentOpen(true)}
                disabled={isPaymentDisabled}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pembayaran
              </Button>
            )}
            {isWaitingConfirmation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                onClick={() => setIsConfirmPaymentOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Konfirmasi Pembayaran
              </Button>
            )}
            {isWaitingOrderConfirmation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-green-600 bg-green-500 text-white hover:bg-green-600 dark:border-green-500 dark:bg-green-900/20 dark:text-white dark:hover:bg-green-900/30"
                onClick={() => setIsConfirmOrderOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Konfirmasi Pesanan
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                >
                  Lainnya
                  <MoreHorizontal className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                {!isWaitingConfirmation && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={!showScheduleButton}
                    onSelect={(e) => {
                      e.preventDefault();
                      onViewScheduleArmadaTim();
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Lihat Jadwal Armada dan Tim
                  </DropdownMenuItem>
                )}
                {!isWaitingConfirmation && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    onPrintSuratPesanan();
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Surat Pesanan
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={Math.max(0, orderData.totalAmount - orderData.remainingAmount) <= 0}
                  onSelect={(e) => {
                    e.preventDefault();
                    onPrintInvoice();
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={(e) => {
                    e.preventDefault();
                    onCancelOrder();
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Batalkan Pesanan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Informasi Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Lengkap</label>
                  <p className="text-gray-900 dark:text-white">{orderData.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{orderData.customerEmail}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nomor Telepon</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{orderData.customerPhone}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Alamat</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{orderData.customerAddress}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getCategoryIcon(orderData.category)}
                <span>Informasi Pesanan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={orderInfoTab} onValueChange={(v) => setOrderInfoTab(v as typeof orderInfoTab)}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger
                    value="overview"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="itinerary"
                  >
                    Itinerary
                  </TabsTrigger>
                  <TabsTrigger
                    value="facilities"
                  >
                    Fasilitas
                  </TabsTrigger>
                  {orderData.scheduled ? (
                    <TabsTrigger value="schedule">Jadwal Perjalanan</TabsTrigger>
                  ) : null}
                </TabsList>

                <div className="min-h-[420px] max-h-[620px] overflow-y-auto">
                  <TabsContent value="overview" className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID</label>
                        <p className="text-gray-900 dark:text-white font-medium">{orderData.order_id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipe Order</label>
                        <p className="text-gray-900 dark:text-white">{orderData.rent_type_label}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Mulai</label>
                        <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{orderData.pickup ? formatDateTime(orderData.pickup.start_date) : '-'}</span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Selesai</label>
                        <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{orderData.pickup ? formatDateTime(orderData.pickup.end_date) : '-'} ({orderData.duration || '-'} hari)</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Lokasi Penjemputan</label>
                      <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{orderData.pickup ? `${orderData.pickup.pickup_location || ''}, ${orderData.pickup.city_label || ''}` : '-'}</span>
                      </p>
                    </div>

                    <Separator className="my-4" />

                    {/* Fleet Table */}
                    <div className="mt-6">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 block">Detail Armada</label>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-sm font-medium w-[52px]">No</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium">Armada</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-sm font-medium w-[95px]">Jumlah Unit</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium w-[150px]">Harga</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium w-[150px]">Sub Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderData.fleets && orderData.fleets.map((fleet, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                                <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm text-center">{index + 1}</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                                  <div className="text-sm">{fleet.fleet_name}</div>
                                  {Array.isArray(fleet.addons) && fleet.addons.length > 0 ? (
                                    <div className="text-xs opacity-70 mt-1">
                                      {fleet.addons
                                        .map((a) => `${a.addon_name}${a.addon_price > 0 ? ` (${formatCurrency(a.addon_price)})` : ''}`)
                                        .join(' • ')}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm text-right whitespace-nowrap text-center">{fleet.quantity} unit</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right">
                                  <div>Rp {fleet.price.toLocaleString('id-ID')}</div>
                                  {Array.isArray(fleet.addons) && fleet.addons.length > 0 ? (
                                    <div className="text-xs opacity-70 mt-1">{formatCurrency(fleet.addon_amount || 0)}</div>
                                  ) : null}
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right font-medium">
                                  Rp {((fleet.price + (fleet.addon_amount || 0)) * fleet.quantity).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 space-y-1 max-w-sm ml-auto">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                          <span>Discount</span>
                          <span>- {formatCurrency(orderData.discount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                          <span>Biaya Lain</span>
                          <span>{formatCurrency(orderData.additionalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-white pt-1">
                          <span>Total</span>
                          <span>{formatCurrency(orderData.totalAmount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Permintaan Khusus</label>
                        <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                          <span>{orderData.additionalRequests || '-'}</span>
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="itinerary" className="pt-4">
                    {(orderData.itinerary ?? []).length === 0 ? (
                      <div className="py-8 text-center text-gray-500">Itinerary tidak tersedia</div>
                    ) : (
                      <div className="space-y-4">
                        {(orderData.itinerary ?? []).map((day, index) => {
                          const activities = Array.isArray(day.activities) ? day.activities : [];
                          return (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">Hari {day.day}</h4>
                                <span className="text-sm text-gray-600 dark:text-gray-300">({formatDate(day.date)})</span>
                              </div>
                              <ul className="space-y-1">
                                {activities.map((activity, actIndex) => (
                                  <li key={actIndex} className="text-sm text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="facilities" className="pt-4">
                    {(orderData.facilities ?? []).length === 0 ? (
                      <div className="py-8 text-center text-gray-500">Tidak ada fasilitas</div>
                    ) : (
                      <ul className="space-y-2">
                        {orderData.facilities?.map((facility, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-900 dark:text-white">{facility}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  {orderData.scheduled ? (
                    <TabsContent value="schedule" className="pt-4 space-y-4">
                      {loadingScheduleDetail ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">Memuat jadwal...</div>
                      ) : !scheduleDetail ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">Jadwal tidak ditemukan.</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jadwal Keberangkatan</label>
                              <p className="text-gray-900 dark:text-white">{formatDateTime(scheduleDetail.departureTime)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jadwal Kembali</label>
                              <p className="text-gray-900 dark:text-white">{formatDateTime(scheduleDetail.arrivalTime)}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Armada & Petugas</label>
                            {scheduleDetail.fleets.length === 0 ? (
                              <div className="text-sm text-gray-600 dark:text-gray-300">Data armada tidak ditemukan.</div>
                            ) : (
                              <div className="space-y-2">
                                {scheduleDetail.fleets.map((row, idx) => (
                                  <div
                                    key={`${row.unitId || row.fleetName || 'row'}-${idx}`}
                                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                                  >
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      Unit {idx + 1}{row.fleetName ? ` • ${row.fleetName}` : ''}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                      Unit ID: {row.unitId || '-'} • {row.plateNumber || '-'}
                                    </div>
                                    {row.driverNames.length > 0 ? (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        Driver: {row.driverNames.join(', ')}
                                      </div>
                                    ) : null}
                                    {row.crewNames.length > 0 ? (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        Crew: {row.crewNames.join(', ')}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  ) : null}

                </div>
              </Tabs>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Informasi Pembayaran</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentTab} onValueChange={(v) => setPaymentTab(v as typeof paymentTab)}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                  <TabsTrigger value="history">Riwayat</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="pt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Status Pembayaran</label>
                    <div className="mt-1">
                      {isWaitingConfirmation ? (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                          Menunggu Konfirmasi
                        </Badge>
                      ) : (
                        getPaymentStatusBadge(orderData.paymentStatus)
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Tanggal Pembayaran</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(orderData.paymentDate)}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Harga Awal</span>
                      <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(orderData.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Diskon</span>
                      <span className="text-sm text-red-600">-{formatCurrency(orderData.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Biaya Lain</span>
                      <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(orderData.additionalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Total Addon</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(
                          (orderData.fleets ?? []).reduce(
                            (acc, f) => acc + (Number.isFinite(f.addon_amount) ? f.addon_amount : 0),
                            0
                          )
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(orderData.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Terbayar</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(Math.max(0, orderData.totalAmount - orderData.remainingAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Sisa Tagihan</span>
                      <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(orderData.remainingAmount)}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="pt-4 space-y-3">
                  {loadingPaymentHistory ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">Memuat riwayat...</div>
                  ) : paymentHistory.length === 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">Belum ada riwayat pembayaran.</div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.map((h) => (
                        <div key={h.id} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {h.payment_type_label || getPaymentTypeLabel(h.payment_type)}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(h.payment_amount)}</div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {(h.payment_method_label || getPaymentMethodLabel(h.payment_method))} • {formatDateTime(h.payment_date)}
                          </div>
                          {Number.isFinite(h.remaining_amount) && h.remaining_amount > 0 ? (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              Sisa tagihan: {formatCurrency(h.remaining_amount)}
                            </div>
                          ) : null}
                          {h.bank_name || h.bank_account ? (
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {h.bank_name ? h.bank_name : '-'}{h.bank_account ? ` • ${h.bank_account}` : ''}
                            </div>
                          ) : null}
                          {h.evidence_file ? (
                            <div className="pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => window.open(toFileUrl(h.evidence_file), '_blank', 'noopener,noreferrer')}
                              >
                                Lihat Bukti
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Order Dibuat</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.createdAt)}</p>
                  </div>
                </div>
                {paymentTimelineItems.length > 0 ? (
                  <div className="space-y-4">
                    {paymentTimelineItems.map((p) => (
                      <div key={p.label} className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.label} • {formatCurrency(p.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{formatDateTime(p.lastDateRaw)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Dimulai</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Selesai</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Konfirmasi Pembayaran */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white dark:bg-gray-900 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Konfirmasi Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Metode Pembayaran</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{orderData.lastPaymentMethod || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Jumlah Pembayaran</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(orderData.lastPaymentAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="flex gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  Mohon pastikan dana sudah masuk ke rekening sebelum melakukan konfirmasi.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmPaymentOpen(false)}
                className="flex-1 rounded-xl"
              >
                Tutup
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                onClick={async () => {
                  // Placeholder for confirmation action
                  setIsConfirmPaymentOpen(false);
                  await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Pembayaran telah dikonfirmasi.',
                    timer: 2000,
                    showConfirmButton: false
                  });
                  // Optionally refresh data
                  window.location.reload();
                }}
              >
                Konfirmasi Sekarang
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Pesanan */}
      <Dialog open={isConfirmOrderOpen} onOpenChange={setIsConfirmOrderOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-white dark:bg-gray-900 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Konfirmasi Pesanan
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin mengkonfirmasi pesanan ini? Konfirmasi ini menandakan bahwa pesanan telah siap untuk diproses lebih lanjut.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOrderOpen(false)}
                className="flex-1 rounded-xl"
              >
                Tutup
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                disabled={isApproving}
                onClick={async () => {
                  const resolvedId = (orderData.id || orderId || routeOrderId || '').trim();
                  if (!resolvedId) return;

                  setIsApproving(true);
                  try {
                    const token = localStorage.getItem('token') ?? '';
                    const res = await api.post<unknown>(
                      `/services/fleet/order/process/approve/${encodeURIComponent(resolvedId)}`,
                      {},
                      token ? { Authorization: token } : undefined
                    );

                    if (res && res.status === 'success') {
                      setIsConfirmOrderOpen(false);
                      await Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Pesanan telah dikonfirmasi.',
                        timer: 2000,
                        showConfirmButton: false,
                      });
                      await fetchDetail();
                    } else {
                      await Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Gagal mengkonfirmasi pesanan. Silakan coba lagi.',
                      });
                    }
                  } catch (error) {
                    console.error('Error approving order:', error);
                    await Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Terjadi kesalahan sistem.',
                    });
                  } finally {
                    setIsApproving(false);
                  }
                }}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi Pesanan'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Update Pembayaran */}
      <Dialog open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-white dark:bg-gray-900 shadow-2xl rounded-2xl [&>button]:text-white">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {canRefund ? 'Ajukan Refund' : 'Update Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePayment} className="p-6 space-y-5">
            {!canRefund ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status Pembayaran</Label>
                  <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentStatusOptions.length > 0
                        ? paymentStatusOptions
                        : [
                            { value: 'dp', label: 'Uang Muka (DP)' },
                            { value: 'installment', label: 'Cicilan' },
                            { value: 'full', label: 'Pelunasan' },
                          ]
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Metode Pembayaran</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(v) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        method: v,
                        ...(String(v).trim() === '1002' ? {} : { bankId: '', bankAccount: '' }),
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentMethodOptions.length > 0
                        ? paymentMethodOptions
                        : [
                            { value: 'transfer', label: 'Transfer Bank' },
                            { value: 'qris', label: 'QRIS' },
                            { value: 'cash', label: 'Tunai' },
                          ]
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Metode Refund</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(v) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      method: v,
                      ...(String(v).trim() === '1002' ? {} : { bankId: '', bankAccount: '' }),
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-blue-500">
                    <SelectValue placeholder="Pilih Metode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(paymentMethodOptions.length > 0
                      ? paymentMethodOptions
                      : [
                          { value: 'transfer', label: 'Transfer Bank' },
                          { value: 'qris', label: 'QRIS' },
                          { value: 'cash', label: 'Tunai' },
                        ]
                    ).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {String(paymentForm.method).trim() === '1002' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Pilihan Bank</Label>
                  <Popover open={bankOpen} onOpenChange={setBankOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={bankOpen}
                        className="h-11 w-full justify-between rounded-xl border-gray-200"
                      >
                        {paymentForm.bankId
                          ? bankOptions.find((b) => b.value === paymentForm.bankId)?.label ?? paymentForm.bankId
                          : 'Pilih bank'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari bank..." />
                        <CommandList>
                          <CommandEmpty>Bank tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {bankOptions.map((b) => (
                              <CommandItem
                                key={b.value}
                                value={`${b.value} ${b.label}`}
                                onSelect={() => {
                                  setPaymentForm((prev) => ({ ...prev, bankId: b.value }));
                                  setBankOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    paymentForm.bankId === b.value ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {b.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{canRefund ? 'Account Name' : 'Bank Account'}</Label>
                  <Input
                    className="h-11 rounded-xl border-gray-200 focus:ring-blue-500"
                    placeholder={canRefund ? 'Masukkan nama pemilik rekening' : 'Masukkan nomor rekening / akun bank'}
                    value={paymentForm.bankAccount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nominal Pembayaran</Label>
              <div className="relative">
                <Input
                  className="h-11 rounded-xl border-gray-200 focus:ring-blue-500 font-medium"
                  placeholder="Rp 0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: formatRupiahInput(e.target.value) }))}
                />
              </div>
            </div>

            {!canRefund ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Bukti Pembayaran</Label>
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl transition-all duration-200 group overflow-hidden",
                    paymentForm.proofPreview
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  )}
                >
                  {paymentForm.proofPreview ? (
                    <div className="relative aspect-video w-full group">
                      <img
                        src={paymentForm.proofPreview}
                        alt="Proof"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-full h-10 w-10 p-0"
                          onClick={() => {
                            if (paymentForm.proofPreview && paymentForm.proofPreview.startsWith('blob:')) {
                              try {
                                URL.revokeObjectURL(paymentForm.proofPreview);
                              } catch {
                                void 0;
                              }
                            }
                            setPaymentForm((prev) => ({ ...prev, proof: null, proofPreview: '' }));
                          }}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer w-full">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Klik untuk upload bukti</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (paymentForm.proofPreview && paymentForm.proofPreview.startsWith('blob:')) {
                              try {
                                URL.revokeObjectURL(paymentForm.proofPreview);
                              } catch {
                                void 0;
                              }
                            }
                            setPaymentForm((prev) => ({
                              ...prev,
                              proof: file,
                              proofPreview: URL.createObjectURL(file),
                            }));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : null}

            <DialogFooter className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-11 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200"
                onClick={() => setIsUpdatePaymentOpen(false)}
                disabled={isSubmittingPayment}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className={cn(
                  'flex-1 rounded-xl h-11 text-white shadow-lg dark:shadow-none',
                  canRefund ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                )}
                disabled={isSubmittingPayment || loadingPaymentOptions}
              >
                {isSubmittingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : loadingPaymentOptions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat opsi...
                  </>
                ) : (
                  canRefund ? 'Ajukan Refund' : 'Update Pembayaran'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
