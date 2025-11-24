import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ServicesArmada: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const armada = [
    {
      id: 1,
      name: 'Toyota Hiace Premio',
      type: 'Minibus',
      capacity: '15 pax',
      price: 200000,
      originalPrice: 250000,
      rating: 4.8,
      reviews: 24,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Minibus nyaman untuk perjalanan jarak jauh dengan fasilitas lengkap.',
      features: ['AC', 'Reclining seats', 'Audio system', 'Safety equipment']
    },
    {
      id: 2,
      name: 'Innova Reborn',
      type: 'MPV',
      capacity: '7 pax',
      price: 150000,
      originalPrice: 180000,
      rating: 4.9,
      reviews: 156,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'MPV keluarga dengan kenyamanan dan keamanan terbaik.',
      features: ['AC', 'Power steering', 'ABS', 'Airbag']
    },
    {
      id: 3,
      name: 'Avanza Veloz',
      type: 'MPV',
      capacity: '7 pax',
      price: 120000,
      originalPrice: 150000,
      rating: 4.7,
      reviews: 89,
      status: 'inactive',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'MPV ekonomis dengan performa efisien untuk perjalanan harian.',
      features: ['AC', 'Power windows', 'Central lock', 'Audio system']
    },
    {
      id: 4,
      name: 'Fortuner 4x4',
      type: 'SUV',
      capacity: '7 pax',
      price: 300000,
      originalPrice: 350000,
      rating: 4.6,
      reviews: 45,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'SUV tangguh untuk perjalanan off-road dan medan berat.',
      features: ['4WD', 'AC', 'Leather seats', 'Navigation system']
    },
    {
      id: 5,
      name: 'Elf Long',
      type: 'Bus Kecil',
      capacity: '20 pax',
      price: 250000,
      originalPrice: 300000,
      rating: 4.5,
      reviews: 67,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Bus kecil untuk grup besar dengan kenyamanan maksimal.',
      features: ['AC', 'Reclining seats', 'Audio system', 'Reading lights']
    },
    {
      id: 6,
      name: 'Grand Max',
      type: 'Pickup',
      capacity: '4 pax',
      price: 100000,
      originalPrice: 120000,
      rating: 4.4,
      reviews: 34,
      status: 'inactive',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Pickup praktis untuk kebutuhan transportasi barang dan penumpang.',
      features: ['AC', 'Power steering', 'Central lock', 'Audio system']
    }
  ];

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

  const filteredArmada = armada.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredArmada.length / itemsPerPage);
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
          onClick={() => navigate('/dashboard/services/fleet/create')}
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
          <CardTitle>Data Armada ({filteredArmada.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipe</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Kapasitas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Harga</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rating</th>
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
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
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
                      <p className="font-medium text-gray-900 dark:text-white">
                        Rp {item.price.toLocaleString()}/hari
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {item.rating}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/services/fleet/edit/${item.id}`)}
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
              <p className="text-2xl font-bold text-blue-600">
                {(armada.reduce((acc, a) => acc + a.rating, 0) / armada.length).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
