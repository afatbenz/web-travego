import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, DollarSign, LogIn } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

  const toRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const toStringSafe = (v: unknown): string =>
    typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

  const toNumberSafe = (v: unknown): number => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : typeof v === 'bigint' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  const tryParseDate = (value: string): Date | null => {
    const v = String(value ?? '').trim();
    if (!v) return null;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const iso = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(iso.getTime()) ? null : iso;
  };

  const formatDdMmmYy = (value: string) => {
    const d = tryParseDate(value);
    if (!d) return '-';
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

  const formatRupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

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
    if (['unpaid', 'pending', 'belum', 'menunggu', 'waiting', 'due'].some((x) => v.includes(x))) {
      return (
        <Badge className="rounded-full border-transparent bg-transparent px-3 py-1 font-medium text-amber-700 hover:bg-gray-200/10 dark:bg-amber-400/15 dark:text-amber-300 dark:hover:bg-amber-400/15">
          Belum lunas
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

  const isUnpaid = (row: TransactionRow) => {
    const v = String(row.statusLabel ?? '').trim().toLowerCase();
    if (!v) return false;
    if (['paid', 'lunas', 'success', 'completed', 'selesai'].some((x) => v.includes(x))) return false;
    if (['unpaid', 'pending', 'belum', 'menunggu', 'waiting', 'due'].some((x) => v.includes(x))) return true;
    return false;
  };

  const monthNames = useMemo(
    () => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    []
  );

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  useEffect(() => {
    const load = async () => {
      const currentReq = (requestIdRef.current += 1);
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/transactions/all', token ? { Authorization: token } : undefined);
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
          const statusLabel = toStringSafe(o.status_label ?? o.statusLabel ?? o.status ?? o.payment_status_label ?? o.paymentStatusLabel ?? o.payment_status).trim();

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

    load();
  }, []);

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
    let unpaidCount = 0;

    filteredRows.forEach((r) => {
      if (isIncoming(r)) {
        incomingCount += 1;
        revenue += Math.abs(r.amount || 0);
      }
      if (isUnpaid(r)) unpaidCount += 1;
    });

    return { revenue, incomingCount, unpaidCount };
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="text-[11px] font-medium text-muted-foreground">Transaksi Masuk</div>
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
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4" />
                <div className="text-[11px] font-medium text-muted-foreground">Belum lunas</div>
              </div>
              {loading ? (
                <div className="mt-1 h-6 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <div className="text-lg md:text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {summary.unpaidCount}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};
