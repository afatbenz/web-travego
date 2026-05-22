import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
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

export const ServicesArmada: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [armada, setArmada] = useState<Array<{
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
  }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);
      if (statusFilter !== 'all') query.set('status', statusFilter);
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
          const type = typeof x.type === 'string' ? x.type : (typeof x.fleet_type === 'string' ? x.fleet_type : '');
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
          return { id, name, type, totalUnit, body, engines, capacities, active: status === 'active', status, image, description };
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
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  type ArmadaRow = (typeof armada)[number];

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

  const filteredArmada = armada; // server-side filtering/pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalItems = Math.max(totalCount, filteredArmada.length);

  const columns: Array<DataTableColumn<ArmadaRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 30,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'Nama',
      key: 'name',
      sortable: true,
      width: 270,
      render: (item) => (
        <div className="flex items-center gap-3">
          <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
          <div className="min-w-0">
            <Link
              to={`${basePrefix}/services/fleet/detail/${encodeURIComponent(String(item.id))}`}
              className="font-semibold text-foreground hover:underline"
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
      width: 80,
      render: (item) => <span className="text-sm text-foreground">{item.type}</span>
    },
    {
      label: 'Unit',
      key: 'totalUnit',
      sortable: true,
      width: 50,
      render: (item) => <span className="text-sm text-foreground">{item.totalUnit}</span>
    },
    {
      label: 'Engine',
      key: 'engines',
      sortable: true,
      width: 200,
      render: (item) => <span className="text-sm text-foreground">{item.engines}</span>
    },
    {
      label: 'Kapasitas',
      key: 'capacities',
      sortable: true,
      width: 100,
      render: (item) => <span className="text-sm text-foreground">{item.capacities} seat</span>
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      width: 80,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rental Kendaraan</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Tambah dan kelola armada anda
          </p>
        </div>
        <Button 
          className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40"
          onClick={() => navigate(`${basePrefix}/services/fleet/create`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Armada
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari armada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full">
            Export Data
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredArmada}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-0"
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
