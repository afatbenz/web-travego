import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

const formatTimeMaybe = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  const m = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return value;
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
  const monthEnd = useMemo(() => new Date(selectedYear, selectedMonth + 1, 0), [selectedYear, selectedMonth]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('created_from', toYmd(monthStart));
        qs.set('created_to', toYmd(monthEnd));
        const fleetRes = await api.get<unknown>(
          `/services/fleet/orders?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );

        const response = fleetRes as { status?: string; data?: unknown };
        if (response?.status !== 'success') {
          setSchedulesByDate({});
          return;
        }

        const payload = response.data as unknown;
        let items: unknown[] = [];
        if (Array.isArray(payload)) items = payload;
        else if (payload && typeof payload === 'object') {
          const root = payload as Record<string, unknown>;
          const dataNode = root.data as unknown;
          const ordersNode =
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).orders : undefined) ?? root.orders;
          if (Array.isArray(ordersNode)) items = ordersNode;
          else if (Array.isArray(dataNode)) items = dataNode;
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
  }, [token, monthStart, monthEnd, basePrefix]);

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

  const selectedList = useMemo(() => {
    if (!selectedDate) return [];
    const key = toYmd(selectedDate);
    return schedulesByDate[key] ?? [];
  }, [selectedDate, schedulesByDate]);

  const selectedLabel = useMemo(() => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate]);

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setCurrentDate(new Date(selectedYear, Number(v), 1))}
                >
                  <SelectTrigger className="w-[160px]">
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
                  <SelectTrigger className="w-[120px]">
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
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`min-h-[96px] border ${
                  isToday(day) ? 'border-2 border-orange-500 dark:border-orange-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {(() => {
                  const inCurrentMonth = day.getMonth() === selectedMonth && day.getFullYear() === selectedYear;
                  return (
                    <button
                      type="button"
                      className={`h-full w-full p-2 text-left transition-colors ${
                        inCurrentMonth
                          ? `bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`
                          : 'bg-gray-100 dark:bg-gray-900/40 cursor-default'
                      }`}
                      onClick={() => (inCurrentMonth ? openDate(day) : undefined)}
                      disabled={loading || !inCurrentMonth}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            inCurrentMonth
                              ? isToday(day)
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {loading ? (
                          <span className="text-xs text-gray-400">...</span>
                        ) : null}
                      </div>

                      {!loading && inCurrentMonth ? (
                        (() => {
                          const fleets = getUniqueFleets(day);
                          if (fleets.length === 0) return null;
                          const top = fleets.slice(0, 2);
                          return (
                            <div className="space-y-1">
                              {top.map((f) => (
                                <div
                                  key={`${f.vehicleId}-${f.fleetName}`}
                                  className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                >
                                  <div className="font-medium truncate">
                                    {f.vehicleId} - {f.fleetName}
                                  </div>
                                </div>
                              ))}
                              {fleets.length > 2 ? (
                                <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Armada Terjadwal - {selectedLabel}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-900">
                <TableHead>Kode Armada</TableHead>
                <TableHead>Nama Armada</TableHead>
                <TableHead>Jam berangkat</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Co-Driver</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                    Tidak ada armada terjadwal pada tanggal ini.
                  </TableCell>
                </TableRow>
              ) : (
                selectedList.map((o) => (
                  <TableRow key={`${o.vehicleId}-${o.orderId}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium text-gray-900 dark:text-white">{o.vehicleId}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{o.fleetName}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{formatTimeMaybe(o.departureTime)}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{o.destination}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{o.driver}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{o.coDriver}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setModalOpen(false);
                          navigate(o.link);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};
