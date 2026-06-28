import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, Download, FileSpreadsheet, RotateCcw, Sheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';

const formatListField = (raw: unknown): string => {
  if (raw == null || raw === '') return '-';
  if (typeof raw === 'string') return raw || '-';
  if (typeof raw === 'number') return String(raw);
  if (Array.isArray(raw)) {
    const parts = raw
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') return String(item);
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const val = o.name ?? o.engine ?? o.capacity ?? o.value ?? o.label;
          if (typeof val === 'string' || typeof val === 'number') return String(val);
        }
        return '';
      })
      .filter(Boolean);
    return parts.length ? parts.join(', ') : '-';
  }
  return '-';
};

const normalizeStatus = (raw: unknown): 'active' | 'inactive' => {
  if (raw === true || raw === 1 || raw === '1') return 'active';
  if (raw === false || raw === 0 || raw === '0') return 'inactive';
  if (typeof raw === 'string') {
    const s = raw.toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'inactive') return 'inactive';
  }
  return 'inactive';
};

const splitListField = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== '-');

type ArmadaRow = {
  totalUlasan: number;
  id: string | number;
  name: string;
  type: string;
  totalUnit: string;
  body?: string;
  engines: string;
  capacities: string;
  active: boolean;
  status: string;
  image?: string;
  description?: string;
  rating?: number;
};

