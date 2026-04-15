import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';

export const ServicesArmada: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [armada, setArmada] = useState<Array<{ id: string | number; name: string; type: string; totalUnit: string; body?: string; engine?: string; status: string; image?: string; description?: string }>>([]);
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
          const idRaw = x.id ?? x.fleet_id;
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
          const engine = typeof x.engine === 'string' ? x.engine : (typeof x.fleet_engine === 'string' ? x.fleet_engine : undefined);
          const status = typeof x.status === 'string' ? x.status : x.active === true ? 'active' : 'inactive';
          const image = typeof x.image === 'string' ? x.image : typeof x.thumbnail === 'string' ? x.thumbnail : undefined;
          const description = typeof x.description === 'string' ? x.description : '';
          return { id, name, type, totalUnit, body, engine, status, image, description };
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

  const getStatusText = (status: string) => {
    const s = status === 'active' ? 'active' : status === 'inactive' ? 'inactive' : status;
    const label = s === 'active' ? 'Publish' : s === 'inactive' ? 'Private' : status;
    const cls =
      s === 'active'
        ? 'text-green-600 dark:text-green-400'
        : s === 'inactive'
          ? 'text-gray-600 dark:text-gray-300'
          : 'text-gray-900 dark:text-white';
    return <span className={`text-sm font-medium ${cls}`}>{label}</span>;
  };

  const filteredArmada = armada; // server-side filtering/pagination
  const totalPages = Math.ceil(Math.max(totalCount, filteredArmada.length) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArmada = filteredArmada.slice(startIndex, endIndex);

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
            Kelola armada yang tersedia
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
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
      <Card>
        <CardHeader>
          <CardTitle>Data Armada ({Math.max(totalCount, filteredArmada.length)} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900">
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Jumlah unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`} className="animate-pulse">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-72" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentArmada.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                      Tidak ada data armada
                    </TableCell>
                  </TableRow>
                ) : (
                  currentArmada.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                              {[item.body, item.engine].filter(Boolean).join(' - ') || item.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900 dark:text-white">{item.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900 dark:text-white">{item.totalUnit}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusText(item.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`${basePrefix}/services/fleet/detail/${item.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`${basePrefix}/services/fleet/edit/${item.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id, item.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, Math.max(totalCount, filteredArmada.length))} dari{' '}
                {Math.max(totalCount, filteredArmada.length)} armada
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{armada.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Armada</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {armada.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {armada.filter(a => a.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tidak Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
