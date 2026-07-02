import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContentScrollable
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { showAlert } from '@/hooks/use-alert';
import { cn } from '@/lib/utils';

type GarageRow = {
  garage_id: string;
  garage_name: string;
  garage_address: string;
  garage_city: string;
  garage_city_label: string;
};

type CityOption = {
  id: string;
  label: string;
};

type GarageForm = {
  garage_id: string;
  garage_name: string;
  garage_address: string;
  garage_city: string;
  garage_city_label: string;
};

const addButtonClass =
  'hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const toText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'bigint') return String(value).trim();
  return '';
};

const extractItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const root = toRecord(payload);
  const dataNode = root.data;
  const dataObj = toRecord(dataNode);
  const list =
    root.items ??
    root.rows ??
    root.list ??
    root.garages ??
    dataObj.items ??
    dataObj.rows ??
    dataObj.list ??
    dataObj.garages;
  return Array.isArray(list) ? list : Array.isArray(dataNode) ? dataNode : [];
};

const extractCityOptions = (payload: unknown): CityOption[] => {
  const items = extractItems(payload);
  return items
    .map((raw, index) => {
      const record = toRecord(raw);
      const idRaw = record.id ?? record.city_id ?? record.cityId ?? record.value ?? record.code;
      const labelRaw = record.name ?? record.city_name ?? record.cityName ?? record.label ?? record.title;
      const id = toText(idRaw) || String(index + 1);
      const label = toText(labelRaw) || id;
      return id ? { id, label } : null;
    })
    .filter((item): item is CityOption => Boolean(item));
};

const fetchCities = async (query: string): Promise<CityOption[]> => {
  const token = localStorage.getItem('token') ?? '';
  const res = await api.get<unknown>(`/general/cities?search=${encodeURIComponent(query)}`, token ? { Authorization: token } : undefined);
  if (res.status !== 'success') return [];
  return extractCityOptions(res.data);
};

const getHeaders = () => {
  const token = localStorage.getItem('token') ?? '';
  return token ? { Authorization: token } : undefined;
};

const emptyForm: GarageForm = {
  garage_id: '',
  garage_name: '',
  garage_address: '',
  garage_city: '',
  garage_city_label: '',
};

