import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Download, FileSpreadsheet, RotateCcw, Sheet, Check, X, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';
import * as XLSX from 'xlsx';
import moment from 'moment';

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

type ItemOption = {
  id: string;
  item_name: string;
};

type GarageOption = {
  id: string;
  garage_name: string;
};

type InventoryRequest = {
  id: string | number;
  request_id: string;
  item_name: string;
  item_sku: string;
  item_category: number;
  garage_name: string;
  quantity: number;
  item_uom: string;
  employee_name: string;
  status: number;
  order_status: number;
};

const categoryToLabel = (category: number): string => {
  if (category === 1) return 'Kebutuhan Armada';
  if (category === 2) return 'Kebutuhan Umum';
  return '-';
};

const statusToLabel = (status: number, order_status?: number): string => {
  if (status === 1 && (order_status === 0 || order_status === 1)) return 'Telah Diterima';
  if (status === 3 && order_status === 1) return 'Belum Diserahkan';
  if (status === 3 && order_status === 2) return 'Proses Pemesanan';
  if (status === 1) return 'Sedang Diproses';
  if (status === 2) return 'Menunggu Persetujuan';
  if (status === 3) return 'Disetujui';
  return '-';
};

const statusToBadgeClass = (status: number, order_status?: number): string => {
  if (status === 1 && (order_status === 0 || order_status === 1)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 3 && order_status === 1) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 3 && order_status === 2) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 1) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 2) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 3) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const unitOptions = ['Pcs', 'Box', 'Unit', 'Liter', 'Kilogram'] as const;

type CreateFormData = {
  item_id: string;
  item_name_manual: string;
  garage_id: string;
  quantity: string;
  item_uom: string;
  item_category: string;
  notes: string;
  unit_id: string;
  employee_id: string;
};

export const InventoryRequest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>({
    item_id: '',
    item_name_manual: '',
    garage_id: '',
    quantity: '',
    item_uom: 'Pcs',
    item_category: '1',
    notes: '',
    unit_id: '',
    employee_id: '',
  });
