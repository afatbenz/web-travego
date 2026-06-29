import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Box, Check, X, MoreVertical, Plus, Calendar, Clock, Copy, Users, ChevronsUpDown, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type SupplierOption = {
  id: string;
  supplier_name: string;
  phone: string;
  url: string;
};

type RequestDetail = {
  request_id: string;
  request_number: string;
  item_id: string;
  item_category: number;
  item_category_label: string;
  item_uom: string;
  item_sku: string;
  item_name: string;
  garage_id: string;
  garage_name: string;
  garage_city: string;
  garage_city_label: string;
  quantity: number;
  status: number;
  request_status_label: string;
  organization_id: string;
  created_at: string;
  created_by: string;
  approve_at: string;
  approve_by: string;
  updated_at: string;
  updated_by: string;
  employee_name: string;
  unit_id: string;
  vehicle_id: string;
  plate_number: string;
  purchase_id: string;
  transaction_date: string;
  order_status: number;
  order_status_label: string;
  received_at: string;
  received_by: string;
  transaction_id: string;
  stock: number;
};

type InventoryLocation = {
  garage_id: string;
  garage_name: string;
  garage_address: string;
  garage_city: string;
  garage_city_label: string;
  stock: number;
  updated_at: string;
  is_primary?: boolean;
};

type InventoryDetail = {
  item_id: string;
  item_name: string;
  item_sku: string;
  item_uom: string;
  locations: InventoryLocation[];
  transaction_id: string;
};

type TimelineItem = {
  id: string;
  status: string;
  description: string;
  date: string;
  displayDate?: string;
  is_active: boolean;
};

const statusToLabel = (status: number): string => {
  if (status === 1) return 'Sedang Diproses';
  if (status === 2) return 'Menunggu Persetujuan';
  if (status === 3) return 'Disetujui';
  return '-';
};

const getStatusColorConfig = (status: number) => {
  switch (status) {
    case 1:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        iconColor: 'text-blue-600',
      };
    case 2:
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        iconColor: 'text-orange-600',
      };
    case 3:
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        iconColor: 'text-green-600',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        iconColor: 'text-gray-600',
      };
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: id }) + ' WIB';
  } catch {
    return '-';
  }
};

const formatCurrency = (val: string) => {
  if (!val) return '';
  const num = Number(val);
  return isNaN(num) ? '' : num.toLocaleString('id-ID');
};