const CityCombobox: React.FC<{
  value: CityOption | null;
  onChange: (value: CityOption | null) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CityOption[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setOptions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        setOptions(await fetchCities(query.trim()));
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open, query]);

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all font-normal', !value && 'text-slate-400')}
        >
          <span className="truncate">{value ? value.label : 'Pilih kota'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl" align="start">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Cari kota..." />
          <CommandList>
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat...
              </div>
            ) : null}
            <CommandEmpty>{loading ? null : 'Tidak ada kota ditemukan'}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = value?.id === option.id;
                return (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    className="rounded-lg"
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const Garages: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [garages, setGarages] = useState<GarageRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<GarageForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GarageRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadGarages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/organization/garage/list', getHeaders());
      if (res.status !== 'success') {
        setGarages([]);
        setTotalCount(0);
        return;
      }

      const payload = res.data as unknown;
      const root = toRecord(payload);
      const items = extractItems(payload);
      const total =
        typeof root.total === 'number'
          ? root.total
          : typeof root.count === 'number'
            ? root.count
            : Array.isArray(payload)
              ? payload.length
              : items.length;

      const mapped = items.map((raw, index): GarageRow => {
        const record = toRecord(raw);
        const id = toText(record.garage_id ?? record.garageId ?? record.id) || `tmp-${index + 1}`;
        const name = toText(record.garage_name ?? record.name ?? record.garageName) || '-';
        const address = toText(record.garage_address ?? record.address) || '-';
        const cityRaw = record.garage_city ?? record.garageCity ?? record.city_id ?? record.cityId ?? record.city;
        const cityRecord = cityRaw && typeof cityRaw === 'object' && !Array.isArray(cityRaw) ? toRecord(cityRaw) : null;
        const cityId = cityRecord ? toText(cityRecord.id ?? cityRecord.city_id ?? cityRecord.value) : toText(cityRaw);
        const cityLabel =
          toText(record.garage_city_label ?? record.city_name ?? record.cityName ?? record.cityLabel ?? record.city_label) ||
          cityId ||
          '-';
        return {
          garage_id: id,
          garage_name: name,
          garage_address: address,
          garage_city: cityId,
          garage_city_label: cityLabel,
        };
      });

      setGarages(mapped);
      setTotalCount(total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGarages();
  }, [loadGarages]);

  const filteredGarages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return garages;
    return garages.filter((garage) =>
      [garage.garage_name, garage.garage_address, garage.garage_city_label]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [garages, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalItems = Math.max(totalCount, filteredGarages.length);

  const setField = (key: keyof GarageForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.garage_name.trim()) next.garage_name = 'Nama garasi wajib diisi';
    if (!form.garage_address.trim()) next.garage_address = 'Alamat garasi wajib diisi';
    if (!form.garage_city.trim()) next.garage_city = 'Kota wajib dipilih';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openCreate = () => {
    setDialogMode('create');
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row: GarageRow) => {
    setDialogMode('edit');
    setForm({
      garage_id: row.garage_id,
      garage_name: row.garage_name === '-' ? '' : row.garage_name,
      garage_address: row.garage_address === '-' ? '' : row.garage_address,
      garage_city: row.garage_city,
      garage_city_label: row.garage_city_label,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) {
      showAlert({ title: 'Validasi', description: 'Periksa kembali field yang wajib diisi.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        garage_name: form.garage_name.trim(),
        garage_address: form.garage_address.trim(),
        garage_city: form.garage_city,
      };

      const endpoint =
        dialogMode === 'edit'
          ? '/organization/garage/update'
          : '/organization/garage/create';

      const res = await api.post<unknown>(
        endpoint,
        dialogMode === 'edit' ? { garage_id: form.garage_id, ...payload } : payload,
        getHeaders()
      );

      if (res.status !== 'success') {
        showAlert({
          title: 'Gagal',
          description: dialogMode === 'edit' ? 'Gagal memperbarui garasi.' : 'Gagal menambahkan garasi.',
          type: 'error',
        });
        return;
      }

      showAlert({
        title: 'Berhasil',
        description: dialogMode === 'edit' ? 'Garasi berhasil diperbarui.' : 'Garasi berhasil ditambahkan.',
        type: 'success',
      });
      setDialogOpen(false);
      setForm(emptyForm);
      await loadGarages();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const res = await api.post<unknown>('/organization/garage/delete', { garage_id: deleteTarget.garage_id }, getHeaders());
      if (res.status !== 'success') {
        showAlert({ title: 'Gagal', description: 'Gagal menghapus garasi. Silakan coba lagi.', type: 'error' });
        return;
      }

      showAlert({ title: 'Berhasil', description: 'Garasi berhasil dihapus.', type: 'success' });
      setGarages((prev) => prev.filter((garage) => garage.garage_id !== deleteTarget.garage_id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDeleteTarget(null);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const selectedCity = form.garage_city
    ? { id: form.garage_city, label: form.garage_city_label || form.garage_city }
    : null;

  const columns: Array<DataTableColumn<GarageRow>> = [
    {
      label: 'Nama Garasi',
      key: 'garage_name',
      sortable: true,
      width: 340,
      render: (row) => (
        <div className="min-w-0">
          <div className="font-semibold text-foreground truncate">{row.garage_name}</div>
        </div>
      ),
    },
    {
      label: 'Alamat',
      key: 'garage_address',
      sortable: true,
      width: 420,
      render: (row) => <span className="text-sm text-foreground line-clamp-2">{row.garage_address}</span>,
    },
    {
      label: 'Kota',
      key: 'garage_city_label',
      sortable: true,
      width: 180,
      render: (row) => (
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <MapPin className="h-3.5 w-3.5" />
          {row.garage_city_label}
        </span>
      ),
    },
    {
      label: 'Action',
      key: 'action',
      sortable: false,
      width: 112,
      align: 'right',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={submitting || deleteSubmitting}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 rounded-2xl">
            <DropdownMenuItem onSelect={() => openEdit(row)} className="flex items-center gap-2 cursor-pointer">
              <Pencil className="h-4 w-4 text-blue-600" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteTarget(row)}
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Daftar Garasi</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Tambah dan kelola garasi organisasi anda</p>
        </div>
        <Button className={addButtonClass} onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Garasi
        </Button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari garasi, alamat, atau kota..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleResetFilters}
            size="icon"
            className="h-11 w-11 rounded-2xl bg-transparent hover:bg-white text-red-600 hover:text-red-700"
            title="Reset filter"
            aria-label="Reset filter"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          data={filteredGarages}
          columns={columns}
          loading={loading}
          stickyHeader
          zebra
          tableClassName="table-auto w-full min-w-[900px]"
          emptyTitle="Tidak ada data garasi"
          emptyDescription="Tambahkan garasi baru atau ubah kata kunci pencarian."
          pagination={{
            page: currentPage,
            pageSize: itemsPerPage,
            totalItems,
            onPageChange: setCurrentPage,
            onPageSizeChange: (n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            },
            pageSizeOptions: [10, 20, 50, 100],
          }}
          sorting={{ initialSort: { key: 'garage_name', direction: 'asc' } }}
          rowKey={(row) => row.garage_id}
        />
      </div>

      <Button
        onClick={openCreate}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Garasi"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open);
        }}
      >
        <DialogContentScrollable className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] p-0 border-none bg-white">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                      {dialogMode === 'edit' ? 'Edit Garasi' : 'Tambah Garasi'}
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      {dialogMode === 'edit'
                        ? 'Perbarui informasi garasi organisasi anda.'
                        : 'Tambahkan garasi baru untuk kebutuhan operasional armada.'}
                    </p>
                  </div>
                </div>
                <DialogClose className="w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400" disabled={submitting}>
                  <X className="w-3 h-3 sm:w-5 sm:h-5" />
                </DialogClose>
              </div>
              <div className="mt-6 h-px bg-slate-100" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-slate-700 font-semibold ml-1">Nama Garasi *</label>
                  <Input
                    value={form.garage_name}
                    onChange={(event) => setField('garage_name', event.target.value)}
                    placeholder="Contoh: Pool Armada Pusat"
                    className={cn('h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700', errors.garage_name && 'border-red-500')}
                  />
                  {errors.garage_name ? <p className="text-sm text-red-500">{errors.garage_name}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-slate-700 font-semibold ml-1">Alamat *</label>
                  <Input
                    value={form.garage_address}
                    onChange={(event) => setField('garage_address', event.target.value)}
                    placeholder="Masukkan alamat lengkap garasi"
                    className={cn('h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700', errors.garage_address && 'border-red-500')}
                  />
                  {errors.garage_address ? <p className="text-sm text-red-500">{errors.garage_address}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-slate-700 font-semibold ml-1">Kota *</label>
                  <CityCombobox
                    value={selectedCity}
                    onChange={(city) => {
                      setField('garage_city', city?.id ?? '');
                      setField('garage_city_label', city?.label ?? '');
                    }}
                    disabled={submitting}
                  />
                  {errors.garage_city ? <p className="text-sm text-red-500">{errors.garage_city}</p> : null}
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end mt-3 md:mt-0 w-full md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                  className="w-full md:w-auto h-12 px-8 rounded-2xl border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto h-12 px-8 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-normal flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {dialogMode === 'edit' ? 'Update Garasi' : 'Simpan Garasi'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContentScrollable>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!deleteSubmitting && !open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus garasi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.garage_name && deleteTarget.garage_name !== '-'
                ? `Garasi "${deleteTarget.garage_name}" akan dihapus permanen.`
                : 'Garasi ini akan dihapus permanen.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={async (event) => {
                event.preventDefault();
                await handleDelete();
              }}
            >
              {deleteSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
