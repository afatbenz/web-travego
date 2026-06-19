import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Box, ArrowLeftRight, Plus, Minus, Pencil, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { cn } from '@/lib/utils';

type LocationRow = {
  garage_name: string;
  garage_address: string;
  garage_city: string;
  garage_city_label: string;
  stock: number;
  updated_at: string;
};

type ItemDetail = {
  item_id: string;
  item_sku: string;
  item_name: string;
  item_uom: string;
  item_category: number;
  status: number;
  locations: LocationRow[];
};

type MovementRow = {
  movement_id: string;
  movement_date: string;
  activity_type: string;
  garage_name: string;
  qty: number;
  stock: number;
  label: string;
  notes: string;
};

const categoryToLabel = (category: number): string => {
  if (category === 1) return 'Persediaan Asset Armada';
  if (category === 2) return 'Persediaan Asset Kantor';
  return '-';
};

const statusToLabel = (status: number): string => {
  if (status === 1) return 'Aktif';
  if (status === 0) return 'Nonaktif';
  return '-';
};

const statusToVariant = (status: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 1) return 'default';
  if (status === 0) return 'secondary';
  return 'outline';
};

const formatDateTimeTable = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthStart = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const activityVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const normalized = type.toLowerCase();
  if (normalized.includes('masuk') || normalized.includes('in')) return 'default';
  if (normalized.includes('pemakaian') || normalized.includes('out') || normalized.includes('keluar')) return 'destructive';
  if (normalized.includes('transfer')) return 'outline';
  return 'secondary';
};

const ProgressBar = ({ value, className = '', color = '#3b82f6' }: { value: number; className?: string; color?: string }) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

const progressColor = (index: number): string => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];
  return colors[index % colors.length];
};

