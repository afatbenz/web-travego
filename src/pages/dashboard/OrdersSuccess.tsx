import React, { useState } from 'react';
import { Calendar, Users, Package, Car, Search, Filter, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrdersSuccess: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const orders = [
    {
      id: 'ORD-001',
      customerName: 'Ahmad Rizki',
      category: 'Paket Wisata',
      title: 'Thailand Bangkok Tour Package - 4 Days 3 Nights',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      participants: 4,
      status: 'success',
      totalAmount: 10000000,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      rating: 5,
      review: 'Pelayanan sangat memuaskan, tour guide profesional dan destinasi sesuai ekspektasi.'
    },
    {
      id: 'ORD-004',
      customerName: 'Maya Sari',
      category: 'Armada',
      title: 'Innova Reborn',
      startDate: '2024-01-30',
      endDate: '2024-02-02',
      participants: 6,
      status: 'success',
      totalAmount: 1800000,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      rating: 4,
      review: 'Kendaraan bersih dan nyaman, driver ramah dan berpengalaman.'
    },
    {
      id: 'ORD-006',
      customerName: 'Lisa Anggraini',
      category: 'Paket Wisata',
      title: 'Yogyakarta 3D2N Cultural Tour',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      participants: 2,
      status: 'success',
      totalAmount: 2500000,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
      rating: 5,
      review: 'Paket wisata budaya yang sangat informatif, recommended!'
    }
  ];

  const getCategoryIcon = (category: string) => {
    return category === 'Paket Wisata' ? <Package className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Sukses</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Pesanan yang telah selesai dengan sukses
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
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Sukses
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
                      
                      {/* Rating & Review */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating:</span>
                          <div className="flex items-center space-x-1">
                            {renderStars(order.rating)}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">({order.rating}/5)</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{order.review}"
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        Rp {order.totalAmount.toLocaleString()}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline">
                          Lihat Review
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Sukses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {(orders.reduce((acc, order) => acc + order.rating, 0) / orders.length).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                Rp {orders.reduce((acc, order) => acc + order.totalAmount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
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
