import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit, Eye, MapPin } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type OrderHistoryRow = {
  order_id: string;
  trip_start: string;
  trip_end: string;
  pickup_point: string;
  destination: string;
};

type UnitDetail = {
  unit_id: string;
  fleet_id?: string;
  fleet_name: string;
  fleet_type?: string;
  vehicle_id: string;
  plate_number: string;
  engine: string;
  capacity: number;
  production_year: number;
  transmission: string;
  thumbnail?: string;
  created_at?: string;
  pickup_points: string[];
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

const getNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMMM yyyy HH:mm', { locale: idLocale });
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const normalizeRange = (range: DateRange | undefined) => {
  if (!range?.from) return { start: undefined, end: undefined };
  const start = startOfDay(range.from);
  const end = endOfDay(range.to ?? range.from);
  return { start, end };
};

const toYmd = (d: Date | undefined) => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDdMmmYyFromDate = (d: Date) => {
  const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
  return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
};

const formatTripDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy', { locale: idLocale });
};

const formatTripRange = (start: string, end: string) => {
  const s = formatTripDate(start);
  const e = formatTripDate(end);
  if (s === '-' && e === '-') return '-';
  if (s !== '-' && (e === '-' || start === end)) return s;
  return `${s} - ${e}`;
};

const toPickupLabel = (raw: unknown): { title: string; subtitle?: string } => {
  if (typeof raw === 'string') return { title: raw };
  if (typeof raw === 'number') return { title: String(raw) };
  const obj = record(raw);
  const title =
    getString(obj.city_name ?? obj.name ?? obj.label ?? obj.location ?? obj.pickup_name ?? obj.area_name ?? obj.address).trim();
  const cityId = getString(obj.city_id ?? obj.id).trim();
  const uuid = getString(obj.uuid).trim();
  const subtitleParts = [cityId ? `ID: ${cityId}` : '', uuid ? `UUID: ${uuid}` : ''].filter(Boolean);
  return { title: title || '-', subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined };
};

