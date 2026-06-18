import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Plus, Download, FileSpreadsheet, Sheet } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPhoneNumberId } from '@/lib/utils';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showAlert } from '@/hooks/use-alert';
import moment from 'moment';
import * as XLSX from 'xlsx';

type PartnerOperationRow = {
  partnerId: string;
  partnerName: string;
  partnerAddress: string;
  partnerCityLabel: string;
  partnerPhone: string;
  partnerEmail: string;
  picName: string;
  totalUnit: number;
  totalRevenue: number;
  createdAt: string;
  raw: Record<string, unknown>;
};

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const list = o.items ?? o.data ?? o.list ?? o.rows ?? o.result;
    if (Array.isArray(list)) return list;
  }
  return [];
}

export const PartnerOperations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PartnerOperationRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const formatRupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/services/partnership/operations', headers);
        if (res.status !== 'success') return;

        const items = extractItems(res.data);
        const mapped = items
          .map((it) => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
          .filter((it): it is Record<string, unknown> => Boolean(it))
          .map((it) => {
            const partnerIdRaw = it.partner_id ?? it.partnerId ?? it.id ?? it.uuid;
            const partnerId = typeof partnerIdRaw === 'string' || typeof partnerIdRaw === 'number' ? String(partnerIdRaw) : '';
            const partnerName = String(it.partner_name ?? it.partnerName ?? it.name ?? '');
            const partnerAddress = String(it.partner_address ?? it.partnerAddress ?? it.address ?? '');
            const partnerCityLabel = String(it.partner_city_label ?? it.partnerCityLabel ?? it.city_label ?? it.cityLabel ?? '');
            const partnerPhone = String(it.partner_phone ?? it.partnerPhone ?? it.phone ?? '');
            const partnerEmail = String(it.partner_email ?? it.partnerEmail ?? it.email ?? '');
            const picName = String(it.pic_name ?? it.picName ?? it.pic ?? '');
            const totalUnitRaw = it.total_unit ?? it.totalUnit ?? it.unit_total ?? it.unitTotal ?? 0;
            const totalUnit =
              typeof totalUnitRaw === 'number'
                ? totalUnitRaw
                : typeof totalUnitRaw === 'string'
                  ? Number(totalUnitRaw) || 0
                  : 0;
            const totalRevenueRaw = it.total_revenue ?? it.totalRevenue ?? it.revenue_total ?? it.revenueTotal ?? 0;
            const totalRevenue =
              typeof totalRevenueRaw === 'number'
                ? totalRevenueRaw
                : typeof totalRevenueRaw === 'string'
                  ? Number(totalRevenueRaw) || 0
                  : 0;
            const createdAt = String(it.created_at ?? it.createdAt ?? it.timestamp ?? '');
            return { partnerId, partnerName, partnerAddress, partnerCityLabel, partnerPhone, partnerEmail, picName, totalUnit, totalRevenue, createdAt, raw: it };
          })
          .filter((r) => r.partnerId || r.partnerName);

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.partnerName,
        row.picName,
        row.partnerAddress,
        row.partnerCityLabel,
        row.partnerPhone,
        row.partnerEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, searchTerm]);

  const exportSheetRows = useMemo(() => {
    return filteredRows.map((row, index) => ({
      No: index + 1,
      'Nama Partner': row.partnerName || '-',
      PIC: row.picName || '-',
      'Total Pendapatan': row.totalRevenue ?? 0,
      Alamat: row.partnerAddress || '-',
      Kota: row.partnerCityLabel || '-',
      'No. Telepon': formatPhoneNumberId(row.partnerPhone),
      Email: row.partnerEmail || '-',
      'Jumlah Unit': row.totalUnit ?? 0,
      Timestamp: row.createdAt || '-',
    }));
  }, [filteredRows]);

  const downloadExcel = () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data mitra operasional untuk diunduh.', type: 'warning' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 22 },
      { wch: 34 },
      { wch: 18 },
      { wch: 18 },
      { wch: 26 },
      { wch: 14 },
      { wch: 24 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mitra Operasional');
    XLSX.writeFile(workbook, `Travego-mitra-operasional-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data mitra operasional untuk dicopy.', type: 'warning' });
      return;
    }

    const headers = [
      'No',
      'Nama Partner',
      'PIC',
      'Alamat',
      'Kota',
      'No. Telepon',
      'Email',
      'Jumlah Unit',
      'Timestamp',
    ];
    const rowsTsv = exportSheetRows.map((row) => [
      row.No,
      row['Nama Partner'],
      row.PIC,
      row.Alamat,
      row.Kota,
      row['No. Telepon'],
      row.Email,
      row['Jumlah Unit'],
      row.Timestamp,
    ]);
    const tsv = [headers, ...rowsTsv]
      .map((cols) => cols.map((value) => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({
        title: 'Berhasil',
        description: 'Data mitra operasional disalin ke clipboard. Tempel di Google Sheet dengan Ctrl+V.',
        type: 'success',
      });
    } catch {
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showAlert({
        title: 'Perhatian',
        description: 'Google Sheet dibuka, tetapi data gagal disalin ke clipboard.',
        type: 'warning',
      });
    }
  };

  const handleSearch = () => {
    const next = searchInput.trim();
    setSearchTerm(next);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  const columns: Array<DataTableColumn<PartnerOperationRow>> = useMemo(
    () => [
      {
        label: 'No',
        key: '__no__',
        width: 72,
        align: 'center',
        sortable: false,
        render: (_row, rowIndex) => (
          <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
        ),
      },
      {
        label: 'Nama',
        key: 'partnerName',
        sortable: true,
        render: (row) => (
          <a
            href={`${basePrefix}/partner-operations/detail/${encodeURIComponent(row.partnerId)}`}
            rel="noopener noreferrer"
            className="font-medium text-blue-800 dark:text-white/80 hover:text-white/80 dark:hover:text-white"
          >
            {row.partnerName || '-'}</a>
        ),
      },
      {
        label: 'Alamat',
        key: 'partnerAddress',
        render: (row) => {
          const addr = row.partnerAddress?.trim() ?? '';
          const city = row.partnerCityLabel?.trim() ?? '';
          const text = addr && city ? `${addr}, ${city}` : addr || city || '-';
          return <span>{text}</span>;
        },
      },
      {
        label: 'No Telpon',
        key: 'partnerPhone',
        render: (row) => <span className="text-sm text-foreground dark:text-white/70">{formatPhoneNumberId(row.partnerPhone)}</span>,
      },
      {
        label: 'PIC',
        key: 'picName',
        render: (row) => <span className="text-sm text-foreground dark:text-white/70">{row.picName || '-'}</span>,
      },
      {
        label: 'Jumlah Unit',
        key: 'totalUnit',
        sortable: true,
        width: 140,
        align: 'center',
        render: (row) => <span className="text-sm text-foreground dark:text-white/70 whitespace-nowrap">{row.totalUnit ?? 0} unit</span>,
      },
      {
        label: 'Revenue',
        key: 'totalRevenue',
        sortable: true,
        width: 140,
        align: 'center',
        render: (row) => <span className="text-sm text-foreground dark:text-white/70 whitespace-nowrap">{formatRupiah(row.totalRevenue ?? 0)}</span>,
      },
    ],
    [basePrefix, startIndex]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Mitra Operasional</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Kelola data mitra operasional</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className={addButtonClass}
            onClick={() => navigate(`${basePrefix}/partner-operations/create`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mitra Baru
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                aria-label="Aksi mitra operasional"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  downloadExcel();
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download ke excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  void copyToGoogleSheet();
                }}
              >
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Copy ke Google Sheet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama partner, PIC, alamat, kota, telepon, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="h-11 rounded-2xl pl-10"
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-2xl sm:w-11 sm:px-0"
            onClick={handleReset}
            disabled={!searchInput && !searchTerm && currentPage === 1}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        emptyTitle="Tidak ada data mitra operasional"
        emptyDescription="Coba muat ulang atau periksa kembali."
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: filteredRows.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'partnerName', direction: 'asc' } }}
        rowKey={(row) => row.partnerId || row.partnerName}
      />

      <Button
        onClick={() => navigate(`${basePrefix}/partner-operations/create`)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)] hover:bg-blue-700 md:hidden"
        size="icon"
        title="Tambah Mitra Baru"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
