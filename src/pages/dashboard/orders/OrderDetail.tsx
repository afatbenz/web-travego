import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Package, Car, Calendar, Users, MapPin, Phone, Mail, CreditCard, CheckCircle, Loader2, Settings, Printer } from 'lucide-react';
import { api, toFileUrl, uploadCommon } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [paymentStatusOptions, setPaymentStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [bankOptions, setBankOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
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
    return s === 'pending' || s === 'paid' || s === 'lunas' || s === 'success';
  })();

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

  useEffect(() => {
    if (!orderId) return;

    const fetchDetail = async () => {
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

      const quantity = getNumber(detail.quantity ?? detail.qty ?? detail.unit_qty ?? detail.unitQty, 0);
      const price = getNumber(detail.price, 0);
      const totalAmount = getNumber(detail.total_amount ?? detail.totalAmount, 0);
      const additionalAmount = getNumber(detail.additional_amount ?? detail.additionalAmount, 0);
      const originalAmount = price > 0 && quantity > 0 ? price * quantity : getNumber(detail.original_amount ?? detail.originalAmount, totalAmount);
      const discount = Math.max(0, originalAmount - totalAmount);
      const remainingAmount = hasPaymentInfo
        ? getNumber(
            payment.payment_remaining ??
              payment.paymentRemaining ??
              payment.remaining_amount ??
              payment.remainingAmount ??
              detail.payment_remaining ??
              detail.paymentRemaining,
            totalAmount
          )
        : totalAmount;

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
      const fleets: FleetItem[] = Array.isArray(fleetsRaw) ? fleetsRaw.map((fleet: unknown) => {
        const f = record(fleet);
        return {
          fleet_id: getString(f.fleet_id ?? f.fleetId, ''),
          fleet_name: getString(f.fleet_name ?? f.fleetName, ''),
          fleet_type: getString(f.fleet_type ?? f.fleetType, ''),
          quantity: getNumber(f.quantity ?? f.qty, 0),
          price: getNumber(f.price, 0),
          charge_amount: getNumber(f.charge_amount ?? f.chargeAmount, 0),
          discount: getNumber(f.discount, 0),
          sub_total: getNumber(f.sub_total ?? f.subTotal, 0),
          order_id: getString(f.order_id ?? f.orderId, ''),
          order_item_id: getString(f.order_item_id ?? f.orderItemId, ''),
          price_id: getString(f.price_id ?? f.priceId, ''),
        };
      }) : [];

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
        totalAmount,
        remainingAmount,
        additionalAmount,
        originalAmount,
        discount,
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
      };

      setOrderData(next);
    };

    fetchDetail();
  }, [orderId]);

  useEffect(() => {
    const resolvedOrderId = orderId || routeOrderId || orderData.id;
    if (!resolvedOrderId) return;
    fetchPaymentHistory(resolvedOrderId);
  }, [orderId, routeOrderId, orderData.id, fetchPaymentHistory]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Detail Order {orderData.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Informasi lengkap pesanan pelanggan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getOrderStatusBadge(orderData.status)}
          {getPaymentStatusBadge(orderData.paymentStatus)}
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
              <Tabs defaultValue="overview">
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

                    {/* Fleet Table */}
                    <div className="mt-6">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 block">Detail Armada</label>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Armada</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Jumlah</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Harga</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Biaya Lain</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Discount</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Sub Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderData.fleets && orderData.fleets.map((fleet, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">{fleet.fleet_name}</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right">{fleet.quantity} unit</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right">
                                  Rp {fleet.price.toLocaleString('id-ID')}
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right">
                                  Rp {fleet.charge_amount.toLocaleString('id-ID')}
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right">
                                  Rp {fleet.discount.toLocaleString('id-ID')}
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-right font-medium">
                                  Rp {fleet.sub_total.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="dark:bg-gray-700">
                              <td colSpan={4} className="border border-white bg-white"></td>
                              <td className="px-3 py-2 text-left text-sm font-medium"><b>Total</b></td>
                              <td className="px-3 py-2 text-right text-sm font-medium"><b>
                                Rp {orderData.totalAmount.toLocaleString('id-ID')}</b>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
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

                </div>
              </Tabs>
            </CardContent>
          </Card>

          <div className={cn('grid gap-4', showScheduleButton ? 'grid-cols-4' : 'grid-cols-2')}>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsUpdatePaymentOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Update Pembayaran
            </Button>
            <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Cetak Invoice
            </Button>
            {showScheduleButton ? (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const qs = new URLSearchParams();
                  if (orderData.id) qs.set('order_id', orderData.id);
                  if (orderData.fleetId) qs.set('fleet_id', orderData.fleetId);
                  const suffix = qs.toString() ? `?${qs.toString()}` : '';
                  navigate(`${basePrefix}/team/schedule-armada/add${suffix}`);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Buat Jadwal
              </Button>
            ) : null}
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </div>

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
              <Tabs defaultValue="summary">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                  <TabsTrigger value="history">Riwayat</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="pt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Status Pembayaran</label>
                    <div className="mt-1">{getPaymentStatusBadge(orderData.paymentStatus)}</div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Pembayaran Dikonfirmasi</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.paymentDate)}</p>
                  </div>
                </div>
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
                      <img src={paymentForm.proofPreview} alt="Proof" className="w-full h-full object-cover" />
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
