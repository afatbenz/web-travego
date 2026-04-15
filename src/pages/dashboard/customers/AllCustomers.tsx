import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';

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

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900">
                  <TableHead>No</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72" />
                      </TableCell>
                      <TableCell>
                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                      Tidak ada data customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map((c, idx) => (
                    <TableRow key={c.id || c.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <span className="text-gray-900 dark:text-white">{startIndex + idx + 1}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-white">{c.name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 dark:text-white">{c.email || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 dark:text-white">{c.phone || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 dark:text-white">
                          {c.address && c.city ? `${c.address}, ${c.city}` : c.address || c.city || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(`${basePrefix}/customers/detail/${encodeURIComponent(c.id)}`)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && rows.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, rows.length)} dari {rows.length} customer
              </div>
              <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