export const FleetUnitDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const unitIdParam = params.unit_id ?? params.id ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UnitDetail | null>(null);

  const [orderRange, setOrderRange] = useState<DateRange | undefined>(() => {
    const to = startOfDay(new Date());
    const from = new Date(to);
    from.setDate(from.getDate() - 90);
    return { from, to };
  });
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderRows, setOrderRows] = useState<OrderHistoryRow[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const orderItemsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/fleet-units/detail/${encodeURIComponent(unitId)}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = record(res.data);
        const obj = record(payload.data && typeof payload.data === 'object' ? payload.data : payload);
        const unit_id = getString(obj.unit_id ?? obj.id ?? unitId);
        const fleet_id = getString(obj.fleet_id ?? obj.fleetId);
        const fleet_name = getString(obj.fleet_name ?? obj.fleetName ?? obj.fleet);
        const fleet_type = getString(obj.fleet_type ?? obj.fleetType ?? obj.type);
        const vehicle_id = getString(obj.vehicle_id ?? obj.vehicleId ?? obj.unit_id);
        const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate);
        const engine = getString(obj.engine ?? obj.chassis ?? obj.machine);
        const capacity = getNumber(obj.capacity);
        const production_year = getNumber(obj.production_year ?? obj.productionYear ?? obj.year);
        const transmission = getString(obj.transmission);
        const thumbnailRaw = getString(obj.thumbnail ?? obj.image ?? obj.photo);
        const created_at = getString(obj.created_at ?? obj.createdAt ?? obj.created_date ?? obj.createdDate);
        const pickupPointsRaw =
          obj.pickup_point ??
          obj.pickupPoint ??
          obj.pickup_points ??
          obj.pickupPoints ??
          obj.pickup_area ??
          obj.pickupArea ??
          obj.pickup;
        const pickup_points = Array.isArray(pickupPointsRaw)
          ? (pickupPointsRaw as unknown[])
              .map((x) => {
                if (typeof x === 'string') return x.trim();
                if (typeof x === 'number') return String(x).trim();
                if (x && typeof x === 'object') return toPickupLabel(x).title.trim();
                return '';
              })
              .filter((x) => x)
          : [];
        setDetail({
          unit_id,
          fleet_id: fleet_id || undefined,
          fleet_name,
          fleet_type: fleet_type || undefined,
          vehicle_id,
          plate_number,
          engine,
          capacity,
          production_year,
          transmission,
          thumbnail: thumbnailRaw ? toFileUrl(thumbnailRaw) : undefined,
          created_at: created_at || undefined,
          pickup_points,
        });
      } else {
        setDetail(null);
      }
      setLoading(false);
    };

    load();
  }, [unitIdParam]);

  useEffect(() => {
    const loadHistory = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      if (!orderRange?.from || !orderRange?.to) return;
      setOrderLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const range = normalizeRange(orderRange);
        if (!range.start || !range.end) return;
        const payload = { unit_id: unitId, start_date: toYmd(range.start), end_date: toYmd(range.end) };
        const res = await api.post<unknown>('/fleet-units/order/history', payload, token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const root = record(payload);
          const dataNode = root.data;
          const dataObj = record(dataNode);
          const itemsNode =
            (Array.isArray(dataNode) ? dataNode : undefined) ??
            (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
            (Array.isArray(dataObj.history) ? dataObj.history : undefined) ??
            (Array.isArray(dataObj.orders) ? dataObj.orders : undefined) ??
            (Array.isArray(root.items) ? root.items : undefined) ??
            (Array.isArray(root.history) ? root.history : undefined) ??
            (Array.isArray(root.orders) ? root.orders : undefined) ??
            (Array.isArray(payload) ? payload : undefined) ??
            [];

          const mapped = (itemsNode as unknown[]).map((raw) => {
            const obj = record(raw);
            const order_id = getString(obj.order_id ?? obj.orderId ?? obj.id ?? obj.transaction_id ?? obj.transactionId).trim();
            const trip_start = getString(
              obj.trip_start ?? obj.tripStart ?? obj.trip_date ?? obj.tripDate ?? obj.start_date ?? obj.startDate ?? obj.date
            ).trim();
            const trip_end = getString(obj.trip_end ?? obj.tripEnd ?? obj.end_date ?? obj.endDate).trim();
            const pickupRaw = obj.pickup_point ?? obj.pickupPoint ?? obj.pickup_location ?? obj.pickupLocation ?? obj.pickup;
            const pickup_point =
              typeof pickupRaw === 'string' || typeof pickupRaw === 'number'
                ? getString(pickupRaw).trim()
                : pickupRaw && typeof pickupRaw === 'object'
                  ? toPickupLabel(pickupRaw).title
                  : '';
            const destRaw = obj.destination ?? obj.tujuan ?? obj.dropoff ?? obj.dropoff_location ?? obj.dropoffLocation ?? obj.to;
            const destination =
              typeof destRaw === 'string' || typeof destRaw === 'number'
                ? getString(destRaw).trim()
                : destRaw && typeof destRaw === 'object'
                  ? toPickupLabel(destRaw).title
                  : '';
            return { order_id, trip_start, trip_end, pickup_point, destination };
          });

          setOrderRows(mapped);
          setOrderPage(1);
        } else {
          setOrderRows([]);
        }
      } finally {
        setOrderLoading(false);
      }
    };

    loadHistory();
  }, [orderRange, unitIdParam]);

  const orderTotalPages = Math.max(1, Math.ceil(orderRows.length / orderItemsPerPage));
  const orderPageSafe = Math.min(orderPage, orderTotalPages);
  const orderPageStart = (orderPageSafe - 1) * orderItemsPerPage;
  const orderPageEnd = orderPageStart + orderItemsPerPage;
  const orderCurrent = orderRows.slice(orderPageStart, orderPageEnd);

  const orderRangeLabel =
    orderRange?.from && orderRange?.to
      ? `${formatDdMmmYyFromDate(orderRange.from)} - ${formatDdMmmYyFromDate(orderRange.to)}`
      : orderRange?.from
        ? `${formatDdMmmYyFromDate(orderRange.from)} - ...`
        : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/fleet-units`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Unit Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 truncate">{detail?.vehicle_id || unitIdParam}</p>
        </div>
        {detail && (
          <Button variant="outline" onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(detail.unit_id)}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger
                value="overview"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="orders"
              >
                Riwayat Order
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {loading ? (
                <div className="animate-pulse mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="w-full max-w-[360px] mx-auto">
                      <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`m-s-${i}`} className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`r-s-${i}`} className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={`p2-s-${i}`} className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : !detail ? (
                <div className="py-10 text-center text-gray-500">Data unit tidak ditemukan</div>
              ) : (
                <div className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      {detail.thumbnail ? (
                        <div className="w-full max-w-[360px] mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <div className="w-full aspect-[4/3]">
                            <img src={detail.thumbnail} alt={detail.vehicle_id || 'thumbnail'} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[360px] mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-gray-500">-</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Fleet Type</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.fleet_type || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Vehicle ID</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.vehicle_id || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Chassis</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.engine || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Transmisi</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.transmission || '-'}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Fleet Name</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.fleet_name || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Plat Nomor</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.plate_number || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Tahun Produksi</div>
                        <div className="font-medium text-gray-900 dark:text-white">{detail.production_year || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Tanggal Create</div>
                        <div className="font-medium text-gray-900 dark:text-white">{formatDate(detail.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  {detail.pickup_points.length === 0 ? (
                    <div className="text-sm text-gray-500">Tidak ada pickup points</div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {detail.pickup_points.length} pickup point tersedia
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detail.pickup_points.map((name, idx) => (
                          <div
                            key={`p-${idx}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders">
              <div className="mt-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="w-full md:max-w-sm">
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Tanggal Trip</div>
                    <Popover
                      open={orderPickerOpen}
                      onOpenChange={(next) => {
                        if (!next) {
                          const r = orderRange;
                          if (r?.from && !r?.to) {
                            setOrderPickerOpen(true);
                            return;
                          }
                        }
                        setOrderPickerOpen(next);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal h-10">
                          {orderRangeLabel || 'Pilih rentang tanggal'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          numberOfMonths={1}
                          selected={orderRange}
                          onSelect={(range) => {
                            setOrderRange(range);
                            if (range?.from && range?.to) {
                              setOrderPickerOpen(false);
                            } else {
                              setOrderPickerOpen(true);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900">
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                        <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Order Id</th>
                        <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Tanggal Trip</th>
                        <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Pickup Point</th>
                        <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Tujuan</th>
                        <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {orderLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`o-s-${i}`} className="border-b border-gray-200 dark:border-gray-700 animate-pulse">
                            {Array.from({ length: 5 }).map((__, j) => (
                              <td key={`o-s-${i}-${j}`} className="py-3 px-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : orderCurrent.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-500">
                            Tidak ada data order
                          </td>
                        </tr>
                      ) : (
                        orderCurrent.map((row, idx) => (
                          <tr key={`o-${row.order_id || idx}`} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.order_id || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-200">
                              {formatTripRange(row.trip_start, row.trip_end || row.trip_start)}
                            </td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-200">{row.pickup_point || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-200">{row.destination || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="!w-auto !h-auto p-2"
                                disabled={!row.order_id}
                                onClick={() =>
                                  row.order_id ? navigate(`${basePrefix}/orders/fleet/detail/${encodeURIComponent(row.order_id)}`) : undefined
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Menampilkan {orderRows.length === 0 ? 0 : orderPageStart + 1}-{Math.min(orderPageEnd, orderRows.length)} dari {orderRows.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={orderPageSafe <= 1}
                      className="bg-transparent hover:bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {orderPageSafe} / {orderTotalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((p) => Math.min(orderTotalPages, p + 1))}
                      disabled={orderPageSafe >= orderTotalPages}
                      className="bg-transparent hover:bg-transparent"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
