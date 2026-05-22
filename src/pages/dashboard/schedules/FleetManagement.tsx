import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Printer, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/common/Pagination';

type ScheduledFleet = {
  orderId: string;
  vehicleId: string;
  fleetName: string;
  departureTime: string;
  destination: string;
  driver: string;
  coDriver: string;
  link: string;
};

type ScheduledFleetDetail = {
  orderId: string;
  fleetName: string;
  vehicleId: string;
  plateNumber: string;
  destination: string;
  driverName: string;
  link: string;
};

const toYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const tryParseDate = (value: string): Date | null => {
  if (!value) return null;
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDaysInMonthGrid = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayIndex = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells: Date[] = [];

  const prevMonthLastDay = new Date(year, month, 0);
  const prevMonthTotalDays = prevMonthLastDay.getDate();
  for (let i = startDayIndex; i > 0; i -= 1) {
    const dayNum = prevMonthTotalDays - i + 1;
    cells.push(new Date(year, month - 1, dayNum));
  }

  for (let d = 1; d <= totalDays; d += 1) cells.push(new Date(year, month, d));

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month + 1, nextDay));
    nextDay += 1;
  }
  return cells;
};

export const FleetManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [schedulesByDate, setSchedulesByDate] = useState<Record<string, ScheduledFleet[]>>({});

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalRows, setModalRows] = useState<ScheduledFleetDetail[]>([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  const token = localStorage.getItem('token') ?? '';

  const monthNames = useMemo(
    () => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    []
  );
  const dayNames = useMemo(() => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], []);

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const days = useMemo(() => getDaysInMonthGrid(currentDate), [currentDate]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 9 }).map((_, i) => y - 4 + i);
  }, []);

  const monthStart = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedYear, selectedMonth]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('period', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`);
        const fleetRes = await api.get<unknown>(
          `/services/schedule/fleet?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );

        const response = fleetRes as { status?: string; data?: unknown };
        if (response?.status !== 'success') {
          setSchedulesByDate({});
          return;
        }

        const payload = response.data as unknown;
        let items: unknown[] = [];
        if (payload && typeof payload === 'object') {
          const root = payload as Record<string, unknown>;
          const schedulesNode = root.schedules;
          if (Array.isArray(schedulesNode)) items = schedulesNode;
        } else if (Array.isArray(payload)) {
          items = payload;
        }

        const map: Record<string, ScheduledFleet[]> = {};

        items.forEach((raw) => {
          const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
          const orderIdRaw = item.order_id ?? item.id ?? item.orderId;
          const orderId = typeof orderIdRaw === 'string' || typeof orderIdRaw === 'number' ? String(orderIdRaw) : '';
          if (!orderId) return;

          const dateRaw =
            item.start_date ??
            item.startDate ??
            item.trip_date ??
            item.tripDate ??
            item.order_date ??
            item.orderDate ??
            item.created_at ??
            item.createdAt;
          const dateStr = typeof dateRaw === 'string' ? dateRaw : '';
          const date = tryParseDate(dateStr) ?? monthStart;
          const dateKey = toYmd(date);

          const vehicleIdRaw = item.vehicle_id ?? item.vehicleId ?? item.unit_id ?? item.unitId ?? item.fleet_unit_id ?? item.fleetUnitId;
          const vehicleId = typeof vehicleIdRaw === 'string' || typeof vehicleIdRaw === 'number' ? String(vehicleIdRaw) : '';
          const fleetNameRaw = item.fleet_name ?? item.fleetName ?? item.vehicle_name ?? item.vehicleName ?? item.title;
          const fleetName = typeof fleetNameRaw === 'string' ? fleetNameRaw : '';

          const departureRaw =
            item.departure_time ??
            item.departureTime ??
            item.start_time ??
            item.startTime ??
            item.pickup_time ??
            item.pickupTime ??
            item.time ??
            item.depart_at ??
            item.departAt ??
            item.start_at ??
            item.startAt;
          const departureTime = typeof departureRaw === 'string' ? departureRaw : '';

          const destinationRaw =
            item.pickup_city_label ??
            item.pickupCityLabel ??
            item.destination ??
            item.destination_name ??
            item.destinationName ??
            item.dropoff_location ??
            item.dropoffLocation ??
            item.to_city ??
            item.toCity ??
            item.city_name ??
            item.cityName;
          const destination = typeof destinationRaw === 'string' ? destinationRaw : '';

          const driverRaw =
            item.driver_name ??
            item.driverName ??
            (item.driver && typeof item.driver === 'object'
              ? (item.driver as Record<string, unknown>).fullname ?? (item.driver as Record<string, unknown>).name
              : undefined) ??
            (item.crew && typeof item.crew === 'object' ? (item.crew as Record<string, unknown>).driver_name : undefined);
          const driver = typeof driverRaw === 'string' ? driverRaw : '';

          const coDriverRaw =
            item.co_driver_name ??
            item.coDriverName ??
            item.codriver_name ??
            item.codriverName ??
            (item.co_driver && typeof item.co_driver === 'object'
              ? (item.co_driver as Record<string, unknown>).fullname ?? (item.co_driver as Record<string, unknown>).name
              : undefined) ??
            (item.crew && typeof item.crew === 'object' ? (item.crew as Record<string, unknown>).co_driver_name : undefined);
          const coDriver = typeof coDriverRaw === 'string' ? coDriverRaw : '';

          const link = `${basePrefix}/orders/fleet/detail/${encodeURIComponent(orderId)}`;
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push({
            orderId,
            vehicleId: vehicleId || '-',
            fleetName: fleetName || '-',
            departureTime: departureTime || '-',
            destination: destination || '-',
            driver: driver || '-',
            coDriver: coDriver || '-',
            link,
          });
        });

        setSchedulesByDate(map);
      } finally {
        setLoading(false);
      }
    };
    load();
    setModalOpen(false);
    setSelectedDate(null);
  }, [token, monthStart, selectedYear, selectedMonth, basePrefix]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return d;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getSchedules = (date: Date) => {
    const key = toYmd(date);
    return schedulesByDate[key] ?? [];
  };

  const getUniqueFleets = (date: Date) => {
    const schedules = getSchedules(date);
    const set = new Set<string>();
    const list: Array<{ vehicleId: string; fleetName: string }> = [];
    schedules.forEach((s) => {
      const k = `${s.vehicleId}::${s.fleetName}`;
      if (set.has(k)) return;
      set.add(k);
      list.push({ vehicleId: s.vehicleId, fleetName: s.fleetName });
    });
    return list;
  };

  const openDate = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const selectedLabel = useMemo(() => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  const escapeHtml = (value: string) =>
    (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const printSuratTugas = (row: ScheduledFleetDetail) => {
    const title = 'Surat Tugas';
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { margin: 16mm; }
      body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #ffffff; color: #111827; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
      .title { font-size: 20px; font-weight: 700; margin: 0; }
      .meta { font-size: 12px; color: #4b5563; margin-top: 4px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
      .grid { display: grid; grid-template-columns: 160px 1fr; gap: 10px 14px; font-size: 13px; }
      .label { color: #6b7280; }
      .value { font-weight: 600; }
      .footer { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      .sign { padding-top: 48px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #374151; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">${title}</h1>
        <div class="meta">Tanggal: ${escapeHtml(selectedLabel || '-')}</div>
      </div>
      <div class="meta">Order ID: ${escapeHtml(row.orderId || '-')}</div>
    </div>

    <div class="card">
      <div class="grid">
        <div class="label">Nama Armada</div><div class="value">${escapeHtml(row.fleetName || '-')}</div>
        <div class="label">Kode Armada</div><div class="value">${escapeHtml(row.vehicleId || '-')}</div>
        <div class="label">Plat Nomor</div><div class="value">${escapeHtml(row.plateNumber || '-')}</div>
        <div class="label">Tujuan</div><div class="value">${escapeHtml(row.destination || '-')}</div>
        <div class="label">Driver</div><div class="value">${escapeHtml(row.driverName || '-')}</div>
      </div>
    </div>

    <div class="footer">
      <div class="sign">Driver</div>
      <div class="sign">PIC / Admin</div>
    </div>

    <script>
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 100);
      });
    </script>
  </body>
</html>`;

    const w = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  useEffect(() => {
    if (!modalOpen || !selectedDate) return;
    let active = true;
    const load = async () => {
      setModalLoading(true);
      setModalRows([]);
      setModalPage(1);
      try {
        const ymd = toYmd(selectedDate);
        const qs = new URLSearchParams();
        qs.set('date', ymd);
        const res = await api.get<unknown>(`/services/schedule/detail?${qs.toString()}`, token ? { Authorization: token } : undefined);
        if (!active) return;
        if (res.status !== 'success') {
          setModalRows([]);
          return;
        }

        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const root = record(res.data);
        const dataNode = root.data ?? res.data;
        const listCandidate =
          (dataNode && typeof dataNode === 'object' && !Array.isArray(dataNode)
            ? (dataNode as Record<string, unknown>).items ??
              (dataNode as Record<string, unknown>).rows ??
              (dataNode as Record<string, unknown>).schedules ??
              (dataNode as Record<string, unknown>).data
            : undefined) ?? dataNode;
        const items = Array.isArray(listCandidate)
          ? listCandidate
          : listCandidate && typeof listCandidate === 'object'
            ? [listCandidate]
            : [];

        const mapped: ScheduledFleetDetail[] = items
          .map((raw) => record(raw))
          .map((it) => {
            const orderId = toStringSafe(it.order_id ?? it.orderId ?? it.order ?? it.id).trim();
            const fleetName = toStringSafe(it.fleet_name ?? it.fleetName ?? it.name).trim();
            const vehicleId = toStringSafe(it.vehicle_id ?? it.vehicleId ?? it.unit_id ?? it.unitId).trim();
            const plateNumber = toStringSafe(it.plate_number ?? it.plateNumber).trim();
            const destination = toStringSafe(it.city_destinations ?? it.cityDestinations ?? it.destination).trim();
            const driverName = toStringSafe(it.driver_name ?? it.driverName ?? it.driver).trim();
            if (!orderId) return null;
            return {
              orderId,
              fleetName: fleetName || '-',
              vehicleId: vehicleId || '-',
              plateNumber: plateNumber || '-',
              destination: destination || '-',
              driverName: driverName || '-',
              link: `${basePrefix}/orders/fleet/detail/${encodeURIComponent(orderId)}`,
            };
          })
          .filter((x): x is ScheduledFleetDetail => Boolean(x));

        setModalRows(mapped);
      } finally {
        if (active) setModalLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [basePrefix, modalOpen, selectedDate, token]);

  const modalTotalPages = useMemo(() => Math.max(1, Math.ceil(modalRows.length / Math.max(1, modalPageSize))), [modalRows.length, modalPageSize]);

  useEffect(() => {
    setModalPage((p) => Math.min(Math.max(1, p), modalTotalPages));
  }, [modalTotalPages]);

  const modalPagedRows = useMemo(() => {
    const start = (Math.max(1, modalPage) - 1) * Math.max(1, modalPageSize);
    return modalRows.slice(start, start + Math.max(1, modalPageSize));
  }, [modalPage, modalPageSize, modalRows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola jadwal berdasarkan pesanan per tanggal</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {monthNames[selectedMonth]} {selectedYear}
            </CardTitle>
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto lg:overflow-visible">
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setCurrentDate(new Date(selectedYear, Number(v), 1))}
                >
                  <SelectTrigger className="w-[132px] sm:w-[160px]">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((m, idx) => (
                      <SelectItem key={m} value={String(idx)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setCurrentDate(new Date(Number(v), selectedMonth, 1))}
                >
                  <SelectTrigger className="w-[96px] sm:w-[120px]">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => (
              <div
                key={index}
                className={`min-h-[76px] border ${
                  isToday(day) ? 'border-2 border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {(() => {
                  const inCurrentMonth = day.getMonth() === selectedMonth && day.getFullYear() === selectedYear;
                  return (
                    <button
                      type="button"
                      className={`h-full w-full p-1 text-left transition-colors ${
                        inCurrentMonth
                          ? `bg-transparent hover:bg-green-100 dark:hover:bg-gray-800 ${isToday(day) ? 'bg-green-50 dark:bg-green-900/20' : ''}`
                          : 'bg-gray-100 dark:bg-gray-900/40 cursor-default'
                      }`}
                      onClick={() => (inCurrentMonth ? openDate(day) : undefined)}
                      disabled={loading || !inCurrentMonth}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-xs font-medium ${
                            inCurrentMonth
                              ? isToday(day)
                                ? 'text-green-600 dark:text-gray-200'
                                : 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {loading ? (
                          <span className="text-[10px] text-gray-400">...</span>
                        ) : null}
                      </div>

                      {!loading && inCurrentMonth ? (
                        (() => {
                          const fleets = getUniqueFleets(day);
                          if (fleets.length === 0) return null;
                          const top = fleets.slice(0, 2);
                          return (
                            <div className="space-y-0.5">
                              {top.map((f) => (
                                <div
                                  key={`${f.vehicleId}-${f.fleetName}`}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-400 dark:bg-orange-900 text-white dark:text-white"
                                >
                                  <div className="font-medium truncate">
                                    {f.vehicleId} - {f.fleetName}
                                  </div>
                                </div>
                              ))}
                              {fleets.length > 2 ? (
                                <div className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  ....
                                </div>
                              ) : null}
                            </div>
                          );
                        })()
                      ) : null}
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-5xl p-0 border-none bg-white overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-slate-900 truncate">Armada Terjadwal</h2>
                  <p className="text-slate-500 text-sm truncate">{selectedLabel || '-'}</p>
                </div>
              </div>
              <DialogClose className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
                <X className="w-5 h-5" />
              </DialogClose>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {modalLoading ? 'Memuat data...' : `${modalRows.length} armada terjadwal`}
              </div>
            </div>

            <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-2">
              <div className="w-full overflow-x-auto overflow-hidden rounded-2xl border border-slate-200">
                <Table className="text-xs sm:text-sm table-fixed min-w-[940px]">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[64px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground text-center whitespace-nowrap">No.</TableHead>
                      <TableHead className="w-[240px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground whitespace-nowrap">Nama Armada</TableHead>
                      <TableHead className="w-[140px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground whitespace-nowrap">Kode Armada</TableHead>
                      <TableHead className="w-[140px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground whitespace-nowrap">Plat Nomor</TableHead>
                      <TableHead className="w-[240px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground whitespace-nowrap">Tujuan</TableHead>
                      <TableHead className="w-[180px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground whitespace-nowrap">Driver</TableHead>
                      <TableHead className="w-[88px] px-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground text-right whitespace-nowrap">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          Memuat...
                        </TableCell>
                      </TableRow>
                    ) : modalRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          Tidak ada armada terjadwal pada tanggal ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      modalPagedRows.map((o, idx) => (
                        <TableRow
                          key={`${o.vehicleId}-${o.orderId}-${idx}`}
                          className="odd:bg-muted/20 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="px-3 py-2 text-center text-muted-foreground tabular-nums whitespace-nowrap">
                            {(modalPage - 1) * modalPageSize + idx + 1}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-foreground whitespace-nowrap">
                            <span className="block max-w-[240px] truncate">{o.fleetName}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                            <span className="block max-w-[140px] truncate">{o.vehicleId}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-foreground whitespace-nowrap">
                            <span className="block max-w-[140px] truncate">{o.plateNumber}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-foreground whitespace-nowrap">
                            <span className="block max-w-[240px] truncate">{o.destination}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-foreground whitespace-nowrap">
                            <span className="block max-w-[180px] truncate">{o.driverName}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[200px]">
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setModalOpen(false);
                                    navigate(o.link);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detail Order
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setModalOpen(false);
                                    navigate(`${basePrefix}/team/schedule-fleet/detail/${encodeURIComponent(o.orderId)}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detail Jadwal
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    printSuratTugas(o);
                                  }}
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Surat Tugas
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {!modalLoading && modalRows.length > 0 ? (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-3">
                  <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span>Rows</span>
                    <Select
                      value={String(modalPageSize)}
                      onValueChange={(v) => {
                        setModalPageSize(Number(v));
                        setModalPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[92px] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="hidden sm:inline">
                      Page {Math.min(Math.max(1, modalPage), modalTotalPages)} of {modalTotalPages}
                    </span>
                  </div>

                  <Pagination
                    currentPage={Math.min(Math.max(1, modalPage), modalTotalPages)}
                    totalPages={modalTotalPages}
                    onPageChange={setModalPage}
                    compact
                    className="sm:hidden"
                  />
                  <Pagination
                    currentPage={Math.min(Math.max(1, modalPage), modalTotalPages)}
                    totalPages={modalTotalPages}
                    onPageChange={setModalPage}
                    className="hidden sm:flex"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
