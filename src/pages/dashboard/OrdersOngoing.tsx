import React, { useState } from 'react';
import { Calendar, Users, Package, Car, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrdersOngoing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const orders = [
    {
      id: 'ORD-002',
      customerName: 'Sari Dewi',
      category: 'Armada',
      title: 'Toyota Hiace Premio',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      participants: 12,
      status: 'ongoing',
      totalAmount: 2400000,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      progress: 60
    },
    {
      id: 'ORD-005',
      customerName: 'Dicky Pratama',
      category: 'Paket Wisata',
      title: 'Singapore 4D3N Tour Package',
      startDate: '2024-01-28',
      endDate: '2024-01-31',
      participants: 3,
      status: 'ongoing',
      totalAmount: 7500000,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      progress: 25
    }
  ];

  const getCategoryIcon = (category: string) => {
    return category === 'Paket Wisata' ? <Package className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Button variant="outline" className="w-full">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={order.image}
                  alt={order.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {order.title}
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          Berlangsung
                        </Badge>
                      </div>
                      <div className="border-b border-gray-200 dark:border-gray-700 mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Order ID: {order.id} • Customer: {order.customerName}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center space-x-1">
                          {getCategoryIcon(order.category)}
                          <span>{order.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{order.startDate} - {order.endDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{order.participants} pax</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">{order.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        Rp {order.totalAmount.toLocaleString()}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline">
                          Update Status
                        </Button>
                        <Button size="sm">
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Berlangsung</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {orders.reduce((acc, order) => acc + order.progress, 0) / orders.length}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                Rp {orders.reduce((acc, order) => acc + order.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
