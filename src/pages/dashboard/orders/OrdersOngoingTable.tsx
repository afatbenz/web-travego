import React, { useState } from 'react';
import { Package, Car, Search, Filter, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrdersOngoingTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const orders = [
    {
      id: 'ORD-002',
      customerName: 'Sari Dewi',
      customerEmail: 'sari.dewi@email.com',
      customerPhone: '081234567891',
      category: 'Armada',
      title: 'Toyota Hiace Premio',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      participants: 12,
      status: 'ongoing',
      totalAmount: 2400000,
      createdAt: '2024-01-15',
      paymentStatus: 'paid',
      progress: 60,
      currentDay: 2,
      totalDays: 3
    },
    {
      id: 'ORD-005',
      customerName: 'Dicky Pratama',
      customerEmail: 'dicky.pratama@email.com',
      customerPhone: '081234567894',
      category: 'Paket Wisata',
      title: 'Singapore 4D3N Tour Package',
      startDate: '2024-01-28',
      endDate: '2024-01-31',
      participants: 3,
      status: 'ongoing',
      totalAmount: 7500000,
      createdAt: '2024-01-22',
      paymentStatus: 'paid',
      progress: 25,
      currentDay: 1,
      totalDays: 4
    },
    {
      id: 'ORD-009',
      customerName: 'Andi Wijaya',
      customerEmail: 'andi.wijaya@email.com',
      customerPhone: '081234567898',
      category: 'Armada',
      title: 'Fortuner 4x4',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      participants: 7,
      status: 'ongoing',
      totalAmount: 3500000,
      createdAt: '2024-01-28',
      paymentStatus: 'paid',
      progress: 80,
      currentDay: 4,
      totalDays: 5
    },
    {
      id: 'ORD-010',
      customerName: 'Rina Sari',
      customerEmail: 'rina.sari@email.com',
      customerPhone: '081234567899',
      category: 'Paket Wisata',
      title: 'Japan Tokyo 7D6N Tour',
      startDate: '2024-02-03',
      endDate: '2024-02-09',
      participants: 2,
      status: 'ongoing',
      totalAmount: 15000000,
      createdAt: '2024-01-30',
      paymentStatus: 'paid',
      progress: 15,
      currentDay: 1,
      totalDays: 7
    }
  ];

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Lunas</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === 'Paket Wisata' ? <Package className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = orderDate >= startDate && orderDate <= endDate;
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Berlangsung</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Monitor pesanan yang sedang berlangsung
          </p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Paket Wisata">Paket Wisata</SelectItem>
                <SelectItem value="Armada">Armada</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Tanggal Mulai"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="Tanggal Akhir"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
            <Button variant="outline" className="w-full">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Orders Berlangsung ({filteredOrders.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Kategori</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Paket/Armada</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Progress</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Pax</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Pembayaran</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">{order.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{order.customerEmail}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(order.category)}
                        <span className="text-sm text-gray-600 dark:text-gray-300">{order.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{order.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">Start: {order.startDate}</p>
                        <p className="text-gray-600 dark:text-gray-300">End: {order.endDate}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Day {order.currentDay}/{order.totalDays}</span>
                          <span className="text-gray-900 dark:text-white font-medium">{order.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-white">{order.participants}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Rp {order.totalAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
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
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} dari {filteredOrders.length} order
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Berlangsung</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(orders.reduce((acc, order) => acc + order.progress, 0) / orders.length)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                Rp {orders.reduce((acc, order) => acc + order.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {orders.reduce((acc, order) => acc + order.participants, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Pax</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
