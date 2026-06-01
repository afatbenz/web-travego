import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';

type FleetScheduleRow = {
  orderId: string;
  tripDate: string;
  fleetName: string;
  vehicleId: string;
  plateNumber: string;
  destinations: string;
  driverName: string;
  crewName: string;
  status: string;
  scheduleNumber: string;
};

type FilterValues = {
  orderId: string;
  period: string;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

const pickString = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = obj[k];
    const s = toStringSafe(v).trim();
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

const formatDmy = (value: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd} ${d.toLocaleDateString('id-ID', { month: 'long' })} ${yyyy}`;
};

const getDefaultPeriod = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const normalizePeriod = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return getDefaultPeriod();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^(\d{4})[\/-](\d{1,2})$/);
  if (m) return `${m[1]}-${String(Number(m[2])).padStart(2, '0')}`;
  return getDefaultPeriod();
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const parsePeriodParts = (value: string): { year: number; month: number } => {
  const normalized = normalizePeriod(value);
  const [yRaw, mRaw] = normalized.split('-');
  const year = Number(yRaw) || new Date().getFullYear();
  const month = Math.min(12, Math.max(1, Number(mRaw) || 1));
  return { year, month };
};

const formatPeriodLabel = (value: string): string => {
  const { year, month } = parsePeriodParts(value);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const shiftPeriod = (value: string, deltaMonths: number): string => {
  const { year, month } = parsePeriodParts(value);
  const d = new Date(year, month - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

const statusVariant = (statusRaw: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const s = statusRaw.trim().toLowerCase();
  if (!s) return 'outline';
  if (['selesai', 'done', 'completed', 'success'].includes(s)) return 'secondary';
  if (['dibatalkan', 'cancelled', 'canceled', 'failed', 'reject', 'rejected'].includes(s)) return 'destructive';
  if (['sedang berjalan', 'ongoing', 'in progress', 'in_progress', 'running', 'scheduled'].includes(s)) return 'default';
  return 'outline';
};

const extractRows = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const root = toRecord(payload);
  const candidates = [root.data, root.schedules, root.items, root.rows, root.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    const rec = toRecord(c);
    const nestedCandidates = [rec.data, rec.schedules, rec.items, rec.rows, rec.results];
    for (const n of nestedCandidates) {
      if (Array.isArray(n)) return n;
    }
  }
  return [];
};

export const FleetSchedules: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FleetScheduleRow[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>(() => ({
    orderId: '',
    period: getDefaultPeriod(),
  }));

  const [applied, setApplied] = useState<FilterValues>(() => ({
    orderId: '',
    period: getDefaultPeriod(),
  }));

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);

  const periodParts = useMemo(() => parsePeriodParts(filterValues.period), [filterValues.period]);
  const periodLabel = useMemo(() => formatPeriodLabel(filterValues.period), [filterValues.period]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const d = new Date(2020, i, 1);
        return { value: pad2(i + 1), label: d.toLocaleDateString('id-ID', { month: 'long' }) };
      }),
    []
  );

  const yearOptions = useMemo(() => {
    const baseYear = periodParts.year || new Date().getFullYear();
    return Array.from({ length: 11 }).map((_, i) => {
      const y = baseYear - 5 + i;
      return { value: String(y), label: String(y) };
    });
  }, [periodParts.year]);

  const applyPeriod = (nextPeriod: string) => {
    const normalized = normalizePeriod(nextPeriod);
    setFilterValues((prev) => ({ ...prev, period: normalized }));
    setApplied((prev) => ({ ...prev, period: normalized }));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('period', normalizePeriod(applied.period));
        const res = await api.get<unknown>(
          `/services/schedule/fleet?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setRows([]);
          return;
        }

        const items = extractRows(res.data);
        const mapped: FleetScheduleRow[] = items.map((raw) => {
          const item = toRecord(raw);
          const orderId = pickString(item, ['order_id', 'orderId', 'order_id_display', 'order_code', 'id']) || '-';
          const startDate = pickString(item, ['start_date']);
          const endDate = pickString(item, ['end_date']);
          const startLabel = formatDmy(startDate);
          const endLabel = formatDmy(endDate);
          const tripDate = startLabel && endLabel ? `${startLabel} - ${endLabel}` : startLabel || endLabel || '-';
          const fleetName = pickString(item, ['fleet_name', 'fleetName', 'armada', 'vehicle_name', 'vehicleName', 'unit_name', 'unitName', 'name']) || '-';
          const vehicleId = pickString(item, ['vehicle_id', 'vehicleId']) || '-';
          const plateNumber = pickString(item, ['plate_number', 'plateNumber']) || '-';
          const crewName = pickString(item, ['crew_name', 'crewName']) || '-';
          const destinations = pickString(item, ['destination', 'destinations']) || '-';
          const scheduleNumber = pickString(item, ['schedule_number', 'scheduleNumber']) || '-';

          const driverName =
            pickString(item, ['driver_name', 'driverName']) ||
            pickString(toRecord(item.driver), ['fullname', 'name']) ||
            pickString(toRecord(item.crew), ['driver_name', 'driverName']) ||
            '-';
          const status = pickString(item, ['status', 'schedule_status', 'scheduleStatus', 'order_status', 'orderStatus', 'status_label', 'statusLabel']) || '-';

          return { orderId, tripDate, fleetName, vehicleId, plateNumber, destinations, scheduleNumber, driverName, crewName, status };
        });

        setRows(mapped);
        setPage(1);
      } finally {
        setLoading(false);
      }
    })();
  }, [applied.period, token]);

  const filteredRows = useMemo(() => {
    const q = applied.orderId.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.orderId.toLowerCase().includes(q));
  }, [applied.orderId, rows]);

  const filterFields = useMemo(
    () =>
      [
        { name: 'orderId', type: 'text', label: 'Order ID', placeholder: 'Cari Order ID…' },
      ] as const,
    []
  );

  const columns = useMemo(() => {
    return [
      {
        label: 'No',
        key: '__no__',
        width: 72,
        render: (_row, rowIndex) => (
          <div className="tabular-nums text-muted-foreground">{(page - 1) * pageSize + rowIndex + 1}</div>
        ),
      },
      {
        label: 'Armada',
        key: 'fleetName',
        width: 270,
        sortable: true,
        render: (row) => <div className="text-foreground">{row.fleetName} - <b> {row.plateNumber}</b></div>,
      },
      // {
      //   label: 'Order ID',
      //   key: 'orderId',
      //   width: 200,
      //   sortable: true,
      //   render: (row) => <div className="font-medium text-foreground">{row.orderId}</div>,
      // },
      {
        label: 'Tanggal Perjalanan',
        key: 'tripDate',
        width: 180,
        sortable: true,
        render: (row) => <div className="text-foreground">{row.tripDate}</div>,
      },
      {
        label: 'Crew',
        key: 'driverName',
        width: 220,
        sortable: true,
        render: (row) => <div className="text-foreground">{row.driverName.split(" ").slice(0, 2).join(" ")} {row.crewName ? `, ${row.crewName.split(" ").slice(0, 2).join(" ")}` : ''}</div>,
      },
      {
        label: 'Tujuan',
        key: 'status',
        width: 160,
        sortable: true,
        render: (row) => (
          <div className="text-foreground">
            {row.destinations ? row.destinations.split(",").slice(0, 2).join(", ") : '-'}  
          </div>
        ),
      },
    ] satisfies Array<DataTableColumn<FleetScheduleRow>>;
  }, [page, pageSize]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Jadwal Armada</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola dan pantau jadwal armada berdasarkan periode.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
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
      </div>

      <div
        className={cn(
          'overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out',
          filterOpen ? 'max-h-[560px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
        )}
      >
        <div className="pt-1">
          <div className="mb-3 grid grid-cols-2 items-end gap-3 md:flex md:flex-nowrap md:items-end md:overflow-x-auto">
            <div className="col-span-2 min-w-0 w-full md:w-auto md:min-w-[320px]">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Periode</div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => applyPeriod(shiftPeriod(applied.period, -1))}
                  aria-label="Bulan sebelumnya"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 justify-start rounded-lg font-normal"
                      aria-label="Pilih periode"
                      title="Pilih periode"
                    >
                      <span className="truncate capitalize">{periodLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[340px] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Bulan</div>
                        <Select
                          value={pad2(periodParts.month)}
                          onValueChange={(m) => applyPeriod(`${periodParts.year}-${m}`)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Pilih bulan" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="capitalize">{opt.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Tahun</div>
                        <Select
                          value={String(periodParts.year)}
                          onValueChange={(y) => applyPeriod(`${y}-${pad2(periodParts.month)}`)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Pilih tahun" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button type="button" className="h-9 rounded-lg" onClick={() => setPeriodPickerOpen(false)}>
                        Selesai
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => applyPeriod(shiftPeriod(applied.period, 1))}
                  aria-label="Bulan selanjutnya"
                  title="Bulan selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <FilterBar
            fields={filterFields}
            values={filterValues}
            onChange={(name, value) => setFilterValues((prev) => ({ ...prev, [name]: String(value ?? '') }))}
            onSubmit={(values) => {
              setApplied({
                orderId: String(values.orderId ?? ''),
                period: normalizePeriod(String(values.period ?? filterValues.period ?? '')),
              });
            }}
            onReset={() => {
              const next = { orderId: '', period: getDefaultPeriod() };
              setFilterValues(next);
              setApplied(next);
            }}
            submitLabel="Terapkan"
            resetLabel="Reset"
            layout="responsive-grid"
          />
        </div>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        emptyTitle="Tidak ada jadwal"
        emptyDescription="Coba ubah filter periode atau Order ID."
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
        sorting={{ initialSort: { key: 'tripDate', direction: 'desc' } }}
        rowKey={(row, index) => row.orderId || index}
        actions={{
          label: 'Action',
          actions: [
            {
              key: 'manage',
              label: 'Manage Jadwal',
              disabled: true,
              onSelect: () => {},
            },
            {
              key: 'detail',
              label: 'Lihat Detail',
              disabled: true,
              onSelect: () => {},
            },
          ].map((a) => ({
            ...a,
            disabled: false,
            onSelect: (row: FleetScheduleRow) => {
              const scheduleNumber = (row.scheduleNumber || '').trim();
              if (!scheduleNumber || scheduleNumber === '-') return;
              if (a.key === 'manage') {
                navigate(`${basePrefix}/schedules/fleet-schedules/manage/${encodeURIComponent(scheduleNumber)}`);
                return;
              }
              navigate(`${basePrefix}/schedules/fleet-schedules/detail/${encodeURIComponent(scheduleNumber)}`);
            },
          })),
        }}
      />
    </div>
  );
};
