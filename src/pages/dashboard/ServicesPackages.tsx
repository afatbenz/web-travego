import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { api, toFileUrl } from '@/lib/api';
import Swal from 'sweetalert2';

interface TourPackage {
  package_id: string | number;
  package_name: string;
  thumbnail: string;
  package_description: string;
  destination: string;
  min_pax: number;
  max_pax: number;
  min_price: number;
  active: boolean;
  status: string;
}

export const ServicesPackages: React.FC = () => {
  const navigate = useNavigate();
  const basePrefix = '/dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const normalizeStatus = (raw: unknown): 'active' | 'inactive' => {
    if (raw === 1 || raw === '1') return 'active';
    if (raw === 0 || raw === '0') return 'inactive';
    if (raw === true) return 'active';
    if (raw === false) return 'inactive';
    if (typeof raw === 'string') {
      const s = raw.toLowerCase();
      if (s === 'active') return 'active';
      if (s === 'inactive') return 'inactive';
    }
    return 'inactive';
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/services/tour-packages/list', token ? { Authorization: token } : undefined);
      if (response.data && Array.isArray(response.data)) {
        const mapped = (response.data as unknown[]).map((x) => {
          const item = x as Record<string, unknown>;
          const rawId = item.package_id ?? item.id ?? item.packageId;
          const package_id =
            typeof rawId === 'string' || typeof rawId === 'number' ? rawId : String(rawId ?? '');
          const destinations = item.destinations;
          const destinationStr = typeof destinations === 'string' ? destinations : '';
          const destinationRaw = destinationStr.length > 25 ? `${destinationStr.slice(0, 25)}...` : destinationStr;
          const status = normalizeStatus(item.status ?? item.active);
          return {
            package_id,
            package_name: String(item.package_name ?? item.name ?? ''),
            thumbnail: toFileUrl(String(item.thumbnail ?? '')),
            package_description: String(item.package_description ?? item.description ?? ''),
            destination: destinationRaw,
            min_pax: Number(item.min_pax ?? 0),
            max_pax: Number(item.max_pax ?? 0),
            min_price: Number(item.min_price ?? 0),
            active: status === 'active',
            status,
          } satisfies TourPackage;
        });
        setPackages(mapped);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    const result = await Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/tour-packages/${encodeURIComponent(String(id))}`, token ? { Authorization: token } : undefined);
        Swal.fire(
          'Terhapus!',
          'Data paket telah dihapus.',
          'success'
        );
        fetchPackages();
      } catch (error) {
        console.error('Error deleting package:', error);
        Swal.fire(
          'Gagal!',
          'Terjadi kesalahan saat menghapus data.',
          'error'
        );
      }
    }
  };

  const handleToggleStatus = async (pkg: TourPackage) => {
    const packageId = String(pkg.package_id ?? '').trim();
    if (!packageId) return;

    const prevActive = pkg.active;
    const action = prevActive ? 'inactive' : 'active';
    const nextActive = !prevActive;
    const nextStatus = nextActive ? 'active' : 'inactive';

    setPackages((prev) =>
      prev.map((p) =>
        p.package_id === pkg.package_id ? { ...p, active: nextActive, status: nextStatus } : p
      )
    );

    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.post(
        '/services/tour-packages/activate',
        { action, package_id: packageId },
        { Authorization: token }
      );
      if (res.status !== 'success') {
        setPackages((prev) =>
          prev.map((p) =>
            p.package_id === pkg.package_id ? { ...p, active: prevActive, status: pkg.status } : p
          )
        );
        Swal.fire('Error', 'Gagal mengubah status', 'error');
      }
    } catch {
      setPackages((prev) =>
        prev.map((p) =>
          p.package_id === pkg.package_id ? { ...p, active: prevActive, status: pkg.status } : p
        )
      );
      Swal.fire('Error', 'Terjadi kesalahan saat mengubah status', 'error');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const formatRupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;
  const truncateWithDots = (value: string, maxChars: number) => {
    const s = (value ?? '').trim();
    if (!s) return '';
    if (s.length <= maxChars) return s;
    return `${s.slice(0, Math.max(0, maxChars))}....`;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  const columns: Array<DataTableColumn<TourPackage>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => (
        <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
      )
    },
    {
      label: 'Nama',
      key: 'package_name',
      sortable: true,
      width: 620,
      render: (pkg) => (
        <div className="flex items-center gap-3">
          <img
            src={pkg.thumbnail}
            alt={pkg.package_name}
            className="h-12 w-12 rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
            }}
          />
          <div className="min-w-0">
            <div
              className={cn(
                'truncate',
                pkg.status === 'inactive' ? 'font-semibold text-muted-foreground' : 'font-semibold text-foreground'
              )}
            >
              <Link
                to={`${basePrefix}/services/packages/detail/${encodeURIComponent(String(pkg.package_id))}`}
                className="hover:no-underline hover:text-bold"
              >
                <span className="md:hidden">{truncateWithDots(pkg.package_name, 35)}</span>
                <span className="hidden md:inline">{truncateWithDots(pkg.package_name, 50)}</span>
              </Link>
            </div>
            <div
              className="line-clamp-1 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: pkg.package_description }}
            />
          </div>
        </div>
      )
    },
    {
      label: 'Pax',
      key: '__pax__',
      width: 220,
      sortable: false,
      render: (pkg) => (
        <span className="text-sm text-foreground">
          {pkg.min_pax} - {pkg.max_pax} Pax
        </span>
      )
    },
    {
      label: 'Tujuan',
      key: 'destination',
      width: 300,
      sortable: true,
      render: (pkg) => (
        <span className="text-sm text-foreground">
          <span className="md:hidden">{truncateWithDots(pkg.destination || '-', 35) || '-'}</span>
          <span className="hidden md:inline">{truncateWithDots(pkg.destination || '-', 50) || '-'}</span>
        </span>
      )
    },
    {
      label: 'Harga Mulai',
      key: 'min_price',
      width: 170,
      sortable: true,
      render: (pkg) => <span className="font-medium text-foreground">{formatRupiah(pkg.min_price)}</span>
    },
    {
      label: 'Status',
      key: 'status',
      width: 140,
      sortable: true,
      render: (pkg) => (
        <Switch checked={pkg.active} onCheckedChange={() => void handleToggleStatus(pkg)} />
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Paket Wisata</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola paket wisata yang tersedia
          </p>
        </div>
        <Button 
          className="hidden sm:flex h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40"
          onClick={() => navigate(`${basePrefix}/services/packages/create`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Paket
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari paket..."
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
        data={filteredPackages}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        emptyTitle="Tidak ada data"
        emptyDescription="Coba ubah filter pencarian atau status."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (row) =>
                navigate(`${basePrefix}/services/packages/detail/${encodeURIComponent(String(row.package_id))}`)
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: Edit,
              onSelect: (row) => navigate(`${basePrefix}/services/packages/edit/${encodeURIComponent(String(row.package_id))}`)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: (row) => void handleDelete(row.package_id)
            }
          ]
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'package_name', direction: 'asc' } }}
        rowKey={(row) => row.package_id}
      />

      

      <Button
        onClick={() => navigate(`${basePrefix}/services/packages/create`)}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Paket"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