export const InventoryRequestDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const { request_id } = useParams<{ request_id: string }>();
  const requestId = decodeURIComponent(request_id ?? '');

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [inventoryDetail, setInventoryDetail] = useState<InventoryDetail | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSaving, setPoSaving] = useState(false);
  const [poFormData, setPoFormData] = useState({
    item_price: '',
    supplier_id: '',
    supplier_name_manual: '',
    supplier_phone: '',
    supplier_url: '',
    quantity: '',
  });
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
const [supplierQuery, setSupplierQuery] = useState('');
  const [items, setItems] = useState<{item_id: string; item_name: string; item_sku: string; item_uom: string}[]>([]);
  const [selectedItem, setSelectedItem] = useState<{item_id: string; item_name: string; item_sku: string; item_uom: string} | null>(null);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeSaving, setCompleteSaving] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<{uuid: string; fullname: string}[]>([]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{uuid: string; fullname: string} | null>(null);

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!detail) return [];
    const items: TimelineItem[] = [
      {
        id: '1',
        status: 'Dibuat',
        description: 'Permintaan berhasil dibuat',
        date: detail.created_at,
        is_active: true,
      },
    ];

    if (detail.status === 1 && detail.order_status === 1) {
      if (detail.approve_at) {
        items.push({
          id: '2',
          status: 'Pesanan Disetujui',
          description: `Disetujui oleh ${detail.approve_by || 'Atasan'}`,
          date: detail.approve_at,
          is_active: true,
        });
      }

      if (detail.purchase_id && detail.transaction_date) {
        items.push({
          id: '3',
          status: 'Pesanan Diproses',
          description: 'Pesanan sedang diproses',
          date: detail.transaction_date,
          displayDate: format(new Date(detail.transaction_date), 'dd MMMM yyyy', { locale: id }),
          is_active: true,
        });
      }

      if (detail.received_at) {
        const receiveId = detail.purchase_id && detail.transaction_date ? '4' : '3';
        items.push({
          id: receiveId,
          status: 'Pesanan Diterima',
          description: `Diterima oleh ${detail.received_by || 'Karyawan'}`,
          date: detail.received_at,
          displayDate: format(new Date(detail.received_at), 'dd MMMM yyyy HH:mm', { locale: id }),
          is_active: true,
        });
      }

      return items.reverse();
    }

    if (detail.status >= 2) {
      items.push({
        id: '2',
        status: 'Menunggu Persetujuan',
        description: 'Permintaan sedang menunggu persetujuan',
        date: detail.created_at,
        is_active: detail.status === 2,
      });
    }
    
    if (detail.status >= 3 && detail.approve_at) {
      items.push({
        id: '3',
        status: 'Disetujui',
        description: `Permintaan disetujui oleh ${detail.approve_by || 'Atasan'}`,
        date: detail.approve_at,
        is_active: detail.status === 3,
      });
    }

    if (detail.status === 3 && detail.transaction_date) {
      items.push({
        id: '4',
        status: 'Pesanan Diproses',
        description: 'Pesanan sedang diproses',
        date: detail.transaction_date,
        displayDate: format(new Date(detail.transaction_date), 'dd MMMM yyyy', { locale: id }),
        is_active: true,
      });
    }

    if (detail.status === 1 && detail.updated_at) {
      items.push({
        id: '5',
        status: 'Item telah diterima',
        description: 'Item telah diterima',
        date: detail.updated_at,
        displayDate: format(new Date(detail.updated_at), 'dd MMMM yyyy HH:mm', { locale: id }),
        is_active: true,
      });
    }

    return items.reverse();
  }, [detail]);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post<unknown>(
        '/inventories/request/detail',
        { request_id: requestId },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
        setDetail({
          request_id: typeof data.request_id === 'string' ? data.request_id : '',
          request_number: typeof data.request_number === 'string' ? data.request_number : '',
          item_id: typeof data.item_id === 'string' ? data.item_id : '',
          item_category: typeof data.item_category === 'number' ? data.item_category : 0,
          item_category_label: typeof data.item_category_label === 'string' ? data.item_category_label : '',
          item_uom: typeof data.item_uom === 'string' ? data.item_uom : '',
          item_sku: typeof data.item_sku === 'string' ? data.item_sku : '',
          item_name: typeof data.item_name === 'string' ? data.item_name : '',
          garage_id: typeof data.garage_id === 'string' ? data.garage_id : '',
          garage_name: typeof data.garage_name === 'string' ? data.garage_name : '',
          garage_city: typeof data.garage_city === 'string' ? data.garage_city : '',
          garage_city_label: typeof data.garage_city_label === 'string' ? data.garage_city_label : '',
          quantity: typeof data.quantity === 'number' ? data.quantity : 0,
          stock: typeof data.stock === 'number' ? data.stock : 0,
          status: typeof data.status === 'number' ? data.status : 0,
          request_status_label: typeof data.request_status_label === 'string' ? data.request_status_label : '',
          organization_id: typeof data.organization_id === 'string' ? data.organization_id : '',
          created_at: typeof data.created_at === 'string' ? data.created_at : '',
          created_by: typeof data.created_by === 'string' ? data.created_by : '',
          approve_at: typeof data.approve_at === 'string' ? data.approve_at : '',
          approve_by: typeof data.approve_by === 'string' ? data.approve_by : '',
          updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
          updated_by: typeof data.updated_by === 'string' ? data.updated_by : '',
          employee_name: typeof data.employee_name === 'string' ? data.employee_name : '',
          unit_id: typeof data.unit_id === 'string' ? data.unit_id : '',
          vehicle_id: typeof data.vehicle_id === 'string' ? data.vehicle_id : '',
          plate_number: typeof data.plate_number === 'string' ? data.plate_number : '',
          purchase_id: typeof data.purchase_id === 'string' ? data.purchase_id : '',
          transaction_date: typeof data.transaction_date === 'string' ? data.transaction_date : '',
          order_status: typeof data.order_status === 'number' ? data.order_status : 0,
          order_status_label: typeof data.order_status_label === 'string' ? data.order_status_label : '',
          received_at: typeof data.received_at === 'string' ? data.received_at : '',
          received_by: typeof data.received_by === 'string' ? data.received_by : '',
          transaction_id: typeof root.transaction_id === 'string' ? root.transaction_id : '',
        });
      } else {
        setDetail(null);
      }
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const fetchInventoryDetail = useCallback(async () => {
    if (!detail?.item_id) return;
    setInventoryLoading(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post<unknown>(
        '/inventories/items/detail',
        { item_id: detail.item_id },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
        const locationsRaw = data.locations;
        const locations: InventoryLocation[] = Array.isArray(locationsRaw)
          ? (locationsRaw as unknown[])
              .map((x) => {
                const obj = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
                return {
                  garage_id: typeof obj.garage_id === 'string' ? obj.garage_id : '',
                  garage_name: typeof obj.garage_name === 'string' ? obj.garage_name : '',
                  garage_address: typeof obj.garage_address === 'string' ? obj.garage_address : '',
                  garage_city: typeof obj.garage_city === 'string' ? obj.garage_city : '',
                  garage_city_label: typeof obj.garage_city_label === 'string' ? obj.garage_city_label : '',
                  stock: typeof obj.stock === 'number' ? obj.stock : 0,
                  updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : '',
                  is_primary: obj.garage_id === detail.garage_id,
                };
              })
              .filter((loc) => loc.garage_name)
          : [];
        setInventoryDetail({
          item_id: typeof data.item_id === 'string' ? data.item_id : '',
          item_name: typeof data.item_name === 'string' ? data.item_name : '',
          item_sku: typeof data.item_sku === 'string' ? data.item_sku : '',
          item_uom: typeof data.item_uom === 'string' ? data.item_uom : '',
          locations,
          transaction_id: typeof root.transaction_id === 'string' ? root.transaction_id : '',
        });
      } else {
        setInventoryDetail(null);
      }
    } catch {
      setInventoryDetail(null);
    } finally {
      setInventoryLoading(false);
    }
  }, [detail?.item_id, detail?.garage_id]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  useEffect(() => {
    if (detail) {
      fetchInventoryDetail();
    }
  }, [detail, fetchInventoryDetail]);

  useEffect(() => {
    if (poModalOpen) {
      const loadSuppliers = async () => {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/inventories/supliers/list', token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const list: unknown[] = Array.isArray(payload)
            ? payload
            : payload && typeof payload === 'object'
              ? Array.isArray((payload as Record<string, unknown>).suppliers)
                ? ((payload as Record<string, unknown>).suppliers as unknown[])
                : Array.isArray((payload as Record<string, unknown>).items)
                  ? ((payload as Record<string, unknown>).items as unknown[])
                  : []
              : [];
          const mapped = list
            .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
            .map((it) => {
              const idRaw = it.suplier_id ?? it.id;
              const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
              const supplier_name = typeof it.suplier_name === 'string'
                ? it.suplier_name
                : typeof it.name === 'string'
                  ? it.name
                  : '';
              const phone = typeof it.suplier_phone === 'string' ? it.suplier_phone : typeof it.phone === 'string' ? it.phone : '';
              const url = typeof it.suplier_url === 'string' ? it.suplier_url : typeof it.website === 'string' ? it.website : '';
              return id && supplier_name ? { id, supplier_name, phone, url } : null;
            })
            .filter((x): x is SupplierOption => x !== null);
          setSupplierOptions(mapped);
        }
      };
      loadSuppliers();
    }
  }, [poModalOpen]);

  useEffect(() => {
    if (poModalOpen) {
      const loadItems = async () => {
        const token = localStorage.getItem('token') ?? '';
        try {
          const res = await api.get<unknown>('/inventories/items/all', token ? { Authorization: token } : undefined);
          if (res.status === 'success') {
            const payload = res.data as unknown;
            const raw = Array.isArray(payload) ? payload : [];
            const mapped = raw
              .filter((it): it is Record<string, unknown> => it && typeof it === 'object')
              .map((it) => {
                const id = typeof it.item_id === 'string' || typeof it.item_id === 'number' ? String(it.item_id) : (typeof it.id === 'string' || typeof it.id === 'number' ? String(it.id) : '');
                const item_name = typeof it.item_name === 'string' ? it.item_name : '';
                const item_sku = typeof it.item_sku === 'string' ? it.item_sku : '';
                const item_uom = typeof it.item_uom === 'string' ? it.item_uom : '';
                return id && item_name ? { item_id: id, item_name, item_sku, item_uom } : null;
              })
              .filter((x): x is {item_id: string; item_name: string; item_sku: string; item_uom: string} => x !== null);
            setItems(mapped);
            if (!selectedItem && detail?.item_id) {
              const found = mapped.find((it) => it.item_id === detail.item_id);
              if (found) setSelectedItem(found);
            }
          }
        } catch {
          // no-op
        }
      };
      loadItems();
    }
  }, [poModalOpen, detail?.item_id, selectedItem]);

  useEffect(() => {
    if (poModalOpen && detail) {
      setPoFormData(p => ({ ...p, quantity: p.quantity ? p.quantity : String(detail.quantity ?? '') }));
    }
  }, [poModalOpen, detail]);

  useEffect(() => {
    if (completeModalOpen) {
      const loadEmployees = async () => {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/employee/all', token ? { Authorization: token } : undefined);
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const list: unknown[] = Array.isArray(payload)
            ? payload
            : payload && typeof payload === 'object'
              ? Array.isArray((payload as Record<string, unknown>).items)
                ? ((payload as Record<string, unknown>).items as unknown[])
                : []
              : [];
          const mapped = list
            .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
            .map((it) => {
              const uuid = typeof it.uuid === 'string' ? it.uuid : '';
              const fullname = typeof it.fullname === 'string' ? it.fullname : '';
              return uuid && fullname ? { uuid, fullname } : null;
            })
            .filter((x): x is {uuid: string; fullname: string} => x !== null);
          setEmployeeOptions(mapped);
        }
      };
      loadEmployees();
    }
  }, [completeModalOpen]);

  const selectedSupplierName = useMemo(() => {
    const found = supplierOptions.find((o) => o.id === poFormData.supplier_id);
    return found?.supplier_name ?? '';
  }, [supplierOptions, poFormData.supplier_id]);

  const handleAction = async (action: 'submit-orders' | 'approve' | 'reject') => {
    if (!requestId || actionLoading) return;
    const actionLabels: Record<string, string> = {
      'submit-orders': 'membuat purchase order',
      'approve': 'menyetujui permintaan',
      'reject': 'menolak permintaan',
    };
    const actionButtonLabels: Record<string, string> = {
      'submit-orders': 'Buat Pesanan',
      'approve': 'Terima Pesanan',
      'reject': 'Tolak Permintaan',
    };
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: `Apakah Anda yakin ingin ${actionLabels[action]}?`,
      showCancelButton: true,
      confirmButtonText: `Ya, ${actionButtonLabels[action]}`,
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const endpoints: Record<string, string> = {
        'submit-orders': '/inventories/request/submit-orders',
        'approve': '/inventories/request/approve',
        'reject': '/inventories/request/reject',
      };
      const res = await api.post<unknown>(
        endpoints[action],
        { request_id: requestId },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: `Permintaan berhasil ${actionLabels[action]}.` });
        fetchRequestDetail();
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memproses.' });
      }
    } catch {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memproses.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!requestId || !selectedEmployee || completeSaving) return;

    const result = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin menyelesaikan pesanan ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Selesaikan Pesanan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
    });

    if (!result.isConfirmed) return;

    setCompleteSaving(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post<unknown>(
        '/inventories/request/completed',
        { request_id: requestId, employee_id: selectedEmployee.uuid },
        token ? { Authorization: token } : undefined
      );
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pesanan berhasil diselesaikan.' });
        setCompleteModalOpen(false);
        setSelectedEmployee(null);
        setEmployeeQuery('');
        setEmployeePickerOpen(false);
        fetchRequestDetail();
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyelesaikan pesanan.' });
      }
    } catch {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyelesaikan pesanan.' });
    } finally {
      setCompleteSaving(false);
    }
  };

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poSaving) return;

    setPoSaving(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const itemToUse = selectedItem ?? { item_id: detail?.item_id, item_uom: detail?.item_uom };
      const payload: Record<string, unknown> = {
        request_id: requestId,
        item_id: itemToUse.item_id,
        quantity: poFormData.quantity ? Number(poFormData.quantity) : detail?.quantity,
        item_uom: itemToUse.item_uom,
        suplier_id: poFormData.supplier_id || undefined,
        suplier_name: poFormData.supplier_id ? selectedSupplierName : poFormData.supplier_name_manual.trim() || undefined,
        suplier_phone: poFormData.supplier_phone ? "62" + poFormData.supplier_phone : undefined,
        suplier_url: poFormData.supplier_url || undefined,
        item_price: Number(poFormData.item_price),
      };

      const res = await api.post<unknown>(
        '/inventories/request/submit-orders',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Purchase order berhasil dibuat.' });
        setPoModalOpen(false);
        setPoFormData({
          item_price: '',
          supplier_id: '',
          supplier_name_manual: '',
          supplier_phone: '',
          supplier_url: '',
          quantity: '',
        });
        fetchRequestDetail();
      } else {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat membuat purchase order.' });
      }
    } catch {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat membuat purchase order.' });
    } finally {
      setPoSaving(false);
    }
  };

  const showAddPurchaseOrder = detail?.status === 2 && detail && detail.quantity >= (detail.stock - 2);
    const showApproveReject = detail?.status === 2 || detail?.status === 3;
    const showApproveButton = showApproveReject && (detail?.stock ?? 0) > 0 && !(detail?.status === 3 && (detail?.order_status === 1 || detail?.order_status === 2));
    const showCompleteButton = detail?.order_status === 1 && detail?.status === 3;

  const inventoryColumns: Array<DataTableColumn<InventoryLocation>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{rowIndex + 1}</span>,
    },
    {
      label: 'Garasi',
      key: 'garage_name',
      sortable: true,
      width: 250,
      render: (item) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{item.garage_name || '-'}</span>
            {item.is_primary && (
              <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-800 hover:bg-green-200">
                Utama
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Alamat',
      key: 'garage_address',
      sortable: true,
      width: 300,
      render: (item) => (
        <div className="text-xs text-muted-foreground truncate">{item.garage_address || '-'}</div>
      ),
    },
    {
      label: 'Jumlah Asset',
      key: 'stock',
      sortable: true,
      width: 120,
      align: 'right',
      render: (item) => (
        <span className="text-blue-600 font-semibold text-sm">
          {item.stock} {detail?.item_uom || 'Pcs'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-2 sm:p-6">
      {/* Breadcrumb */}
      <div className="hidden sm:flex">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`${basePrefix}/inventories`} className="hover:text-foreground">
                  Inventories
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`${basePrefix}/inventories/request`} className="hover:text-foreground">
                  Permintaan Asset
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
            onClick={() => navigate(`${basePrefix}/inventories/request`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Detail Permintaan</h1>
              {detail && (
                <Badge 
                  variant="default" 
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    detail.status === 2 ? "bg-orange-100 text-orange-800 hover:bg-orange-200" : 
                    detail.status === 3 ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                    "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  )}
                >
                  {detail.request_status_label || statusToLabel(detail.status)}
                </Badge>
              )}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-300">
              Informasi lengkap permintaan asset
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showAddPurchaseOrder && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setPoModalOpen(true)}
              disabled={actionLoading}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Buat Pesanan</span>
            </Button>
          )}
          {showApproveButton && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs sm:text-sm text-white bg-blue-500 hover:text-white hover:bg-blue-600"
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Approve Permintaan</span>
            </Button>
          )}
          {showCompleteButton && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs sm:text-sm text-white bg-emerald-500 hover:text-white hover:bg-emerald-600"
              onClick={() => setCompleteModalOpen(true)}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Selesaikan Pesanan</span>
            </Button>
          )}
          {showApproveReject && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs sm:text-sm bg-white text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction('reject')}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Tolak Permintaan</span>
            </Button>
          )}
        </div>
      </div>

      <div className="block sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-white border-gray-200/70 hover:bg-white"
            onClick={() => navigate(`${basePrefix}/inventories/request`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {detail && (
            <Badge 
              variant="default" 
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                detail.status === 2 ? "bg-orange-100 text-orange-800" : 
                detail.status === 3 ? "bg-green-100 text-green-800" : 
                "bg-blue-100 text-blue-800"
              )}
            >
              {detail.request_status_label || statusToLabel(detail.status)}
            </Badge>
          )}
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Detail Permintaan</h2>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          Informasi lengkap permintaan asset
        </div>
        <div className="mt-3 flex items-center gap-2">
          {showApproveButton && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs text-emerald-600 border-emerald-200 hover:text-emerald-700"
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Approve
            </Button>
          )}
          {showCompleteButton && (
            <Button
              variant="outline"
              className="h-9 rounded-2xl text-xs text-emerald-600 border-emerald-200 hover:text-emerald-700"
              onClick={() => setCompleteModalOpen(true)}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Selesaikan
            </Button>
          )}
          {(showAddPurchaseOrder || showApproveReject) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-2xl">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                {showAddPurchaseOrder && (
                  <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); setPoModalOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    Add Purchase Order
                  </DropdownMenuItem>
                )}
                {showApproveReject && (
                  <DropdownMenuItem className="cursor-pointer gap-2 text-red-600" onSelect={(e) => { e.preventDefault(); handleAction('reject'); }}>
                    <X className="h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] pb-6">
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
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
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Item Yang Diajukan</div>
                      <div className="mt-1 text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">{detail.item_name || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Request ID</div>
                      <div className="mt-1 text-sm md:text-bold text-gray-900 dark:text-white font-mono truncate">{detail.request_id || '-'}</div>
                      {detail.item_sku && (
                        <div className="text-xs text-gray-600 dark:text-white truncate">
                          Item SKU:{' '}
                          <Link
                            to={`${basePrefix}/inventories/items/detail/${encodeURIComponent(detail.item_id)}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {detail.item_sku}
                            <ArrowLeft className="h-3 w-3 rotate-180" />
                          </Link>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Jumlah</div>
                         <div className="mt-1 text-sm md:text-bold text-gray-900 dark:text-white font-semibold">
                         {detail.quantity} <span className="text-muted-foreground font-normal">{detail.item_uom || 'Pcs'}</span>
                         <div className="text-xs text-muted-foreground">Stok tersedia: {detail.stock || ''} <span className="text-muted-foreground font-normal">{detail.item_uom || 'Pcs'}</span></div>
                       </div>
                     </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Kategori</div>
                      <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-semibold">{detail.item_category_label || '-'}</div>
                    </div>
                    {detail.plate_number && (
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Kendaraan</div>
                        <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-semibold">{detail.plate_number} - {detail.vehicle_id}</div>
                      </div>
                    )}
                    <div className="col-span-2">
                      <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Lokasi Garasi</div>
                      <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white font-semibold">{detail.garage_name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{detail.garage_city_label || ''}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Status Block */}
                <div className={cn(
                  "rounded-2xl border p-4",
                  getStatusColorConfig(detail.status).bg,
                  getStatusColorConfig(detail.status).border
                )}>
                  <div className="flex items-start gap-3">
                    <Clock className={cn("h-5 w-5 mt-0.5", getStatusColorConfig(detail.status).iconColor)} />
                    <div>
                      <div className={cn("text-sm font-bold", getStatusColorConfig(detail.status).text)}>
                        {detail.request_status_label || statusToLabel(detail.status)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {detail.status === 2 
                          ? 'Permintaan ini sedang menunggu persetujuan dari atasan.'
                          : detail.status === 3
                          ? 'Permintaan telah disetujui.'
                          : 'Permintaan sedang diproses.'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diajukan Oleh */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Permintaan Dari</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{detail.employee_name || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Tanggal Dibuat */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal Dibuat</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{formatDateTime(detail.created_at)}</div>
                      <div className="text-xs font-normal text-gray-600 dark:text-white truncate">Oleh {detail.created_by || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Transaction ID */}
                {detail.transaction_id && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Copy className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Purchase ID</div>
                      <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white truncate">{detail.transaction_id || '-'}</div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] p-10 text-center text-sm text-gray-500 dark:text-gray-300">
          Data permintaan tidak ditemukan
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-7 rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="p-5 sm:p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 rounded-[28px] border border-gray-200/70 bg-white dark:bg-gray-900 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="p-5 sm:p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      ) : inventoryDetail ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* Persediaan Asset */}
          <Card className="lg:col-span-7 dark:bg-gray-900">
            <CardHeaderWithBadge title="Persediaan Asset" subtitle="Daftar distribusi paket yang dimiliki" badgeIcon={<Box className="h-3.5 w-3.5 sm:h-6 sm:w-6" />} />
            <CardContent className="p-5 sm:p-6">
              <DataTable
                data={inventoryDetail.locations}
                columns={inventoryColumns}
                loading={inventoryLoading}
                tableClassName="table-auto w-full"
                emptyTitle="Tidak ada data lokasi stok"
                emptyDescription="Belum ada garasi yang tercatat untuk item ini."
                pagination={{ enabled: false }}
              />
              {/* Pagination Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Menampilkan {inventoryDetail.locations.length} dari {inventoryDetail.locations.length} data
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white text-xs font-medium">
                    1
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Riwayat Permintaan */}
          <Card className="lg:col-span-3 dark:bg-gray-900">
            <CardHeaderWithBadge title="Riwayat Permintaan" subtitle="Daftar riwayat permintaan untuk item ini" badgeIcon={<Clock className="h-3.5 w-3.5 sm:h-6 sm:w-6 text-purple-600" />} />
            <CardContent className="p-5 sm:p-6">
              <div className="relative">
                {timelineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2",
                        item.is_active 
                          ? "bg-orange-500 border-orange-500" 
                          : "bg-transparent border-gray-300"
                      )} />
                      {index < timelineItems.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                      )}
                    </div>
                    <div className="pb-6">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.status}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {item.displayDate || formatDateTime(item.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Purchase Order Modal */}
      <Dialog open={poModalOpen} onOpenChange={(open) => { setPoModalOpen(open); if (!open) { setSupplierQuery(''); setItemQuery(''); setItemPickerOpen(false); setItems([]); setSelectedItem(null); setPoFormData({ item_price: '', supplier_id: '', supplier_name_manual: '', supplier_phone: '', supplier_url: '', quantity: '' }); } }}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={handlePoSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Tambah Purchase Order</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">Isi detail purchase order untuk {detail?.item_name}</p>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-gray-600 dark:text-white/70">Pilih Item</label>
                  <Popover open={itemPickerOpen} onOpenChange={(open) => { setItemPickerOpen(open); setItemQuery(open ? (selectedItem?.item_name || detail?.item_name || '') : ''); if (!open) setItemQuery(''); }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <span className={selectedItem ? '' : 'text-muted-foreground'}>
                          {selectedItem ? `${selectedItem.item_name} - ${selectedItem.item_sku}` : (detail?.item_name ? `${detail.item_name} - ${detail.item_sku}` : 'Ketik min. 3 karakter untuk cari item')}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                      <Command shouldFilter={false} className="rounded-xl">
                        <CommandInput
                          placeholder="Cari item..."
                          value={itemQuery}
                          onValueChange={(v) => setItemQuery(v)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {itemQuery.trim().length < 3
                              ? 'Ketik minimal 3 karakter untuk mencari item.'
                              : 'Tidak ada hasil.'}
                          </CommandEmpty>
                          <CommandGroup heading="Item">
                            {items.map((opt) => (
                              <CommandItem
                                key={opt.item_id}
                                value={`${opt.item_name} ${opt.item_sku} ${opt.item_id}`}
                                className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                                onSelect={() => {
                                  setSelectedItem(opt);
                                  setItemQuery('');
                                  setItemPickerOpen(false);
                                }}
                              >
                                <Check className={selectedItem?.item_id === opt.item_id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                {opt.item_name} - {opt.item_sku}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Harga Item *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">Rp</span>
                     <Input
                       type="text"
                       inputMode="numeric"
                       value={formatCurrency(poFormData.item_price)}
                       onChange={(e) => setPoFormData((p) => ({ ...p, item_price: e.target.value.replace(/[^0-9]/g, '') }))}
                       placeholder="0"
                       className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 pl-10 w-full"
                       style={{ appearance: 'textfield' }}
                     />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jumlah</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={poFormData.quantity}
                    onChange={(e) => setPoFormData((p) => ({ ...p, quantity: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="0"
                    className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 w-full"
                    style={{ appearance: 'textfield' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Satuan</label>
                   <div className="h-11 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-gray-900 flex items-center">
                     {selectedItem?.item_uom || detail?.item_uom || 'Pcs'}
                   </div>
                </div>

              </div>

              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Informasi Suplier *</label>
                <Popover open={supplierPickerOpen} onOpenChange={(open) => { setSupplierPickerOpen(open); setSupplierQuery(open ? poFormData.supplier_name_manual : ''); if (!open) setSupplierQuery(''); }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <span className={poFormData.supplier_id || poFormData.supplier_name_manual ? '' : 'text-muted-foreground'}>
                        {poFormData.supplier_id ? selectedSupplierName : (poFormData.supplier_name_manual || 'Ketik min. 3 karakter untuk cari suplier')}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                    <Command shouldFilter={false} className="rounded-xl">
                      <CommandInput
                        placeholder="Cari suplier..."
                        value={supplierQuery}
                        onValueChange={(v) => {
                          setSupplierQuery(v);
                          setPoFormData((p) => ({ ...p, supplier_name_manual: v, supplier_id: '' }));
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {supplierQuery.trim().length < 3
                            ? 'Ketik minimal 3 karakter untuk mencari suplier.'
                            : 'Tidak ada hasil.'}
                        </CommandEmpty>
                        {supplierQuery.trim() ? (
                          <CommandGroup heading="Teks">
                            <CommandItem
                              value={`__custom_supplier__:${supplierQuery.trim()}`}
                              className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                              onSelect={() => {
                                const v = supplierQuery.trim();
                                setSupplierQuery('');
                                setPoFormData((p) => ({ ...p, supplier_name_manual: v, supplier_id: '' }));
                                setSupplierPickerOpen(false);
                              }}
                            >
                              Gunakan: {supplierQuery.trim()}
                            </CommandItem>
                          </CommandGroup>
                        ) : null}
                        <CommandGroup heading="Suplier">
                          {supplierOptions.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={`${opt.supplier_name} ${opt.id}`}
                              className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                              onSelect={() => {
                                setPoFormData((p) => ({
                                  ...p,
                                  supplier_id: opt.id,
                                  supplier_name_manual: opt.supplier_name,
                                  supplier_phone: opt.phone || '',
                                  supplier_url: opt.url || ''
                                }));
                                setSupplierQuery('');
                                setSupplierPickerOpen(false);
                              }}
                            >
                              <Check className={poFormData.supplier_id === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                              {opt.supplier_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Nomor Telepon</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">+62</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={poFormData.supplier_phone}
                      onChange={(e) => setPoFormData((p) => ({ ...p, supplier_phone: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="8xxxxxxxxxx"
                      className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 pl-10 w-full"
                      style={{ appearance: 'textfield' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">URL Suplier</label>
                  <Input
                    type="url"
                    value={poFormData.supplier_url}
                    onChange={(e) => setPoFormData((p) => ({ ...p, supplier_url: e.target.value }))}
                    placeholder="https://example.com"
                    className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30"
                  />
                </div>
              </div>

              <div className="w-full rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-2.5 flex items-start gap-2 mt-5">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700">Pastikan data purchase order sudah benar sebelum melanjutkan.</span>
              </div>
            </div>

            <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button type="button" variant="outline" onClick={() => setPoModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
                Batal
              </Button>
              <Button type="submit" disabled={poSaving} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
                {poSaving ? 'Menyimpan...' : 'Proses Pesanan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Order Modal */}
      <Dialog open={completeModalOpen} onOpenChange={(open) => { setCompleteModalOpen(open); if (!open) { setEmployeeQuery(''); setEmployeePickerOpen(false); setEmployeeOptions([]); setSelectedEmployee(null); } }}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Selesaikan Pesanan</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">Pilih karyawan penerima untuk {detail?.item_name}</p>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white/70">Pilih Karyawan Penerima</label>
                <Popover open={employeePickerOpen} onOpenChange={(open) => { setEmployeePickerOpen(open); setEmployeeQuery(open ? '' : ''); if (!open) setEmployeeQuery(''); }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <span className={selectedEmployee ? '' : 'text-muted-foreground'}>
                        {selectedEmployee ? selectedEmployee.fullname : 'Ketik min. 3 karakter untuk cari karyawan'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                    <Command shouldFilter={false} className="rounded-xl">
                    <CommandInput
                      placeholder="Cari karyawan..."
                      value={employeeQuery}
                      onValueChange={(v) => setEmployeeQuery(v)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {employeeQuery.trim().length < 3
                          ? 'Ketik minimal 3 karakter untuk mencari karyawan.'
                          : 'Tidak ada hasil.'}
                      </CommandEmpty>
                      <CommandGroup heading="Karyawan">
                        {employeeOptions.map((opt) => (
                          <CommandItem
                            key={opt.uuid}
                            value={opt.fullname}
                            className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                            onSelect={() => {
                              setSelectedEmployee(opt);
                              setEmployeeQuery('');
                              setEmployeePickerOpen(false);
                            }}
                          >
                            <Check className={selectedEmployee?.uuid === opt.uuid ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                            {opt.fullname}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button type="button" variant="outline" onClick={() => setCompleteModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
              Batal
            </Button>
            <Button type="submit" disabled={completeSaving || !selectedEmployee} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
              {completeSaving ? 'Menyimpan...' : 'Selesaikan Pesanan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
   </div>
  );
};
