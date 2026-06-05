import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, CreditCard, Filter, LogOut, Plus, Info, Save, X, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { showAlert } from '@/hooks/use-alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
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
  };

  type FilterValues = {
    month: string;
    year: string;
    invoice_number: string;
    transaction_type_label: string;
  };

  type IntOption = { id: string; label: string };
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
    bank_account_name: '',
  });
  const [filters, setFilters] = useState<FilterValues>({
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    invoice_number: '',
    transaction_type_label: 'all',
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
      const res = await api.get<unknown>('/services/transactions/expenses', headers);
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
          api.get<unknown>('/services/transactions/types?filteredby=items&type=expense&tags=general', headers),
          api.get<unknown>('/general/payment-status', headers),
          api.get<unknown>('/general/payment-method', headers),
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

    loadTransactions();
    loadMeta();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [selectedMonthIndex, selectedYear, pageSize, filters.invoice_number, filters.transaction_type_label]);

  const monthFilteredRows = useMemo(() => {
    return rows.filter((r) => {
      const d = tryParseDate(r.transactionDate);
      if (!d) return false;
      return d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear;
    });
  }, [rows, selectedMonthIndex, selectedYear]);

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

  const transactionTypeOptions = useMemo(() => {
    const set = new Set<string>();
    monthFilteredRows.forEach((r) => {
      const v = String(r.transactionTypeLabel ?? '').trim();
      if (v) set.add(v);
    });
    return [{ label: 'Semua', value: 'all' }, ...Array.from(set).sort((a, b) => a.localeCompare(b)).map((v) => ({ label: v, value: v }))];
  }, [monthFilteredRows]);

  const filteredRows = useMemo(() => {
    const q = filters.invoice_number.trim().toLowerCase();
    return monthFilteredRows.filter((r) => {
      if (filters.transaction_type_label !== 'all' && String(r.transactionTypeLabel ?? '') !== filters.transaction_type_label) return false;
      if (q) {
        const inv = String(r.invoiceNumber ?? '').toLowerCase();
        if (!inv.includes(q)) return false;
      }
      return true;
    });
  }, [filters.invoice_number, filters.transaction_type_label, monthFilteredRows]);

  const summary = useMemo(() => {
    let expense = 0;
    let operationalExpense = 0;
    let otherExpense = 0;
    const transactionCount = filteredRows.length;

    filteredRows.forEach((r) => {
      const val = Math.abs(r.amount || 0);
      expense += val;
      if (r.orderType === 3) operationalExpense += val;
      if (r.orderType === 4) otherExpense += val;
    });

    return { expense, operationalExpense, otherExpense, transactionCount };
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
      width: 320,
      render: (row) => <span className="text-sm text-foreground">{row.description || '-'}</span>,
    },
    {
      label: 'Jenis Transaksi',
      key: 'transactionTypeLabel',
      sortable: true,
      width: 170,
      render: (row) => <span className="text-sm text-foreground">{row.transactionCategoryLabel || '-'}</span>,
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
    ] as const;
  }, [monthOptions, transactionTypeOptions, yearOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">General Expenses</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Track organization expenses</p>
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
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <CreditCard className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">
                  Total Expense
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
                <div className="text-[11px] font-medium text-muted-foreground">
                  Pengeluaran Operasional
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
                transaction_type_label: 'all',
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
        title="Tambah Expense Manual"
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
        <DialogContent className="max-w-2xl p-0 border-none bg-white overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Tambah Expense</h2>
                  <p className="text-slate-500 text-sm">Tambahkan catatan pengeluaran anda secara manual di sini</p>
                </div>
              </div>
              <DialogClose className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </DialogClose>
            </div>

            <div className="h-px bg-slate-100" />

            <form
              className="space-y-6 h-85 overflow-auto max-h-[650px]"
              onSubmit={async (e) => {
                e.preventDefault();
                // ... validation logic stays the same ...
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

                  const res = await api.post<unknown>('/services/transactions/expenses/submit', payload, headers);
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
                    const message = map[code] ?? 'Gagal menambahkan expense. Silakan coba lagi.';
                    showAlert({ title: 'Gagal', description: message, type: 'error' });
                    return;
                  }

                  showAlert({ title: 'Berhasil', description: 'Expense berhasil ditambahkan.', type: 'success' });
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
                    bank_account_name: '',
                  }));
                  await loadTransactions(headers);
                } finally {
                  setManualSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="grid grid-cols-2 gap-5 col-span-1 md:col-span-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold ml-1">Tanggal Transaksi</Label>
                    <Popover open={transactionDateOpen} onOpenChange={setTransactionDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full h-12 justify-start text-left font-normal rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all">
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                          <span className="text-slate-700">
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
                    <Label className="text-slate-700 font-semibold ml-1">Jenis Transaksi</Label>
                    <Select
                      value={manualForm.order_type}
                      onValueChange={(v) => setManualForm((prev) => ({ ...prev, order_type: v, order_id: '' }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700">
                        <SelectValue placeholder="Pilih jenis order" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        {/* <SelectItem value="0" className="rounded-lg">Tanpa Order</SelectItem> */}
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
                  <Label className="text-slate-700 font-semibold ml-1">Jenis Pengeluaran</Label>
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
                      <SelectValue placeholder="Pilih metode" />
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
                <Textarea
                  id="description"
                  value={manualForm.description}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Masukkan keterangan"
                  rows={3}
                  className="rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {/* Info Card */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="text-blue-600">
                    <Info className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setManualOpen(false)}
                    disabled={manualSubmitting}
                    className="flex-1 md:flex-none h-12 px-8 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={manualSubmitting}
                    className="flex-1 md:flex-none h-10 px-8 rounded-lg bg-blue-500 text-white font-normal flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                  >
                    {manualSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Simpan Expense
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
