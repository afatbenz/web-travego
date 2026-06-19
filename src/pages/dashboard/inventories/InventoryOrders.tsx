import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Search, Download, FileSpreadsheet, RotateCcw, Sheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';
import * as XLSX from 'xlsx';
import moment from 'moment';

type InventoryOrder = {
  id: string | number;
  item_name: string;
  request_id: string | number;
  quantity: number;
  garage_name: string;
};

export const InventoryOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);

      const res = await api.get<unknown>(`/inventories/orders/list?${query.toString()}`, token ? { Authorization: token } : undefined);

      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object'
            ? Array.isArray((payload as Record<string, unknown>).items)
              ? ((payload as Record<string, unknown>).items as unknown[])
              : []
            : [];

        const mapped = list.map((raw, i) => {
          const obj = record(raw);
          const idRaw = obj.order_id ?? obj.id;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
          const item_name = typeof obj.item_name === 'string' ? obj.item_name : '';
          const request_id = typeof obj.request_id === 'string' || typeof obj.request_id === 'number' ? obj.request_id : undefined;
          const quantity = typeof obj.quantity === 'number' ? obj.quantity : 0;
          const garage_name = typeof obj.garage_name === 'string' ? obj.garage_name : '';
          return { id, item_name, request_id, quantity, garage_name };
        });
        setOrders(mapped);
        if (Array.isArray(payload)) {
          setTotalCount(mapped.length);
        } else if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
        }
      } else {
        setOrders([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const exportRows = useMemo(() => {
    return orders.map((row, index) => ({
      No: startIndex + index + 1,
      'Item Name': row.item_name || '-',
      'Request ID': row.request_id ?? '-',
      Quantity: row.quantity ?? 0,
      Garasi: row.garage_name || '-',
    }));
  }, [startIndex, orders]);

  const downloadExcel = () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk diunduh.', type: 'warning' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Orders');
    XLSX.writeFile(workbook, `inventory-orders-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportRows.length) {
      showAlert({ title: 'Info', description: 'Tidak ada data untuk disalin.', type: 'warning' });
      return;
    }
    const headers = ['No', 'Item Name', 'Request ID', 'Quantity', 'Garasi'];
    const rowsTsv = exportRows.map((row) => [row.No, row['Item Name'], row['Request ID'], row.Quantity, row.Garasi]);
    const tsv = [headers, ...rowsTsv]
      .map((cols) => cols.map((value) => String(value ?? '').replace(/\t/g, ' ')).join('\t'))
      .join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({ title: 'Berhasil', description: 'Data disalin ke clipboard. Tempel di Google Sheet.', type: 'success' });
    } catch {
      showAlert({ title: 'Gagal', description: 'Tidak dapat menyalin data.', type: 'error' });
    }
  };

  const columns: Array<DataTableColumn<InventoryOrder>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    { label: 'Nama Item', key: 'item_name', sortable: true, width: 280, render: (row) => <span className="text-foreground">{row.item_name || '-'}</span> },
    { label: 'Request ID', key: 'request_id', sortable: true, width: 180, render: (row) => <span className="text-foreground">{row.request_id ?? '-'}</span> },
    { label: 'Jumlah', key: 'quantity', sortable: true, width: 120, render: (row) => <span className="text-foreground">{row.quantity}</span> },
    { label: 'Garasi', key: 'garage_name', sortable: true, width: 200, render: (row) => <span className="text-foreground">{row.garage_name || '-'}</span> },
  ];

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalItems = totalCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Pemesanan Asset</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola pemesanan asset organisasi Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300"
            onClick={() => navigate(`${basePrefix}/inventories/orders/create`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pemesanan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                aria-label="Aksi"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl">
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); downloadExcel(); }}>
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Download Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={(e) => { e.preventDefault(); void copyToGoogleSheet(); }}>
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari pemesanan..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="h-11 rounded-2xl pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          disabled={!searchTerm && currentPage === 1}
          className="h-11 rounded-2xl"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full"
        emptyTitle="Tidak ada data pemesanan"
        emptyDescription="Coba ubah pencarian."
        actions={{
          label: 'Aksi',
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (row) => navigate(`${basePrefix}/inventories/orders/detail/${encodeURIComponent(String(row.id))}`)
            }
          ]
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => { setItemsPerPage(n); setCurrentPage(1); },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'item_name', direction: 'asc' } }}
        rowKey={(row) => row.id}
      />

      <Button
        onClick={() => navigate(`${basePrefix}/inventories/orders/create`)}
        className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
        size="icon"
        title="Tambah Pemesanan"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};