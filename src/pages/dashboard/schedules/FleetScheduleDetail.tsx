import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Car, Check, CheckCircle, ChevronsUpDown, Clock, CreditCard, DollarSign, HandCoins, MoreHorizontal, Plus, Printer, ReceiptText, Save, Trash2, UsersRound, X, XCircle } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import BackButton from '@/components/common/BackButton';
import defaultAvatar from '@/assets/general/avatar.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

type Option = { value: string; label: string };

type FleetTripExpenseRow = {
  id: string;
  transactionItem: string;
  reporter: string;
  amount: number;
  paymentMethod: 1 | 2 | 0;
  paymentLabel: 'Lunas' | 'Tagihan';
};

type FleetTripExpenseTableRow = {
  id: string;
  transactionItemLabel: string;
  reporter: string;
  amount: number;
  paymentMethodLabel: string;
  description: string;
};

type FleetTripDetail = {
  scheduleFleetId: string;
  scheduleId: string;
  scheduleUnitId: string;
  orderId: string;
  unitId: string;
  departureTime: string;
  arrivalTime: string;
  endDate: string;
  fleetName: string;
  fleetPhoto: string;
  vehicleId: string;
  plateNumber: string;
  paymentStatus: number;
  driverName: string;
  driverId: string;
  driverAvatar: string;
  crewName: string;
  crewId: string;
  crewAvatar: string;
  expenses: FleetTripExpenseRow[];
};

const parseFleetTripFinance = (payload: unknown, scheduleNumberFallback: string) => {
  const root = toRecord(payload);
  const data = toRecord(root.data ?? root.detail ?? root);

  const rowsNode =
    (Array.isArray(data.expenses) ? data.expenses : undefined) ??
    (Array.isArray(data.expesnes) ? data.expesnes : undefined) ??
    (Array.isArray(data.transactions) ? data.transactions : undefined) ??
    (Array.isArray(data.items) ? data.items : undefined) ??
    [];

  const expenses = (rowsNode as unknown[]).map((raw, idx) => {
    const o = toRecord(raw);
    const id =
      pickString(o, ['expense_id', 'transaction_id', 'transactionId', 'id', 'uuid']) ||
      `${scheduleNumberFallback}-expense-${idx}`;
    const transactionItemLabel =
      pickString(o, ['transaction_item_label', 'transactionItemLabel', 'transaction_type_label', 'transactionTypeLabel', 'label', 'name']) ||
      pickString(o, ['transaction_item', 'transactionItem']) ||
      '-';
    const reporter =
      pickString(o, ['created_by', 'createdBy', 'created_by_name', 'createdByName', 'reporter', 'reporter_name', 'user_name', 'userName']) || '-';
    const description = pickString(o, ['description', 'desc', 'note']) || '-';
    const amount = toNumberSafe(o.amount ?? o.total_amount ?? o.totalAmount ?? o.nominal ?? o.value);
    const paymentMethodLabelRaw = pickString(o, ['payment_method_label', 'paymentMethodLabel', 'payment_label', 'paymentLabel']);
    const paymentMethodNum = toNumberSafe(o.payment_method ?? o.paymentMethod);
    const paymentMethodLabel =
      paymentMethodLabelRaw ||
      (paymentMethodNum === 1 ? 'Biaya Operasional' : paymentMethodNum === 2 ? 'Reimburse' : '-');

    const row: FleetTripExpenseTableRow = {
      id,
      transactionItemLabel,
      reporter,
      amount,
      paymentMethodLabel,
      description,
    };
    return row;
  });

  const totalAmount = toNumberSafe(data.total_amount ?? data.tota_amount ?? data.totalAmount);
  const totalExpenses = toNumberSafe(data.total_expenses ?? data.totalExpenses);
  const totalReimburse = toNumberSafe(data.total_reimburse ?? data.totalReimburse);
  const balance = toNumberSafe(data.balance ?? data.sisa_operasional ?? data.balance_amount ?? data.balanceAmount);

  return { totalAmount, totalExpenses, totalReimburse, balance, expenses };
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

const toNumberSafe = (v: unknown): number => {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? Number(v)
        : typeof v === 'bigint'
          ? Number(v)
          : NaN;
  return Number.isFinite(n) ? n : 0;
};

const pickString = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const s = toStringSafe(obj[k]).trim();
    if (s) return s;
  }
  return '';
};

