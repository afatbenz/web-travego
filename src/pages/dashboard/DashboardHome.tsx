import React from 'react';
import { Users, ShoppingBag, MessageSquare, TrendingUp, Car, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const DashboardHome: React.FC = () => {
  const summaryCards = [
    {
      title: 'Total Pesanan',
      value: '1,247',
      change: '+12%',
      changeType: 'increase',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Jumlah Anggota',
      value: '342',
      change: '+3%',
      changeType: 'increase',
      icon: Users,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Pesan Masuk',
      value: '89',
      change: '+8%',
      changeType: 'increase',
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: 'Rp 245.8M',
      change: '+18%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const monthlyData = [
    { month: 'Jan', revenue: 120000000, bookings: 98 },
    { month: 'Feb', revenue: 135000000, bookings: 112 },
    { month: 'Mar', revenue: 149000000, bookings: 128 },
    { month: 'Apr', revenue: 162000000, bookings: 145 },
    { month: 'May', revenue: 178000000, bookings: 159 },
    { month: 'Jun', revenue: 195000000, bookings: 174 },
    { month: 'Jul', revenue: 212000000, bookings: 189 },
    { month: 'Aug', revenue: 228000000, bookings: 203 },
    { month: 'Sep', revenue: 234000000, bookings: 218 },
    { month: 'Oct', revenue: 241000000, bookings: 225 },
    { month: 'Nov', revenue: 245000000, bookings: 234 },
    { month: 'Dec', revenue: 248000000, bookings: 247 }
  ];

  const serviceData = [
    { name: 'Rental Mobil', value: 45, color: '#3b82f6' },
    { name: 'Travel', value: 30, color: '#10b981' },
    { name: 'Paket Wisata', value: 20, color: '#f59e0b' },
    { name: 'Airport Transfer', value: 5, color: '#ef4444' }
  ];

  const recentBookings = [
    {
      id: 'BK-001',
      customer: 'Ahmad Santoso',
      service: 'Paket Wisata Bali',
      amount: 'Rp 2,500,000',
      status: 'confirmed',
      date: '2025-01-15'
    },
    {
      id: 'BK-002',
      customer: 'Sari Dewi',
      service: 'Rental Mobil Jakarta',
      amount: 'Rp 400,000',
      status: 'pending',
      date: '2025-01-15'
    },
    {
      id: 'BK-003',
      customer: 'Budi Pratama',
      service: 'Travel Jogja-Jakarta',
      amount: 'Rp 150,000',
      status: 'completed',
      date: '2025-01-14'
    },
    {
      id: 'BK-004',
      customer: 'Maya Sari',
      service: 'Airport Transfer',
      amount: 'Rp 200,000',
      status: 'confirmed',
      date: '2025-01-14'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">
          Selamat datang kembali! Berikut adalah ringkasan aktivitas bisnis Anda.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    {card.title}
                  </p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 lg:mt-2">
                    {card.value}
                  </p>
                  <div className="flex items-center mt-1 lg:mt-2">
                    <span className={`text-xs lg:text-sm font-medium ${
                      card.changeType === 'increase' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {card.change}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 hidden sm:inline">
                      from last month
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 ${card.color} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg lg:text-xl">
                <DollarSign className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="month" 
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).slice(0, -3) + 'K'}
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Distribution */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg lg:text-xl">
                <Car className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Service Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3 lg:mt-4">
                {serviceData.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div 
                        className="w-2 h-2 lg:w-3 lg:h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white ml-2">
                      {service.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg lg:text-xl">
              <Calendar className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
              Monthly Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <YAxis className="text-gray-600 dark:text-gray-400" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Bookings']}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg lg:text-xl">
              <MapPin className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm lg:text-base truncate">
                        {booking.customer}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)} flex-shrink-0 ml-2`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {booking.service}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">
                        {booking.amount}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};