import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AllCustomers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  type Customer = {
    id: string;
    name: string;
    address: string;
    phone: string;
    city: string;
    email: string;
    statusLabel: string;
    raw: Record<string, unknown>;
  };

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/customers', token ? { Authorization: token } : undefined);
        if (res.status !== 'success') return;

        const payload = res.data as unknown;
        let items: unknown[] = [];
        if (Array.isArray(payload)) {
          items = payload;
        } else if (payload && typeof payload === 'object') {
          const o = payload as Record<string, unknown>;
          const list = o.items ?? o.data ?? o.list ?? o.rows ?? o.result;
          if (Array.isArray(list)) items = list;
        }

        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it) => {
            const idRaw = it.customer_id ?? it.id ?? it.uuid;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
            const name = String(it.customer_name ?? it.name ?? it.fullname ?? it.full_name ?? '');
            const address = String(it.customer_address ?? it.address ?? it.alamat ?? '');
            const phone = String(it.customer_phone ?? it.phone ?? it.phone_number ?? it.mobile ?? it.telepon ?? '');
            const city = String(it.city_name ?? it.city ?? it.cityLabel ?? it.kota ?? '');
            const email = String(it.customer_email ?? it.email ?? '');
            const statusRaw = it.status ?? it.active ?? it.is_active ?? it.isActive ?? '';
            const isActive =
              statusRaw === true || statusRaw === 1 || statusRaw === '1' || String(statusRaw).toLowerCase() === 'active';
            const statusLabel = isActive ? 'Active' : 'Inactive';
            return { id, name, address, phone, city, email, statusLabel, raw: it };
          })
          .filter((c) => c.id || c.name);

        setCustomers(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => customers, [customers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar customer</p>
        </div>
        {basePrefix === '/dashboard/partner' ? (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`${basePrefix}/customers/create`)}>
            Tambah Customer
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Customers ({rows.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Tidak ada data customer.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">No</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Name Pelanggan</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Email</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Phone</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Alamat</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {rows.map((c, idx) => (
                    <tr key={c.id || c.name} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">{idx + 1}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">{c.name || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">{c.email || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">{c.phone || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {c.address && c.city ? `${c.address}, ${c.city}` : (c.address || c.city || '-')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(`${basePrefix}/customers/detail/${encodeURIComponent(c.id)}`)}
                        >
                          Detail
                        </Button>
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
  );
};