const tryFormatDate = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const tryFormatDateTime = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const toYmdFromAny = (value: string): string => {
  const v = String(value ?? '').trim();
  if (!v) return '';
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

const formatRupiahInput = (digits: string) => {
  const clean = String(digits ?? '').replace(/\D/g, '');
  if (!clean) return '';
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return '';
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
};

const getInitials = (nameRaw: string): string => {
  const name = nameRaw.trim();
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : parts[0]?.[1] ?? '';
  return (first + second).toUpperCase() || '?';
};

const parseFleetTripDetail = (payload: unknown, scheduleNumberFallback: string): FleetTripDetail => {
  const root = toRecord(payload);
  const data = toRecord(root.data ?? root.detail ?? root);

  const expensesNode =
    (Array.isArray(data.expenses) ? data.expenses : undefined) ??
    (Array.isArray(data.expense_items) ? data.expense_items : undefined) ??
    (Array.isArray(data.transactions) ? data.transactions : undefined) ??
    (Array.isArray(data.items) ? data.items : undefined) ??
    [];

  const expenses = (expensesNode as unknown[]).map((raw, idx) => {
    const o = toRecord(raw);
    const id =
      pickString(o, ['expense_id', 'transaction_id', 'transactionId', 'id', 'uuid']) ||
      `${scheduleNumberFallback}-expense-${idx}`;
    const transactionItem =
      pickString(o, ['transaction_item_label', 'transactionItemLabel', 'transaction_type_label', 'transactionTypeLabel', 'name', 'label']) ||
      pickString(o, ['transaction_item', 'transactionItem']) ||
      '-';
    const reporter =
      pickString(o, ['reporter', 'reporter_name', 'reporterName', 'created_by_name', 'createdByName', 'user_name', 'userName', 'created_by']) ||
      '-';
    const amount = toNumberSafe(o.amount ?? o.total_amount ?? o.totalAmount ?? o.nominal ?? o.value);
    const paymentMethodNum = toNumberSafe(o.payment_method ?? o.paymentMethod ?? o.funding_type ?? o.fundingType);
    const paymentMethod = paymentMethodNum === 1 ? 1 : paymentMethodNum === 2 ? 2 : 0;
    const statusRaw = toStringSafe(o.status_label ?? o.statusLabel ?? o.status ?? o.payment_status_label ?? o.paymentStatusLabel).trim();
    const statusNum = toNumberSafe(o.payment_status ?? o.paymentStatus ?? o.status_id ?? o.statusId);
    const normalized = statusRaw.toLowerCase();
    const paymentLabel: 'Lunas' | 'Tagihan' =
      statusNum === 1 || normalized.includes('lunas') || normalized.includes('paid') || normalized.includes('settled') ? 'Lunas' : 'Tagihan';

    return { id, transactionItem, reporter, amount, paymentMethod, paymentLabel } satisfies FleetTripExpenseRow;
  });

  return {
    scheduleFleetId:
      pickString(data, ['schedule_fleet_id', 'scheduleFleetId']) ||
      pickString(data, ['schedule_fleet_uuid', 'scheduleFleetUuid']) ||
      scheduleNumberFallback ||
      '-',
    scheduleId: pickString(data, ['schedule_id', 'scheduleId']) || '-',
    scheduleUnitId: pickString(data, ['schedule_unit_id', 'scheduleUnitId']) || '-',
    orderId: pickString(data, ['order_id', 'orderId']) || '-',
    unitId: pickString(data, ['unit_id', 'unitId']) || '-',
    departureTime: pickString(data, ['departure_time', 'departureTime', 'start_date', 'trip_date']) || '',
    arrivalTime: pickString(data, ['arrival_time', 'arrivalTime']) || '',
    endDate: pickString(data, ['end_date', 'endDate', 'finish_date']) || '',
    fleetName: pickString(data, ['fleet_name', 'fleetName']) || '-',
    fleetPhoto: pickString(data, ['fleet_photo', 'fleetPhoto']) || '',
    vehicleId: pickString(data, ['vehicle_id', 'vehicleId']) || '-',
    plateNumber: pickString(data, ['plate_number', 'plateNumber']) || '-',
    paymentStatus: toNumberSafe(data.payment_status ?? data.paymentStatus ?? data.status),
    driverName: pickString(data, ['driver_name', 'driverName']) || '-',
    driverId: pickString(data, ['driver_id', 'driverId']) || '-',
    driverAvatar: pickString(data, ['driver_avatar', 'driverAvatar']) || '',
    crewName: pickString(data, ['crew_name', 'crewName', 'co_driver_name', 'coDriverName']) || '-',
    crewId: pickString(data, ['crew_id', 'crewId', 'co_driver_id', 'coDriverId']) || '-',
    crewAvatar: pickString(data, ['crew_avatar', 'crewAvatar', 'co_driver_avatar', 'coDriverAvatar']) || '',
    expenses,
  };
};

const KeyValueGrid: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 dark:bg-[#1c2633] dark:border-[#334155] dark:text-[#D1D5DB]">
          <div className="text-[11px] font-medium text-muted-foreground">{item.label}</div>
          <div className="mt-1 text-sm font-semibold text-foreground break-words">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export const FleetScheduleDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const token = localStorage.getItem('token') ?? '';

  const scheduleNumberParam = (params.schedule_number ?? params.scheduleNumber ?? params.order_id ?? params.orderid ?? params.id ?? '')
    .toString()
    .trim();
  const scheduleNumber = scheduleNumberParam.trim();

  const [loading, setLoading] = useState(false);
  const [fleetTrip, setFleetTrip] = useState<FleetTripDetail | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addExpenseSubmitting, setAddExpenseSubmitting] = useState(false);
  const [transactionTypesLoading, setTransactionTypesLoading] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<Option[]>([]);
  const [transactionTypeOpen, setTransactionTypeOpen] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState({ transaction_item: '', amount: '', description: '', payment_method: '1' as '1' | '2' });
  const [financeTotalsOverride, setFinanceTotalsOverride] = useState<null | { totalAmount: number; totalExpenses: number; totalReimburse: number; balance?: number }>(null);
  const [financeExpenses, setFinanceExpenses] = useState<FleetTripExpenseTableRow[]>([]);
  const [financeLoaded, setFinanceLoaded] = useState(false);

  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewSubmitting, setCrewSubmitting] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityOptions, setAvailabilityOptions] = useState<Option[]>([]);
  const [crewDraft, setCrewDraft] = useState({ driver_id: '', crew_id: '' });

  const [deletingExpenseId, setDeletingExpenseId] = useState<string>('');

  const onPrintSuratJalan = async () => {
    if (!scheduleNumber) return;
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
    <title>Generate File...</title>
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
        <div class="title">Generate File...</div>
        <p class="desc">Mohon tunggu dan izinkan popup.</p>
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
      title: 'Generate File...',
      text: 'Generate File...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const base = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api').replace(/\/+$/, '');
    const url = `${base}/services/print-management/fleet/trips/${encodeURIComponent(scheduleNumber)}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf, application/octet-stream, application/json',
          ...(token ? { Authorization: token } : {}),
        },
      });
      const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
      if (!res.ok) throw new Error('PRINT_FAILED');

      if (contentType.includes('application/json')) {
        const json = (await res.json().catch(() => null)) as unknown;
        const root = toRecord(json);
        const dataNode = toRecord(root.data);
        const urlCandidate =
          String(dataNode.url ?? dataNode.file_url ?? dataNode.fileUrl ?? dataNode.path ?? dataNode.file ?? root.url ?? root.path ?? '').trim();
        if (urlCandidate) {
          const finalUrl = toFileUrl(urlCandidate);
          await wait(700);
          if (popup) popup.location.href = finalUrl;
          else window.open(finalUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Surat jalan berhasil digenerate.' });
        if (popup) popup.close();
        return;
      }

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: 'application/pdf' });
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
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal generate surat jalan.' });
    } finally {
      Swal.close();
    }
  };

  const loadFleetTrip = async () => {
    if (!scheduleNumber) return;
    setLoading(true);
    try {
      const headers = token ? { Authorization: token } : undefined;
      const [detailRes, financeRes] = await Promise.all([
        api.get<unknown>(`/services/schedule/fleet-trip/detail/${encodeURIComponent(scheduleNumber)}`, headers),
        api.get<unknown>(`/services/transactions/fleet-trip?schedule_number=${encodeURIComponent(scheduleNumber)}`, headers),
      ]);

      if (detailRes.status !== 'success') {
        setFleetTrip(null);
      } else {
        setFleetTrip(parseFleetTripDetail(detailRes.data, scheduleNumber));
      }

      if (financeRes.status === 'success') {
        const parsed = parseFleetTripFinance(financeRes.data, scheduleNumber);
        setFinanceLoaded(true);
        setFinanceExpenses(parsed.expenses);
        setFinanceTotalsOverride({
          totalAmount: parsed.totalAmount,
          totalExpenses: parsed.totalExpenses,
          totalReimburse: parsed.totalReimburse,
          balance: parsed.balance,
        });
      } else {
        setFinanceLoaded(false);
        setFinanceExpenses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scheduleNumber) return;
    loadFleetTrip();
  }, [scheduleNumber, token]);

  useEffect(() => {
    setFinanceTotalsOverride(null);
    setFinanceExpenses([]);
    setFinanceLoaded(false);
  }, [scheduleNumber]);

  useEffect(() => {
    if (!addExpenseOpen) return;
    if (transactionTypes.length > 0) return;
    (async () => {
      setTransactionTypesLoading(true);
      try {
        const res = await api.get<unknown>(
          '/services/transactions/types?filteredby=items&type=expense&order_type=fleet&tags=operations',
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setTransactionTypes([]);
          return;
        }
        const payload = res.data as unknown;
        const root = toRecord(payload);
        const data = toRecord(root.data ?? root);
        const itemsRaw =
          (Array.isArray(payload) ? payload : undefined) ??
          (Array.isArray(data.items) ? data.items : undefined) ??
          (Array.isArray(data.rows) ? data.rows : undefined) ??
          (Array.isArray(data.data) ? data.data : undefined) ??
          (Array.isArray(root.items) ? root.items : undefined) ??
          (Array.isArray(root.rows) ? root.rows : undefined) ??
          (Array.isArray(root.data) ? root.data : undefined) ??
          [];
        const mapped = (itemsRaw as unknown[])
          .map((raw) => toRecord(raw))
          .map((o) => {
            const value = pickString(o, ['id', 'uuid', 'transaction_item_id', 'transactionItemId', 'value']);
            const label = pickString(o, ['label', 'name', 'transaction_item_label', 'transactionItemLabel']);
            return value ? { value, label: label || value } : null;
          })
          .filter((x): x is Option => Boolean(x));
        setTransactionTypes(mapped);
      } finally {
        setTransactionTypesLoading(false);
      }
    })();
  }, [addExpenseOpen, token, transactionTypes.length]);

  const selectedTransactionTypeLabel = useMemo(() => {
    const id = expenseDraft.transaction_item;
    if (!id) return '';
    return transactionTypes.find((x) => x.value === id)?.label ?? id;
  }, [expenseDraft.transaction_item, transactionTypes]);

  const showPaymentMethod = useMemo(() => expenseDraft.transaction_item !== 'TRX-I00', [expenseDraft.transaction_item]);

  useEffect(() => {
    if (!showPaymentMethod && expenseDraft.payment_method !== '1') {
      setExpenseDraft((p) => ({ ...p, payment_method: '1' }));
    }
  }, [expenseDraft.payment_method, showPaymentMethod]);

  useEffect(() => {
    if (!crewModalOpen) return;
    const startDate = toYmdFromAny(fleetTrip?.departureTime ?? '');
    const endDate = toYmdFromAny(fleetTrip?.arrivalTime ?? fleetTrip?.endDate ?? '');
    if (!startDate || !endDate) {
      setAvailabilityOptions([]);
      return;
    }
    (async () => {
      setAvailabilityLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('start_date', startDate);
        qs.set('end_date', endDate);
        const res = await api.get<unknown>(
          `/services/schedule/operations/availibility?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setAvailabilityOptions([]);
          return;
        }
        const payload = res.data as unknown;
        const root = toRecord(payload);
        const dataNode = root.data;
        const dataObj = toRecord(dataNode);
        const listNode =
          (Array.isArray(payload) ? payload : undefined) ??
          (Array.isArray(dataNode) ? dataNode : undefined) ??
          (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
          (Array.isArray(dataObj.rows) ? dataObj.rows : undefined) ??
          (Array.isArray(dataObj.data) ? dataObj.data : undefined) ??
          (Array.isArray(root.items) ? root.items : undefined) ??
          (Array.isArray(root.rows) ? root.rows : undefined) ??
          (Array.isArray(root.data) ? root.data : undefined) ??
          [];
        const mapped = (listNode as unknown[])
          .map((raw) => toRecord(raw))
          .map((o) => {
            const value = pickString(o, ['uuid', 'id', 'value']);
            const employeeId = pickString(o, ['employee_id', 'employeeId', 'nik']);
            const fullname = pickString(o, ['fullname', 'full_name', 'name']);
            const label = `${employeeId || value}${fullname ? ` - ${fullname}` : ''}`.trim();
            return value ? { value, label: label || value } : null;
          })
          .filter((x): x is Option => Boolean(x));
        setAvailabilityOptions(mapped);
        setCrewDraft({
          driver_id: fleetTrip?.driverId && fleetTrip.driverId !== '-' ? fleetTrip.driverId : '',
          crew_id: fleetTrip?.crewId && fleetTrip.crewId !== '-' ? fleetTrip.crewId : '',
        });
      } finally {
        setAvailabilityLoading(false);
      }
    })();
  }, [crewModalOpen, fleetTrip?.arrivalTime, fleetTrip?.departureTime, fleetTrip?.endDate, fleetTrip?.crewId, fleetTrip?.driverId, token]);

  const arrivalNode = useMemo(() => {
    const arrival = (fleetTrip?.arrivalTime ?? '').trim();
    if (arrival) return tryFormatDateTime(arrival);

    const fallback = (fleetTrip?.endDate ?? '').trim();
    const fallbackLabel = fallback ? tryFormatDateTime(fallback) : '-';
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span>{fallbackLabel}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Badge
                  variant="outline"
                  className="border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200"
                >
                  ?
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent>Belum ada informasi kedatangan</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }, [fleetTrip?.arrivalTime, fleetTrip?.endDate]);

  const paymentStatusNode = useMemo(() => {
    const status = fleetTrip?.paymentStatus ?? 0;
    const commonClass = 'rounded-full px-3 py-1 font-medium';
    if (status === 1) {
      return (
        <Badge className={`${commonClass} border-transparent bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:bg-emerald-400/15 dark:text-emerald-300`}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Pembayaran Lunas
        </Badge>
      );
    }
    if (status === 2) {
      return (
        <Badge className={`${commonClass} border-transparent bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:bg-rose-400/15 dark:text-rose-300`}>
          <XCircle className="mr-2 h-4 w-4" />
          Belum Lunas
        </Badge>
      );
    }
    if (status === 3) {
      return (
        <Badge className={`${commonClass} border-transparent bg-amber-500/10 text-amber-800 hover:bg-amber-500/15 dark:bg-amber-400/15 dark:text-amber-200`}>
          <Clock className="mr-2 h-4 w-4" />
          Menunggu Konfirmasi
        </Badge>
      );
    }
    if (status === 4) {
      return (
        <Badge className={`${commonClass} border-transparent bg-orange-500/10 text-orange-800 hover:bg-orange-500/15 dark:bg-orange-400/15 dark:text-orange-200`}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Masih ada tagihan
        </Badge>
      );
    }
    return <Badge variant="outline">-</Badge>;
  }, [fleetTrip?.paymentStatus]);

  const orderIdNode = useMemo(() => {
    const orderId = (fleetTrip?.orderId ?? '').trim();
    if (!orderId || orderId === '-') return '-';
    return (
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-blue-700 dark:text-blue-300"
        onClick={() => navigate(`${basePrefix}/orders/detail/${encodeURIComponent(orderId)}`)}
      >
        {orderId}
      </Button>
    );
  }, [basePrefix, fleetTrip?.orderId, navigate]);

  const orderInfoItems = useMemo(() => {
    const t = fleetTrip;
    return [
      { label: 'Order ID', value: orderIdNode },
      { label: 'Status', value: t ? paymentStatusNode : '-' },
      { label: 'Tanggal Keberangkatan', value: t ? tryFormatDateTime(t.departureTime) : '-' },
      { label: 'Tanggal Kedatangan', value: fleetTrip ? arrivalNode : '-' },
    ];
  }, [arrivalNode, fleetTrip, orderIdNode, paymentStatusNode]);

  const fleetInfoItems = useMemo(() => {
    const t = fleetTrip;
    const unitId = (t?.unitId ?? '').trim();
    const displayId = (t?.vehicleId ?? '').trim() || unitId;
    const linkPath = unitId && unitId !== '-' ? `/dashboard/partner/fleet-units/detail/${encodeURIComponent(unitId)}` : '';
    return { unitId, displayId, linkPath };
  }, [fleetTrip, navigate]);

  const financeSummary = useMemo(() => {
    if (financeTotalsOverride) {
      const operasional = financeTotalsOverride.totalAmount;
      const total = financeTotalsOverride.totalExpenses;
      const reimburse = financeTotalsOverride.totalReimburse;
      const sisaOperasional = Number.isFinite(financeTotalsOverride.balance ?? NaN) ? (financeTotalsOverride.balance as number) : operasional - total;
      return { operasional, reimburse, total, sisaOperasional };
    }
    const expenses = fleetTrip?.expenses ?? [];
    const operasional = expenses.reduce((sum, x) => sum + (x.paymentMethod === 1 ? x.amount : 0), 0);
    const reimburse = expenses.reduce((sum, x) => sum + (x.paymentMethod === 2 ? x.amount : 0), 0);
    const total = expenses.reduce((sum, x) => sum + x.amount, 0);
    const sisaOperasional = expenses.reduce((sum, x) => sum + (x.paymentMethod === 1 && x.paymentLabel === 'Tagihan' ? x.amount : 0), 0);
    return { operasional, reimburse, total, sisaOperasional };
  }, [financeTotalsOverride, fleetTrip?.expenses]);

  const expenseTableRows = useMemo(() => {
    if (financeLoaded) return financeExpenses;
    return (fleetTrip?.expenses ?? []).map((row) => {
      const paymentMethodLabel = row.paymentMethod === 1 ? 'Biaya Operasional' : row.paymentMethod === 2 ? 'Reimburse' : '-';
      const mapped: FleetTripExpenseTableRow = {
        id: row.id,
        transactionItemLabel: row.transactionItem || '-',
        reporter: row.reporter || '-',
        amount: row.amount,
        paymentMethodLabel,
        description: '-',
      };
      return mapped;
    });
  }, [financeExpenses, financeLoaded, fleetTrip?.expenses]);

  const financeItems = useMemo(() => {
    return [
      { label: 'Biaya Operasional', value: formatCurrency(financeSummary.operasional) },
      { label: 'Total Pengeluaran', value: formatCurrency(financeSummary.total) },
      { label: 'Sisa Operasional', value: formatCurrency(financeSummary.sisaOperasional) },
      { label: 'Klaim / Reimbursement', value: formatCurrency(financeSummary.reimburse) },
    ];
  }, [financeSummary.operasional, financeSummary.reimburse, financeSummary.sisaOperasional, financeSummary.total]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BackButton to={`${basePrefix}/schedules/fleet-schedules`} />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Detail Jadwal Armada
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {scheduleNumber ? `Schedule Number: ${scheduleNumber}` : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-2xl border-[#295BFF]/40 bg-[#295BFF]/10 text-[#295BFF] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#295BFF]/15 hover:shadow-lg/10 dark:border-[#295BFF]/40 dark:bg-[#295BFF]/15 dark:text-[#7FA0FF]"
            onClick={() => setAddExpenseOpen(true)}
            disabled={!scheduleNumber}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengeluaran
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                More Action
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!fleetTrip?.scheduleUnitId || fleetTrip.scheduleUnitId === '-'}
                onSelect={(e) => {
                  e.preventDefault();
                  setCrewModalOpen(true);
                }}
              >
                <UsersRound className="mr-2 h-4 w-4" />
                Ubah Driver / Crew
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!scheduleNumber}
                onSelect={(e) => {
                  e.preventDefault();
                  onPrintSuratJalan();
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Surat Jalan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderWithBadge
            title="Informasi Pesanan"
            subtitle={loading ? 'Memuat detail…' : 'Ringkasan data pesanan dan perjalanan'}
            badgeIcon={ReceiptText}
          />
          <CardContent>
            <KeyValueGrid items={orderInfoItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeaderWithBadge
            title="Informasi Armada"
            subtitle={loading ? 'Memuat data armada…' : 'Armada dan awak yang bertugas'}
            badgeIcon={Car}
          />
          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-4 dark:bg-[#1c2633] dark:border-[#334155] dark:text-[#D1D5DB]">
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage
                    src={fleetTrip?.fleetPhoto ? toFileUrl(fleetTrip.fleetPhoto) : ''}
                    alt={fleetTrip?.fleetName ? `Foto ${fleetTrip.fleetName}` : 'Foto armada'}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl">
                    <img src={defaultAvatar} alt="Armada" className="h-8 w-8 object-contain opacity-80" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Armada</div>
                  <div className="truncate text-sm font-semibold text-foreground">{fleetTrip?.fleetName ?? '-'}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">{fleetTrip?.plateNumber ?? '-'}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Kode Armada:{' '}
                    {fleetInfoItems.linkPath ? (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-blue-700 dark:text-blue-300"
                        onClick={() => navigate(fleetInfoItems.linkPath)}
                      >
                        {fleetInfoItems.displayId || '-'}
                      </Button>
                    ) : (
                      <span className="text-foreground">{fleetInfoItems.displayId || '-'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 dark:bg-[#1c2633] dark:border-[#334155] dark:text-[#D1D5DB]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={fleetTrip?.driverAvatar ? toFileUrl(fleetTrip.driverAvatar) : ''}
                        alt={fleetTrip?.driverName ? `Foto ${fleetTrip.driverName}` : 'Foto driver'}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold">{getInitials(fleetTrip?.driverName ?? '')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">Driver</div>
                      <div className="truncate text-sm font-semibold text-foreground">{fleetTrip?.driverName ?? '-'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={fleetTrip?.crewAvatar ? toFileUrl(fleetTrip.crewAvatar) : ''}
                        alt={fleetTrip?.crewName ? `Foto ${fleetTrip.crewName}` : 'Foto crew'}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm font-semibold">{getInitials(fleetTrip?.crewName ?? '')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">Crew</div>
                      <div className="truncate text-sm font-semibold text-foreground">{fleetTrip?.crewName ?? '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeaderWithBadge
            title="Informasi Keuangan"
            subtitle={loading ? 'Memuat data finansial…' : 'Tagihan dan ringkasan pengeluaran'}
            badgeIcon={DollarSign}
          />
          <CardContent>
            <KeyValueGrid items={financeItems} />
            <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/70 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/80 dark:bg-[#1c2633] dark:border-white/10 dark:text-[#D1D5DB]">
                  <TableRow>
                    <TableHead className="w-[56px] px-4">No</TableHead>
                    <TableHead className="px-4">Jenis Transaksi</TableHead>
                    <TableHead className="px-4">Deskripsi</TableHead>
                    <TableHead className="px-4 text-right w-[160px]">Nominal</TableHead>
                    <TableHead className="px-4 w-[160px]">Jenis Pembayaran</TableHead>
                    <TableHead className="px-4">Reporter</TableHead>
                    <TableHead className="px-4 text-right w-[90px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseTableRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseTableRows.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell className="px-4 text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                        <TableCell className="px-4 font-medium text-foreground">{row.transactionItemLabel || '-'}</TableCell>
                        <TableCell className="px-4 text-foreground">{row.description || '-'}</TableCell>
                        <TableCell className="px-4 text-right font-semibold text-foreground tabular-nums">
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className="rounded-full">
                            {row.paymentMethodLabel || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-foreground">{row.reporter || '-'}</TableCell>
                        <TableCell className="px-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            disabled={!row.id || deletingExpenseId === row.id}
                            onClick={async () => {
                              const confirmed = await Swal.fire({
                                icon: 'warning',
                                title: 'Hapus transaksi?',
                                text: 'Transaksi yang dihapus tidak bisa dikembalikan.',
                                showCancelButton: true,
                                confirmButtonText: 'Hapus',
                                cancelButtonText: 'Batal',
                                confirmButtonColor: '#dc2626',
                              });
                              if (!confirmed.isConfirmed) return;
                              setDeletingExpenseId(row.id);
                              try {
                                await api.post<unknown>(
                                  '/transactions/fleet-trip/expenses/delete',
                                  { schedule_number: scheduleNumber, transaction_id: row.id },
                                  token ? { Authorization: token } : undefined
                                );
                                await loadFleetTrip();
                              } finally {
                                setDeletingExpenseId('');
                              }
                            }}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={addExpenseOpen}
        onOpenChange={(open) => {
          setAddExpenseOpen(open);
          if (!open) {
            setTransactionTypeOpen(false);
            setExpenseDraft({ transaction_item: '', amount: '', description: '', payment_method: '1' });
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 border-none bg-white dark:bg-[#090e1a] overflow-hidden max-h-[80vh] sm:max-h-[90vh] flex flex-col">
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ReceiptText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white/70">Tambah Pengeluaran</h2>
                  <p className="text-slate-500 text-sm">Tambahkan catatan pengeluaran untuk perjalanan ini</p>
                </div>
              </div>
              <DialogClose className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </DialogClose>
            </div>

            <div className="h-px bg-slate-100" />

            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!scheduleNumber) return;
                const amount = Number(String(expenseDraft.amount ?? '').replace(/\D/g, '') || 0);
                if (!expenseDraft.transaction_item) {
                  await Swal.fire({ icon: 'warning', title: 'Gagal', text: 'Jenis pengeluaran wajib dipilih.' });
                  return;
                }
                if (!amount) {
                  await Swal.fire({ icon: 'warning', title: 'Gagal', text: 'Nominal wajib diisi.' });
                  return;
                }

                setAddExpenseSubmitting(true);
                try {
                  const res = await api.post<unknown>(
                    '/transactions/fleet-trip/expenses/submit',
                    {
                      schedule_number: scheduleNumber,
                      transaction_item: expenseDraft.transaction_item,
                      amount,
                      payment_method: expenseDraft.payment_method === '2' ? 2 : 1,
                      description: expenseDraft.description.trim() || undefined,
                    },
                    token ? { Authorization: token } : undefined
                  );
                  if (res.status === 'success' && (res.statusCode === 200 || res.statusCode === 201)) {
                    const data = toRecord(res.data);
                    const hasTotals =
                      'total_amount' in data ||
                      'tota_amount' in data ||
                      'total_expenses' in data ||
                      'total_reimburse' in data ||
                      'totalAmount' in data ||
                      'totalExpenses' in data ||
                      'totalReimburse' in data;
                    if (hasTotals) {
                      const totalAmount = toNumberSafe(data.total_amount ?? data.tota_amount ?? data.totalAmount);
                      const totalExpenses = toNumberSafe(data.total_expenses ?? data.totalExpenses);
                      const totalReimburse = toNumberSafe(data.total_reimburse ?? data.totalReimburse);
                      setFinanceTotalsOverride({ totalAmount, totalExpenses, totalReimburse });
                    }
                  }
                  setAddExpenseOpen(false);
                  await loadFleetTrip();
                } finally {
                  setAddExpenseSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold ml-1 dark:text-white/70">Jenis Pengeluaran</Label>
                  <Popover open={transactionTypeOpen} onOpenChange={setTransactionTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={transactionTypeOpen}
                        className="w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all font-normal text-slate-700"
                        disabled={transactionTypesLoading}
                      >
                        {selectedTransactionTypeLabel ? selectedTransactionTypeLabel : transactionTypesLoading ? 'Memuat…' : 'Pilih jenis pengeluaran'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-2xl border-slate-200 shadow-2xl" align="start">
                      <Command>
                        <CommandInput placeholder="Cari jenis pengeluaran..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada data</CommandEmpty>
                          <CommandGroup>
                            {transactionTypes.map((opt) => (
                              <CommandItem
                                key={opt.value}
                                value={`${opt.label} ${opt.value}`}
                                onSelect={() => {
                                  setExpenseDraft((p) => ({ ...p, transaction_item: opt.value }));
                                  setTransactionTypeOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', expenseDraft.transaction_item === opt.value ? 'opacity-100' : 'opacity-0')} />
                                {opt.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground font-semibold ml-1 dark:text-white/70">Nominal</Label>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    value={formatRupiahInput(expenseDraft.amount)}
                    onChange={(e) => setExpenseDraft((p) => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Rp 0"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all tabular-nums text-foreground dark:text-white/70"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="expense-description" className="text-foreground font-semibold ml-1 dark:text-white/70">Deskripsi (Opsional)</Label>
                  <textarea
                    id="expense-description"
                    value={expenseDraft.description}
                    onChange={(e) => setExpenseDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Tulis catatan pengeluaran (opsional)"
                    rows={3}
                    className="w-full min-h-[96px] rounded-xl border border-slate-200 bg-slate-50 dark:bg-[#295BFF]/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-foreground dark:text-white/70 resize-none"
                  />
                </div>

                {showPaymentMethod ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 font-semibold ml-1">Metode Pembayaran</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setExpenseDraft((p) => ({ ...p, payment_method: '1' }))}
                        className={cn(
                          'text-left rounded-2xl border p-4 transition-all bg-slate-50 hover:bg-slate-100 dark:bg-blue-950/20 dark:hover:dark:bg-blue-950',
                          expenseDraft.payment_method === '1'
                            ? 'border-[#295BFF]/40 bg-[#295BFF]/10 ring-2 ring-blue-400 dark:bg-[#295BFF]/10 dark:hover:bg-[#295BFF]/20'
                            : 'border-slate-200 dark:border-[#295BFF]/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-800/10 flex items-center justify-center text-blue-600">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white/70">Biaya Operasional</div>
                            <div className="mt-1 text-xs text-slate-500">Dibebankan dari biaya operasional perjalanan</div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpenseDraft((p) => ({ ...p, payment_method: '2' }))}
                        className={cn(
                          'text-left rounded-2xl border p-4 transition-all bg-slate-50 hover:bg-slate-100 dark:bg-blue-950/20 dark:hover:dark:bg-blue-950',
                          expenseDraft.payment_method === '2'
                            ? 'border-[#295BFF]/40 bg-[#295BFF]/10 ring-2 ring-blue-400 dark:bg-[#295BFF]/10 dark:hover:bg-[#295BFF]/20'
                            : 'border-slate-200 dark:border-[#295BFF]/40'
                        )}
                        >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#295BFF]/10 flex items-center justify-center text-amber-700">
                            <HandCoins className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white/70">Reimburse</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-white/70">Dibebankan sementara kepada driver, dapat diklaim</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 w-full md:w-auto border-t border-slate-200 pt-4 mt-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAddExpenseOpen(false)}
                  disabled={addExpenseSubmitting}
                  className="flex-1 md:flex-none h-12 px-8 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 dark:bg-[#295BFF]/10 dark:hover:bg-[#295BFF]/20 transition-colors disabled:opacity-50 dark:text-white/70"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addExpenseSubmitting || !expenseDraft.transaction_item || Number(expenseDraft.amount || 0) <= 0}
                  className="flex-1 md:flex-none h-10 px-8 rounded-lg bg-blue-500 dark:bg-blue-800/100 dark:hover:bg-blue-900/100 text-white font-normal flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 dark:text-white/70"
                >
                  {addExpenseSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Pengeluaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={crewModalOpen} onOpenChange={setCrewModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ubah Driver / Crew</DialogTitle>
            <DialogDescription>Pilih driver dan crew yang tersedia pada periode perjalanan.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Driver</div>
              <Select value={crewDraft.driver_id} onValueChange={(v) => setCrewDraft((p) => ({ ...p, driver_id: v }))} disabled={availabilityLoading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={availabilityLoading ? 'Memuat…' : 'Pilih driver'} />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {availabilityLoading ? 'Memuat…' : 'Tidak ada data'}
                    </SelectItem>
                  ) : (
                    availabilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Crew</div>
              <Select value={crewDraft.crew_id} onValueChange={(v) => setCrewDraft((p) => ({ ...p, crew_id: v }))} disabled={availabilityLoading}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={availabilityLoading ? 'Memuat…' : 'Pilih crew'} />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {availabilityLoading ? 'Memuat…' : 'Tidak ada data'}
                    </SelectItem>
                  ) : (
                    availabilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setCrewModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                crewSubmitting ||
                !fleetTrip?.scheduleUnitId ||
                fleetTrip.scheduleUnitId === '-' ||
                !crewDraft.driver_id
              }
              onClick={async () => {
                const scheduleUnitId = (fleetTrip?.scheduleUnitId ?? '').trim();
                if (!scheduleUnitId || scheduleUnitId === '-') return;
                if (!crewDraft.driver_id) return;
                setCrewSubmitting(true);
                try {
                  await api.post<unknown>(
                    '/schedule/fleet-trip/update',
                    {
                      schedule_unit_id: scheduleUnitId,
                      driver_id: crewDraft.driver_id,
                      crew_id: crewDraft.crew_id,
                    },
                    token ? { Authorization: token } : undefined
                  );
                  setCrewModalOpen(false);
                  await loadFleetTrip();
                } finally {
                  setCrewSubmitting(false);
                }
              }}
            >
              {crewSubmitting ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
