import React, { useCallback, useState } from 'react';
import { Calendar, Users, Package, Car, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';

type DetailAddon = {
  addon_name: string;
  addon_desc: string;
  addon_price: number;
  order_item_id: string;
};

type DetailFleetRow = {
  order_item_id: string;
  fleet_name: string;
  qty: number;
  unit_price: number;
  addons: DetailAddon[];
};

export const OrdersOngoing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState('');
  const [detailFleets, setDetailFleets] = useState<DetailFleetRow[]>([]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openDetailArmada = useCallback(async (orderId: string) => {
    const resolvedOrderId = (orderId || '').trim();
    if (!resolvedOrderId) return;

    setDetailOpen(true);
    setDetailOrderId(resolvedOrderId);
    setDetailLoading(true);
    setDetailFleets([]);

    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(
        `/services/fleet/order/detail/${encodeURIComponent(resolvedOrderId)}`,
        token ? { Authorization: token } : undefined
      );
      if (res.status !== 'success') return;

      const record = (v: unknown): Record<string, unknown> =>
        v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
      const root = record(res.data);
      const detail = record(root.order ?? root.transaction ?? root.detail ?? root.data ?? root);

      const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').trim();
      const getNumber = (v: unknown) => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        if (typeof v === 'string') {
          const cleaned = v.trim().replace(/[^\d-]/g, '');
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : 0;
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const addonsRaw =
        (root.addon ??
          detail.addon ??
          (root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).addon : undefined) ??
          (root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>).addons : undefined) ??
          detail.addons) as unknown;
      const addonsArr = Array.isArray(addonsRaw) ? (addonsRaw as unknown[]) : [];

      const addonsByOrderItemId = new Map<string, DetailAddon[]>();
      addonsArr
        .map((a) => record(a))
        .forEach((a) => {
          const order_item_id = getString(a.order_item_id ?? a.orderItemId ?? a.order_item ?? a.orderItem);
          if (!order_item_id) return;
          const addon_name = getString(a.addon_name ?? a.addonName ?? a.name ?? a.title);
          if (!addon_name) return;
          const addon_desc = getString(a.addon_desc ?? a.addonDesc ?? a.description ?? a.desc);
          const addon_price = getNumber(a.addon_price ?? a.addonPrice ?? a.price ?? a.amount ?? a.value);
          const item: DetailAddon = { addon_name, addon_desc, addon_price, order_item_id };
          const existing = addonsByOrderItemId.get(order_item_id) ?? [];
          addonsByOrderItemId.set(order_item_id, [...existing, item]);
        });

      const fleetsRaw = detail.fleets;
      const fleetsArr = Array.isArray(fleetsRaw) ? (fleetsRaw as unknown[]) : [];
      const parsedFleets = fleetsArr.map((row) => {
        const f = record(row);
        const order_item_id = getString(f.order_item_id ?? f.orderItemId);
        const fleet_name = getString(f.fleet_name ?? f.fleetName ?? f.name ?? f.title);
        const qty = getNumber(f.qty ?? f.quantity ?? f.unit_qty ?? f.unitQty);
        const unit_price = getNumber(f.price ?? f.unit_price ?? f.unitPrice);
        const addons = order_item_id ? (addonsByOrderItemId.get(order_item_id) ?? []) : [];
        return { order_item_id, fleet_name, qty, unit_price, addons } satisfies DetailFleetRow;
      });

      setDetailFleets(parsedFleets);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Armada{detailOrderId ? ` • ${detailOrderId}` : ''}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Memuat detail...</div>
          ) : detailFleets.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Data armada tidak ditemukan.</div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr className="text-gray-600 dark:text-gray-300">
                      <th className="px-3 py-3 text-left font-semibold w-[52px]">No</th>
                      <th className="px-3 py-3 text-left font-semibold">Armada</th>
                      <th className="px-3 py-3 text-right font-semibold w-[110px]">Unit</th>
                      <th className="px-3 py-3 text-right font-semibold w-[160px]">Harga</th>
                      <th className="px-3 py-3 text-right font-semibold w-[170px]">Sub Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {detailFleets.map((fleet, index) => {
                      const addonPerUnit = (fleet.addons ?? []).reduce((acc, a) => acc + (Number.isFinite(a.addon_price) ? a.addon_price : 0), 0);
                      const subtotal = (fleet.qty || 0) * ((fleet.unit_price || 0) + addonPerUnit);
                      const addonDescs = (fleet.addons ?? []).map((a) => a.addon_desc).filter((s) => Boolean(s));
                      const addonNames = (fleet.addons ?? []).map((a) => a.addon_name).filter((s) => Boolean(s));
                      return (
                        <tr
                          key={`${fleet.order_item_id || fleet.fleet_name}-${index}`}
                          className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900/40"
                        >
                          <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{index + 1}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900 dark:text-white">{fleet.fleet_name || '-'}</div>
                            {addonDescs.length > 0 ? (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{addonDescs.join(' • ')}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-200">{fleet.qty || 0} unit</td>
                          <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-200">
                            <div>{formatCurrency(fleet.unit_price || 0)}</div>
                            {addonNames.length > 0 ? (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{addonNames.join(' • ')}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                        <Button size="sm" onClick={() => openDetailArmada(order.id)}>
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
