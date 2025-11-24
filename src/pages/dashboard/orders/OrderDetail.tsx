import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Car, Calendar, Users, MapPin, Phone, Mail, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();

  // Sample order data - in real app, this would be fetched based on id
  const orderData = {
    id: 'ORD-001',
    customerName: 'Ahmad Rizki',
    customerEmail: 'ahmad.rizki@email.com',
    customerPhone: '081234567890',
    customerAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
    category: 'Paket Wisata',
    title: 'Thailand Bangkok Tour Package - 4 Days 3 Nights',
    description: 'Paket wisata ke Bangkok dengan mengunjungi tempat-tempat wisata terkenal seperti Grand Palace, Wat Pho, dan Chatuchak Market.',
    startDate: '2024-01-15',
    endDate: '2024-01-18',
    participants: 4,
    status: 'success',
    totalAmount: 10000000,
    originalAmount: 12000000,
    discount: 2000000,
    createdAt: '2024-01-10',
    paymentStatus: 'paid',
    paymentMethod: 'Bank Transfer',
    paymentDate: '2024-01-12',
    pickupLocation: 'Bandara Soekarno-Hatta',
    pickupTime: '06:00',
    itinerary: [
      {
        day: 1,
        date: '2024-01-15',
        activities: [
          'Tiba di Bangkok',
          'Check-in hotel',
          'City tour Bangkok',
          'Makan malam di restoran lokal'
        ]
      },
      {
        day: 2,
        date: '2024-01-16',
        activities: [
          'Kunjungi Grand Palace',
          'Wat Pho Temple',
          'Shopping di Chatuchak Market',
          'Makan siang di floating market'
        ]
      },
      {
        day: 3,
        date: '2024-01-17',
        activities: [
          'Day trip ke Ayutthaya',
          'Kunjungi historical park',
          'Makan siang di Ayutthaya',
          'Kembali ke Bangkok'
        ]
      },
      {
        day: 4,
        date: '2024-01-18',
        activities: [
          'Free time untuk shopping',
          'Check-out hotel',
          'Transfer ke airport',
          'Pulang ke Jakarta'
        ]
      }
    ],
    facilities: [
      'Transportasi airport-hotel-airport',
      'Akomodasi hotel 3 bintang',
      'Makan 3x sehari',
      'Tiket masuk tempat wisata',
      'Tour guide berbahasa Indonesia',
      'Asuransi perjalanan'
    ],
    additionalRequests: 'Mohon disiapkan kursi roda untuk 1 peserta yang memiliki keterbatasan mobilitas.',
    notes: 'Customer meminta untuk tidak mengunjungi tempat yang terlalu ramai karena ada anggota keluarga yang mudah panik.'
  };

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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Selesai</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Berlangsung</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Menunggu</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === 'Paket Wisata' ? <Package className="h-5 w-5" /> : <Car className="h-5 w-5" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="!w-auto !h-auto p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detail Order {orderData.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Informasi lengkap pesanan pelanggan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getOrderStatusBadge(orderData.status)}
          {getPaymentStatusBadge(orderData.paymentStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Informasi Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Lengkap</label>
                  <p className="text-gray-900 dark:text-white">{orderData.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{orderData.customerEmail}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nomor Telepon</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{orderData.customerPhone}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Alamat</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{orderData.customerAddress}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getCategoryIcon(orderData.category)}
                <span>Informasi Paket</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Kategori</label>
                <p className="text-gray-900 dark:text-white">{orderData.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Paket</label>
                <p className="text-gray-900 dark:text-white text-lg font-medium">{orderData.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi</label>
                <p className="text-gray-900 dark:text-white">{orderData.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Mulai</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(orderData.startDate)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Selesai</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(orderData.endDate)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jumlah Peserta</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{orderData.participants} orang</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Itinerary Perjalanan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.itinerary.map((day, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Hari {day.day}</h4>
                      <span className="text-sm text-gray-600 dark:text-gray-300">({formatDate(day.date)})</span>
                    </div>
                    <ul className="space-y-1">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="text-sm text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card>
            <CardHeader>
              <CardTitle>Fasilitas yang Disediakan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {orderData.facilities.map((facility, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-900 dark:text-white">{facility}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Permintaan Khusus</label>
                <p className="text-gray-900 dark:text-white">{orderData.additionalRequests}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Catatan</label>
                <p className="text-gray-900 dark:text-white">{orderData.notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Informasi Pembayaran</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Status Pembayaran</label>
                <div className="mt-1">{getPaymentStatusBadge(orderData.paymentStatus)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Metode Pembayaran</label>
                <p className="text-gray-900 dark:text-white">{orderData.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">Tanggal Pembayaran</label>
                <p className="text-gray-900 dark:text-white">{formatDate(orderData.paymentDate)}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Harga Awal</span>
                  <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(orderData.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Diskon</span>
                  <span className="text-sm text-red-600">-{formatCurrency(orderData.discount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(orderData.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickup Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Informasi Pickup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Lokasi Pickup</label>
                <p className="text-gray-900 dark:text-white">{orderData.pickupLocation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Waktu Pickup</label>
                <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{orderData.pickupTime} WIB</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Order Dibuat</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Pembayaran Dikonfirmasi</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.paymentDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Dimulai</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Selesai</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{formatDate(orderData.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Kirim Email
              </Button>
              <Button className="w-full" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Hubungi Customer
              </Button>
              <Button className="w-full" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Update Pembayaran
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
