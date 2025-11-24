import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ServicesPackages: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const packages = [
    {
      id: 1,
      title: 'Thailand Bangkok Tour Package - 4 Days 3 Nights',
      location: 'Bangkok, Thailand',
      duration: '4 Days 3 Nights',
      price: 2500000,
      originalPrice: 3000000,
      rating: 4.8,
      reviews: 24,
      participants: '2-8 pax',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Paket wisata lengkap ke Bangkok dengan hotel bintang 4, transportasi AC, dan tour guide profesional.',
      features: ['Hotel bintang 4', 'Transportasi AC', 'Guide berbahasa Indonesia', 'Makan sesuai itinerary']
    },
    {
      id: 2,
      title: 'Bali 3D2N Tour Package',
      location: 'Bali, Indonesia',
      duration: '3 Days 2 Nights',
      price: 1500000,
      originalPrice: 1800000,
      rating: 4.9,
      reviews: 156,
      participants: '2-6 pax',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Paket wisata Bali dengan destinasi populer seperti Ubud, Kuta, dan Tanah Lot.',
      features: ['Hotel bintang 3', 'Transportasi AC', 'Guide lokal', 'Tiket masuk tempat wisata']
    },
    {
      id: 3,
      title: 'Singapore 4D3N Tour Package',
      location: 'Singapore',
      duration: '4 Days 3 Nights',
      price: 3500000,
      originalPrice: 4000000,
      rating: 4.7,
      reviews: 89,
      participants: '2-4 pax',
      status: 'inactive',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      description: 'Paket wisata Singapore dengan Universal Studios, Marina Bay Sands, dan Sentosa Island.',
      features: ['Hotel bintang 4', 'Transportasi MRT', 'Guide berbahasa Inggris', 'Tiket Universal Studios']
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

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPackages = filteredPackages.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paket Wisata</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola paket wisata yang tersedia
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/dashboard/services/packages/create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Paket
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Paket Wisata ({filteredPackages.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Durasi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Pax</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Harga</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={pkg.image}
                          alt={pkg.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pkg.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{pkg.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{pkg.duration}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{pkg.participants}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Rp {pkg.price.toLocaleString()}
                        </p>
                        {pkg.originalPrice > pkg.price && (
                          <p className="text-sm text-gray-500 line-through">
                            Rp {pkg.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {pkg.rating} ({pkg.reviews})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(pkg.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/services/packages/edit/${pkg.id}`)}
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPackages.length)} dari {filteredPackages.length} paket
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
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{packages.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Paket</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {packages.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {packages.filter(p => p.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tidak Aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {(packages.reduce((acc, pkg) => acc + pkg.rating, 0) / packages.length).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
