import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Box, ArrowLeftRight, Pencil, Clock, X, ShoppingCart, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Swal from 'sweetalert2';

type LocationRow = {
  garage_id: string;
  garage_name: string;
  garage_address: string;
  garage_city: string;
  garage_city_label: string;
  stock: number;
  updated_at: string;
};

type GarageOption = {
  id: string;
  garage_name: string;
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

type OrderHistoryRow = {
  purchase_id: string;
  quantity: number;
  item_price: number;
  total_amount: number;
};

type GarageMovementRow = {
  transaction_date: string;
  movement_type: string;
  quantity: number;
  item_uom: string;
  stock_final: number;
  stock_before: number;
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

  const formatDateOnlyTable = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
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

const getEndOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const { item_id } = useParams<{ item_id: string }>();
  const itemId = decodeURIComponent(item_id ?? '');

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementPage, setMovementPage] = useState(1);
const [startDate, setStartDate] = useState(formatDateOnly(getMonthStart(new Date())));
   const [endDate, setEndDate] = useState(formatDateOnly(getEndOfMonth(new Date())));
   const [editModalOpen, setEditModalOpen] = useState(false);
   const [editSaving, setEditSaving] = useState(false);
   const [editFormData, setEditFormData] = useState({
     item_name: '',
     item_category: '1',
   });
   const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);
  const [garageOptions, setGarageOptions] = useState<GarageOption[]>([]);
  const [garageFromOptions, setGarageFromOptions] = useState<GarageOption[]>([]);
  const [garageFromPickerOpen, setGarageFromPickerOpen] = useState(false);
  const [garageFromQuery, setGarageFromQuery] = useState('');
  const [garageDestPickerOpen, setGarageDestPickerOpen] = useState(false);
  const [garageDestQuery, setGarageDestQuery] = useState('');
  const [transferFormData, setTransferFormData] = useState({
    garage_from: '',
    garage_destination: '',
    stock: '',
  });
  const [reloadDetail, setReloadDetail] = useState(0);
  
  // Order History state
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryData, setOrderHistoryData] = useState<OrderHistoryRow[]>([]);
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const [orderHistoryTotal, setOrderHistoryTotal] = useState(0);
  
  // Garage Movement History state
  const [garageMovementModalOpen, setGarageMovementModalOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<LocationRow | null>(null);
  const [garageMovementLoading, setGarageMovementLoading] = useState(false);
  const [garageMovementData, setGarageMovementData] = useState<GarageMovementRow[]>([]);
  const [garageMovementPage, setGarageMovementPage] = useState(1);
  const [garageMovementTotal, setGarageMovementTotal] = useState(0);

  const totalStock = detail?.locations.reduce((sum, loc) => sum + loc.stock, 0) ?? 0;

  const fetchMovements = useCallback(async (page: number) => {
    if (!itemId) return;
    setMovementLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const endOfMonth = formatDateOnly(getEndOfMonth(new Date(startDate)));
    try {
      const res = await api.post<unknown>(
        '/inventories/items/movement',
        { item_id: itemId, start_date: startDate, end_date: endOfMonth, page, limit: 10 },
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

  const fetchOrderHistory = useCallback(async (page: number) => {
    if (!itemId) return;
    setOrderHistoryLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    try {
      const res = await api.post<unknown>(
        '/inventories/items/order-history',
        { item_id: itemId, page, limit: 10 },
        headers
      );
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const listRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).items : root;
        const list: unknown[] = Array.isArray(listRaw) ? listRaw : [];
        const mapped = list.map((raw) => {
          const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
          return {
            purchase_id: typeof obj.purchase_id === 'string' ? obj.purchase_id : '',
            quantity: typeof obj.quantity === 'number' ? obj.quantity : 0,
            item_price: typeof obj.item_price === 'number' ? obj.item_price : 0,
            total_amount: typeof obj.total_amount === 'number' ? obj.total_amount : 0,
          };
        });
        setOrderHistoryData(mapped);
        const totalRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).total : undefined;
        setOrderHistoryTotal(typeof totalRaw === 'number' ? totalRaw : mapped.length);
        setOrderHistoryPage(page);
      } else {
        setOrderHistoryData([]);
        setOrderHistoryTotal(0);
      }
    } catch {
      setOrderHistoryData([]);
      setOrderHistoryTotal(0);
    } finally {
      setOrderHistoryLoading(false);
    }
  }, [itemId]);

  const fetchGarageMovementHistory = useCallback(async (garage: LocationRow, page: number) => {
    if (!itemId) return;
    setGarageMovementLoading(true);
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    try {
      const res = await api.post<unknown>(
        '/inventories/items/movement',
        { item_id: itemId, garage_id: garage.garage_id, page, limit: 10 },
        headers
      );
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const listRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).items : root;
        const list: unknown[] = Array.isArray(listRaw) ? listRaw : [];
        const mapped = list.map((raw) => {
          const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
          return {
            transaction_date: typeof obj.movement_date === 'string' ? obj.movement_date : '',
            movement_type: typeof obj.movement_type === 'string' ? obj.movement_type : '-',
            quantity: typeof obj.quantity === 'number' ? obj.quantity : 0,
            item_uom: typeof obj.item_uom === 'string' ? obj.item_uom : 'Pcs',
            stock_final: typeof obj.stock_final === 'number' ? obj.stock_final : 0,
            stock_before: typeof obj.stock_before === 'number' ? obj.stock_before : 0,
            notes: typeof obj.notes === 'string' ? obj.notes : '',
          };
        });
        setGarageMovementData(mapped);
        const totalRaw = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).total : undefined;
        setGarageMovementTotal(typeof totalRaw === 'number' ? totalRaw : mapped.length);
        setGarageMovementPage(page);
      } else {
        setGarageMovementData([]);
        setGarageMovementTotal(0);
      }
    } catch {
      setGarageMovementData([]);
      setGarageMovementTotal(0);
    } finally {
      setGarageMovementLoading(false);
    }
  }, [itemId]);

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
                const garageIdRaw = obj.garage_id ?? obj.id;
                return {
                  garage_id: typeof garageIdRaw === 'string' || typeof garageIdRaw === 'number' ? String(garageIdRaw) : '',
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
  }, [itemId, reloadDetail]);

  useEffect(() => {
    if (detail) {
      fetchMovements(1);
      fetchOrderHistory(1);
    }
  }, [detail, fetchMovements, fetchOrderHistory]);

  useEffect(() => {
    const loadGarages = async () => {
      if (!transferModalOpen || !itemId) return;
      const token = localStorage.getItem('token') ?? '';
      const [fromRes, allRes] = await Promise.all([
        api.get<unknown>(`/organization/garage/list?item_id=${encodeURIComponent(itemId)}`, token ? { Authorization: token } : undefined),
        api.get<unknown>('/organization/garage/list', token ? { Authorization: token } : undefined),
      ]);

      const mapGarage = (payload: unknown): GarageOption[] => {
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const list: unknown[] = Array.isArray(root.items) ? root.items : Array.isArray(payload) ? payload : [];
        return list
          .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
          .map((x) => {
            const idRaw = x.garage_id ?? x.id;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
            const garage_name = typeof x.garage_name === 'string' ? x.garage_name : '';
            return id && garage_name ? { id, garage_name } : null;
          })
          .filter((x): x is GarageOption => x !== null);
      };

      const fromOptions = mapGarage(fromRes.data);
      setGarageFromOptions(fromOptions);
      if (fromOptions.length > 0 && !transferFormData.garage_from) {
        setTransferFormData((p) => ({ ...p, garage_from: fromOptions[0].id }));
      }

      const allOptions = mapGarage(allRes.data);
      setGarageOptions(allOptions);
    };
    loadGarages();
  }, [transferModalOpen, itemId, detail?.locations]);

  const movementStartIndex = (movementPage - 1) * 10;

  const filteredGarageDestOptions = useMemo(() => {
    return garageOptions.filter((o) => o.id !== transferFormData.garage_from);
  }, [garageOptions, transferFormData.garage_from]);

  const filteredGarageFromOptions = useMemo(() => {
    return garageFromOptions.filter((o) => o.id !== transferFormData.garage_destination);
  }, [garageFromOptions, transferFormData.garage_destination]);

  const selectedGarageFromName = useMemo(() => {
    const found = garageFromOptions.find((o) => o.id === transferFormData.garage_from);
    return found?.garage_name ?? '';
  }, [garageFromOptions, transferFormData.garage_from]);

  const selectedGarageDestName = useMemo(() => {
    const found = garageOptions.find((o) => o.id === transferFormData.garage_destination);
    return found?.garage_name ?? '';
  }, [garageOptions, transferFormData.garage_destination]);

  const handleApplyFilter = () => {
    setEndDate(formatDateOnly(getEndOfMonth(new Date(startDate))));
    fetchMovements(1);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSaving || !detail) return;
    const token = localStorage.getItem('token') ?? '';
    try {
      setEditSaving(true);
      const res = await api.post<unknown>(
        '/inventories/items/update',
        {
          item_id: detail.item_id,
          item_name: editFormData.item_name,
          item_category: Number(editFormData.item_category),
        },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Item berhasil diperbarui.' });
        setEditModalOpen(false);
        setDetail((prev) => prev ? { ...prev, item_name: editFormData.item_name, item_category: Number(editFormData.item_category) } : null);
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferSaving || !itemId) return;
    const token = localStorage.getItem('token') ?? '';
    try {
      setTransferSaving(true);
      const res = await api.post<unknown>(
        '/inventories/items/transfer',
        {
          item_id: itemId,
          garage_from: transferFormData.garage_from,
          garage_destination: transferFormData.garage_destination,
          stock: Number(transferFormData.stock),
        },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Stok berhasil ditransfer.' });
        setTransferModalOpen(false);
        setTransferFormData({ garage_from: '', garage_destination: '', stock: '' });
        setReloadDetail((p) => p + 1);
      }
    } finally {
      setTransferSaving(false);
    }
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

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    });
  };

  const orderHistoryStartIndex = (orderHistoryPage - 1) * 10;
  const orderHistoryColumns: Array<DataTableColumn<OrderHistoryRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{orderHistoryStartIndex + rowIndex + 1}</span>
      ),
    },
    {
      label: 'Purchase ID',
      key: 'purchase_id',
      sortable: true,
      width: 200,
      render: (item) => (
        <Link
          to={`${basePrefix}/inventories/orders/detail/${encodeURIComponent(item.purchase_id)}`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          {item.purchase_id}
        </Link>
      ),
    },
    {
      label: 'Qty',
      key: 'quantity',
      sortable: true,
      width: 100,
      align: 'right',
      render: (item) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {item.quantity} {detail?.item_uom || 'Pcs'}
        </span>
      ),
    },
    {
      label: 'Harga',
      key: 'item_price',
      sortable: true,
      width: 180,
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(item.item_price)}
          </div>
          <div className="text-xs text-muted-foreground">
            Total: {formatCurrency(item.total_amount)}
          </div>
        </div>
      ),
    },
  ];

  const garageMovementStartIndex = (garageMovementPage - 1) * 10;
  const garageMovementColumns: Array<DataTableColumn<GarageMovementRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{garageMovementStartIndex + rowIndex + 1}</span>
      ),
    },
    {
      label: 'Tanggal',
      key: 'transaction_date',
      sortable: true,
      width: 160,
      render: (item) => <span className="text-foreground text-sm">{formatDateTimeTable(item.transaction_date)}</span>,
    },
    {
      label: 'Aktivitas',
      key: 'movement_type',
      sortable: true,
      width: 150,
      render: (item) => (
        <Badge variant={activityVariant(item.movement_type)} className="rounded-full px-2.5 py-1 text-xs font-medium">
          {item.movement_type || '-'}
        </Badge>
      ),
    },
    {
      label: 'Qty',
      key: 'quantity',
      sortable: true,
      width: 120,
      align: 'right',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {item.quantity} {item.item_uom}
        </span>
      ),
    },
    {
      label: 'Stok',
      key: 'stock_final',
      sortable: true,
      width: 150,
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {item.stock_final} {item.item_uom}
          </div>
          <div className="text-xs text-muted-foreground">
            Stok sebelumnya: {item.stock_before} {item.item_uom}
          </div>
        </div>
      ),
    },
    {
      label: 'Keterangan',
      key: 'notes',
      sortable: true,
      width: 250,
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
      label: 'Stok',
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
      label: 'Update',
      key: 'updated_at',
      sortable: true,
      width: 160,
      render: (item) => <span className="text-muted-foreground text-sm">{formatDateOnlyTable(item.updated_at)}</span>,
    },
    {
      label: 'Aksi',
      key: '__action__',
      sortable: false,
      width: 120,
      align: 'center',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs"
          onClick={() => {
            setSelectedGarage(item);
            fetchGarageMovementHistory(item, 1);
            setGarageMovementModalOpen(true);
          }}
        >
          <Clock className="h-3.5 w-3.5" />
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
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Detail Asset</h1>
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
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white text-center" onClick={() => setTransferModalOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Transfer Stok</span>
          </Button>
          <Button variant="outline" className="h-9 rounded-2xl text-xs sm:text-sm" onClick={() => {
                if (detail) {
                  setEditFormData({ item_name: detail.item_name, item_category: String(detail.item_category) });
                  setEditModalOpen(true);
                }
              }}>
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
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Detail Asset</h2>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      ) : detail ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
           {/* Riwayat Order */}
           <Card className="lg:col-span-4 dark:bg-gray-900">
             <CardHeaderWithBadge title="Riwayat Order" badgeIcon={<ShoppingCart className="h-3.5 w-3.5 sm:h-6 sm:w-6" />} />
             <CardContent className="p-5 sm:p-6">
               <DataTable
                 data={orderHistoryData}
                 columns={orderHistoryColumns}
                 loading={orderHistoryLoading}
                 tableClassName="table-auto w-full"
                 emptyTitle="Tidak ada riwayat order"
                 emptyDescription="Belum ada order untuk item ini."
                 pagination={{
                   enabled: true,
                   page: orderHistoryPage,
                   pageSize: 10,
                   totalItems: orderHistoryTotal,
                   onPageChange: (p) => fetchOrderHistory(p),
                   pageSizeOptions: [10, 20, 50],
                 }}
               />
             </CardContent>
           </Card>

           {/* Distribusi Stok Per Garasi */}
           <Card className="lg:col-span-6 dark:bg-gray-900">
             <CardHeaderWithBadge title="Distribusi Stok Per Garasi" badgeIcon={<MapPin className="h-3.5 w-3.5 sm:h-6 sm:w-6" />} />
             <CardContent className="p-5 sm:p-6">
               <DataTable
                 data={detail.locations}
                 columns={distributionColumns}
                 loading={loading}
                 tableClassName="table-auto w-full"
                 emptyTitle="Tidak ada data lokasi stok"
                 emptyDescription="Belum ada garasi yang tercatat untuk item ini."
                 pagination={{ enabled: false }}
               />
             </CardContent>
           </Card>
        </div>
      ) : null}

      {/* Riwayat Mutasi Terbaru */}
      {loading ? (
         <BottomSkeleton />
        ) : detail ? (
          <div className="grid grid-cols-1 gap-4">
            <Card className="dark:bg-gray-900">
              <CardHeaderWithBadge title="Riwayat Mutasi Terbaru" badgeIcon={<Clock className="h-3.5 w-3.5 sm:h-6 sm:w-6" />} />
              <CardContent className="p-5 sm:p-6">
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
              </CardContent>
            </Card>
          </div>
        ) : null}

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={handleEdit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Pencil className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Edit Item</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Perbarui informasi item inventaris
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Nama Item *</label>
                <Input
                  value={editFormData.item_name}
                  onChange={(e) => setEditFormData((p) => ({ ...p, item_name: e.target.value }))}
                  placeholder="Masukkan nama item"
                  className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jenis Asset *</label>
                <RadioGroup value={editFormData.item_category} onValueChange={(v) => setEditFormData((p) => ({ ...p, item_category: v }))} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${editFormData.item_category === '1' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                    <RadioGroupItem value="1" id="edit-category-1" className="mt-0.5 border-blue-300" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900">Kebutuhan Armada</div>
                      <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan operasional armada.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${editFormData.item_category === '2' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                    <RadioGroupItem value="2" id="edit-category-2" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900">Kebutuhan Umum</div>
                      <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan umum / kantor.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
                Batal
              </Button>
              <Button type="submit" disabled={editSaving} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
                {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={handleTransfer} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <ArrowLeftRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Transfer Stok</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Pindah stok antar lokasi garasi
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Lokasi Asal *</label>
                <Popover open={garageFromPickerOpen} onOpenChange={setGarageFromPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50`}
                    >
                      <span className={transferFormData.garage_from ? '' : 'text-muted-foreground'}>
                        {transferFormData.garage_from ? selectedGarageFromName : 'Pilih garasi asal'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                    <Command shouldFilter={false} className="rounded-xl">
                      <CommandInput
                        placeholder="Cari garasi..."
                        value={garageFromQuery}
                        onValueChange={setGarageFromQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {garageFromQuery.trim().length < 3
                            ? 'Ketik minimal 3 karakter untuk mencari garasi.'
                            : 'Tidak ada hasil.'}
                        </CommandEmpty>
                        <CommandGroup heading="Garasi">
                          {filteredGarageFromOptions.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.garage_name}
                              onSelect={() => {
                                setTransferFormData((p) => ({ ...p, garage_from: opt.id }));
                                setGarageFromPickerOpen(false);
                                setGarageFromQuery('');
                              }}
                            >
                              <Check className={transferFormData.garage_from === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                              {opt.garage_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Lokasi Tujuan *</label>
                <Popover open={garageDestPickerOpen} onOpenChange={(open) => {
                  setGarageDestPickerOpen(open);
                  setGarageDestQuery(open ? '' : '');
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50`}
                    >
                      <span className={transferFormData.garage_destination ? '' : 'text-muted-foreground'}>
                        {transferFormData.garage_destination ? selectedGarageDestName : 'Pilih garasi tujuan'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                    <Command shouldFilter={false} className="rounded-xl">
                      <CommandInput
                        placeholder="Cari garasi..."
                        value={garageDestQuery}
                        onValueChange={setGarageDestQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {garageDestQuery.trim().length < 3
                            ? 'Ketik minimal 3 karakter untuk mencari garasi.'
                            : 'Tidak ada hasil.'}
                        </CommandEmpty>
                        <CommandGroup heading="Garasi">
                          {filteredGarageDestOptions.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.garage_name}
                              onSelect={() => {
                                setTransferFormData((p) => ({ ...p, garage_destination: opt.id }));
                                setGarageDestPickerOpen(false);
                                setGarageDestQuery('');
                              }}
                            >
                              <Check className={transferFormData.garage_destination === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                              {opt.garage_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jumlah Stok *</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={transferFormData.stock}
                      onChange={(e) => setTransferFormData((p) => ({ ...p, stock: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="0"
                      className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30"
                      style={{ appearance: 'textfield' }}
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      value={detail?.item_uom || ''}
                      readOnly
                      placeholder="Satuan"
                      className="h-11 rounded-2xl border-gray-300 bg-white text-sm text-center px-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
                Batal
              </Button>
              <Button type="submit" disabled={transferSaving} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
                {transferSaving ? 'Mengirim...' : 'Transfer Stok'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Riwayat Mutasi Item Per Garasi Dialog */}
      <Dialog open={garageMovementModalOpen} onOpenChange={setGarageMovementModalOpen}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <div className="px-6 sm:px-8 pt-6 sm:pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Riwayat Mutasi Item</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Riwayat mutasi untuk {selectedGarage?.garage_name}
                  </p>
                </div>
              </div>
              <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                <X className="w-3 h-3 sm:w-5 sm:h-5" />
              </DialogClose>
            </div>
            <div className="h-px bg-slate-100 mt-4" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
            <DataTable
              data={garageMovementData}
              columns={garageMovementColumns}
              loading={garageMovementLoading}
              tableClassName="table-auto w-full"
              emptyTitle="Tidak ada riwayat mutasi"
              emptyDescription="Belum ada mutasi untuk garasi ini."
              pagination={{
                enabled: true,
                page: garageMovementPage,
                pageSize: 10,
                totalItems: garageMovementTotal,
                onPageChange: (p) => selectedGarage && fetchGarageMovementHistory(selectedGarage, p),
                pageSizeOptions: [10, 20, 50],
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
