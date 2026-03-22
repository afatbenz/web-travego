import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil } from 'lucide-react';

type CustomerDetailData = {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_telephone: string;
  customer_bod: string;
  customer_company: string;
  customer_address: string;
  customer_city_name: string;
};

type OrderRow = {
  id: string;
  type: string;
  number: string;
  date: string;
  item: string;
  total: number;
  status: string;
};

function formatDateTime(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDateOnly(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function fetchOrdersSilent(path: string, token: string): Promise<unknown> {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
  const url = path.startsWith('http') ? path : `${base.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { headers: token ? { Authorization: token, Accept: 'application/json' } : { Accept: 'application/json' } });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) return null;
  return json;
}

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<unknown>(`/services/customers/detail/${encodeURIComponent(id)}`, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;
        const payload = res.data as unknown;
        const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>;

        const customer_id = String(data.customer_id ?? data.id ?? id ?? '');
        const customer_name = String(data.customer_name ?? data.name ?? '');
        const customer_email = String(data.customer_email ?? data.email ?? '');
        const customer_phone = String(data.customer_phone ?? data.phone ?? '');
        const customer_telephone = String(data.customer_telephone ?? data.telephone ?? data.customer_tel ?? '');
        const customer_bod = String(data.customer_bod ?? data.date_of_birth ?? data.customer_dob ?? data.dob ?? '');
        const customer_company = String(data.customer_company ?? data.company_name ?? data.customer_company_name ?? '');
        const customer_address = String(data.customer_address ?? data.address ?? '');
        const customer_city_name = String(data.customer_city_name ?? data.city ?? data.city_label ?? '');

        setCustomer({
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_telephone,
          customer_bod,
          customer_company,
          customer_address,
          customer_city_name,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingOrders(true);
      try {
        const json = await fetchOrdersSilent(`/services/customers/orders?customer_id=${encodeURIComponent(id)}`, token);
        const root = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
        const data = root.data as unknown;
        const items = Array.isArray(data) ? data : [];
        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it) => {
            const idRaw = it.order_id ?? it.id ?? it.uuid ?? it.number;
            const idStr = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : crypto.randomUUID();
            const type = String(it.order_type ?? it.type ?? it.category ?? '-');
            const number = String(it.order_number ?? it.order_no ?? it.orderId ?? it.order_id ?? it.id ?? '-');
            const date = String(it.order_date ?? it.created_at ?? it.createdAt ?? it.date ?? '');
            const item = String(it.item ?? it.fleet_name ?? it.package_name ?? it.title ?? '-');
            const totalRaw = it.total_amount ?? it.total ?? it.total_bill ?? it.totalAmount ?? 0;
            const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw ?? 0);
            const status = String(it.status_label ?? it.status ?? it.payment_status_label ?? it.payment_status ?? '-');
            return { id: idStr, type, number, date, item, total, status };
          });
        setOrders(mapped);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [id]);

  const addressText = useMemo(() => {
    const a = customer?.customer_address ?? '';
    const c = customer?.city_name ?? '';
    if (a && c) return `${a}, ${c}`;
    return a || c || '-';
  }, [customer?.customer_address, customer?.customer_city_name]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/customers`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Pelanggan</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi detail pelanggan</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
            ) : !customer ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Data customer tidak tersedia.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Nama</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{customer.customer_name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{customer.customer_email || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Nomor HP</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{customer.customer_phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Nomor Telepon</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{customer.customer_telephone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tanggal Lahir</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{formatDateOnly(customer.customer_bod)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Perusahaan</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{customer.customer_company || '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Alamat</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{addressText}, {customer.customer_city_name}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`${basePrefix}/customers/edit/${encodeURIComponent(customer.customer_id || id || '')}`)}
                  >
                    <Pencil className="h-4 w-4" />
                    Ubah Data Pelanggan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
            ) : orders.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Belum ada riwayat pesanan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">No</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Jenis Pesanan</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Nomor Pesanan</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Tanggal Pesanan</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Item</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Total Tagihan</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {orders.map((o, idx) => (
                      <tr key={o.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{idx + 1}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{o.type || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{o.number || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{formatDateTime(o.date)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{o.item || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{formatCurrency(o.total)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{o.status || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
