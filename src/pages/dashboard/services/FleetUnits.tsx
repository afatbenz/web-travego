import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { api } from '@/lib/api';

export const FleetUnits: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = location.pathname.startsWith('/dashboard/partner');
  const createUnitPath = '/dashboard/partner/fleet-units/create';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Array<{ id: string | number; vehicle_id: string; fleet_name: string; plate_number: string; engine: string; capacity: number }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);
      
      // Menggunakan endpoint mock atau API yang sesuai jika sudah tersedia
      const res = await api.get<unknown>(`/services/fleet-units?${query.toString()}`, token ? { Authorization: token } : undefined);
      
      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const getNumber = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];

        const mapped = list.map((raw, i) => {
          const obj = record(raw);
          const idRaw = obj.id ?? obj.unit_id ?? obj.vehicle_id ?? i;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
          const vehicle_id = getString(obj.vehicle_id ?? obj.unit_id);
          const fleet_name = getString(obj.fleet_name ?? obj.fleet);
          const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate);
          const engine = getString(obj.engine ?? obj.chassis ?? obj.machine);
          const capacity = getNumber(obj.capacity);
          return { id, vehicle_id, fleet_name, plate_number, engine, capacity };
        });

        setUnits(mapped);
        if (Array.isArray(payload)) {
          setTotalCount(mapped.length);
        } else if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
        }
      } else {
        // Mock data untuk keperluan development jika API belum ready
        setUnits([
          { id: 1, vehicle_id: 'UNIT-001', fleet_name: 'Toyota Hiace Premio', plate_number: 'B 1234 ABC', engine: 'D4BB-123', capacity: 14 },
          { id: 2, vehicle_id: 'UNIT-002', fleet_name: 'Isuzu Elf Long', plate_number: 'B 5678 DEF', engine: '4HG1-456', capacity: 19 },
          { id: 3, vehicle_id: 'UNIT-003', fleet_name: 'Bus Medium', plate_number: 'B 9012 GHI', engine: 'J08E-789', capacity: 31 },
        ]);
        setTotalCount(3);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalItems = totalCount;

  type UnitRow = (typeof units)[number];
  const columns: Array<DataTableColumn<UnitRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    { label: 'Jenis Armada', key: 'fleet_name', sortable: true, width: 380, render: (unit) => <span className="text-foreground">{unit.fleet_name}</span> },
    {
      label: 'ID Armada',
      key: 'vehicle_id',
      sortable: true,
      width: 160,
      render: (unit) => (
        <Link
          to={`/dashboard/partner/fleet-units/detail/${encodeURIComponent(String(unit.id))}`}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {unit.vehicle_id}
        </Link>
      )
    },
    { label: 'Plat Nomor', key: 'plate_number', sortable: true, width: 160, render: (unit) => <span className="text-foreground">{unit.plate_number}</span> },
    { label: 'Chassis / Mesin', key: 'engine', sortable: true, width: 250, render: (unit) => <span className="text-foreground">{unit.engine || '-'}</span> },
    {
      label: 'Kapasitas',
      key: 'capacity',
      sortable: true,
      width: 140,
      align: 'center',
      render: (unit) => <span className="text-foreground">{unit.capacity} Pax</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola unit armada spesifik (berdasarkan plat nomor/ID)
          </p>
        </div>
        {canCreate ? (
          <Button
            className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40"
            onClick={() => navigate(createUnitPath)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah unit baru
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari ID armada, jenis armada, atau plat nomor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Car className="h-5 w-5" />
        Daftar Unit Armada
      </div>
      <DataTable
        data={units}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        emptyTitle="Tidak ada data unit armada"
        emptyDescription="Coba ubah pencarian."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (row) => navigate(`/dashboard/partner/fleet-units/detail/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: Edit,
              onSelect: (row) => navigate(`/dashboard/partner/fleet-units/edit/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              disabled: true,
              onSelect: () => void 0
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
        sorting={{ initialSort: { key: 'vehicle_id', direction: 'asc' } }}
        rowKey={(row) => row.id}
      />

      {canCreate ? (
        <Button
          onClick={() => navigate(createUnitPath)}
          className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
          size="icon"
          title="Tambah Unit Armada"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
};
