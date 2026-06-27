import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, Plus, RotateCcw, Search, Sheet } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { formatPhoneNumberId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const AllCustomers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard');
  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  type Customer = {
    id: string;
    name: string;
    address: string;
    phone: string;
    city: string;
    email: string;
    company: string;
    totalOrders: number;
    createdAt: string;
    raw: Record<string, unknown>;
  };

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const term = searchTerm.trim();
    const shouldSearch = term.length >= 3;
    const shouldLoadAll = term.length === 0;

    const timer = window.setTimeout(() => {
      if (!shouldSearch && !shouldLoadAll) return;

      (async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token') ?? '';
          const query = new URLSearchParams();
          if (shouldSearch) query.set('search', term);
          const url = query.toString() ? `/services/customers?${query.toString()}` : '/services/customers';

          const res = await api.get<unknown>(url, token ? { Authorization: token } : undefined);
          if (cancelled) return;
          if (res.status !== 'success') {
            setCustomers([]);
            return;
          }

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
              const city = String(it.customer_city ?? it.city_name ?? it.city ?? it.cityLabel ?? it.kota ?? '');
              const email = String(it.customer_email ?? it.email ?? '');
              const company = String(it.customer_company ?? it.company ?? it.perusahaan ?? it.instansi ?? '');

              const totalOrdersRaw = it.total_orders ?? it.totalOrders ?? it.orders ?? it.order_count ?? it.total_order;
              const totalOrders =
                typeof totalOrdersRaw === 'number'
                  ? totalOrdersRaw
                  : typeof totalOrdersRaw === 'string'
                    ? parseInt(totalOrdersRaw) || 0
                    : 0;

              const createdAt = String(it.created_at ?? it.createdAt ?? it.created ?? '');

              return { id, name, address, phone, city, email, company, totalOrders, createdAt, raw: it };
            })
            .filter((c) => c.id || c.name);

          setCustomers(mapped);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, term ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const buildExportRows = () => {
    const headers = [
      'No.',
      'Nama Pelanggan',
      'Nomor Telepon',
      'Email',
      'Alamat',
      'Kota',
      'Instansi / Perusahaan',
      'Jumlah Pesanan',
      'Tanggal Bergabung',
    ];

    const rows = customers.map((c, i) => {
      const addressFull = c.address && c.city ? `${c.address}, ${c.city}` : c.address || c.city || '';
      return [
        i + 1,
        c.name ?? '',
        formatPhoneNumberId(c.phone),
        c.email ?? '',
        addressFull,
        c.city ?? '',
        c.company ?? '',
        c.totalOrders ?? 0,
        c.createdAt ?? '',
      ];
    });

    return { headers, rows };
  };

  const handleDownloadExcel = () => {
    if (!customers.length) {
      void Swal.fire('Info', 'Tidak ada data customer untuk diunduh.', 'info');
      return;
    }

    const { headers, rows } = buildExportRows();

    const escapeCell = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const tableHeader = headers.map((header) => `<th>${escapeCell(header)}</th>`).join('');
    const tableBody = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('');

    const workbook = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; }
            th { background: #f3f4f6; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', workbook], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleCopyToGoogleSheet = async () => {
    if (!customers.length) {
      await Swal.fire('Info', 'Tidak ada data customer untuk disalin.', 'info');
      return;
    }

    const { headers, rows } = buildExportRows();
    const tsv = [headers.join('\t'), ...rows.map((row) => row.map((cell) => String(cell ?? '')).join('\t'))].join('\n');

    try {
      const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = tsv;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      };

      let copied = false;
      try {
        await navigator.clipboard.writeText(tsv);
        copied = true;
      } catch {
        copied = fallbackCopy();
      }

      if (!copied) throw new Error('COPY_FAILED');

      window.open('https://sheet.new', '_blank', 'noopener,noreferrer');
      await Swal.fire('Berhasil', 'Data sudah disalin. Tab Google Sheet dibuka, silakan tempelkan (Ctrl+V).', 'success');
    } catch {
      await Swal.fire(
        'Gagal',
        'Tidak dapat menyalin data ke clipboard. Pastikan website berjalan di HTTPS atau localhost, dan izinkan akses clipboard di browser.',
        'error'
      );
    }
  };

  const columns = useMemo<Array<DataTableColumn<Customer>>>(() => {
    return [
      {
        label: 'No',
        key: '__no__',
        width: 72,
        align: 'center',
        sortable: false,
        render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>,
      },
      {
        label: 'Nama Pelanggan',
        key: 'name',
        sortable: true,
        width: 260,
        render: (row) => {
          if (!row.id) return <span className="font-medium text-foreground dark:text-white/70">{row.name || '-'}</span>;
          const to = `${basePrefix}/customers/detail/${encodeURIComponent(row.id)}`;
          return (
            <Link
              to={to}
              className="font-medium no-underline hover:no-underline hover:text-white/80 transition-colors text-blue-900 dark:text-white/80 dark:hover:text-white"
            >
              {row.name || '-'}
            </Link>
          );
        },
      },
      {
        label: 'Email',
        key: 'email',
        sortable: true,
        width: 260,
        render: (row) => <span className="text-sm text-foreground dark:text-white/70">{row.email || '-'}</span>,
      },
      {
        label: 'Phone',
        key: 'phone',
        sortable: true,
        width: 180,
        render: (row) => <span className="text-sm text-foreground dark:text-white/70">{formatPhoneNumberId(row.phone)}</span>,
      },
      {
        label: 'Alamat',
        key: 'address',
        sortable: false,
        width: 420,
        render: (row) => (
          <span className="text-sm text-foreground dark:text-white/70">
            {row.address && row.city ? `${row.address}, ${row.city}` : row.address || row.city || '-'}
          </span>
        ),
      },
    ];
  }, [basePrefix, startIndex]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Daftar customer</p>
        </div>
        <div className="flex items-center gap-2">
          {basePrefix === '/dashboard/partner' ? (
            <Button className={addButtonClass} onClick={() => navigate(`${basePrefix}/customers/create`)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Customer
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border" aria-label="Download">
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  handleDownloadExcel();
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Download file excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  void handleCopyToGoogleSheet();
                }}
              >
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 sm:max-w-lg">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari customer... (min. 3 huruf)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-2xl pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl"
              onClick={handleReset}
              aria-label="Reset"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[920px]"
        emptyTitle="Tidak ada data customer"
        emptyDescription={searchTerm.trim().length >= 3 ? 'Customer dengan kata kunci tersebut tidak ditemukan.' : 'Data customer belum tersedia.'}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'name', direction: 'asc' } }}
        rowKey={(row, index) => row.id || `${row.email || row.name || 'row'}-${index}`}
      />

      {basePrefix === '/dashboard/partner' ? (
        <Button
          onClick={() => navigate(`${basePrefix}/customers/create`)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)] hover:bg-blue-700 md:hidden"
          size="icon"
          title="Tambah Customer"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
};
