import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Car, Calendar, Users, MapPin, Phone, Mail, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ItineraryDay = {
  day: number;
  date: string;
  activities: string[];
};

type OrderData = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  category: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: number;
  status: string;
  totalAmount: number;
  originalAmount: number;
  discount: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string;
  pickupLocation: string;
  pickupTime: string;
  itinerary: ItineraryDay[];
  facilities: string[];
  additionalRequests: string;
  notes: string;
};

const createEmptyOrderData = (id: string): OrderData => ({
  id,
  customerName: '-',
  customerEmail: '-',
  customerPhone: '-',
  customerAddress: '-',
  category: 'Armada',
  title: 'Order',
  description: '-',
  startDate: '',
  endDate: '',
  participants: 0,
  status: 'pending',
  totalAmount: 0,
  originalAmount: 0,
  discount: 0,
  createdAt: '',
  paymentStatus: 'pending',
  paymentMethod: '-',
  paymentDate: '',
  pickupLocation: '-',
  pickupTime: '-',
  itinerary: [],
  facilities: [],
  additionalRequests: '-',
  notes: '-',
});

export const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const routeOrderId = params.transaction_id ?? params.order_id ?? params.id ?? '';
  const orderId = params.order_id;
  const [orderData, setOrderData] = useState<OrderData>(() => createEmptyOrderData(routeOrderId || '-'));

  useEffect(() => {
    setOrderData(createEmptyOrderData(routeOrderId || '-'));
  }, [routeOrderId]);

  useEffect(() => {
    if (!orderId) return;

    const fetchDetail = async () => {
      const token = localStorage.getItem('token');
      const response = await api.get<unknown>(`/services/fleet/order/detail/${orderId}`, token ? { Authorization: token } : undefined);
      if (response.status !== 'success') return;

      const record = (v: unknown): Record<string, unknown> =>
        v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
      const root = record(response.data);
      const detail = record(root.order ?? root.transaction ?? root.detail ?? root);

      const getString = (v: unknown, fallback: string) =>
        typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : fallback;
      const getNumber = (v: unknown, fallback: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      const pickup = record(detail.pickup);
      const customer = record(detail.customer);
      const payment = record(detail.payment);
      const addonsRaw = detail.addon;
      const addons = Array.isArray(addonsRaw) ? (addonsRaw as unknown[]) : [];

      const normalizePaymentStatus = (raw: unknown): 'paid' | 'pending' | 'failed' => {
        if (raw === 1 || raw === '1' || raw === 'paid' || raw === 'lunas') return 'paid';
        if (raw === 4 || raw === '4' || raw === 'failed' || raw === 'gagal') return 'failed';
        if (raw === 2 || raw === '2' || raw === 3 || raw === '3') return 'pending';
        if (typeof raw === 'string') {
          const s = raw.toLowerCase().trim();
          if (s === 'paid' || s === 'lunas' || s === 'success') return 'paid';
          if (s === 'failed' || s === 'gagal' || s === 'cancelled') return 'failed';
          if (s === '' || s === 'pending' || s === 'unpaid') return 'pending';
        }
        return 'pending';
      };

      const paymentStatus = normalizePaymentStatus(detail.payment_status ?? payment.status ?? payment.payment_status);

      const quantity = getNumber(detail.quantity ?? detail.qty ?? detail.unit_qty ?? detail.unitQty, 0);
      const price = getNumber(detail.price, 0);
      const totalAmount = getNumber(detail.total_amount ?? detail.totalAmount, 0);
      const originalAmount = price > 0 && quantity > 0 ? price * quantity : getNumber(detail.original_amount ?? detail.originalAmount, totalAmount);
      const discount = Math.max(0, originalAmount - totalAmount);

      const startDate = getString(pickup.start_date ?? pickup.startDate, '');
      const endDate = getString(pickup.end_date ?? pickup.endDate, '');
      const createdAt = getString(detail.order_date ?? detail.created_at ?? detail.createdAt, startDate || endDate || '');
      const paymentDate = getString(payment.payment_date ?? payment.paymentDate ?? detail.payment_date ?? detail.paymentDate, createdAt);

      const customerCity = getString(customer.city_label ?? customer.customer_city ?? customer.city, '');
      const customerAddressRaw = getString(customer.customer_address ?? customer.address, '-');
      const customerAddress = customerCity ? `${customerAddressRaw}, ${customerCity}` : customerAddressRaw;

      const pickupCityLabel = getString(pickup.city_label ?? pickup.pickup_city_label ?? '', '');
      const pickupLocationRaw = getString(pickup.pickup_location ?? pickup.pickupLocation, '-');
      const pickupLocation = pickupCityLabel ? `${pickupLocationRaw}, ${pickupCityLabel}` : pickupLocationRaw;

      const duration = getNumber(detail.duration, 0);
      const durationUom = getString(detail.duration_uom ?? detail.uom, '');
      const rentTypeLabel = getString(detail.rent_type_label ?? detail.rentTypeLabel, '');
      const fallbackDescriptionParts = [
        duration > 0 ? `Sewa ${duration}${durationUom ? ` ${durationUom}` : ''}` : '',
        rentTypeLabel,
      ].filter(Boolean);
      const description = fallbackDescriptionParts.length ? fallbackDescriptionParts.join(' • ') : '-';

      const facilities = addons
        .map((a) => (a && typeof a === 'object' ? (a as Record<string, unknown>) : {}))
        .map((a) => {
          const name = getString(a.addon_name ?? a.name, '');
          const priceValue = getNumber(a.addon_price ?? a.price, 0);
          if (!name) return '';
          if (priceValue > 0) return `${name} - Rp ${priceValue.toLocaleString('id-ID')}`;
          return name;
        })
        .filter(Boolean);

      const rawItinerary = Array.isArray(detail.itinerary) ? (detail.itinerary as any[]) : [];
      const groupedItinerary: Record<number, ItineraryDay> = {};

      rawItinerary.forEach((item) => {
         const dayNum = getNumber(item.day, 1);
         const activityRaw = item.destination ?? item.activities ?? item.activity;
         if (!activityRaw) return;

         if (!groupedItinerary[dayNum]) {
           let dayDate = getString(item.date, '');
           if (!dayDate && startDate) {
             const baseDate = new Date(startDate);
             if (!isNaN(baseDate.getTime())) {
               baseDate.setDate(baseDate.getDate() + (dayNum - 1));
               dayDate = baseDate.toISOString().split('T')[0];
             }
           }

           groupedItinerary[dayNum] = {
             day: dayNum,
             date: dayDate,
             activities: [],
           };
         }
         
         if (Array.isArray(activityRaw)) {
            groupedItinerary[dayNum].activities.push(...activityRaw.map(a => getString(a, '')));
          } else {
            const cityName = getString(item.city_label ?? item.city_name ?? '', '');
            const destination = getString(activityRaw, '');
            const activityText = cityName ? `${destination}, ${cityName}` : destination;
            groupedItinerary[dayNum].activities.push(activityText);
          }
       });

      const itinerary = Object.values(groupedItinerary).sort((a, b) => a.day - b.day);

      const next: OrderData = {
        ...createEmptyOrderData(orderId),
        id: getString(detail.order_id ?? detail.id, orderId),
        customerName: getString(customer.customer_name ?? customer.customerName, '-'),
        customerEmail: getString(customer.customer_email ?? customer.customerEmail, '-'),
        customerPhone: getString(customer.customer_phone ?? customer.customerPhone, '-'),
        customerAddress,
        category: getString(detail.rent_type_label, 'Armada'),
        title: getString(detail.fleet_name ?? detail.package_name ?? detail.title, 'Order'),
        description,
        startDate,
        endDate,
        participants: quantity,
        status: getString(detail.status, paymentStatus === 'paid' ? 'success' : 'pending'),
        totalAmount,
        originalAmount,
        discount,
        createdAt,
        paymentStatus,
        paymentMethod: getString(payment.payment_method ?? payment.paymentMethod ?? detail.payment_method ?? detail.paymentMethod, '-'),
        paymentDate,
        pickupLocation,
        pickupTime: getString(pickup.pickup_time ?? pickup.pickupTime, '-'),
        itinerary,
        facilities: facilities.length ? facilities : Array.isArray(detail.facilities) ? (detail.facilities as string[]) : [],
        additionalRequests: getString(detail.additional_request ?? detail.additional_requests ?? detail.additionalRequests, '-'),
        notes: getString(detail.notes, '-'),
      };

      setOrderData(next);
    };

    fetchDetail();
  }, [orderId]);

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

  const formatDateTime = (value: string) => {
    if (!value) return '-';
    const raw = value.trim();
    let d: Date | null = null;

    const m1 = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m1) {
      const y = Number(m1[1]);
      const mo = Number(m1[2]) - 1;
      const day = Number(m1[3]);
      d = new Date(y, mo, day, 0, 0, 0, 0);
    }

    const m2 = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!d && m2) {
      const y = Number(m2[1]);
      const mo = Number(m2[2]) - 1;
      const day = Number(m2[3]);
      const hh = Number(m2[4]);
      const mm = Number(m2[5]);
      const ss = Number(m2[6] ?? 0);
      d = new Date(y, mo, day, hh, mm, ss, 0);
    }

    if (!d) {
      const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime())) d = parsed;
    }

    if (!d || isNaN(d.getTime())) return '-';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = months[d.getMonth()] ?? '';
    const yyyy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mmm} ${yyyy} ${hh}:${mm}`.trim();
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
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
                <span>Informasi Pesanan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Kategori</label>
                <p className="text-gray-900 dark:text-white">{orderData.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Pesanan</label>
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
                    <span>{formatDateTime(orderData.startDate)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Selesai</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(orderData.endDate)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jumlah Armada</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <Car className="h-4 w-4" />
                    <span>{orderData.participants} unit</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Lokasi Pickup</label>
                  <p className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{orderData.pickupLocation}</span>
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
                {orderData.itinerary?.map((day, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Hari {day.day}</h4>
                      <span className="text-sm text-gray-600 dark:text-gray-300">({formatDate(day.date)})</span>
                    </div>
                    <ul className="space-y-1">
                      {day.activities?.map((activity, actIndex) => (
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
                {orderData.facilities?.map((facility, index) => (
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