const [errors, setErrors] = useState<Record<string, string>>({});

   const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  const [garageOptions, setGarageOptions] = useState<GarageOption[]>([]);
  const [garagePickerOpen, setGaragePickerOpen] = useState(false);
  const [garageQuery, setGarageQuery] = useState('');

  const [fleetOptions, setFleetOptions] = useState<{ unit_id: string; vehicle_id: string; plate_number: string; fleet_name: string }[]>([]);
  const [fleetPickerOpen, setFleetPickerOpen] = useState(false);
  const [fleetQuery, setFleetQuery] = useState('');

  const [employeeOptions, setEmployeeOptions] = useState<{ uuid: string; fullname: string }[]>([]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);

      const res = await api.get<unknown>(`/inventories/request/list?${query.toString()}`, token ? { Authorization: token } : undefined);

      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object'
            ? Array.isArray((payload as Record<string, unknown>).items)
              ? ((payload as Record<string, unknown>).items as unknown[])
              : []
            : [];

        const mapped = list.map((raw, i) => {
          const obj = record(raw);
          const idRaw = obj.request_id ?? obj.id;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
          const request_id = typeof obj.request_id === 'string' ? obj.request_id : String(idRaw ?? '');
          const item_name = typeof obj.item_name === 'string' ? obj.item_name : '';
          const item_sku = typeof obj.item_sku === 'string' ? obj.item_sku : '';
          const item_category = typeof obj.item_category === 'number' ? obj.item_category : 0;
          const garage_name = typeof obj.garage_name === 'string' ? obj.garage_name : '';
          const quantity = typeof obj.quantity === 'number' ? obj.quantity : 0;
          const item_uom = typeof obj.item_uom === 'string' ? obj.item_uom : '';
          const employee_name = typeof obj.employee_name === 'string' ? obj.employee_name : '';
          const status = typeof obj.status === 'number' ? obj.status : 0;
          const order_status = typeof obj.order_status === 'number' ? obj.order_status : 0;
          return { id, request_id, item_name, item_sku, item_category, garage_name, quantity, item_uom, employee_name, status, order_status };
        });
        setRequests(mapped);
        if (Array.isArray(payload)) {
          setTotalCount(mapped.length);
        } else if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
        }
      } else {
        setRequests([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (createModalOpen) {
      const loadOptions = async () => {
        const token = localStorage.getItem('token') ?? '';
        const garagesRes = await api.get<unknown>('/organization/garage/list', token ? { Authorization: token } : undefined);

        if (garagesRes.status === 'success') {
          const payload = garagesRes.data as unknown;
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
              const idRaw = it.garage_id ?? it.id;
              const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
              const garage_name = typeof it.garage_name === 'string' ? it.garage_name : '';
              return id && garage_name ? { id, garage_name } : null;
            })
            .filter((x): x is GarageOption => x !== null);
          setGarageOptions(mapped);
        }
      };
      loadOptions();
    }
  }, [createModalOpen]);

  useEffect(() => {
    if (createModalOpen && formData.item_category) {
      const loadItemsByCategory = async () => {
        const token = localStorage.getItem('token') ?? '';
        const query = new URLSearchParams();
        query.set('item_category', formData.item_category);
        const itemsRes = await api.get<unknown>(
          `/inventories/items?${query.toString()}`,
          token ? { Authorization: token } : undefined
        );

        if (itemsRes.status === 'success') {
          const raw = Array.isArray(itemsRes.data) ? itemsRes.data : [];
          const mapped = raw
            .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
            .map((it) => {
              const idRaw = it.item_id ?? it.id;
              const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
              const item_name = typeof it.item_name === 'string' ? it.item_name : '';
              return id && item_name ? { id, item_name } : null;
            })
            .filter((x): x is ItemOption => x !== null);
          setItemOptions(mapped);
        }
      };
      loadItemsByCategory();
    }
  }, [createModalOpen, formData.item_category]);

  useEffect(() => {
    if (createModalOpen && formData.item_category === '1') {
      const loadFleetUnits = async () => {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/fleet-units', token ? { Authorization: token } : undefined);

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
              const unit_id = typeof it.unit_id === 'string' || typeof it.unit_id === 'number' ? String(it.unit_id) : '';
              const vehicle_id = typeof it.vehicle_id === 'string' ? it.vehicle_id : '';
              const plate_number = typeof it.plate_number === 'string' ? it.plate_number : '';
              const fleet_name = typeof it.fleet_name === 'string' ? it.fleet_name : '';
              return unit_id && vehicle_id && plate_number && fleet_name ? { unit_id, vehicle_id, plate_number, fleet_name } : null;
            })
            .filter((x): x is { unit_id: string; vehicle_id: string; plate_number: string; fleet_name: string } => x !== null);
          setFleetOptions(mapped);
        }
      };
      loadFleetUnits();
    }
  }, [createModalOpen, formData.item_category]);

  useEffect(() => {
    if (createModalOpen) {
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
            .filter((x): x is { uuid: string; fullname: string } => x !== null);
          setEmployeeOptions(mapped);
        }
      };
      loadEmployees();
    }
  }, [createModalOpen]);

  useEffect(() => {
    if (formData.item_id) {
      const fetchItemDetail = async () => {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.post<unknown>(
          '/inventories/items/detail',
          { item_id: formData.item_id },
          token ? { Authorization: token } : undefined
        );
        if (res.status === 'success') {
          const payload = res.data as unknown;
          const obj = toRecord(payload);
          const item_uom = typeof obj.item_uom === 'string' ? obj.item_uom : '';
          if (item_uom) {
            setFormData((p) => ({ ...p, item_uom }));
          }
        }
      };
      void fetchItemDetail();
    }
  }, [formData.item_id]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const exportRows = useMemo(() => {
    return requests.map((row, index) => ({
      No: startIndex + index + 1,
      'Request ID': row.request_id || '-',
      'Nama Item': row.item_name || '-',
      SKU: row.item_sku || '-',
      Kategori: categoryToLabel(row.item_category),
      Garasi: row.garage_name || '-',
      Jumlah: row.quantity ?? 0,
      Satuan: row.item_uom || '',
      User: row.employee_name || '-',
       Status: statusToLabel(row.status, row.order_status),
    }));
  }, [startIndex, requests]);

  const downloadExcel = () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Requests');
    XLSX.writeFile(workbook, `inventory-requests-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk disalin.', type: 'warning' });
      return;
    }
    const headers = ['No', 'Request ID', 'Nama Item', 'SKU', 'Kategori', 'Garasi', 'Jumlah', 'Satuan', 'User', 'Status'];
    const rowsTsv = exportRows.map((row) => [row.No, row['Request ID'], row['Nama Item'], row.SKU, row.Kategori, row.Garasi, row.Jumlah, row.Satuan, row.User, row.Status]);
    const tsv = [headers, ...rowsTsv]
      .map((cols) => cols.map((value) => String(value ?? '').replace(/\t/g, ' ')).join('\t'))
      .join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({ title: 'Berhasil', description: 'Data disalin ke clipboard. Tempel di Google Sheet.', type: 'success' });
    } catch {
      showAlert({ title: 'Gagal', description: 'Tidak dapat menyalin data.', type: 'error' });
    }
  };

  const columns: Array<DataTableColumn<InventoryRequest>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'Request ID',
      key: 'request_id',
      sortable: true,
      width: 140,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`${basePrefix}/inventories/request/detail/${encodeURIComponent(String(row.request_id))}`)}
          className="text-blue-950 hover:text-blue-700 text-sm font-semibold"
        >
          {row.request_id || '-'}
        </button>
      )
    },
    {
      label: 'Nama Item',
      key: 'item_name',
      sortable: true,
      width: 280,
      render: (row) => (
        <div className="min-w-0">
          <div className="text-foreground truncate">{row.item_name || '-'}</div>
          {row.item_sku && <div className="text-xs text-muted-foreground">SKU: {row.item_sku}</div>}
        </div>
      )
    },
    {
      label: 'Kategori',
      key: 'item_category',
      sortable: true,
      width: 160,
      render: (row) => <span className="text-foreground">{categoryToLabel(row.item_category)}</span>
    },
    { label: 'Garasi', key: 'garage_name', sortable: true, width: 200, render: (row) => <span className="text-foreground">{row.garage_name || '-'}</span> },
    {
      label: 'Qty',
      key: 'quantity',
      sortable: true,
      width: 80,
      align: 'right',
      render: (row) => <span className="text-foreground">{row.quantity} {row.item_uom || ''}</span>
    },
    { label: 'User', key: 'employee_name', sortable: true, width: 220, render: (row) => <span className="text-foreground">{row.employee_name || '-'}</span> },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      width: 160,
      render: (row) => (
        <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${statusToBadgeClass(row.status, row.order_status)}`}>
          {statusToLabel(row.status, row.order_status)}
        </span>
      )
    },
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalItems = totalCount;

  const filteredItems = useMemo(() => {
    if (!itemQuery) return itemOptions;
    return itemOptions.filter((o) => o.item_name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [itemOptions, itemQuery]);

  const selectedItemName = useMemo(() => {
    const found = itemOptions.find((o) => o.id === formData.item_id);
    return found?.item_name ?? '';
  }, [itemOptions, formData.item_id]);

  const filteredGarages = useMemo(() => {
    if (!garageQuery) return garageOptions;
    return garageOptions.filter((o) => o.garage_name.toLowerCase().includes(garageQuery.toLowerCase()));
  }, [garageOptions, garageQuery]);

  const selectedGarageName = useMemo(() => {
    const found = garageOptions.find((o) => o.id === formData.garage_id);
    return found?.garage_name ?? '';
  }, [garageOptions, formData.garage_id]);

  const filteredFleets = useMemo(() => {
    if (!fleetQuery) return fleetOptions;
    return fleetOptions.filter((o) => {
      const label = `${o.vehicle_id} - ${o.plate_number} - ${o.fleet_name}`.toLowerCase();
      return label.includes(fleetQuery.toLowerCase());
    });
  }, [fleetOptions, fleetQuery]);

  const selectedFleetLabel = useMemo(() => {
    const found = fleetOptions.find((o) => o.unit_id === formData.unit_id);
    return found ? `${found.vehicle_id} - ${found.plate_number} - ${found.fleet_name}` : '';
  }, [fleetOptions, formData.unit_id]);

  const filteredEmployees = useMemo(() => {
    if (!employeeQuery) return employeeOptions;
    return employeeOptions.filter((o) => o.fullname.toLowerCase().includes(employeeQuery.toLowerCase()));
  }, [employeeOptions, employeeQuery]);

  const selectedEmployeeName = useMemo(() => {
    const found = employeeOptions.find((o) => o.uuid === formData.employee_id);
    return found?.fullname ?? '';
  }, [employeeOptions, formData.employee_id]);

  const validate = () => {
    const next: Record<string, string> = {};
    // if (!formData.item_id && !formData.item_name_manual.trim()) {
    //   next.item_id = 'Item harus dipilih atau ditulis manual';
    // }
    if (!formData.garage_id) {
      next.garage_id = 'Garasi wajib dipilih';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      next.quantity = 'Jumlah item harus berupa angka > 0';
    }
    if (!formData.item_uom) {
      next.item_uom = 'Satuan wajib dipilih';
    }
    if (formData.item_category === '1' && !formData.unit_id) {
      next.unit_id = 'Armada wajib dipilih';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) {
      showAlert({ title: 'Validasi', description: 'Periksa kembali field yang wajib diisi.', type: 'warning' });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    try {
      const payload: Record<string, unknown> = {
        item_category: Number(formData.item_category),
        quantity: Number(formData.quantity),
        item_uom: formData.item_uom,
        notes: formData.notes.trim(),
      };
      if (formData.item_id) {
        payload.item_id = formData.item_id;
      } else {
        payload.item_name = formData.item_name_manual.trim();
      }
      if (formData.garage_id) {
        payload.garage_id = formData.garage_id;
      }
      if (formData.item_category === '1' && formData.unit_id) {
        payload.unit_id = formData.unit_id;
      }
      if (formData.employee_id) {
        payload.employee_id = formData.employee_id;
      }

      const res = await api.post<unknown>(
        '/inventories/request/create',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        showAlert({ title: 'Berhasil', description: 'Permintaan asset berhasil ditambahkan.', type: 'success' });
        setCreateModalOpen(false);
        setFormData({
          item_id: '',
          item_name_manual: '',
          garage_id: '',
          quantity: '',
          item_uom: 'Pcs',
          item_category: '1',
          notes: '',
          unit_id: '',
          employee_id: '',
        });
        setErrors({});
        setLoading(true);
        const query = new URLSearchParams();
        query.set('page', String(1));
        query.set('limit', String(itemsPerPage));
        if (searchTerm) query.set('search', searchTerm);
        const reload = await api.get<unknown>(`/inventories/request/list?${query.toString()}`, token ? { Authorization: token } : undefined);
        if (reload.status === 'success') {
          const record = (v: unknown): Record<string, unknown> =>
            v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
          const payload = reload.data as unknown;
          const list: unknown[] = Array.isArray(payload)
            ? payload
            : payload && typeof payload === 'object'
              ? Array.isArray((payload as Record<string, unknown>).items)
                ? ((payload as Record<string, unknown>).items as unknown[])
                : []
              : [];
          const mapped = list.map((raw, i) => {
            const obj = record(raw);
            const idRaw = obj.request_id ?? obj.id;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
            const request_id = typeof obj.request_id === 'string' ? obj.request_id : String(idRaw ?? '');
            const item_name = typeof obj.item_name === 'string' ? obj.item_name : '';
            const item_sku = typeof obj.item_sku === 'string' ? obj.item_sku : '';
            const item_category = typeof obj.item_category === 'number' ? obj.item_category : 0;
            const garage_name = typeof obj.garage_name === 'string' ? obj.garage_name : '';
            const quantity = typeof obj.quantity === 'number' ? obj.quantity : 0;
            const item_uom = typeof obj.item_uom === 'string' ? obj.item_uom : '';
            const employee_name = typeof obj.employee_name === 'string' ? obj.employee_name : '';
            const status = typeof obj.status === 'number' ? obj.status : 0;
            const order_status = typeof obj.order_status === 'number' ? obj.order_status : 0;
            return { id, request_id, item_name, item_sku, item_category, garage_name, quantity, item_uom, employee_name, status, order_status };
          });
          setRequests(mapped);
          if (Array.isArray(payload)) {
            setTotalCount(mapped.length);
          } else if (payload && typeof payload === 'object') {
            const obj = payload as Record<string, unknown>;
            setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
          }
          setCurrentPage(1);
        }
        setLoading(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Permintaan Asset</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola permintaan asset organisasi Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Permintaan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                aria-label="Aksi"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl">
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); downloadExcel(); }}>
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Download Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); void copyToGoogleSheet(); }}>
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari permintaan..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="h-11 rounded-2xl pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          disabled={!searchTerm && currentPage === 1}
          className="h-11 rounded-2xl"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full"
        emptyTitle="Tidak ada data permintaan"
        emptyDescription="Coba ubah pencarian."
        // actions={{
        //   label: 'Aksi',
        //   actions: [
        //     {
        //       key: 'detail',
        //       label: 'Detail',
        //       icon: Eye,
        //       onSelect: (row) => navigate(`${basePrefix}/inventories/request/detail/${encodeURIComponent(String(row.id))}`)
        //     },
        //     {
        //       key: 'edit',
        //       label: 'Edit',
        //       icon: Edit,
        //       onSelect: (row) => navigate(`${basePrefix}/inventories/request/edit/${encodeURIComponent(String(row.id))}`)
        //     },
        //     {
        //       key: 'approve',
        //       label: 'Approve',
        //       icon: Check,
        //       onSelect: (row) => navigate(`${basePrefix}/inventories/request/detail/${encodeURIComponent(String(row.request_id))}`)
        //     }
        //   ]
        // }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => { setItemsPerPage(n); setCurrentPage(1); },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'item_name', direction: 'asc' } }}
        rowKey={(row) => row.id}
      />

      <Button
        onClick={() => setCreateModalOpen(true)}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Permintaan"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={createModalOpen} onOpenChange={(open) => {
        setCreateModalOpen(open);
        if (!open) {
          setErrors({});
        setFormData({
          item_id: '',
          item_name_manual: '',
          garage_id: '',
          quantity: '',
          item_uom: 'Pcs',
          item_category: '1',
          notes: '',
          unit_id: '',
          employee_id: '',
        });
        }
      }}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Tambah Permintaan</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Buat permintaan asset baru
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>

              <div className="h-px bg-slate-100 my-4" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Kategori Item *</label>
                  <RadioGroup value={formData.item_category} onValueChange={(v) => {
                    setFormData((p) => ({ ...p, item_category: v, item_id: '', item_name_manual: '', unit_id: '', employee_id: '' }));
                    setItemQuery('');
                    setFleetQuery('');
                    setEmployeeQuery('');
                  }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.item_category === '1' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                      <RadioGroupItem value="1" id="req-category-1" className="mt-0.5 border-blue-300" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">Kebutuhan Armada</div>
                        <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan operasional armada.</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.item_category === '2' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                      <RadioGroupItem value="2" id="req-category-2" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">Kebutuhan Umum</div>
                        <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan umum / kantor.</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {formData.item_category === '1' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70">Pilih Armada </label>
                    <Popover open={fleetPickerOpen} onOpenChange={(open) => {
                      setFleetPickerOpen(open);
                      setFleetQuery(open ? '' : '');
                      if (!open) {
                        setFleetQuery('');
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50 ${errors.unit_id ? 'border-red-500' : ''}`}
                        >
                          <span className={formData.unit_id ? '' : 'text-muted-foreground'}>
                            {formData.unit_id ? selectedFleetLabel : 'Pilih armada'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                        <Command shouldFilter={false} className="rounded-xl">
                          <CommandInput
                            placeholder="Cari armada..."
                            value={fleetQuery}
                            onValueChange={setFleetQuery}
                          />
                          <CommandList>
                            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                            <CommandGroup>
                              {filteredFleets.map((opt) => (
                                <CommandItem
                                  key={opt.unit_id}
                                  value={`${opt.vehicle_id} ${opt.plate_number} ${opt.fleet_name}`}
                                  className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                                  onSelect={() => {
                                    setFormData((p) => ({ ...p, unit_id: opt.unit_id }));
                                    setFleetQuery('');
                                    setFleetPickerOpen(false);
                                    const errKey = 'unit_id';
                                    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                                  }}
                                >
                                  <Check className={formData.unit_id === opt.unit_id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                  {opt.vehicle_id} - {opt.plate_number} - {opt.fleet_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.unit_id && <p className="text-sm text-red-500">{errors.unit_id}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Pilih Karyawan</label>
                  <Popover open={employeePickerOpen} onOpenChange={(open) => {
                    setEmployeePickerOpen(open);
                    setEmployeeQuery(open ? '' : '');
                    if (!open) {
                      setEmployeeQuery('');
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50 ${errors.employee_id ? 'border-red-500' : ''}`}
                      >
                        <span className={formData.employee_id ? '' : 'text-muted-foreground'}>
                          {formData.employee_id ? selectedEmployeeName : 'Pilih karyawan'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                      <Command shouldFilter={false} className="rounded-xl">
                        <CommandInput
                          placeholder="Cari karyawan..."
                          value={employeeQuery}
                          onValueChange={setEmployeeQuery}
                        />
                        <CommandList>
                          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                          <CommandGroup>
                            {filteredEmployees.map((opt) => (
                              <CommandItem
                                key={opt.uuid}
                                value={opt.fullname}
                                className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                                onSelect={() => {
                                  setFormData((p) => ({ ...p, employee_id: opt.uuid }));
                                  setEmployeeQuery('');
                                  setEmployeePickerOpen(false);
                                  const errKey = 'employee_id';
                                  if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                                }}
                              >
                                <Check className={formData.employee_id === opt.uuid ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                {opt.fullname}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Pilih Garasi *</label>
                  <Popover open={garagePickerOpen} onOpenChange={setGaragePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50 ${errors.garage_id ? 'border-red-500' : ''}`}
                      >
                        <span className={formData.garage_id ? '' : 'text-muted-foreground'}>
                          {formData.garage_id ? selectedGarageName : 'Pilih garasi'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Cari garasi..."
                          value={garageQuery}
                          onValueChange={setGarageQuery}
                        />
                        <CommandList>
                          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                          <CommandGroup>
                            {filteredGarages.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.garage_name}
                                onSelect={() => {
                                  setFormData((p) => ({ ...p, garage_id: opt.id }));
                                  setGaragePickerOpen(false);
                                }}
                              >
                                <Check className={formData.garage_id === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                {opt.garage_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.garage_id && <p className="text-sm text-red-500">{errors.garage_id}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Nama Item *</label>
                  <Popover open={itemPickerOpen} onOpenChange={(open) => {
                    setItemPickerOpen(open);
                    setItemQuery(open ? formData.item_name_manual : '');
                    if (!open) {
                      setItemQuery('');
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between h-11 rounded-2xl border-gray-300 bg-white hover:bg-gray-50 ${errors.item_id ? 'border-red-500' : ''}`}
                      >
                        <span className={formData.item_id || formData.item_name_manual ? '' : 'text-muted-foreground'}>
                          {formData.item_id ? selectedItemName : (formData.item_name_manual || 'Ketik min. 3 karakter untuk cari item')}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl" align="start">
                      <Command shouldFilter={false} className="rounded-xl">
                        <CommandInput
                          placeholder="Cari item..."
                          value={itemQuery}
                          onValueChange={(v) => {
                            setItemQuery(v);
                            setFormData((p) => ({ ...p, item_name_manual: v, item_id: '' }));
                            const errKey = 'item_id';
                            if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {itemQuery.trim().length < 3
                              ? 'Ketik minimal 3 karakter untuk mencari item.'
                              : 'Tidak ada hasil.'}
                          </CommandEmpty>
                          {itemQuery.trim() ? (
                            <CommandGroup heading="Teks">
                              <CommandItem
                                value={`__custom__:${itemQuery.trim()}`}
                                className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                                onSelect={() => {
                                  const v = itemQuery.trim();
                                  setItemQuery('');
                                  setFormData((p) => ({ ...p, item_name_manual: v, item_id: '' }));
                                  setItemPickerOpen(false);
                                  const errKey = 'item_id';
                                  if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                                }}
                              >
                                Gunakan: {itemQuery.trim()}
                              </CommandItem>
                            </CommandGroup>
                          ) : null}
                          <CommandGroup heading="Item">
                            {filteredItems.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={`${opt.item_name} ${opt.id}`}
                                className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-800"
                                onSelect={() => {
                                  setFormData((p) => ({
                                    ...p,
                                    item_id: opt.id,
                                    item_name_manual: '',
                                  }));
                                  setItemQuery('');
                                  setItemPickerOpen(false);
                                  const errKey = 'item_id';
                                  if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                                }}
                              >
                                <Check className={formData.item_id === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                                {opt.item_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jumlah Item *</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.quantity}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="0"
                    className={`h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 ${errors.quantity ? 'border-red-500' : ''}`}
                    style={{ appearance: 'textfield' }}
                  />
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Satuan *</label>
                  <Select value={formData.item_uom} onValueChange={(v) => setFormData((p) => ({ ...p, item_uom: v }))}>
                    <SelectTrigger className={`h-11 rounded-2xl border-gray-300 bg-white ${errors.item_uom ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.item_uom && <p className="text-sm text-red-500">{errors.item_uom}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Catatan</label>
                  <Input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Tambahkan catatan..."
                    className="h-11 rounded-2xl border-gray-300 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
                {saving ? 'Mengajukan...' : 'Ajukan Permintaan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};