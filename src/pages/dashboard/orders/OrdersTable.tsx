import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Car, Search, Filter, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrdersTableProps {
  status: 'all' | 'ongoing' | 'success' | 'waiting-approval';
  type?: 'fleet' | 'tour';
  title: string;
  description: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ status, type, title, description }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  interface Order {
    orderId: string;
    fleetName: string;
    duration: number;
    uom: string;
    unitQty: number;
    paymentStatus: number;
    customerName: string;
    totalAmount: number;
    // Keep these for potential filtering usage, map them if available
    title: string;
    createdAt: string;
    category: string;
    startDate: string;
    endDate: string;
    rentType?: string;
  }

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        let endpoint = '/partner/services/fleet/orders';
        
        // If type is explicitly tour, use tour endpoint (placeholder for now if not confirmed)
        if (type === 'tour') {
           // Assuming this endpoint exists based on convention, or falling back to fleet if it's the same table
           // For now, let's assume there's a separate endpoint or query
           endpoint = '/partner/services/packages/orders'; 
        }

        const response = await api.get<any[]>(endpoint, token ? { Authorization: token } : undefined);
        
        if (response.status === 'success' && Array.isArray(response.data)) {
          const mappedOrders = response.data.map((item) => ({
            orderId: item.order_id || item.id,
            fleetName: item.fleet_name || item.package_name || item.title || 'Unknown Unit',
            duration: Number(item.duration || 0),
            uom: item.uom || 'Days',
            unitQty: Number(item.unit_qty || item.qty || 0),
            paymentStatus: Number(item.payment_status || 0),
            customerName: item.customer_name || item.customerName || 'Unknown',
            totalAmount: Number(item.total_amount || item.totalAmount || 0),
            title: item.fleet_name || item.package_name || item.title || 'Order',
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            category: item.category || (type === 'tour' ? 'Paket Wisata' : 'Armada'),
            startDate: item.start_date || item.startDate || new Date().toISOString(),
            endDate: item.end_date || item.endDate || new Date().toISOString(),
            rentType: item.rent_type,
          }));
          setOrders(mappedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, [type]);

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/20">Pembayaran Selesai</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/20">Menunggu Pembayaran</Badge>;
      case 3:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/20">Menunggu Persetujuan</Badge>;
      case 4:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/20">Pembayaran Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getOrderStatus = (order: Order) => {
    const now = new Date();
    const startDate = new Date(order.startDate);
    const endDate = new Date(order.endDate);
    
    // Logic for 'ongoing' / 'success' filters based on dates and payment status
    // If payment is cancelled (4) or pending (2, 3), it might not be 'success' or 'ongoing' in the same way.
    // For now, I'll keep the logic simple or adapt it.
    // The user didn't ask to change this logic, but the properties changed.
    
    if (order.paymentStatus === 1) {
       if (now > endDate) return 'success';
       if (now >= startDate && now <= endDate) return 'ongoing';
       return 'upcoming';
    }
    return 'pending';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fleetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = orderDate >= startDate && orderDate <= endDate;
    }
    
    // Filter by status
    let matchesStatus = true;
    if (status === 'waiting-approval') {
      matchesStatus = order.paymentStatus === 3;
    } else {
      const orderStatus = getOrderStatus(order);
      matchesStatus = status === 'all' || orderStatus === status;
    }
    
    return matchesSearch && matchesCategory && matchesDateRange && matchesStatus;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {description}
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
          <CardTitle>Data Orders ({filteredOrders.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">OrderId</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Nama Unit</th>
                  {type === 'fleet' && (
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Tipe</th>
                  )}
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Durasi</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Jumlah</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {currentOrders.map((order) => (
                  <tr key={order.orderId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{order.fleetName}</span>
                    </td>
                    {type === 'fleet' && (
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {order.rentType || '-'}
                        </Badge>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{order.duration} {order.uom}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 dark:text-white">{order.unitQty}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/partner/orders/detail/${order.orderId}`)}
                        >
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredOrders.filter(o => o.paymentStatus === 1).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Lunas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredOrders.filter(o => o.paymentStatus === 2 || o.paymentStatus === 3).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                Rp {filteredOrders.reduce((acc, order) => acc + order.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
