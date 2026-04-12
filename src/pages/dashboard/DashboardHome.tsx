import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, ShoppingBag, MessageSquare, TrendingUp, Car, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const DashboardHome: React.FC = () => {
  const location = useLocation();
  const isPartnerDashboard = location.pathname.startsWith('/dashboard/partner');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPercentage, setOrderPercentage] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customerPercentage, setCustomerPercentage] = useState(0);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const formatDdMmmYyFromDate = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()] ?? '';
    const year = String(d.getFullYear() % 100).padStart(2, '0');
    return `${day} ${month} ${year}`.trim();
  };

  useEffect(() => {
    if (!isPartnerDashboard) return;
    if (dateRange?.from) return;
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    setDateRange({ from: startOfDay(lastYear), to: endOfDay(today) });
  }, [dateRange?.from, isPartnerDashboard]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      const token = localStorage.getItem('token');
      try {
        const response = await api.get<unknown>('/dashboard', token ? { Authorization: token } : undefined);
        if (response.status !== 'success' || !response.data || typeof response.data !== 'object') return;
        const root = response.data as Record<string, unknown>;
        const transactionNode = root.transaction;
        if (transactionNode && typeof transactionNode === 'object') {
          const t = transactionNode as Record<string, unknown>;
          const nextTotal = Number(t.total_order ?? 0);
          const nextPct = Number(t.order_percentage ?? 0);
          if (Number.isFinite(nextTotal)) setTotalOrders(nextTotal);
          if (Number.isFinite(nextPct)) setOrderPercentage(nextPct);
        }
        const customersNode = root.customers;
        if (customersNode && typeof customersNode === 'object') {
          const c = customersNode as Record<string, unknown>;
          const nextTotal = Number(c.total_customers ?? 0);
          const nextPct = Number(c.customer_percentage ?? 0);
          if (Number.isFinite(nextTotal)) setTotalCustomers(nextTotal);
          if (Number.isFinite(nextPct)) setCustomerPercentage(nextPct);
        }
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, []);

  const summaryCards = [
    {
      title: 'Total Pesanan',
      value: totalOrders.toLocaleString('id-ID'),
      change: `${orderPercentage >= 0 ? '+' : ''}${orderPercentage}%`,
      changeType: orderPercentage >= 0 ? 'increase' : 'decrease',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Jumlah Anggota',
      value: totalCustomers.toLocaleString('id-ID'),
      change: `${customerPercentage >= 0 ? '+' : ''}${customerPercentage}%`,
      changeType: customerPercentage >= 0 ? 'increase' : 'decrease',
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
        {isPartnerDashboard ? (
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal h-10 md:max-w-[320px]">
                {dateRange?.from && dateRange?.to
                  ? `${formatDdMmmYyFromDate(dateRange.from)} - ${formatDdMmmYyFromDate(dateRange.to)}`
                  : 'Pilih rentang'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <UiCalendar
                mode="range"
                numberOfMonths={1}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) setDatePickerOpen(false);
                  else setDatePickerOpen(true);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">
            Selamat datang kembali! Berikut adalah ringkasan aktivitas bisnis Anda.
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {loadingDashboard
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={`s-${i}`} className="animate-pulse">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card, index) => (
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
              {loadingDashboard ? (
                <div className="h-64 lg:h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
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
                        formatter={(value: number | string) => [formatCurrency(Number(value)), 'Revenue']}
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
              )}
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
              {loadingDashboard ? (
                <div className="h-48 lg:h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <>
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
                        <Tooltip formatter={(value: number | string) => [`${value}%`, 'Percentage']} />
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg lg:text-xl">
              <UiCalendar className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
              Monthly Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDashboard ? (
              <div className="h-48 lg:h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
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
                      formatter={(value: number | string) => [value, 'Bookings']}
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
            )}
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
              {loadingDashboard
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`s-${i}`}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))
                : recentBookings.map((booking) => (
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
