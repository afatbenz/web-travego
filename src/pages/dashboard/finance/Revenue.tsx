import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Car, Check, ChevronsUpDown, DollarSign, Filter, Layers, LogIn, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { showAlert } from '@/hooks/use-alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const Revenue: React.FC = () => {
  type TransactionRow = {
    id: string;
    invoiceNumber: string;
    transactionDate: string;
    description: string;
    sourceLabel: string;
    transactionTypeLabel: string;
    transactionMarkLabel: string;
    amount: number;
    statusLabel: string;
  };

  type FilterValues = {
    month: string;
    year: string;
    invoice_number: string;
    source: string;
    transaction_type_label: string;
    transaction_mark_label: string;
  };

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

  const statusBadge = (status: string) => {
    const v = String(status ?? '').trim().toLowerCase();
    if (!v) return <Badge variant="outline">-</Badge>;
    if (['paid', 'lunas', 'success', 'completed', 'selesai'].some((x) => v.includes(x))) {
      return (
        <Badge className="rounded-full border-transparent bg-transparent px-3 py-1 font-medium text-emerald-700 hover:bg-gray-200/10 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/15">
          Lunas
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const isIncoming = (row: TransactionRow) => {
    const mark = String(row.transactionMarkLabel ?? '').toLowerCase();
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

  const monthNames = useMemo(
    () => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    []
  );

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
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
  const [filters, setFilters] = useState<FilterValues>({
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    invoice_number: '',
    source: 'all',
    transaction_type_label: 'all',
    transaction_mark_label: 'all',
  });

  const selectedMonthIndex = Math.min(11, Math.max(0, Number(filters.month || '1') - 1));
  const selectedYear = Number(filters.year || String(new Date().getFullYear())) || new Date().getFullYear();

  const monthOptions = useMemo(() => {
    return monthNames.map((label, i) => ({ label, value: String(i + 1).padStart(2, '0') }));
  }, [monthNames]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 9 }).map((_, i) => {
      const year = y - 4 + i;
      return { label: String(year), value: String(year) };
    });
  }, []);

  const requestIdRef = useRef(0);
  const metaRequestIdRef = useRef(0);

  const loadTransactions = async (headersOverride?: Record<string, string>) => {
    const currentReq = (requestIdRef.current += 1);
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = headersOverride ?? (token ? { Authorization: token } : undefined);
      const res = await api.get<unknown>('/services/transactions/revenue', headers);
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
          transactionMarkLabel,
          amount,
          statusLabel,
        } satisfies TransactionRow;
      });

      setRows(mapped);
    } finally {
      if (currentReq === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const loadMeta = async () => {
      const currentReq = (metaRequestIdRef.current += 1);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const [typesRes, statusesRes, methodsRes, banksRes, orderTypesRes] = await Promise.all([
          api.get<unknown>('/services/transactions/labels?filteredby=income', headers),
          api.get<unknown>('/general/payment-status', headers),
          api.get<unknown>('/general/payment-method', headers),
          api.get<unknown>('/general/bank-list', headers),
          api.get<unknown>('/services/transactions/types', headers),
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

    loadTransactions();
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
  }, [
    selectedMonthIndex,
    selectedYear,
    pageSize,
    filters.invoice_number,
    filters.source,
    filters.transaction_mark_label,
    filters.transaction_type_label,
  ]);

  const monthFilteredRows = useMemo(() => {
    return rows.filter((r) => {
      const d = tryParseDate(r.transactionDate);
      if (!d) return false;
      return d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear;
    });
  }, [rows, selectedMonthIndex, selectedYear]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    monthFilteredRows.forEach((r) => {
      const v = String(r.sourceLabel ?? '').trim();
      if (v) set.add(v);
    });
    return [{ label: 'Semua', value: 'all' }, ...Array.from(set).sort((a, b) => a.localeCompare(b)).map((v) => ({ label: v, value: v }))];
  }, [monthFilteredRows]);

  const showBankFields = useMemo(() => {
    const id = Number(manualForm.payment_method || 0);
    return id === 1002;
  }, [manualForm.payment_method]);

  useEffect(() => {
    if (!showBankFields) {
      setManualForm((prev) => ({ ...prev, bank_account: '', bank_code: '' }));
    }
  }, [showBankFields]);

  const transactionTypeOptions = useMemo(() => {
    const set = new Set<string>();
    monthFilteredRows.forEach((r) => {
      const v = String(r.transactionTypeLabel ?? '').trim();
      if (v) set.add(v);
    });
    return [{ label: 'Semua', value: 'all' }, ...Array.from(set).sort((a, b) => a.localeCompare(b)).map((v) => ({ label: v, value: v }))];
  }, [monthFilteredRows]);

  const transactionMarkOptions = useMemo(() => {
    const set = new Set<string>();
    monthFilteredRows.forEach((r) => {
      const v = String(r.transactionMarkLabel ?? '').trim();
      if (v) set.add(v);
    });
    return [{ label: 'Semua', value: 'all' }, ...Array.from(set).sort((a, b) => a.localeCompare(b)).map((v) => ({ label: v, value: v }))];
  }, [monthFilteredRows]);

  const filteredRows = useMemo(() => {
    const q = filters.invoice_number.trim().toLowerCase();
    return monthFilteredRows.filter((r) => {
      if (filters.source !== 'all' && String(r.sourceLabel ?? '') !== filters.source) return false;
      if (filters.transaction_type_label !== 'all' && String(r.transactionTypeLabel ?? '') !== filters.transaction_type_label) return false;
      if (filters.transaction_mark_label !== 'all' && String(r.transactionMarkLabel ?? '') !== filters.transaction_mark_label) return false;
      if (q) {
        const inv = String(r.invoiceNumber ?? '').toLowerCase();
        if (!inv.includes(q)) return false;
      }
      return true;
    });
  }, [filters.invoice_number, filters.source, filters.transaction_mark_label, filters.transaction_type_label, monthFilteredRows]);

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
      render: (row) => <span className="text-sm text-foreground tabular-nums">{formatDdMmmYy(row.transactionDate)}</span>,
    },
    {
      label: 'No. Invoice',
      key: 'invoiceNumber',
      sortable: true,
      width: 170,
      render: (row) => <span className="text-sm text-foreground">{row.invoiceNumber || '-'}</span>,
    },
    {
      label: 'Keterangan',
      key: 'description',
      sortable: true,
      width: 420,
      render: (row) => <span className="text-sm text-foreground">{row.description || '-'}</span>,
    },
    {
      label: 'Jenis Transaksi',
      key: 'transactionMarkLabel',
      sortable: true,
      width: 170,
      render: (row) => <span className="text-sm text-foreground">{row.transactionTypeLabel || '-'}</span>,
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
      label: 'Status',
      key: 'statusLabel',
      sortable: true,
      width: 140,
      render: (row) => statusBadge(row.statusLabel),
    },
  ];

  const filterFields = useMemo(() => {
    return [
      {
        name: 'month',
        type: 'select',
        label: 'Bulan',
        placeholder: 'Pilih bulan',
        options: monthOptions,
      },
      {
        name: 'year',
        type: 'select',
        label: 'Tahun',
        placeholder: 'Pilih tahun',
        options: yearOptions,
      },
      {
        name: 'invoice_number',
        type: 'text',
        label: 'Invoice',
        placeholder: 'Cari invoice_number...',
      },
      {
        name: 'transaction_type_label',
        type: 'select',
        label: 'Tipe',
        placeholder: 'Semua tipe',
        options: transactionTypeOptions,
      },
      {
        name: 'transaction_mark_label',
        type: 'select',
        label: 'Jenis Transaksi',
        placeholder: 'Semua jenis transaksi',
        options: transactionMarkOptions,
      },
    ] as const;
  }, [monthOptions, sourceOptions, transactionMarkOptions, transactionTypeOptions, yearOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Track organization revenue</p>
      </div>

      <div className="flex items-center justify-between gap-3">
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
        <Button type="button" onClick={() => setManualOpen(true)} className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Manual
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <DollarSign className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">
                  Pendapatan bulan {monthNames[selectedMonthIndex]}
                </div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-28 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {formatRupiah(summary.revenue)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <LogIn className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Jumlah transaksi masuk</div>
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
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
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
          <CardContent className="px-4 py-3 md:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
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
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
          filterOpen ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
        }`}
      >
        <div className="pt-1">
          <FilterBar
            fields={filterFields}
            values={filters}
            onChange={(name, value) => setFilters((prev) => ({ ...prev, [name]: String(value ?? '') }))}
            onReset={() =>
              setFilters({
                month: String(new Date().getMonth() + 1).padStart(2, '0'),
                year: String(new Date().getFullYear()),
                invoice_number: '',
                source: 'all',
                transaction_type_label: 'all',
                transaction_mark_label: 'all',
              })
            }
            layout="responsive-grid"
            resetButtonClassName="hidden md:inline-flex md:w-auto"
          />
        </div>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-0"
        emptyTitle="Tidak ada data transaksi"
        emptyDescription="Coba ubah filter atau periode bulan & tahun."
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
        onClick={() => setManualOpen(true)}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-6 z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Revenue Manual"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog
        open={manualOpen}
        onOpenChange={(v) => {
          if (manualSubmitting) return;
          setManualOpen(v);
        }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-gray-900 px-6 py-4">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-base md:text-lg">Tambah Revenue Manual</DialogTitle>
              <div className="mt-1 text-xs text-muted-foreground">Tambahkan catatan pendapatan anda secara manual di sini</div>
            </DialogHeader>
          </div>

          <form
            className="space-y-4 p-6"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                <div className="space-y-2">
                  <Label>Tanggal Transaksi</Label>
                  <Popover open={transactionDateOpen} onOpenChange={setTransactionDateOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full h-11 justify-start text-left font-normal rounded-xl">
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                        {manualForm.transaction_date
                          ? (tryParseDate(manualForm.transaction_date)?.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            }) ?? 'Pilih tanggal transaksi')
                          : 'Pilih tanggal transaksi'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                  <Label>Jenis Order</Label>
                  <Select value={manualForm.order_type} onValueChange={(v) => setManualForm((prev) => ({ ...prev, order_type: v, order_id: '' }))}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Pilih jenis order (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label>Jenis Transaksi</Label>
                <Popover open={transactionTypeOpen} onOpenChange={setTransactionTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={transactionTypeOpen}
                      className="w-full h-11 justify-between rounded-xl font-normal"
                    >
                      <span className={cn('truncate text-left', manualForm.transaction_type ? '' : 'text-muted-foreground')}>
                        {manualForm.transaction_type
                          ? (transactionTypes.find((x) => x.id === Number(manualForm.transaction_type))?.label ?? 'Pilih jenis transaksi')
                          : 'Pilih jenis transaksi'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                  <Label>{manualForm.order_type === '4' ? 'Pilih Armada' : 'Pilih Pesanan'}</Label>
                  <Popover open={orderOpen} onOpenChange={setOrderOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={orderOpen}
                        className="w-full h-11 justify-between rounded-xl font-normal"
                        disabled={orderLoading}
                      >
                        <span className={cn('truncate text-left', manualForm.order_id ? '' : 'text-muted-foreground')}>
                          {orderLoading
                            ? 'Memuat...'
                            : manualForm.order_id
                            ? (orderList.find((x) => x.id === manualForm.order_id)?.label ?? 'Pilih...')
                            : 'Pilih...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                <Label>Status Pembayaran</Label>
                <Select value={manualForm.status} onValueChange={(v) => setManualForm((prev) => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={manualForm.payment_method} onValueChange={(v) => setManualForm((prev) => ({ ...prev, payment_method: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Nominal Pembayaran</Label>
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={formatRupiahInput(manualForm.amount)}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Rp 0"
                  className="tabular-nums"
                />
              </div>

              {showBankFields ? (
                <>
                  <div className="space-y-2">
                    <Label>Pilih Bank</Label>
                    <Select value={manualForm.bank_code} onValueChange={(v) => setManualForm((prev) => ({ ...prev, bank_code: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((b) => (
                          <SelectItem key={b.code} value={b.code}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account">No. Rekening</Label>
                    <Input
                      id="bank_account"
                      inputMode="numeric"
                      value={manualForm.bank_account}
                      onChange={(e) => setManualForm((prev) => ({ ...prev, bank_account: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Masukkan no. rekening"
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                value={manualForm.description}
                onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Masukkan keterangan"
                rows={4}
              />
            </div>

            <div className="border-t pt-4">
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setManualOpen(false)} disabled={manualSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={manualSubmitting} className='bg-blue-600 hover:bg-blue-700 text-white'>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambahkan Revenue
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