export const ServicesArmada: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [armada, setArmada] = useState<ArmadaRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('fleet_name', searchTerm);
      const res = await api.get<unknown>(`/services/fleet/list?${query.toString()}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        let items: unknown[] = [];
        let total = 0;
        if (Array.isArray(payload)) {
          items = payload;
          total = payload.length;
        } else if (payload && typeof payload === 'object') {
          const p = record(payload);
          const arr = p.items;
          const t = p.total;
          if (Array.isArray(arr)) items = arr; else items = [];
          total = typeof t === 'number' ? t : (Array.isArray(arr) ? arr.length : 0);
        }
        const mapped = items.map((raw, i) => {
          const x = record(raw);
          const idRaw = x.fleet_id ?? x.id;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? (idRaw as string | number) : i;
          const name = typeof x.name === 'string' ? x.name : (typeof x.fleet_name === 'string' ? x.fleet_name : '');
          const typeRaw = typeof x.type === 'string' ? x.type : (typeof x.fleet_type === 'string' ? x.fleet_type : '');
          const type = typeRaw.trim() || '-';
          const rating = typeof x.rating === 'number' ? x.rating : 0;
          const totalUlasan = typeof x.total_ulasan === 'number' ? x.total_ulasan : 0;
          const totalUnitVal = x.total_unit ?? x.totalUnit ?? x.total_unit ?? x.totalUnit;
          const totalUnitNum =
            typeof totalUnitVal === 'number'
              ? totalUnitVal
              : typeof totalUnitVal === 'string'
                ? parseInt(totalUnitVal) || 0
                : 0;
          const totalUnit =  `${totalUnitNum} unit`;
          const body = typeof x.body === 'string' ? x.body : (typeof x.fleet_body === 'string' ? x.fleet_body : undefined);
          const engines = formatListField(x.engines ?? x.engine ?? x.fleet_engine);
          const capacities = formatListField(x.capacities ?? x.capacity);
          const status = normalizeStatus(x.status ?? x.active);
          const image = typeof x.image === 'string' ? x.image : typeof x.thumbnail === 'string' ? x.thumbnail : undefined;
          const description = typeof x.description === 'string' ? x.description : '';
          return { id, name, type, totalUnit, body, engines, capacities, active: status === 'active', status, image, description, rating, totalUlasan };
        });
        setArmada(mapped);
        setTotalCount(total);
      } else {
        setArmada([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(armada.map((item) => item.type.trim()).filter((item) => item && item !== '-')));
    return unique.sort((a, b) => a.localeCompare(b, 'id'));
  }, [armada]);

  const capacityOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        armada.flatMap((item) => splitListField(item.capacities))
      )
    );
    return unique.sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
      return a.localeCompare(b, 'id');
    });
  }, [armada]);

  useEffect(() => {
    if (typeFilter !== 'all' && !typeOptions.includes(typeFilter)) {
      setTypeFilter('all');
    }
  }, [typeFilter, typeOptions]);

  useEffect(() => {
    if (capacityFilter !== 'all' && !capacityOptions.includes(capacityFilter)) {
      setCapacityFilter('all');
    }
  }, [capacityFilter, capacityOptions]);

  const handleToggleStatus = async (item: ArmadaRow) => {
    const fleetId = String(item.id ?? '').trim();
    if (!fleetId) return;

    const prevActive = item.active;
    const action = prevActive ? 'inactive' : 'active';
    const nextActive = !prevActive;
    const nextStatus = nextActive ? 'active' : 'inactive';

    setArmada((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, active: nextActive, status: nextStatus } : a))
    );

    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post(
        '/services/fleet/activate',
        { action, fleet_id: fleetId },
        { Authorization: token }
      );
      if (res.status !== 'success') {
        setArmada((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, active: prevActive, status: item.status } : a))
        );
        Swal.fire('Error', 'Gagal mengubah status', 'error');
      }
    } catch {
      setArmada((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, active: prevActive, status: item.status } : a))
      );
      Swal.fire('Error', 'Terjadi kesalahan saat mengubah status', 'error');
    }
  };

  const filteredArmada = useMemo(
    () =>
      armada.filter((item) => {
        const matchType = typeFilter === 'all' || item.type === typeFilter;
        const matchCapacity =
          capacityFilter === 'all' || splitListField(item.capacities).includes(capacityFilter);
        return matchType && matchCapacity;
      }),
    [armada, typeFilter, capacityFilter]
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalItems =
    typeFilter !== 'all' || capacityFilter !== 'all'
      ? filteredArmada.length
      : Math.max(totalCount, filteredArmada.length);

  const columns: Array<DataTableColumn<ArmadaRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 72,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'Nama',
      key: 'name',
      sortable: true,
      width: 340,
      render: (item) => (
        <div className="flex items-center gap-3">
          <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
          <div className="min-w-0">
            <Link
              to={`${basePrefix}/services/fleet/detail/${encodeURIComponent(String(item.id))}`}
              className="font-semibold text-foreground hover:no-underline hover:text-bold"
            >
              {item.name}
            </Link>
            <div className="line-clamp-1 text-sm text-muted-foreground">
              {item.body || item.description}
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Tipe',
      key: 'type',
      sortable: true,
      width: 120,
      render: (item) => (
        <span className="inline-flex whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {item.type}
        </span>
      )
    },
    {
      label: 'Unit',
      key: 'totalUnit',
      sortable: true,
      width: 110,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap">{item.totalUnit}</span>
    },
    {
      label: 'Engine',
      key: 'engines',
      sortable: true,
      width: 260,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap">{item.engines ? item.engines.length > 30 ? item.engines.slice(0, 30) + '...' : item.engines : ''}</span>
    },
    {
      label: 'Kapasitas',
      key: 'capacities',
      sortable: true,
      width: 140,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap">{item.capacities} seat</span>
    },
    {
      label: 'Rating',
      key: 'rating',
      sortable: true,
      width: 160,
      render: (item) => <span className="text-sm text-foreground whitespace-nowrap"><Star className={`inline-block ${(item.rating ?? 0) >= 1 ? 'text-orange-500' : 'text-gray-500'} w-4 h-4 mr-2`} /> {item.rating?.toFixed(1) ?? '0.0'} ({item.totalUlasan ?? 0})</span>
    },
    {
      label: 'Published',
      key: 'published',
      sortable: true,
      width: 120,
      render: (item) => (
        <Switch checked={item.active} onCheckedChange={() => void handleToggleStatus(item)} />
      )
    },
  ];

  const handleDelete = async (fleetId: string | number, fleetName: string) => {
    const result = await Swal.fire({
      title: 'Hapus armada?',
      text: fleetName ? `Armada "${fleetName}" akan dihapus dan tidak dapat dikembalikan.` : 'Data yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/fleet/delete', { fleet_id: fleetId }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Armada berhasil dihapus.' });
      setArmada((prev) => prev.filter((x) => String(x.id) !== String(fleetId)));
      setTotalCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCapacityFilter('all');
    setCurrentPage(1);
  };

  const handleDownloadExcel = () => {
    if (!filteredArmada.length) {
      void Swal.fire('Info', 'Tidak ada data armada untuk diunduh.', 'info');
      return;
    }

    const headers = ['No', 'Nama Armada', 'Tipe', 'Unit', 'Engine', 'Kapasitas', 'Rating', 'Total Ulasan', 'Published'];
    const rows = filteredArmada.map((item, index) => [
      startIndex + index + 1,
      item.name,
      item.type,
      item.totalUnit,
      item.engines,
      item.capacities,
      item.rating?.toFixed(1) ?? '0.0',
      item.totalUlasan ?? 0,
      item.active ? 'Aktif' : 'Tidak Aktif',
    ]);

    const escapeCell = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const tableHeader = headers.map((header) => `<th>${escapeCell(header)}</th>`).join('');
    const tableBody = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`)
      .join('');

    const workbook = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; }
            th { background: #f3f4f6; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', workbook], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `armada-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleCopyToGoogleSheet = async () => {
    if (!filteredArmada.length) {
      void Swal.fire('Info', 'Tidak ada data armada untuk disalin.', 'info');
      return;
    }

    const headers = ['No', 'Nama Armada', 'Tipe', 'Unit', 'Engine', 'Kapasitas', 'Rating', 'Total Ulasan', 'Published'];
    const rows = filteredArmada.map((item, index) => [
      startIndex + index + 1,
      item.name,
      item.type,
      item.totalUnit,
      item.engines,
      item.capacities,
      item.rating?.toFixed(1) ?? '0.0',
      item.totalUlasan ?? 0,
      item.active ? 'Aktif' : 'Tidak Aktif',
    ]);
    const tsv = [headers.join('\t'), ...rows.map((row) => row.map((cell) => String(cell ?? '')).join('\t'))].join('\n');

    try {
      const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      };

      let copied = false;
      try {
        await navigator.clipboard.writeText(tsv);
        copied = true;
      } catch {
        copied = fallbackCopy();
      }

      if (!copied) throw new Error('COPY_FAILED');

      window.open('https://sheet.new', '_blank', 'noopener,noreferrer');
      await Swal.fire('Berhasil', 'Data sudah disalin. Tab Google Sheet dibuka, silakan tempelkan (Ctrl+V).', 'success');
    } catch {
      await Swal.fire(
        'Gagal',
        'Tidak dapat menyalin data ke clipboard. Pastikan website berjalan di HTTPS atau localhost, dan izinkan akses clipboard di browser.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Layanan Armada</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Tambah dan kelola layanan armada anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className={addButtonClass}
            onClick={() => navigate(`${basePrefix}/services/fleet/create`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Armada
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700"
                aria-label="Aksi armada"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  handleDownloadExcel();
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Download Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  void handleCopyToGoogleSheet();
                }}
              >
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari armada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:col-span-3 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem className="rounded-2xl" value="all">Semua Tipe</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem className="rounded-2xl" key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Kapasitas" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem className="rounded-2xl" value="all">Semua Kapasitas</SelectItem>
                {capacityOptions.map((capacity) => (
                  <SelectItem className="rounded-2xl" key={capacity} value={capacity}>
                    {capacity} seat
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </div>

      {/* Table */}
      <DataTable
        data={filteredArmada}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1260px]"
        emptyTitle="Tidak ada data armada"
        emptyDescription="Coba ubah pencarian atau filter."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (row) => navigate(`${basePrefix}/services/fleet/detail/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: Edit,
              onSelect: (row) => navigate(`${basePrefix}/services/fleet/edit/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: (row) => void handleDelete(row.id, row.name)
            }
          ]
        }}
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
        sorting={{ initialSort: { key: 'name', direction: 'asc' } }}
        rowKey={(row) => row.id}
      />

      <Button
        onClick={() => navigate(`${basePrefix}/services/fleet/create`)}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Armada"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
