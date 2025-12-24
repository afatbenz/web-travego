import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

export const ServicesArmada: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [, setLoading] = useState(false);
  const [armada, setArmada] = useState<Array<{ id: string | number; name: string; type: string; capacity: string; body?: string; engine?: string; status: string; image?: string; description?: string }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const body: Record<string, unknown> = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const res = await api.post<unknown>('/partner/services/fleet/list', body, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = res.data as unknown;
        let items: any[] = [];
        let total = 0;
        if (Array.isArray(payload)) {
          items = payload;
          total = payload.length;
        } else if (payload && typeof payload === 'object') {
          const p = payload as Record<string, unknown>;
          const arr = p.items as unknown;
          const t = p.total as unknown;
          if (Array.isArray(arr)) items = arr as any[]; else items = [];
          total = typeof t === 'number' ? t : (Array.isArray(arr) ? arr.length : 0);
        }
        const mapped = items.map((x, i) => {
          const idRaw = (x as { id?: unknown; fleet_id?: unknown }).id ?? (x as { fleet_id?: unknown }).fleet_id;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? (idRaw as string | number) : i;
          const name = typeof x.name === 'string' ? x.name : (typeof x.fleet_name === 'string' ? x.fleet_name : '');
          const type = typeof x.type === 'string' ? x.type : (typeof x.fleet_type === 'string' ? x.fleet_type : '');
          const capacityNum = typeof x.capacity === 'number' ? x.capacity : (typeof x.capacity === 'string' ? parseInt(x.capacity) || 0 : 0);
          const capacity = capacityNum > 0 ? `${capacityNum} pax` : String(x.capacity ?? '');
          const body = typeof x.body === 'string' ? x.body : (typeof x.fleet_body === 'string' ? x.fleet_body : undefined);
          const engine = typeof x.engine === 'string' ? x.engine : (typeof x.fleet_engine === 'string' ? x.fleet_engine : undefined);
          const status = typeof x.status === 'string' ? x.status : (x.active === true ? 'active' : 'inactive');
          const image = typeof x.image === 'string' ? x.image : (typeof x.thumbnail === 'string' ? x.thumbnail : undefined);
          const description = typeof x.description === 'string' ? x.description : '';
          return { id, name, type, capacity, body, engine, status, image, description };
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Aktif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Tidak Aktif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredArmada = armada; // server-side filtering/pagination
  const totalPages = Math.ceil(Math.max(totalCount, filteredArmada.length) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArmada = filteredArmada.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola armada yang tersedia
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/dashboard/partner/services/fleet/create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Armada
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Armada ({Math.max(totalCount, filteredArmada.length)} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipe</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Kapasitas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Spesifikasi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentArmada.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{item.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{item.capacity}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{[item.body, item.engine].filter(Boolean).join(' - ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/partner/services/fleet/detail/${item.id}`)}
                        >
                          Detail
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/partner/services/fleet/edit/${item.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredArmada.length)} dari {filteredArmada.length} armada
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
