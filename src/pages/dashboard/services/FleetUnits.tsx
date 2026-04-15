import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { api } from '@/lib/api';

export const FleetUnits: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate('/dashboard/partner/fleet-units/create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah unit baru
        </Button>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Daftar Unit Armada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900">
                  <TableHead>ID Armada</TableHead>
                  <TableHead>Jenis Armada</TableHead>
                  <TableHead>Plat Nomor</TableHead>
                  <TableHead>Chassis / Mesin</TableHead>
                  <TableHead className="text-center">Kapasitas</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`} className="animate-pulse">
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" /></TableCell>
                      <TableCell className="text-center"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                      Tidak ada data unit armada
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400">{unit.vehicle_id}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{unit.fleet_name}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{unit.plate_number}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{unit.engine || '-'}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 text-center">{unit.capacity} Pax</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/partner/fleet-units/detail/${encodeURIComponent(String(unit.id))}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/partner/fleet-units/edit/${unit.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
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
              <p className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} unit
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
