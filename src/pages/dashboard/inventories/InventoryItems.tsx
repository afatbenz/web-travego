import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Download, FileSpreadsheet, RotateCcw, Sheet, X, ChevronsUpDown, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import Swal from 'sweetalert2';

type InventoryItem = {
  id: string | number;
  item_name: string;
  item_uom: string;
  garage_names: string;
  item_category: number;
  total_stock: number;
  item_sku: string;
};

type ItemOption = {
  id: string;
  item_name: string;
  item_uom: string;
};

type ItemFormData = {
  item_id: string;
  item_name_manual: string;
  stock: string;
  item_uom: string;
  item_category: string;
  garage_id: string;
  update_action: string;
};

type GarageOption = {
  id: string;
  garage_name: string;
};

const categoryToLabel = (category: number): string => {
  if (category === 1) return 'Persediaan Asset Armada';
  if (category === 2) return 'Persediaan Asset Kantor';
  return '-';
};

export const InventoryItems: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>({
    item_id: '',
    item_name_manual: '',
    stock: '',
    item_uom: '',
    item_category: '1',
    garage_id: '',
    update_action: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [garageOptions, setGarageOptions] = useState<GarageOption[]>([]);
  const [garagePickerOpen, setGaragePickerOpen] = useState(false);
  const [garageQuery, setGarageQuery] = useState('');

  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);

      const res = await api.get<unknown>(`/inventories/items?${query.toString()}`, token ? { Authorization: token } : undefined);

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
            const idRaw = obj.item_id ?? obj.id;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
            const item_name = typeof obj.item_name === 'string' ? obj.item_name : '';
            const item_uom = typeof obj.item_uom === 'string' ? obj.item_uom : '';
            const garage_names = typeof obj.garage_names === 'string' ? obj.garage_names : '';
            const item_category = typeof obj.item_category === 'number' ? obj.item_category : 0;
            const total_stock = typeof obj.total_stock === 'number' ? obj.total_stock : 0;
            const item_sku = typeof obj.item_sku === 'string' ? obj.item_sku : '';
            return { id, item_name, item_uom, garage_names, item_category, total_stock, item_sku };
          });
          setItems(mapped);
        if (Array.isArray(payload)) {
          setTotalCount(mapped.length);
        } else if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
        }
      } else {
        setItems([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    const loadOptions = async () => {
      const token = localStorage.getItem('token') ?? '';
      const [itemsRes, garagesRes] = await Promise.all([
        api.get<unknown>(`/inventories/items`, token ? { Authorization: token } : undefined),
        api.get<unknown>('/organization/garage/list', token ? { Authorization: token } : undefined),
      ]);

      if (itemsRes.status === 'success') {
        const raw = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const mapped = raw
          .filter((it): it is Record<string, unknown> => it && typeof it === 'object')
          .map((it) => {
            const idRaw = it.item_id ?? it.id;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
            const item_name = typeof it.item_name === 'string' ? it.item_name : '';
            const item_uom = typeof it.item_uom === 'string' ? it.item_uom : '';
            return id && item_name ? { id, item_name, item_uom } : null;
          })
          .filter((x): x is ItemOption => x !== null);
        setItemOptions(mapped);
      }

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
    if (createModalOpen) {
      loadOptions();
    }
  }, [createModalOpen]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const exportRows = useMemo(() => {
    return items.map((row, index) => ({
      No: startIndex + index + 1,
      'No SKU': row.item_sku || '-',
      'Nama Item': row.item_name || '-',
      Satuan: row.item_uom || '-',
      Kategori: categoryToLabel(row.item_category),
      Stok: row.total_stock ?? 0,
      Garage: row.garage_names
    }));
  }, [startIndex, items]);

  const downloadExcel = () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Items');
    XLSX.writeFile(workbook, `inventory-items-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk disalin.', type: 'warning' });
      return;
    }
    const headers = ['No', 'No SKU', 'Nama Item', 'Stok', 'Satuan', 'Kategori', 'Garasi'];
    const rowsTsv = exportRows.map((row) => [row.No, row['No SKU'], row['Nama Item'], row.Stok, row.Satuan, row.Kategori, row.Garage]);
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

  const columns: Array<DataTableColumn<InventoryItem>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'No SKU',
      key: 'item_sku',
      sortable: true,
      width: 120,
      render: (item) => <span className="text-foreground">{item.item_sku || '-'}</span>
    },
    {
      label: 'Nama Item',
      key: 'item_name',
      sortable: true,
      width: 240,
      render: (item) => (
        <Link
          to={`${basePrefix}/inventories/items/detail/${encodeURIComponent(String(item.id))}`}
          className="font-medium text-blue-600 hover:no-underline hover:text-bold dark:text-blue-400"
        >
          {item.item_name || '-'}
        </Link>
      )
    },
    { label: 'Stok', key: 'total_stock', sortable: true, width: 120, render: (item) => <span className="text-foreground">{item.total_stock} {item.item_uom || 'Pcs'}</span> },
    {
      label: 'Kategori',
      key: 'item_category',
      sortable: true,
      width: 150,
      render: (item) => <span className="text-foreground">{categoryToLabel(item.item_category)}</span>
    },
    { label: 'Lokasi', key: 'garage_names', sortable: true, width: 250, render: (item) => <span className="text-foreground">{item.garage_names || '-'}</span> },
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalItems = totalCount;

  const filteredGarages = useMemo(() => {
    if (!garageQuery) return garageOptions;
    return garageOptions.filter((o) => o.garage_name.toLowerCase().includes(garageQuery.toLowerCase()));
  }, [garageOptions, garageQuery]);

  const selectedGarageName = useMemo(() => {
    const found = garageOptions.find((o) => o.id === formData.garage_id);
    return found?.garage_name ?? '';
  }, [garageOptions, formData.garage_id]);

  const filteredItems = useMemo(() => {
    if (!itemQuery) return itemOptions;
    return itemOptions.filter((o) => o.item_name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [itemOptions, itemQuery]);

  const selectedItemName = useMemo(() => {
    const found = itemOptions.find((o) => o.id === formData.item_id);
    return found?.item_name ?? '';
  }, [itemOptions, formData.item_id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.item_id && !formData.item_name_manual.trim()) {
      next.item_id = 'Item harus dipilih atau ditulis manual';
    }
    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) next.stock = 'Stok harus berupa angka >= 0';
    if (!formData.garage_id) next.garage_id = 'Garasi wajib dipilih';
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
          stock: Number(formData.stock),
          garage_id: formData.garage_id,
          item_category: Number(formData.item_category),
        };
if (formData.item_id) {
          payload.item_id = formData.item_id;
          payload.movement_type = formData.update_action;
        } else {
         payload.item_name = formData.item_name_manual.trim();
         payload.item_uom = formData.item_uom;
       }

      const res = await api.post<unknown>(
        '/inventories/items/create',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Asset berhasil ditambahkan.' });
        setCreateModalOpen(false);
        setFormData({ item_id: '', item_name_manual: '', stock: '', item_uom: '', item_category: '1', garage_id: '', update_action: '' });
        setLoading(true);
        const query = new URLSearchParams();
        query.set('page', String(1));
        query.set('limit', String(itemsPerPage));
        const reload = await api.get<unknown>(`/inventories/items?${query.toString()}`, token ? { Authorization: token } : undefined);
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
              const idRaw = obj.item_id ?? obj.id;
              const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
              const item_name = typeof obj.item_name === 'string' ? obj.item_name : '';
              const item_uom = typeof obj.item_uom === 'string' ? obj.item_uom : '';
              const garage_names = typeof obj.garage_names === 'string' ? obj.garage_names : '';
              const item_category = typeof obj.item_category === 'number' ? obj.item_category : 0;
              const total_stock = typeof obj.total_stock === 'number' ? obj.total_stock : 0;
              const item_sku = typeof obj.item_sku === 'string' ? obj.item_sku : '';
              return { id, item_name, item_uom, garage_names, item_category, total_stock, item_sku };
            });
           setItems(mapped);
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Asset Tersedia</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola asset yang tersedia di organisasi Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Asset
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
            placeholder="Cari nama item..."
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
        data={items}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full"
        emptyTitle="Tidak ada data asset"
        emptyDescription="Coba ubah pencarian."
        actions={{
          label: 'Aksi',
          actions: [
            {
              key: 'edit',
              label: 'Edit',
              icon: Edit,
              onSelect: (row) => navigate(`${basePrefix}/inventories/items/edit/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: () => void 0
            }
          ]
        }}
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
        title="Tambah Asset"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Tambah Asset</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Tambahkan asset baru ke inventaris
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400">
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>

              <div className="h-px bg-slate-100" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Nama Item / Asset *</label>
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
                                   setFormData((p) => ({ ...p, item_id: opt.id, item_name_manual: '', item_uom: opt.item_uom || '' }));
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
                  <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jenis Asset *</label>
                  <RadioGroup value={formData.item_category} onValueChange={(v) => setFormData((p) => ({ ...p, item_category: v }))} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.item_category === '1' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                      <RadioGroupItem value="1" id="category-1" className="mt-0.5 border-blue-300" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">Kebutuhan Armada</div>
                        <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan operasional armada.</div>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.item_category === '2' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                      <RadioGroupItem value="2" id="category-2" className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">Kebutuhan Umum</div>
                        <div className="mt-1 text-xs text-gray-600">Asset yang digunakan untuk kebutuhan umum / kantor.</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {formData.item_id && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jenis Perubahan *</label>
                    <RadioGroup value={formData.update_action} onValueChange={(v) => setFormData((p) => ({ ...p, update_action: v }))} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.update_action === '1' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                        <RadioGroupItem value="1" id="action-1" className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">Tambah Stock</div>
                          <div className="mt-1 text-xs text-gray-600">Tambahkan stok baru ke inventaris.</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 rounded-[22px] border p-4 cursor-pointer transition-all ${formData.update_action === '2' ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 bg-white'}`}>
                        <RadioGroupItem value="3" id="action-3" className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">Update Stock</div>
                          <div className="mt-1 text-xs text-gray-600">Atur ulang jumlah stok yang sudah ada.</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2 md:col-span-2">
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/70">Stok *</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min={0}
                          value={formData.stock}
                          onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value.replace(/[^0-9]/g, '') }))}
                          placeholder="0"
                          className={`h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 ${errors.stock ? 'border-red-500' : ''}`}
                          style={{ appearance: 'textfield' }}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          value={formData.item_uom}
                          onChange={(e) => setFormData((p) => ({ ...p, item_uom: e.target.value }))}
                          placeholder="Satuan"
                          className="h-11 rounded-2xl border-gray-300 bg-white focus-visible:ring-[#4F6BFF]/30 text-sm text-center px-2"
                        />
                      </div>
                    </div>
                    {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
                  </div>
                </div>

                <div className="w-full rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-2.5 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700">Pastikan data asset sudah benar sebelum melanjutkan.</span>
                </div>
              </div>
            </div>

            <div className="w-full px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full md:w-auto h-11 rounded-2xl">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="w-full md:w-auto h-11 rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white">
                {saving ? 'Menyimpan...' : 'Lanjutkan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};