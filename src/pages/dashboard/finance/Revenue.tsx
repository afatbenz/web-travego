import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Car, Check, ChevronsUpDown, DollarSign, Download, FileSpreadsheet, Layers, LogIn, Save, Sheet, X } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { showAlert } from '@/hooks/use-alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContentScrollable, DialogScrollableBody, DialogStickyFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import moment from 'moment';
import * as XLSX from 'xlsx';

export const Revenue: React.FC = () => {
  type TransactionRow = {
    id: string;
    invoiceNumber: string;
    transactionDate: string;
    description: string;
    sourceLabel: string;
    transactionTypeLabel: string;
    transactionCategoryLabel: string;
    transactionMarkLabel: string;
    paymentTypeLabel: string;
    amount: number;
    statusLabel: string;
  };

  type RevenueExportRow = {
    transaction_date: string;
    invoice_number: string;
    transaction_category_label: string;
    description: string;
    amount: number;
    payment_method_label: string;
    created_at: string;
  };

  const PERIOD_OPTIONS = ['Bulan Ini', 'Bulan Lalu', '3 Bulan Terakhir', 'Tahun Ini', '1 Tahun terakhir', 'Tahun Lalu'] as const;
  type PeriodOption = (typeof PERIOD_OPTIONS)[number];

  type IntOption = { id: number; label: string };
  type BankOption = { code: string; name: string };

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

  const isIncoming = (row: TransactionRow) => {
    const mark = String(row.transactionCategoryLabel ?? '').toLowerCase();
    const type = String(row.transactionTypeLabel ?? '').toLowerCase();
    const desc = String(row.description ?? '').toLowerCase();
    if (['masuk', 'pemasukan', 'income', 'credit', 'kredit'].some((x) => mark.includes(x) || type.includes(x) || desc.includes(x))) {
      return true;
    }
    if (['keluar', 'pengeluaran', 'expense', 'debit', 'debet'].some((x) => mark.includes(x) || type.includes(x) || desc.includes(x))) {
      return false;
    }
    return row.amount >= 0;
  };

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [exportRows, setExportRows] = useState<RevenueExportRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
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
  const [manualForm, setManualForm] = useState({
    transaction_date: toYmdLocal(new Date()),
    transaction_type: '',
    order_type: '',
    order_id: '',
    status: '',
    payment_method: '',
    amount: '',
    description: '',
    bank_code: '',
    bank_account: '',
  });
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
      const res = await api.get<unknown>(`/services/transactions/revenue?${params.toString()}`, headers);
      if (currentReq !== requestIdRef.current) return;

      if (res.status !== 'success') {
        setRows([]);
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
        (Array.isArray(root.transactions) ? root.transactions : undefined) ??
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
        const paymentTypeLabel = toStringSafe(o.payment_type_label ?? o.paymentTypeLabel ?? o.payment_type_label ?? o.paymentTypeLabel).trim();
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

        return {
          id,
          invoiceNumber,
          transactionDate,
          description,
          sourceLabel,
          transactionTypeLabel,
          transactionCategoryLabel,
          paymentTypeLabel,
          transactionMarkLabel,
          amount,
          statusLabel,
        } satisfies TransactionRow;
      });

      const exportMapped = (listNode as unknown[]).map((raw) => {
        const o = toRecord(raw);
        return {
          transaction_date: toStringSafe(o.transaction_date ?? o.transactionDate).trim(),
          invoice_number: toStringSafe(o.invoice_number ?? o.invoiceNumber).trim(),
          transaction_category_label: toStringSafe(
            o.transaction_category_label ?? o.transactionCategoryLabel ?? o.category_label ?? o.categoryLabel
          ).trim(),
          description: toStringSafe(o.description ?? o.desc ?? o.note ?? o.notes ?? o.keterangan).trim(),
          amount: toNumberSafe(
            o.amount ??
              o.total_amount ??
              o.totalAmount ??
              o.transaction_amount ??
              o.transactionAmount ??
              o.payment_amount ??
              o.paymentAmount ??
              o.nominal ??
              o.value
          ),
          payment_method_label: toStringSafe(
            o.payment_method_label ?? o.paymentMethodLabel ?? o.payment_type_label ?? o.paymentTypeLabel
          ).trim(),
          created_at: toStringSafe(o.created_at ?? o.createdAt).trim(),
        } satisfies RevenueExportRow;
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
          api.get<unknown>('/services/transactions/labels?filteredby=categories&type=income', headers),
          api.get<unknown>('/general/payment-status', headers),
          api.get<unknown>('/general/payment-method?type=general', headers),
          api.get<unknown>('/general/bank-list', headers),
          api.get<unknown>('/services/transactions/types?filteredby=items&type=income', headers),
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
              const id = toNumberSafe(o.id);
              const label = toStringSafe(o.label).trim();
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
    if (![1, 2, 4].includes(ot)) {
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
        if (ot === 1) url = '/services/fleet/orders';
        else if (ot === 2) url = '/services/tour-packages/order/list';
        else if (ot === 4) url = '/services/fleet-units';

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
        const mapped = list.map((raw) => {
          const o = toRecord(raw);
          if (ot === 4) {
            const unit_id = toStringSafe(o.unit_id ?? o.id);
            const fleet_name = toStringSafe(o.fleet_name ?? o.fleet);
            const vehicle_id = toStringSafe(o.vehicle_id);
            const plate_number = toStringSafe(o.plate_number);
            return {
              id: unit_id,
              label: `${fleet_name} | ${vehicle_id} | ${plate_number}`.trim(),
            };
          } else {
            const order_id = toStringSafe(o.order_id ?? o.id);
            return {
              id: order_id,
              label: order_id,
            };
          }
        }).filter(x => x.id);
        
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

  useEffect(() => {
    if (!showBankFields) {
      setManualForm((prev) => ({ ...prev, bank_account: '', bank_code: '' }));
    }
  }, [showBankFields]);

  const filteredRows = rows;

  const exportSheetRows = useMemo(() => {
    return exportRows.map((row, index) => ({
      No: index + 1,
      'Tanggal Transaksi': row.transaction_date || '-',
      'No. Invoice': row.invoice_number || '-',
      Kategori: row.transaction_category_label || '-',
      Keterangan: row.description || '-',
      Nominal: row.amount ?? 0,
      'Metode Pembayaran': row.payment_method_label || '-',
      Timestamp: row.created_at || '-',
    }));
  }, [exportRows]);

  const downloadExcel = () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data revenue untuk diunduh.', type: 'warning' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 40 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue');
    XLSX.writeFile(workbook, `travego-revenue-${moment().format('YYYYMMDDHH:mm')}.xlsx`);
  };

  const exportToGoogleSheet = async () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data revenue untuk diexport.', type: 'warning' });
      return;
    }

    const headers = ['No', 'Tanggal Transaksi', 'No. Invoice', 'Kategori', 'Keterangan', 'Nominal', 'Metode Pembayaran', 'Timestamp'];
    const rowsTsv = exportSheetRows.map((row) => [
      row.No,
      row['Tanggal Transaksi'],
      row['No. Invoice'],
      row.Kategori,
      row.Keterangan,
      row.Nominal,
      row['Metode Pembayaran'],
      row.Timestamp,
    ]);
    const tsv = [headers, ...rowsTsv]
      .map((cols) => cols.map((value) => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({
        title: 'Berhasil',
        description: 'Data revenue disalin ke clipboard. Tempel di Google Sheet dengan Ctrl+V.',
        type: 'success',
      });
    } catch {
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({
        title: 'Perhatian',
        description: 'Google Sheet dibuka, tetapi data gagal disalin ke clipboard.',
        type: 'warning',
      });
    }
  };

  const summary = useMemo(() => {
    let revenue = 0;
    let incomingCount = 0;
    let rentalRevenue = 0;

    filteredRows.forEach((r) => {
      if (isIncoming(r)) {
        incomingCount += 1;
        const amt = Math.abs(r.amount || 0);
        revenue += amt;
        const tag = `${r.sourceLabel ?? ''} ${r.transactionTypeLabel ?? ''} ${r.description ?? ''}`.toLowerCase();
        if (tag.includes('rental')) rentalRevenue += amt;
      }
    });

    const otherRevenue = Math.max(0, revenue - rentalRevenue);
    return { revenue, incomingCount, rentalRevenue, otherRevenue };
  }, [filteredRows]);

  const startIndex = (page - 1) * pageSize;
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
      width: 190,
      render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.invoiceNumber || '-'}</span>,
    },
    {
      label: 'Keterangan',
      key: 'description',
      sortable: true,
      width: 420,
      render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.description || '-'}</span>,
    },
    {
      label: 'Jenis Transaksi',
      key: 'transactionCategoryLabel',
      sortable: true,
      width: 240,
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
    // {
    //   label: '',
    //   key: 'paymentType',
    //   sortable: true,
    //   width: 140,
    //   render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.paymentTypeLabel || '-'}</span>,
    // },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pendapatan</h1>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Lihat pendapatan pada periode <span className="font-medium text-foreground">{period}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm pb-0">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-5">
                <DollarSign className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">
                  Pendapatan ({period})
                </div>
              </div>
              {loading ? (
                <div className="mt-5 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-5">
                  {formatRupiah(summary.revenue)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5 pb-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-5">
                <LogIn className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Transaksi masuk</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {summary.incomingCount}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5 pb-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 mb-5">
                <Car className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Pendapatan Rental</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.rentalRevenue)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5 pb-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 mb-5">
                <Layers className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Pendapatan Lainnya</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.otherRevenue)}
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
                    <Button type="button" variant="outline" className="h-10 rounded-2xl px-3 bg-blue-500 hover:bg-blue-700 no-border" title="Download report">
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[260px] rounded-2xl">
                    <DropdownMenuItem className="cursor-pointer gap-2" onSelect={downloadExcel}>
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span>Download file excel (.xlsx)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2" onSelect={() => void exportToGoogleSheet()}>
                      <Sheet className="h-4 w-4 text-green-600" />
                      <span>Export ke Google Sheet</span>
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

      {/* <Button
        type="button"
        onClick={() => setManualOpen(true)}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-6 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Revenue Manual"
      >
        <Plus className="h-6 w-6" />
      </Button> */}

      <Dialog
        open={manualOpen}
        onOpenChange={(v) => {
          if (manualSubmitting) return;
          setManualOpen(v);
        }}
      >
        <DialogContentScrollable className="max-w-2xl p-0 border-none bg-white">
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
              const transactionType = Number(manualForm.transaction_type || 0);
              if (!transactionType) {
                showAlert({ title: 'Gagal', description: 'Jenis transaksi wajib dipilih.', type: 'warning' });
                return;
              }
              const status = Number(manualForm.status || 0);
              if (!status) {
                showAlert({ title: 'Gagal', description: 'Status pembayaran wajib dipilih.', type: 'warning' });
                return;
              }
              const paymentMethod = Number(manualForm.payment_method || 0);
              if (!paymentMethod) {
                showAlert({ title: 'Gagal', description: 'Metode pembayaran wajib dipilih.', type: 'warning' });
                return;
              }
              const orderType = Number(manualForm.order_type || 0);
              if (orderType && !manualForm.order_id) {
                const label = orderType === 4 ? 'Unit armada' : 'Order';
                showAlert({ title: 'Gagal', description: `${label} wajib dipilih jika jenis order ditentukan.`, type: 'warning' });
                return;
              }
              if (showBankFields) {
                if (!manualForm.bank_code) {
                  showAlert({ title: 'Gagal', description: 'Pilih bank wajib diisi.', type: 'warning' });
                  return;
                }
                if (!manualForm.bank_account.trim()) {
                  showAlert({ title: 'Gagal', description: 'No. rekening wajib diisi.', type: 'warning' });
                  return;
                }
              }

              setManualSubmitting(true);
              try {
                const token = localStorage.getItem('token') ?? '';
                const headers = token ? { Authorization: token } : undefined;
                const payload: Record<string, unknown> = {
                  transaction_date: manualForm.transaction_date,
                  transaction_type: transactionType,
                  status,
                  payment_method: paymentMethod,
                  amount,
                  description: manualForm.description,
                  order_type: orderType || undefined,
                  order_id: manualForm.order_id || undefined,
                };
                if (showBankFields) {
                  payload.bank_code = manualForm.bank_code;
                  payload.bank_account = manualForm.bank_account;
                }

                const res = await api.post<unknown>('/services/transactions/create', payload, headers);
                if (res.status !== 'success') {
                  const code = String(res.message ?? '');
                  const map: Record<string, string> = {
                    PAYMENT_METHOD_DOESNT_EXIST: 'Metode pembayaran tidak tersedia. Silakan pilih metode lain.',
                    PAYMENT_STATUS_DOESNT_EXIST: 'Status pembayaran tidak tersedia. Silakan pilih status lain.',
                    TRANSACTION_TYPE_DOESNT_EXIST: 'Jenis transaksi tidak tersedia. Silakan pilih jenis lain.',
                    BANK_DOESNT_EXIST: 'Bank tidak tersedia. Silakan pilih bank lain.',
                  };
                  const message = map[code] ?? 'Gagal menambahkan revenue. Silakan coba lagi.';
                  showAlert({ title: 'Gagal', description: message, type: 'error' });
                  return;
                }

                showAlert({ title: 'Berhasil', description: 'Revenue berhasil ditambahkan.', type: 'success' });
                setManualOpen(false);
                setManualForm((prev) => ({
                  ...prev,
                  transaction_date: toYmdLocal(new Date()),
                  transaction_type: '',
                  order_type: '',
                  order_id: '',
                  status: '',
                  payment_method: '',
                  amount: '',
                  description: '',
                  bank_code: '',
                  bank_account: '',
                }));
                await loadTransactions(headers);
              } finally {
                setManualSubmitting(false);
              }
            }}
          >
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <DollarSign className="w-3 h-3 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Tambah Revenue</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">Tambahkan catatan pendapatan anda secara manual di sini</p>
                  </div>
                </div>
                <DialogClose className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </DialogClose>
              </div>

              <div className="mt-6 h-px bg-slate-100" />
            </div>

            <DialogScrollableBody className="px-6 sm:px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Tanggal Transaksi</Label>
                  <Popover open={transactionDateOpen} onOpenChange={setTransactionDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 justify-start text-left font-normal rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {manualForm.transaction_date
                          ? (tryParseDate(manualForm.transaction_date)?.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            }) ?? 'Pilih tanggal transaksi')
                          : 'Pilih tanggal transaksi'}
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
                        classNames={{
                          month: 'space-y-4',
                          table: 'w-full border-collapse space-y-1',
                          head_row: 'flex w-full',
                          head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center',
                          row: 'flex w-full mt-2',
                          cell:
                            'relative p-0 text-center text-sm flex-1 focus-within:relative focus-within:z-20 bg-transparent [&:has([aria-selected])]:bg-gray-100 dark:[&:has([aria-selected])]:bg-gray-800 [&:has([aria-selected].day-outside)]:bg-gray-100 dark:[&:has([aria-selected].day-outside)]:bg-gray-800 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:rounded-md',
                          day:
                            'h-9 w-full p-0 font-normal aria-selected:opacity-100 bg-transparent text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800 rounded-md',
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Jenis Order</Label>
                  <Select value={manualForm.order_type} onValueChange={(v) => setManualForm((prev) => ({ ...prev, order_type: v, order_id: '' }))}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                      <SelectValue placeholder="Pilih jenis order (opsional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="0">Tanpa Order</SelectItem>
                      {orderTypes.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold ml-1">Jenis Transaksi</Label>
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
                          ? (transactionTypes.find((x) => x.id === Number(manualForm.transaction_type))?.label ?? 'Pilih jenis transaksi')
                          : 'Pilih jenis transaksi'}
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
                                  setManualForm((prev) => ({ ...prev, transaction_type: String(o.id) }));
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

              {manualForm.order_type && ['1', '2', '4'].includes(manualForm.order_type) ? (
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">{manualForm.order_type === '4' ? 'Pilih Armada' : 'Pilih Pesanan'}</Label>
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
                <Label className="text-slate-700 font-semibold ml-1">Status Pembayaran</Label>
                <Select value={manualForm.status} onValueChange={(v) => setManualForm((prev) => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                    <SelectValue placeholder="Pilih status" />
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
                <Label className="text-slate-700 font-semibold ml-1">Metode Pembayaran</Label>
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
                <Label htmlFor="amount" className="text-slate-700 font-semibold ml-1">Nominal Pembayaran</Label>
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={formatRupiahInput(manualForm.amount)}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Rp 0"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all tabular-nums text-slate-700"
                />
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
                    <Label htmlFor="bank_account" className="text-slate-700 font-semibold ml-1">No. Rekening</Label>
                    <Input
                      id="bank_account"
                      inputMode="numeric"
                      value={manualForm.bank_account}
                      onChange={(e) => setManualForm((prev) => ({ ...prev, bank_account: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Masukkan no. rekening"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                    />
                  </div>
                </>
              ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-semibold ml-1">Keterangan</Label>
                <Textarea
                  id="description"
                  value={manualForm.description}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan keterangan"
                  rows={3}
                  className="rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                />
              </div>
            </DialogScrollableBody>

            <DialogStickyFooter className="px-6 sm:px-8 pb-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  disabled={manualSubmitting}
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 border-2 border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="w-full sm:w-auto h-12 px-5 rounded-lg text-md bg-blue-500 text-white font-normal flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.3)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Revenue
                    </>
                  )}
                </button>
              </div>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>
    </div>
  );
};
