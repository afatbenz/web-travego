import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Sheet } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showAlert } from '@/hooks/use-alert';
import moment from 'moment';
import * as XLSX from 'xlsx';

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
  search: string;
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
  const m = trimmed.match(/^(\d{4})[/-](\d{1,2})$/);
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
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const token = localStorage.getItem('token') ?? '';
  const fetchSeq = useRef(0);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FleetScheduleRow[]>([]);
  const [exportSchedules, setExportSchedules] = useState<
    Array<{
      start_date: string;
      end_date: string;
      order_id: string;
      schedule_number: string;
      fleet_name: string;
      vehicle_id: string;
      plate_number: string;
      driver_name: string;
      crew_name: string;
      pickup_city_label: string;
      destinations: string;
    }>
  >([]);
  const [tableKey, setTableKey] = useState(0);
  const [filterValues, setFilterValues] = useState<FilterValues>(() => ({
    orderId: '',
    period: getDefaultPeriod(),
    search: '',
  }));

  const [applied, setApplied] = useState<FilterValues>(() => ({
    orderId: '',
    period: getDefaultPeriod(),
    search: '',
  }));

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);

  const periodParts = useMemo(() => parsePeriodParts(filterValues.period), [filterValues.period]);
  const periodLabel = useMemo(() => formatPeriodLabel(filterValues.period), [filterValues.period]);
  const appliedPeriodLabel = useMemo(() => formatPeriodLabel(applied.period), [applied.period]);

  const getScheduleNumber = useCallback((row: FleetScheduleRow) => {
    const scheduleNumber = (row.scheduleNumber || '').trim();
    return scheduleNumber && scheduleNumber !== '-' ? scheduleNumber : '';
  }, []);

  const goToDetail = useCallback((row: FleetScheduleRow) => {
    const scheduleNumber = getScheduleNumber(row);
    if (!scheduleNumber) return;
    navigate(`${basePrefix}/schedules/fleet-schedules/detail/${encodeURIComponent(scheduleNumber)}`);
  }, [basePrefix, getScheduleNumber, navigate]);

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
    setRows([]);
    setExportSchedules([]);
    setPage(1);
    setFilterValues((prev) => ({ ...prev, period: normalized }));
    setApplied((prev) => ({ ...prev, period: normalized }));
  };

  const applySearch = (nextSearch: string) => {
    const trimmed = String(nextSearch ?? '').trim();
    setRows([]);
    setExportSchedules([]);
    setPage(1);
    setFilterValues((prev) => ({ ...prev, search: nextSearch }));
    setApplied((prev) => ({ ...prev, search: trimmed }));
  };

  useEffect(() => {
    const seq = ++fetchSeq.current;
    (async () => {
      setLoading(true);
      setRows([]);
      setExportSchedules([]);
      setPage(1);
      setTableKey(seq);
      try {
        const period = normalizePeriod(applied.period);
        const qs = new URLSearchParams();
        qs.set('period', period);
        const orderId = applied.orderId.trim();
        if (orderId) qs.set('order_id', orderId);
        const search = applied.search.trim();
        if (search) qs.set('search', search);
        const res = await api.get<unknown>(
          `/services/schedule/fleet?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );
        if (seq !== fetchSeq.current) return;
        if (res.status !== 'success') {
          setRows([]);
          setExportSchedules([]);
          return;
        }

        const items = extractRows(res.data);
        const exportMapped = items.map((raw) => {
          const item = toRecord(raw);
          const start_date = pickString(item, ['start_date']);
          const end_date = pickString(item, ['end_date']);
          const order_id = pickString(item, ['order_id', 'orderId', 'order_id_display', 'order_code', 'id']);
          const schedule_number = pickString(item, ['schedule_number', 'scheduleNumber']);
          const fleet_name = pickString(item, ['fleet_name', 'fleetName', 'armada', 'vehicle_name', 'vehicleName', 'unit_name', 'unitName', 'name']);
          const vehicle_id = pickString(item, ['vehicle_id', 'vehicleId']);
          const plate_number = pickString(item, ['plate_number', 'plateNumber']);
          const driver_name =
            pickString(item, ['driver_name', 'driverName']) ||
            pickString(toRecord(item.driver), ['fullname', 'name']) ||
            pickString(toRecord(item.crew), ['driver_name', 'driverName']);
          const crew_name = pickString(item, ['crew_name', 'crewName']);
          const pickup_city_label = pickString(item, ['pickup_city_label', 'pickupCityLabel', 'pickup_city', 'pickupCity']);
          const destinations = pickString(item, ['destinations', 'destination']);
          return {
            start_date: start_date || '-',
            end_date: end_date || '-',
            order_id: order_id || '-',
            schedule_number: schedule_number || '-',
            fleet_name: fleet_name || '-',
            vehicle_id: vehicle_id || '-',
            plate_number: plate_number || '-',
            driver_name: driver_name || '-',
            crew_name: crew_name || '-',
            pickup_city_label: pickup_city_label || '-',
            destinations: destinations || '-',
          };
        });
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
        setExportSchedules(exportMapped);
        setPage(1);
      } finally {
        if (seq === fetchSeq.current) {
          setLoading(false);
        }
      }
    })();
  }, [applied.orderId, applied.period, applied.search, token]);

  const exportSheetRows = useMemo(() => {
    return exportSchedules.map((s, index) => ({
      No: index + 1,
      'Tanggal Berangkat': s.start_date || '-',
      'Tanggal Pulang': s.end_date || '-',
      'Order ID': s.order_id || '-',
      'Nomor Tugas': s.schedule_number || '-',
      Armada: s.fleet_name || '-',
      'Unit ID': s.vehicle_id || '-',
      'Plat Nomor': s.plate_number || '-',
      Pengemudi: s.driver_name || '-',
      Crew: s.crew_name || '-',
      Penjemputan: s.pickup_city_label || '-',
      Tujuan: s.destinations || '-',
    }));
  }, [exportSchedules]);

  const downloadExcel = () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data jadwal armada untuk diunduh.', type: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Armada');
    XLSX.writeFile(workbook, `travego-jadwal_armada-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data jadwal armada untuk dicopy.', type: 'warning' });
      return;
    }

    const headers = [
      'No',
      'Tanggal Berangkat',
      'Tanggal Pulang',
      'Order ID',
      'Nomor Tugas',
      'Armada',
      'Unit ID',
      'Plat Nomor',
      'Pengemudi',
      'Crew',
      'Penjemputan',
      'Tujuan',
    ];
    const rowsTsv = exportSheetRows.map((row) => [
      row.No,
      row['Tanggal Berangkat'],
      row['Tanggal Pulang'],
      row['Order ID'],
      row['Nomor Tugas'],
      row.Armada,
      row['Unit ID'],
      row['Plat Nomor'],
      row.Pengemudi,
      row.Crew,
      row.Penjemputan,
      row.Tujuan,
    ]);
    const tsv = [headers, ...rowsTsv]
      .map((cols) => cols.map((value) => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({
        title: 'Berhasil',
        description: 'Data jadwal armada disalin ke clipboard. Tempel di Google Sheet dengan Ctrl+V.',
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
        width: 360,
        sortable: true,
        render: (row) => {
          const scheduleNumber = getScheduleNumber(row);
          const content = (
            <span className="whitespace-nowrap text-blue-900 dark:text-blue-100 hover:text-blue-700 text-normal">
              {row.fleetName} - {row.plateNumber} ({row.vehicleId})
            </span>
          );

          if (!scheduleNumber) return content;

          return (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 font-semibold text-blue-700 hover:text-blue-900 hover:no-underline dark:text-blue-300 dark:hover:text-blue-200"
              onClick={() => goToDetail(row)}
              title="Lihat Detail"
            >
              {content}
            </Button>
          );
        },
      },
      {
        label: 'Tanggal Perjalanan',
        key: 'tripDate',
        width: 240,
        sortable: true,
        render: (row) => <div className="text-foreground whitespace-nowrap">{row.tripDate}</div>,
      },
      {
        label: 'Crew',
        key: 'driverName',
        width: 260,
        sortable: true,
        render: (row) => <div className="text-foreground whitespace-nowrap">{row.driverName.split(" ").slice(0, 2).join(" ")} {row.crewName ? `, ${row.crewName.split(" ").slice(0, 2).join(" ")}` : ''}</div>,
      },
      {
        label: 'Tujuan',
        key: 'status',
        width: 260,
        sortable: true,
        render: (row) => (
          <div className="text-foreground whitespace-nowrap">
            {row.destinations ? row.destinations.split(",").slice(0, 2).join(", ") : '-'}  
          </div>
        ),
      },
      {
        label: 'Detail',
        key: '__detail__',
        width: 120,
        align: 'right',
        sortable: false,
        render: (row) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => goToDetail(row)}
              disabled={!getScheduleNumber(row)}
            >
              Detail
            </Button>
          </div>
        ),
      },
    ] satisfies Array<DataTableColumn<FleetScheduleRow>>;
  }, [getScheduleNumber, goToDetail, page, pageSize]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Jadwal Armada</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola dan pantau jadwal armada di bulan <span className="capitalize">{appliedPeriodLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                aria-label="Aksi jadwal armada"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  downloadExcel();
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Download ke excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  void copyToGoogleSheet();
                }}
              >
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 w-full md:w-auto md:min-w-[320px]">
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
                    <Select value={pad2(periodParts.month)} onValueChange={(m) => applyPeriod(`${periodParts.year}-${m}`)}>
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

        <div className="w-full md:max-w-md">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Search</div>
          <Input
            value={filterValues.search}
            placeholder="Cari order / armada / plat / driver..."
            className="h-10 rounded-2xl"
            onChange={(e) => {
              const next = e.target.value;
              setFilterValues((prev) => ({ ...prev, search: next }));
              const trimmed = next.trim();
              if (!trimmed) {
                setApplied((prev) => ({ ...prev, search: '' }));
                return;
              }
              if (trimmed.length >= 2) {
                setApplied((prev) => ({ ...prev, search: trimmed }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              applySearch(e.currentTarget.value);
            }}
          />
        </div>
      </div>

      <DataTable
        key={tableKey}
        data={rows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1120px]"
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
        rowKey={(row, index) => {
          const scheduleNumber = (row.scheduleNumber || '').trim();
          if (scheduleNumber && scheduleNumber !== '-') return scheduleNumber;
          const orderId = (row.orderId || '').trim();
          const vehicleId = (row.vehicleId || '').trim();
          const tripDate = (row.tripDate || '').trim();
          return `${orderId || 'order'}-${vehicleId || 'vehicle'}-${tripDate || 'date'}-${index}`;
        }}
      />
    </div>
  );
};
