import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Eye, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  MapPin,
  Users,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample order data
const orderHistory = [
  {
    id: "ORD-2024-001",
    type: "catalog",
    title: "Thailand Bangkok Tour Package - 4 Days 3 Nights",
    date: "2024-01-15",
    status: "completed",
    amount: "Rp 5.000.000",
    participants: 2,
    image: "https://images.unsplash.com/photo-1528181941400-9d289170254f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    location: "Bangkok, Thailand",
    duration: "4 Hari 3 Malam"
  },
  {
    id: "ORD-2023-005",
    type: "armada",
    title: "Sewa Toyota Hiace Premio - 3 Hari",
    date: "2023-12-01",
    status: "completed",
    amount: "Rp 3.600.000",
    participants: 10,
    image: "https://www.balialphardrental.com/wp-content/uploads/2024/11/Hiace-premio.jpg",
    location: "Jakarta - Bandung",
    duration: "3 Hari"
  },
  {
    id: "ORD-2023-004",
    type: "catalog",
    title: "Bali Honeymoon Package - 5 Days 4 Nights",
    date: "2023-11-20",
    status: "pending",
    amount: "Rp 8.000.000",
    participants: 2,
    image: "https://images.unsplash.com/photo-1537996194471-bd805c7fe615?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    location: "Bali, Indonesia",
    duration: "5 Hari 4 Malam"
  },
  {
    id: "ORD-2023-003",
    type: "armada",
    title: "Sewa Toyota Alphard - 1 Hari",
    date: "2023-10-10",
    status: "cancelled",
    amount: "Rp 2.000.000",
    participants: 4,
    image: "https://sewamobilpalingmurah.com/wp-content/uploads/2024/07/Biaya-Pajak-Mobil-Toyota-Alphard-Berdasarkan-Tahun-dan-Tipe.jpg",
    location: "Jakarta",
    duration: "1 Hari"
  },
  {
    id: "ORD-2023-002",
    type: "catalog",
    title: "Explore Raja Ampat - 7 Days 6 Nights",
    date: "2023-09-05",
    status: "completed",
    amount: "Rp 12.000.000",
    participants: 1,
    image: "https://images.unsplash.com/photo-1619453600086-ae1563672d12?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    location: "Raja Ampat, Indonesia",
    duration: "7 Hari 6 Malam"
  },
  {
    id: "ORD-2023-001",
    type: "armada",
    title: "Sewa Bus Pariwisata - 2 Hari",
    date: "2023-08-15",
    status: "completed",
    amount: "Rp 4.500.000",
    participants: 25,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    location: "Yogyakarta - Solo",
    duration: "2 Hari"
  }
];

export const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const itemsPerPage = 4;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Selesai</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Dibatalkan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Menunggu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter orders based on search term and filters
  const filteredOrders = orderHistory.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Pesanan Saya
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Kelola dan pantau semua pesanan Anda
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari pesanan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Semua Status</option>
                  <option value="completed" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Selesai</option>
                  <option value="pending" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Menunggu</option>
                  <option value="cancelled" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Dibatalkan</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Semua Tipe</option>
                  <option value="catalog" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Paket Wisata</option>
                  <option value="armada" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Sewa Armada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {currentOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                  {/* Image */}
                  <img
                    src={order.image}
                    alt={order.title}
                    className="w-full lg:w-24 h-24 object-cover rounded-lg"
                  />
                  
                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {order.title}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>ID: {order.id}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(order.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{order.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{order.participants} {order.type === 'catalog' ? 'pax' : 'orang'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status and Amount */}
                      <div className="flex flex-col items-end space-y-2 mt-4 lg:mt-0">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {order.amount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {order.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                      {order.status === 'pending' && (
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Bayar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} dari {filteredOrders.length} pesanan
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tidak ada pesanan ditemukan
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Coba ubah filter atau kata kunci pencarian Anda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