export const InventoryItemDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const { item_id } = useParams<{ item_id: string }>();
  const itemId = decodeURIComponent(item_id ?? '');

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementPage, setMovementPage] = useState(1);
  const [startDate, setStartDate] = useState(formatDateOnly(getMonthStart(new Date())));
  const [endDate, setEndDate] = useState(formatDateOnly(new Date()));

  const totalStock = detail?.locations.reduce((sum, loc) => sum + loc.stock, 0) ?? 0;

  const fetchMovements = useCallback(async (page: number) => {
    if (!itemId) return;
    setMovementLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    try {
      const res = await api.post<unknown>(
        '/inventories/items/movement',
        { item_id: itemId, start_date: startDate, end_date: endDate, page, limit: 10 },
        headers
      );
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const listRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).items : root;
        const list: unknown[] = Array.isArray(listRaw) ? listRaw : [];
        const mapped = list.map((raw, i) => {
          const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
          return {
            movement_id: typeof obj.movement_id === 'string' ? obj.movement_id : `${page}-${i}`,
            movement_date: typeof obj.movement_date === 'string' ? obj.movement_date : '',
            activity_type: typeof obj.movement_type === 'string' ? obj.movement_type : '-',
            garage_name: typeof obj.garage_name === 'string' ? obj.garage_name : '-',
            qty: typeof obj.quantity === 'number' ? obj.quantity : 0,
            stock: typeof obj.stock_final === 'number' ? obj.stock_final : 0,
            label: typeof obj.label === 'string' ? obj.label : 'Pcs',
            notes: typeof obj.notes === 'string' ? obj.notes : '',
          };
        });
        setMovements(mapped);
        const totalRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).total : undefined;
        setMovementTotal(typeof totalRaw === 'number' ? totalRaw : mapped.length);
        setMovementPage(page);
      } else {
        setMovements([]);
        setMovementTotal(0);
      }
    } catch {
      setMovements([]);
      setMovementTotal(0);
    } finally {
      setMovementLoading(false);
    }
  }, [itemId, startDate, endDate]);

  useEffect(() => {
    const load = async () => {
      if (!itemId) return;
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.post<unknown>('/inventories/items/detail', { item_id: itemId }, headers);
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
        const item_id = typeof data.item_id === 'string' ? data.item_id : '';
        const item_sku = typeof data.item_sku === 'string' ? data.item_sku : '';
        const item_name = typeof data.item_name === 'string' ? data.item_name : '';
        const item_uom = typeof data.item_uom === 'string' ? data.item_uom : '';
        const item_category = typeof data.item_category === 'number' ? data.item_category : 0;
        const status = typeof data.status === 'number' ? data.status : 1;
        const locationsRaw = data.locations;
        const locations: LocationRow[] = Array.isArray(locationsRaw)
          ? (locationsRaw as unknown[])
              .map((x) => {
                const obj = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
                return {
                  garage_name: typeof obj.garage_name === 'string' ? obj.garage_name : '',
                  garage_address: typeof obj.garage_address === 'string' ? obj.garage_address : '',
                  garage_city: typeof obj.garage_city === 'string' ? obj.garage_city : '',
                  garage_city_label: typeof obj.garage_city_label === 'string' ? obj.garage_city_label : '',
                  stock: typeof obj.stock === 'number' ? obj.stock : 0,
                  updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : '',
                };
              })
              .filter((loc) => loc.garage_name)
          : [];
        setDetail({ item_id, item_sku, item_name, item_uom, item_category, status, locations });
      } else {
        setDetail(null);
      }
      setLoading(false);
    };
    load();
  }, [itemId]);

  useEffect(() => {
    if (detail) {
      fetchMovements(1);
    }
  }, [detail, fetchMovements]);

  const movementStartIndex = (movementPage - 1) * 10;

  const handleApplyFilter = () => {
    fetchMovements(1);
  };

  const movementColumns: Array<DataTableColumn<MovementRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{movementStartIndex + rowIndex + 1}</span>
      ),
    },
    {
      label: 'Tanggal',
      key: 'movement_date',
      sortable: true,
      width: 120,
      render: (item) => <span className="text-foreground">{formatDateTimeTable(item.movement_date)}</span>,
    },
    {
      label: 'Aktivitas',
      key: 'activity_type',
      sortable: true,
      width: 140,
      render: (item) => (
        <Badge variant={activityVariant(item.activity_type)} className="rounded-full px-2.5 py-1 text-xs font-medium">
          {item.activity_type || '-'}
        </Badge>
      ),
    },
    {
      label: 'Garasi',
      key: 'garage_name',
      sortable: true,
      width: 150,
      render: (item) => <span className="text-foreground">{item.garage_name || '-'}</span>,
    },
    {
      label: 'Qty',
      key: 'qty',
      sortable: true,
      width: 80,
      align: 'right',
      render: (item) => (
        <span className={`text-sm font-medium ${item.label === "+" ? "text-green-800" : "text-red-700"}`}>
          {item.label} {item.qty} {detail?.item_uom || 'Pcs'}
        </span>
      ),
    },
    {
      label: 'Stok',
      key: 'stock',
      sortable: true,
      width: 80,
      align: 'right',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {item.stock} {detail?.item_uom || 'Pcs'}
        </span>
      ),
    },
    {
      label: 'Keterangan',
      key: 'notes',
      sortable: true,
      width: 350,
      render: (item) => (
        <span className="text-muted-foreground text-sm line-clamp-1">{item.notes || '-'}</span>
      ),
    },
  ];

  const distributionColumns: Array<DataTableColumn<LocationRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{rowIndex + 1}</span>
      ),
    },
    {
      label: 'Garasi',
      key: 'garage_name',
      sortable: true,
      width: 250,
      render: (item) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{item.garage_name || '-'}</div>
          <div className="text-xs text-muted-foreground truncate">{item.garage_address || ''}</div>
        </div>
      ),
    },
    {
      label: 'Kota',
      key: 'garage_city_label',
      sortable: true,
      width: 180,
      render: (item) => <span className="text-foreground">{item.garage_city_label || '-'}</span>,
    },
    {
      label: 'Stok Saat Ini',
      key: 'stock',
      sortable: true,
      width: 100,
      align: 'right',
      render: (item) => (
        <span className="text-blue-600 font-semibold text-sm">
          {item.stock} {detail?.item_uom || 'Pcs'}
        </span>
      ),
    },
    {
      label: 'Persentase',
      key: '__percentage__',
      sortable: false,
      width: 180,
      render: (item) => {
        const pct = totalStock > 0 ? Math.round((item.stock / totalStock) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar value={pct} className="h-2" color={progressColor(0)} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      label: 'Update Terakhir',
      key: 'updated_at',
      sortable: true,
      width: 160,
      render: (item) => <span className="text-muted-foreground text-sm">{formatDateTimeTable(item.updated_at)}</span>,
    },
    {
      label: 'Aksi',
      key: '__action__',
      sortable: false,
      width: 120,
      align: 'center',
      render: () => (
        <Button variant="outline" size="sm" className="h-8 rounded-full text-xs">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Riwayat
        </Button>
      ),
    },
  ];

  const InfoCardSkeleton = () => (
    <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] pb-6">
      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="p-5 sm:p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );

  const BottomSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="p-5 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="p-5 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 p-2 sm:p-6">
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
            onClick={() => navigate(`${basePrefix}/inventories/items`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Detail Inventory Item</h1>
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-300">
              <span className="text-gray-500">Asset</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-gray-500">Inventories</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-gray-900 dark:text-white font-medium truncate">{detail?.item_name || '...'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Transfer Stok</span>
          </Button>
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm text-emerald-600 border-emerald-200 hover:text-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Tambah Stok</span>
          </Button>
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm text-amber-600 border-amber-200 hover:text-amber-700">
            <Minus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Kurangi Stok</span>
          </Button>
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm">
            <Pencil className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Edit Item</span>
          </Button>
        </div>
      </div>

      <div className="block sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
            onClick={() => navigate(`${basePrefix}/inventories/items`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant={statusToVariant(detail?.status ?? 1)} className="rounded-full px-2.5 py-1 text-xs font-medium">
            {loading ? 'Memuat...' : detail ? statusToLabel(detail.status) : '-'}
          </Badge>
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Detail Inventory Item</h2>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-300">
          Asset / Inventories / <span className="text-gray-900 dark:text-white font-medium truncate">{detail?.item_name || '...'}</span>
        </div>
      </div>

      {loading ? (
        <InfoCardSkeleton />
      ) : detail ? (
        <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] pb-6">
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 mt-1 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <Box className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Nama Item</div>
                      <div className="mt-1 text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">{detail.item_name || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Kategori</div>
                      <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-semibold">{categoryToLabel(detail.item_category)}</div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Total Stok</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {totalStock} <span className="text-sm font-medium text-muted-foreground">{detail.item_uom || 'Pcs'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">ID Item</div>
                      <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-mono truncate">{detail.item_sku || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Tersebar di</div>
                      <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-semibold">
                        {detail.locations.length} <span className="text-muted-foreground font-normal">Garasi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Distribusi Stok per Garasi</div>
                {detail.locations.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-300">Tidak ada data lokasi</div>
                ) : (
                  <div className="space-y-3">
                    {detail.locations.map((loc, idx) => {
                      const pct = totalStock > 0 ? Math.round((loc.stock / totalStock) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{loc.garage_name}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">{loc.stock} pcs ({pct}%)</div>
                          </div>
                           <ProgressBar value={pct} className="h-2" color={progressColor(idx)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] p-10 text-center text-sm text-gray-500 dark:text-gray-300">
          Data item tidak ditemukan
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : detail ? (
        <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Distribusi Stok Per Garasi</h3>
            <DataTable
              data={detail.locations}
              columns={distributionColumns}
              loading={loading}
              tableClassName="table-auto w-full"
              emptyTitle="Tidak ada data lokasi stok"
              emptyDescription="Belum ada garasi yang tercatat untuk item ini."
              pagination={{ enabled: false }}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <BottomSkeleton />
      ) : detail ? (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
          <div className="lg:col-span-2 rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Riwayat Mutasi Terbaru</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Dari</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sampai</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:text-white dark:bg-gray-800"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700"
                  onClick={handleApplyFilter}
                  disabled={movementLoading}
                >
                  Terapkan
                </Button>
              </div>
              <DataTable
                data={movements}
                columns={movementColumns}
                loading={movementLoading}
                tableClassName="table-auto w-full"
                emptyTitle="Tidak ada riwayat mutasi"
                emptyDescription="Coba ubah rentang tanggal."
                pagination={{
                  enabled: true,
                  page: movementPage,
                  pageSize: 10,
                  totalItems: movementTotal,
                  onPageChange: (p) => fetchMovements(p),
                  pageSizeOptions: [10, 20, 50],
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
