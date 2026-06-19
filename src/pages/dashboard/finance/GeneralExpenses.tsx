import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Check, ChevronRight, ChevronsUpDown, CreditCard, Download, FileSpreadsheet, Info, LogOut, MoreHorizontal, Pencil, Plus, Receipt, Save, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { showAlert } from '@/hooks/use-alert';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const GeneralExpenses: React.FC = () => {
  type TransactionRow = {
    id: string;
    invoiceNumber: string;
    transactionDate: string;
    description: string;
    sourceLabel: string;
    transactionTypeLabel: string;
    transactionMarkLabel: string;
    transactionCategoryLabel: string;
    amount: number;
    statusLabel: string;
    orderType: number;
    transactionTypeId: string;
    transactionCategoryId: string;
    paymentTypeId: string;
    paymentMethodId: string;
    orderId: string;
    unitId: string;
    bankCode: string;
    bankAccount: string;
    bankAccountName: string;
  };
  type ExpenseExportRow = {
    transactionDate: string;
    invoiceNumber: string;
    transactionCategoryLabel: string;
    transactionItemLabel: string;
    description: string;
    amount: number;
    paymentMethodLabel: string;
    paymentTypeLabel: string;
    createdAt: string;
    createdBy: string;
  };

  const PERIOD_OPTIONS = ['Bulan Ini', 'Bulan Lalu', '3 Bulan Terakhir', 'Tahun Ini', '1 Tahun terakhir', 'Tahun Lalu'] as const;
  type PeriodOption = (typeof PERIOD_OPTIONS)[number];

  type IntOption = { id: string; label: string };
  type BankOption = { code: string; name: string };
  type ManualFormValues = {
    transaction_date: string;
    transaction_type: string;
    order_type: string;
    order_id: string;
    status: string;
    payment_method: string;
    amount: string;
    description: string;
    bank_code: string;
    bank_account: string;
    bank_account_name: string;
  };
  const GoogleSheetIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"
        fill="#0F9D58"
      />
      <path d="M14 2v5h5z" fill="#34A853" />
      <path d="M8 10h8M8 13h8M8 16h8M12 8v10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const toRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const toStringSafe = (v: unknown): string =>
    typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

  const toNumberSafe = (v: unknown): number => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : typeof v === 'bigint' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  const toYmdLocal = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addMonthsClamped = (d: Date, months: number): Date => {
    const day = d.getDate();
    const anchor = new Date(d.getFullYear(), d.getMonth(), 1);
    const target = new Date(anchor.getFullYear(), anchor.getMonth() + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay));
  };

  const addYearsClamped = (d: Date, years: number): Date => addMonthsClamped(d, years * 12);

  const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const getPeriodRange = (period: PeriodOption, now: Date = new Date()): { start: Date; end: Date } => {
    if (period === 'Bulan Ini') return { start: startOfMonth(now), end: endOfMonth(now) };
    if (period === 'Bulan Lalu') {
      const prev = addMonthsClamped(now, -1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    if (period === '3 Bulan Terakhir') return { start: addMonthsClamped(now, -3), end: now };
    if (period === 'Tahun Ini') return { start: new Date(now.getFullYear(), 0, 1), end: now };
    if (period === '1 Tahun terakhir') return { start: addYearsClamped(now, -1), end: now };
    return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31) };
  };

  const tryParseDate = (value: string): Date | null => {
    const v = String(value ?? '').trim();
    if (!v) return null;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return Number.isNaN(local.getTime()) ? null : local;
    }
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
  };

  const formatDdMmmYy = (value: string) => {
    const d = tryParseDate(value);
    if (!d) return '-';
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

  const formatRupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

  const formatRupiahInput = (digits: string) => {
    const clean = String(digits ?? '').replace(/\D/g, '');
    if (!clean) return '';
    const n = Number(clean);
    if (!Number.isFinite(n) || n < 0) return '';
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  };
  const formatExportTimestamp = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}`;
  };
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const createDefaultManualForm = (): ManualFormValues => ({
    transaction_date: '',
    transaction_type: '',
    order_type: '',
    order_id: '',
    status: '',
    payment_method: '',
    amount: '',
    description: '',
    bank_code: '',
    bank_account: '',
    bank_account_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [exportRows, setExportRows] = useState<ExpenseExportRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualMode, setManualMode] = useState<'create' | 'edit'>('create');
  const [activeTransactionId, setActiveTransactionId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [transactionDateOpen, setTransactionDateOpen] = useState(false);
  const [transactionTypeOpen, setTransactionTypeOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderTypes, setOrderTypes] = useState<IntOption[]>([]);
  const [orderList, setOrderList] = useState<{ id: string; label: string }[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<IntOption[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<IntOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<IntOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [manualForm, setManualForm] = useState<ManualFormValues>(createDefaultManualForm);
  const [period, setPeriod] = useState<PeriodOption>('Bulan Ini');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const requestIdRef = useRef(0);
  const metaRequestIdRef = useRef(0);

  const loadTransactions = async (headersOverride?: Record<string, string>) => {
    const currentReq = (requestIdRef.current += 1);
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = headersOverride ?? (token ? { Authorization: token } : undefined);
      const { start, end } = getPeriodRange(period);
      const params = new URLSearchParams();
      params.set('start_date', toYmdLocal(start));
      params.set('end_date', toYmdLocal(end));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await api.get<unknown>(`/services/transactions/expenses?${params.toString()}`, headers);
      if (currentReq !== requestIdRef.current) return;

      if (res.status !== 'success') {
        setRows([]);
        setExportRows([]);
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
        (Array.isArray(dataObj.transactions) ? dataObj.transactions : undefined) ??
        (Array.isArray(dataObj.data) ? dataObj.data : undefined) ??
        (Array.isArray(root.items) ? root.items : undefined) ??
        (Array.isArray(root.rows) ? root.rows : undefined) ??
        (Array.isArray(root.transactions) ? root.transactions : undefined) ??
        (Array.isArray(root.data) ? root.data : undefined) ??
        [];

      const mapped = (listNode as unknown[]).map((raw, idx) => {
        const o = toRecord(raw);
        const id =
          toStringSafe(o.transaction_id ?? o.transactionId ?? o.id ?? o.uuid ?? o.tx_id ?? o.txId).trim() || `tmp-${idx}`;
        const invoiceNumber = toStringSafe(o.invoice_number ?? o.invoiceNumber).trim();
        const transactionDate = toStringSafe(o.transaction_date ?? o.transactionDate ?? o.created_at ?? o.createdAt).trim();
        const description = toStringSafe(o.description ?? o.desc ?? o.note ?? o.notes ?? o.keterangan).trim();
        const sourceLabel = toStringSafe(o.order_type_label ?? o.orderTypeLabel ?? o.source_label ?? o.sourceLabel).trim();
        const transactionTypeLabel = toStringSafe(o.transaction_type_label ?? o.transactionTypeLabel ?? o.type_label ?? o.typeLabel).trim();
        const transactionMarkLabel = toStringSafe(o.transaction_mark_label ?? o.transactionMarkLabel ?? o.mark_label ?? o.markLabel).trim();
        const transactionCategoryLabel = toStringSafe(o.transaction_category_label ?? o.transactionCategoryLabel ?? o.category_label ?? o.categoryLabel).trim();
        const amount = toNumberSafe(
          o.amount ??
            o.total_amount ??
            o.totalAmount ??
            o.transaction_amount ??
            o.transactionAmount ??
            o.payment_amount ??
            o.paymentAmount ??
            o.nominal ??
            o.value
        );
        const statusLabel = toStringSafe(
          o.status_label ?? o.statusLabel ?? o.status ?? o.payment_status_label ?? o.paymentStatusLabel ?? o.payment_status
        ).trim();
        const orderType = toNumberSafe(o.order_type ?? o.orderType);
        const transactionTypeId = toStringSafe(
          o.transaction_item ??
            o.transactionItem ??
            o.transaction_type_id ??
            o.transactionTypeId ??
            o.transaction_type ??
            o.transactionType
        ).trim();
        const transactionCategoryId = toStringSafe(
          o.transaction_category ?? o.transactionCategory ?? o.order_type ?? o.orderType ?? o.transaction_category_id ?? o.transactionCategoryId
        ).trim();
        const paymentTypeId = toStringSafe(
          o.payment_type ?? o.paymentType ?? o.payment_status_id ?? o.paymentStatusId ?? o.payment_status ?? o.status_id ?? o.statusId
        ).trim();
        const paymentMethodId = toStringSafe(
          o.payment_method ?? o.paymentMethod ?? o.payment_method_id ?? o.paymentMethodId
        ).trim();
        const orderId = toStringSafe(o.order_id ?? o.orderId).trim();
        const unitId = toStringSafe(o.unit_id ?? o.unitId).trim();
        const bankCode = toStringSafe(o.bank_code ?? o.bankCode).trim();
        const bankAccount = toStringSafe(o.bank_account ?? o.bankAccount).trim();
        const bankAccountName = toStringSafe(o.bank_account_name ?? o.bankAccountName).trim();

        return {
          id,
          invoiceNumber,
          transactionDate,
          description,
          sourceLabel,
          transactionTypeLabel,
          transactionMarkLabel,
          amount,
          statusLabel,
          orderType,
          transactionCategoryLabel,
          transactionTypeId,
          transactionCategoryId,
          paymentTypeId,
          paymentMethodId,
          orderId,
          unitId,
          bankCode,
          bankAccount,
          bankAccountName,
        } satisfies TransactionRow;
      });
      const exportMapped = (listNode as unknown[]).map((raw) => {
        const o = toRecord(raw);
        return {
          transactionDate: toStringSafe(o.transaction_date).trim(),
          invoiceNumber: toStringSafe(o.invoice_number).trim(),
          transactionCategoryLabel: toStringSafe(o.transaction_category_label).trim(),
          transactionItemLabel: toStringSafe(o.transaction_item_label).trim(),
          description: toStringSafe(o.description).trim(),
          amount: toNumberSafe(o.amount),
          paymentMethodLabel: toStringSafe(o.payment_method_label).trim(),
          paymentTypeLabel: toStringSafe(o.payment_type_label).trim(),
          createdAt: toStringSafe(o.created_at).trim(),
          createdBy: toStringSafe(o.created_by).trim(),
        } satisfies ExpenseExportRow;
      });

      setRows(mapped);
      setExportRows(exportMapped);
    } finally {
      if (currentReq === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    loadTransactions();
  }, [period, searchQuery]);

  useEffect(() => {
    const loadMeta = async () => {
      const currentReq = (metaRequestIdRef.current += 1);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const [typesRes, statusesRes, methodsRes, banksRes, orderTypesRes] = await Promise.all([
          api.get<unknown>('/services/transactions/types?filteredby=items&type=expense&tags=general', headers),
          api.get<unknown>('/general/payment-status', headers),
          api.get<unknown>('/general/payment-method?type=general', headers),
          api.get<unknown>('/general/bank-list', headers),
          api.get<unknown>('/services/transactions/types?filteredby=categories&type=expense&tags=general', headers),
        ]);
        if (currentReq !== metaRequestIdRef.current) return;

        const extractList = (payload: unknown): unknown[] => {
          if (Array.isArray(payload)) return payload;
          const root = toRecord(payload);
          const dataNode = root.data;
          if (Array.isArray(dataNode)) return dataNode;
          const dataObj = toRecord(dataNode);
          if (Array.isArray(dataObj.data)) return dataObj.data as unknown[];
          if (Array.isArray(dataObj.orders)) return dataObj.orders as unknown[];
          if (Array.isArray(dataObj.items)) return dataObj.items as unknown[];
          if (Array.isArray(root.items)) return root.items as unknown[];
          if (Array.isArray(root.rows)) return root.rows as unknown[];
          if (Array.isArray(root.orders)) return root.orders as unknown[];
          return [];
        };

        const toIntOptions = (payload: unknown): IntOption[] => {
          const list = extractList(payload);
          return list
            .map((raw) => {
              const o = toRecord(raw);
              const id = toStringSafe(
                o.id ?? o.code ?? o.transaction_type_id ?? o.transactionTypeId ?? o.transaction_type ?? o.transactionType
              ).trim();
              const label = toStringSafe(o.label ?? o.name ?? o.title).trim();
              if (!id || !label) return null;
              return { id, label } satisfies IntOption;
            })
            .filter((x): x is IntOption => Boolean(x));
        };

        const toBankOptions = (payload: unknown): BankOption[] => {
          const list = extractList(payload);
          return list
            .map((raw) => {
              const o = toRecord(raw);
              const code = toStringSafe(o.code).trim();
              const name = toStringSafe(o.name).trim();
              if (!code || !name) return null;
              return { code, name } satisfies BankOption;
            })
            .filter((x): x is BankOption => Boolean(x));
        };

        if (typesRes.status === 'success') setTransactionTypes(toIntOptions(typesRes.data));
        if (statusesRes.status === 'success') setPaymentStatuses(toIntOptions(statusesRes.data));
        if (methodsRes.status === 'success') setPaymentMethods(toIntOptions(methodsRes.data));
        if (banksRes.status === 'success') setBanks(toBankOptions(banksRes.data));
        if (orderTypesRes.status === 'success') setOrderTypes(toIntOptions(orderTypesRes.data));
      } catch {
        return;
      }
    };

    loadMeta();
   
  }, []);

  useEffect(() => {
    const ot = Number(manualForm.order_type);
    const otId = String(manualForm.order_type || '').toUpperCase().trim();
    const isFleetUnitType =
      otId === 'TRX04';

    if (![1, 2].includes(ot) && !isFleetUnitType) {
      setOrderList([]);
      setManualForm((prev) => ({ ...prev, order_id: '' }));
      return;
    }

    const loadOrders = async () => {
      setOrderLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        let url = '';
        if (isFleetUnitType) {
          url = '/services/fleet-units';
        }
        else if (ot === 1) url = '/services/fleet/orders';
        else if (ot === 2) url = '/services/tour-packages/order/list';

        const res = await api.get<unknown>(url, headers);
        if (res.status !== 'success') {
          setOrderList([]);
          return;
        }

        const extractList = (payload: unknown): unknown[] => {
          if (Array.isArray(payload)) return payload;
          const root = toRecord(payload);
          const dataNode = root.data;
          if (Array.isArray(dataNode)) return dataNode;
          const dataObj = toRecord(dataNode);
          if (Array.isArray(dataObj.data)) return dataObj.data as unknown[];
          if (Array.isArray(dataObj.orders)) return dataObj.orders as unknown[];
          if (Array.isArray(dataObj.items)) return dataObj.items as unknown[];
          if (Array.isArray(root.items)) return root.items as unknown[];
          if (Array.isArray(root.rows)) return root.rows as unknown[];
          if (Array.isArray(root.orders)) return root.orders as unknown[];
          return [];
        };

        const list = extractList(res.data);
        const mapped = list
          .map((raw) => {
          const o = toRecord(raw);
          if (isFleetUnitType) {
            const unit_id = toStringSafe(o.unit_id ?? o.id);
            const fleet_name = toStringSafe(o.fleet_name ?? o.fleet);
            const vehicle_id = toStringSafe(o.vehicle_id);
            const plate_number = toStringSafe(o.plate_number);
            const label = [fleet_name, plate_number, vehicle_id].map((x) => String(x ?? '').trim()).filter(Boolean).join(' - ');
            return {
              id: unit_id,
              label: label || unit_id,
            };
          } else {
            const order_id = toStringSafe(o.order_id ?? o.id);
            return {
              id: order_id,
              label: order_id,
            };
          }
          })
          .filter((x) => x.id);
        
        setOrderList(mapped);
      } catch {
        setOrderList([]);
      } finally {
        setOrderLoading(false);
      }
    };

    loadOrders();
  }, [manualForm.order_type]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const showBankFields = useMemo(() => {
    const id = Number(manualForm.payment_method || 0);
    return id === 1002;
  }, [manualForm.payment_method]);

  const orderTypeIdUpper = useMemo(() => {
    return String(manualForm.order_type || '').toUpperCase().trim();
  }, [manualForm.order_type]);

  const selectedTrxIdUpper = useMemo(() => {
    if (orderTypeIdUpper.startsWith('TRX')) return orderTypeIdUpper;
    return '';
  }, [orderTypeIdUpper]);

  const isTrx04Type = useMemo(() => {
    return selectedTrxIdUpper === 'TRX04';
  }, [selectedTrxIdUpper]);

  const isFleetUnitType = useMemo(() => {
    return isTrx04Type;
  }, [isTrx04Type]);

  const showOrderOrFleetSelect = useMemo(() => {
    const ot = Number(manualForm.order_type);
    return [1, 2].includes(ot) || isFleetUnitType;
  }, [manualForm.order_type, isFleetUnitType]);

  useEffect(() => {
    if (!showBankFields) {
      setManualForm((prev) => ({ ...prev, bank_account: '', bank_code: '', bank_account_name: '' }));
    }
  }, [showBankFields]);

  const filteredRows = rows;
  const exportSheetRows = useMemo(
    () =>
      exportRows.map((row, index) => ({
        No: index + 1,
        'Tanggal Transaksi': row.transactionDate || '-',
        'No. Invoice': row.invoiceNumber || '-',
        Kategori: row.transactionCategoryLabel || '-',
        'Jenis Transaksi': row.transactionItemLabel || '-',
        Keterangan: row.description || '-',
        Nominal: row.amount || 0,
        'Metode Pembayaran': row.paymentMethodLabel || '-',
        'Tipe Pembayaran': row.paymentTypeLabel || '-',
        Timestamp: row.createdAt || '-',
        PIC: row.createdBy || '-',
      })),
    [exportRows]
  );

  const summary = useMemo(() => {
    let expense = 0;
    let operationalExpense = 0;
    let otherExpense = 0;
    const transactionCount = filteredRows.length;

    filteredRows.forEach((r) => {
      const val = Math.abs(r.amount || 0);
      expense += val;
      const trxOperational = ["TRX01", "TRX02", "TRX04", "TRX05"];
      if (trxOperational.includes(r.transactionCategoryId || "")) operationalExpense += val;
      if (!trxOperational.includes(r.transactionCategoryId || "")) otherExpense += val;
    });

    return { expense, operationalExpense, otherExpense, transactionCount };
  }, [filteredRows]);
  const handleDownloadExcel = () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 24 },
      { wch: 22 },
      { wch: 26 },
      { wch: 42 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 24 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    const fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadBlob(
      new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `travego-expenses-${formatExportTimestamp(new Date())}.xlsx`
    );
  };
  const handleExportGoogleSheet = async () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data untuk diexport.', type: 'warning' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
    const win = window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');

    try {
      await navigator.clipboard.writeText(tsv);
      showAlert({
        title: 'Berhasil',
        description: 'Data berhasil disalin. Tempelkan ke Google Sheet yang baru terbuka.',
        type: 'success',
      });
    } catch {
      if (win) win.close();
      showAlert({
        title: 'Gagal',
        description: 'Browser tidak mengizinkan akses clipboard untuk export Google Sheet.',
        type: 'error',
      });
    }
  };

  const startIndex = (page - 1) * pageSize;
  const resetManualState = () => {
    setManualMode('create');
    setActiveTransactionId('');
    setManualForm(createDefaultManualForm());
    setTransactionDateOpen(false);
    setTransactionTypeOpen(false);
    setOrderOpen(false);
  };

  const openCreateModal = () => {
    resetManualState();
    setManualOpen(true);
  };

const openEditModal = (row: TransactionRow) => {
    setManualMode('edit');
    setActiveTransactionId(row.id);
    setManualForm({
      transaction_date: row.transactionDate || '',
      transaction_type: row.transactionTypeId,
      order_type: row.transactionCategoryId || String(row.orderType || ''),
      order_id: row.unitId || row.orderId,
      status: row.paymentTypeId,
      payment_method: row.paymentMethodId,
      amount: String(Math.round(Math.abs(row.amount || 0))),
      description: row.description,
      bank_code: row.bankCode,
      bank_account: row.bankAccount,
      bank_account_name: row.bankAccountName,
    });
    setTransactionDateOpen(false);
    setTransactionTypeOpen(false);
    setOrderOpen(false);
  };

  const columns: Array<DataTableColumn<TransactionRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>,
    },
    {
      label: 'Tanggal',
      key: 'transactionDate',
      sortable: true,
      width: 130,
      render: (row) => <span className="text-sm text-foreground tabular-nums whitespace-nowrap">{formatDdMmmYy(row.transactionDate)}</span>,
    },
    {
      label: 'No. Invoice',
      key: 'invoiceNumber',
      sortable: true,
      width: 170,
      render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.invoiceNumber || '-'}</span>,
    },
    {
      label: 'Keterangan',
      key: 'description',
      sortable: true,
      width: 520,
      render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.description || '-'}</span>,
    },
    {
      label: 'Jenis Transaksi',
      key: 'transactionTypeLabel',
      sortable: true,
      width: 220,
      render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.transactionCategoryLabel || '-'}</span>,
    },
    {
      label: 'Jumlah',
      key: 'amount',
      sortable: true,
      width: 160,
      align: 'right',
      render: (row) => <span className="text-sm font-medium text-foreground tabular-nums">{formatRupiah(row.amount || 0)}</span>,
    },
    {
      label: 'Action',
      key: 'action',
      sortable: false,
      width: 90,
      align: 'center',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={manualSubmitting || deleteSubmitting}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {String(row.transactionTypeId).trim().toUpperCase() !== 'TRX-I00' ? (
              <>
                <DropdownMenuItem onSelect={() => openEditModal(row)} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span>Edit pengeluaran</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              onSelect={() => setDeleteTarget(row)}
              className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Pengeluaran</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Pengeluaran Umum</h1>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Lihat pengeluaran umum pada periode <span className="font-medium text-foreground">{period}</span>
        </p>
      </div>

      {/* <div className="flex items-center justify-between gap-3">
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
        <Button type="button" onClick={openCreateModal} className="hidden sm:flex h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Manual
        </Button>
      </div> */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <CreditCard className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">
                  Total Pengeluaran
                </div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.expense)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CreditCard className="h-4 w-4" />
                <div className="text-[11px] sm:text-sm font-medium text-muted-foreground">
                  Biaya Operasional
                </div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.operationalExpense)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CreditCard className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">
                  Pengeluaran Lain
                </div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.otherExpense)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <LogOut className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Jumlah transaksi</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {summary.transactionCount}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out max-h-[520px] opacity-100 translate-y-0`}
      >
        <div className="pt-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[280px_1fr] py-2 px-1">
            <div className="space-y-1.5">
              {/* <Label className="text-xs text-muted-foreground">Periode</Label> */}
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
                <SelectTrigger className="h-10 rounded-2xl">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              {/* <Label className="text-xs text-muted-foreground">Cari Invoice / Keterangan / Order ID</Label> */}
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari invoice, keterangan atau order ID..."
                  className="h-10 rounded-2xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-2xl"
                  onClick={() => {
                    setPeriod('Bulan Ini');
                    setSearchInput('');
                  }}
                  title="Reset filter"
                >
                  <X className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                      disabled={loading || !exportSheetRows.length}
                      title="Download data"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px] rounded-xl">
                    <DropdownMenuItem onSelect={handleDownloadExcel} className="flex items-center gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span>Download file excel (.xlsx)</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void handleExportGoogleSheet()} className="flex items-center gap-2 cursor-pointer">
                      <GoogleSheetIcon className="h-4 w-4" />
                      <span>Export ke Google Sheet</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1020px]"
        emptyTitle="Tidak ada data transaksi"
        emptyDescription="Coba ubah periode atau kata kunci pencarian."
        pagination={{
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (n) => {
            setPageSize(n);
            setPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'transactionDate', direction: 'desc' } }}
        rowKey={(row) => row.id}
      />

      <Button
        type="button"
        onClick={openCreateModal}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-6 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Expense Manual"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog
        open={manualOpen}
        onOpenChange={(v) => {
          if (manualSubmitting) return;
          setManualOpen(v);
          if (!v) resetManualState();
        }}
      >
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form
            className="flex flex-col flex-1 min-h-0"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!manualForm.transaction_date) {
                showAlert({ title: 'Gagal', description: 'Tanggal transaksi wajib diisi.', type: 'warning' });
                return;
              }
              const amount = Number(String(manualForm.amount ?? '').replace(/\D/g, '') || 0);
              if (!amount) {
                showAlert({ title: 'Gagal', description: 'Nominal pembayaran wajib diisi.', type: 'warning' });
                return;
              }
              const transactionCategoryValue = String(manualForm.order_type || '').trim();
              if (!transactionCategoryValue) {
                showAlert({ title: 'Gagal', description: 'Jenis transaksi wajib dipilih.', type: 'warning' });
                return;
              }
              const transactionItemValue = String(manualForm.transaction_type || '').trim();
              if (!transactionItemValue) {
                showAlert({ title: 'Gagal', description: 'Jenis pengeluaran wajib dipilih.', type: 'warning' });
                return;
              }
              const paymentType = Number(manualForm.status || 0);
              if (!paymentType) {
                showAlert({ title: 'Gagal', description: 'Status pembayaran wajib dipilih.', type: 'warning' });
                return;
              }
              const paymentMethod = Number(manualForm.payment_method || 0);
              if (!paymentMethod) {
                showAlert({ title: 'Gagal', description: 'Metode pembayaran wajib dipilih.', type: 'warning' });
                return;
              }

              setManualSubmitting(true);
              try {
                const token = localStorage.getItem('token') ?? '';
                const headers = token ? { Authorization: token } : undefined;
                const toNumberish = (v: string) => (v && Number.isFinite(Number(v)) ? Number(v) : v);
                const unitId = isTrx04Type ? (manualForm.order_id || undefined) : undefined;
                const payload: Record<string, unknown> = {
                  amount,
                  description: manualForm.description,
                  unit_id: unitId,
                  payment_method: paymentMethod,
                  payment_type: paymentType,
                  transaction_date: manualForm.transaction_date,
                  transaction_category: toNumberish(transactionCategoryValue),
                  transaction_item: toNumberish(transactionItemValue),
                };

                if (manualMode === 'edit') {
                  payload.transaction_id = activeTransactionId;
                }

                const endpoint =
                  manualMode === 'edit'
                    ? '/services/transactions/expenses/update'
                    : '/services/transactions/expenses/submit';

                const res = await api.post<unknown>(endpoint, payload, headers);
                if (res.status !== 'success') {
                  const code = String(res.message ?? '');
                  const map: Record<string, string> = {
                    PAYMENT_METHOD_DOESNT_EXIST: 'Metode pembayaran tidak tersedia. Silakan pilih metode lain.',
                    PAYMENT_TYPE_DOESNT_EXIST: 'Status pembayaran tidak tersedia. Silakan pilih status lain.',
                    PAYMENT_STATUS_DOESNT_EXIST: 'Status pembayaran tidak tersedia. Silakan pilih status lain.',
                    TRANSACTION_CATEGORY_DOESNT_EXIST: 'Jenis transaksi tidak tersedia. Silakan pilih jenis lain.',
                    TRANSACTION_ITEM_DOESNT_EXIST: 'Jenis pengeluaran tidak tersedia. Silakan pilih jenis lain.',
                    TRANSACTION_TYPE_DOESNT_EXIST: 'Jenis pengeluaran tidak tersedia. Silakan pilih jenis lain.',
                    BANK_DOESNT_EXIST: 'Bank tidak tersedia. Silakan pilih bank lain.',
                  };
                  const message = map[code] ?? (manualMode === 'edit'
                    ? 'Gagal mengubah expense. Silakan coba lagi.'
                    : 'Gagal menambahkan expense. Silakan coba lagi.');
                  showAlert({ title: 'Gagal', description: message, type: 'error' });
                  return;
                }

                showAlert({
                  title: 'Berhasil',
                  description: manualMode === 'edit' ? 'Expense berhasil diperbarui.' : 'Expense berhasil ditambahkan.',
                  type: 'success',
                });
                setManualOpen(false);
                resetManualState();
                await loadTransactions(headers);
              } finally {
                setManualSubmitting(false);
              }
            }}
          >
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                      {manualMode === 'edit' ? 'Edit Expense' : 'Tambah Expense'}
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      {manualMode === 'edit'
                        ? 'Perbarui catatan pengeluaran anda secara manual di sini'
                        : 'Tambahkan catatan pengeluaran anda secara manual di sini'}
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>

              <div className="mt-6 h-px bg-slate-100" />

              <h3 className="text-sm font-bold text-slate-900 mt-4 mb-2">Informasi Transaksi</h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 col-span-1 md:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Tanggal Transaksi *</Label>
                    <Popover open={transactionDateOpen} onOpenChange={setTransactionDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full h-12 justify-start text-left font-normal rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all">
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                          <span className={cn('text-slate-700', !manualForm.transaction_date && 'text-slate-400')}>
                            {manualForm.transaction_date
                              ? (tryParseDate(manualForm.transaction_date)?.toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                }) ?? 'Pilih tanggal')
                              : 'Pilih tanggal'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 shadow-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={tryParseDate(manualForm.transaction_date) ?? undefined}
                          onSelect={(d) => {
                            setManualForm((prev) => ({ ...prev, transaction_date: d ? toYmdLocal(d) : '' }));
                            if (d) setTransactionDateOpen(false);
                          }}
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={new Date().getFullYear() + 1}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Jenis Transaksi *</Label>
                    <Select
                      value={manualForm.order_type}
                      onValueChange={(v) => setManualForm((prev) => ({ ...prev, order_type: v, order_id: '' }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                        <SelectValue placeholder="Pilih jenis transaksi" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        {orderTypes.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)} className="rounded-lg">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showOrderOrFleetSelect ? (
                  <div className={cn('space-y-2', isFleetUnitType || isTrx04Type ? 'md:col-span-2' : '')}>
                    <Label className="text-slate-700 font-semibold ml-1">{isFleetUnitType ? 'Pilih Armada' : 'Pilih Pesanan'}</Label>
                    <Popover open={orderOpen} onOpenChange={setOrderOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={orderOpen}
                          className="w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all font-normal text-slate-700"
                          disabled={orderLoading}
                        >
                          <span className={cn('truncate text-left', manualForm.order_id ? 'text-slate-900' : 'text-slate-400')}>
                            {orderLoading
                              ? 'Memuat...'
                              : manualForm.order_id
                                ? (orderList.find((x) => x.id === manualForm.order_id)?.label ?? 'Pilih...')
                                : 'Pilih...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl" align="start">
                        <Command>
                          <CommandInput placeholder="Cari..." />
                          <CommandList>
                            <CommandEmpty>Tidak ada data.</CommandEmpty>
                            <CommandGroup>
                              {orderList.map((o) => {
                                const selected = o.id === manualForm.order_id;
                                return (
                                  <CommandItem
                                    key={o.id}
                                    value={o.label}
                                    onSelect={() => {
                                      setManualForm((prev) => ({ ...prev, order_id: o.id }));
                                      setOrderOpen(false);
                                    }}
                                    className="rounded-lg"
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{o.label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null}

<div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Jenis Pengeluaran *</Label>
                    <Popover open={transactionTypeOpen} onOpenChange={setTransactionTypeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={transactionTypeOpen}
                          className="w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all font-normal text-slate-700"
                        >
                          <span className={cn('truncate text-left', manualForm.transaction_type ? 'text-slate-900' : 'text-slate-400')}>
                            {manualForm.transaction_type
                              ? (transactionTypes.find((x) => String(x.id) === String(manualForm.transaction_type))?.label ?? 'Pilih jenis pengeluaran')
                              : 'Pilih jenis pengeluaran'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl" align="start">
                        <Command>
                          <CommandInput placeholder="Cari jenis transaksi..." />
                          <CommandList>
                            <CommandEmpty>Tidak ada data.</CommandEmpty>
                            <CommandGroup>
                              {transactionTypes.map((o) => {
                                const selected = String(o.id) === String(manualForm.transaction_type);
                                return (
                                  <CommandItem
                                    key={o.id}
                                    value={o.label}
                                    onSelect={() => {
                                      const nextId = String(o.id);
                                      setManualForm((prev) => ({
                                        ...prev,
                                        transaction_type: nextId,
                                      }));
                                      setTransactionTypeOpen(false);
                                    }}
                                    className="rounded-lg"
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{o.label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Status Pembayaran *</Label>
                    <Select value={manualForm.status} onValueChange={(v) => setManualForm((prev) => ({ ...prev, status: v }))}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                        <SelectValue placeholder="Pilih status pembayaran" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        {paymentStatuses.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)} className="rounded-lg">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Metode Pembayaran *</Label>
                    <Select value={manualForm.payment_method} onValueChange={(v) => setManualForm((prev) => ({ ...prev, payment_method: v }))}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        {paymentMethods.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)} className="rounded-lg">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-slate-700 font-semibold ml-1">Nominal Pembayaran *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600 bg-slate-100 border-r border-slate-200 px-2 py-1 rounded-l-lg">Rp</span>
                      <Input
                        id="amount"
                        inputMode="numeric"
                        value={formatRupiahInput(manualForm.amount)}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, '') }))}
                        placeholder="0"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all tabular-nums text-slate-700 pl-12"
                      />
                    </div>
                  </div>

                {showBankFields ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold ml-1">Pilih Bank</Label>
                      <Select value={manualForm.bank_code} onValueChange={(v) => setManualForm((prev) => ({ ...prev, bank_code: v }))}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                          <SelectValue placeholder="Pilih bank" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          {banks.map((b) => (
                            <SelectItem key={b.code} value={b.code} className="rounded-lg">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account" className="text-slate-700 font-semibold ml-1">No. Rekening Tujuan</Label>
                      <Input
                        id="bank_account"
                        inputMode="numeric"
                        value={manualForm.bank_account}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, bank_account: e.target.value.replace(/\D/g, '') }))}
                        placeholder="Masukkan no. rekening"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_account_name" className="text-slate-700 font-semibold ml-1">Nama Rekening Tujuan</Label>
                      <Input
                        id="bank_account_name"
                        value={manualForm.bank_account_name}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, bank_account_name: e.target.value }))}
                        placeholder="Masukkan nama rekening"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                      />
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-semibold ml-1">Keterangan</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    value={manualForm.description}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value.slice(0, 250) }))}
                    placeholder="Masukkan keterangan (opsional)"
                    rows={3}
                    className="rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700 pr-12"
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-slate-400">{manualForm.description.length}/250</span>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="w-full rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-2.5 flex items-start gap-2 md:max-w-[calc(100%-180px)]">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Pastikan semua informasi sudah benar sebelum menyimpan data pengeluaran.</span>
              </div>

              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end mt-3 md:mt-0">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  disabled={manualSubmitting}
                  className="w-full md:w-auto h-12 px-8 rounded-2xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 border-2 border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="w-full md:w-auto h-12 px-8 rounded-xl bg-blue-500 text-white font-normal flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {manualMode === 'edit' ? 'Update Expense' : 'Simpan Expense'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!deleteSubmitting && !open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Data pengeluaran{deleteTarget?.invoiceNumber ? ` ${deleteTarget.invoiceNumber}` : ''} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleteTarget?.id) return;
                setDeleteSubmitting(true);
                try {
                  const token = localStorage.getItem('token') ?? '';
                  const headers = token ? { Authorization: token } : undefined;
                  const res = await api.post<unknown>(
                    '/services/transactions/expenses/delete',
                    { transaction_id: deleteTarget.id },
                    headers
                  );

                  if (res.status !== 'success') {
                    showAlert({ title: 'Gagal', description: 'Gagal menghapus expense. Silakan coba lagi.', type: 'error' });
                    return;
                  }

                  showAlert({ title: 'Berhasil', description: 'Expense berhasil dihapus.', type: 'success' });
                  setDeleteTarget(null);
                  await loadTransactions(headers);
                } finally {
                  setDeleteSubmitting(false);
                }
              }}
            >
              {deleteSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
