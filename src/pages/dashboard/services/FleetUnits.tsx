import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, RotateCcw, Sheet, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { api } from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showAlert } from '@/hooks/use-alert';
import moment from 'moment';
import * as XLSX from 'xlsx';

export const FleetUnits: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = location.pathname.startsWith('/dashboard/partner');
  const createUnitPath = '/dashboard/partner/fleet-units/create';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<
    Array<{
      id: string | number;
      vehicle_id: string;
      plate_number: string;
      fleet_name: string;
      engine: string;
      transmision: string;
      production_year: string;
      capacity: number;
      created_at: string;
    }>
  >([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const query = new URLSearchParams();
      query.set('page', String(currentPage));
      query.set('limit', String(itemsPerPage));
      if (searchTerm) query.set('search', searchTerm);
      
      const res = await api.get<unknown>(`/services/fleet-units?${query.toString()}`, token ? { Authorization: token } : undefined);
      
      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const getYearString = (v: unknown) => {
          if (typeof v === 'number' && Number.isFinite(v)) return String(v);
          if (typeof v === 'string') return v;
          return '';
        };
        const getNumber = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        const payload = res.data as unknown;
        const list: unknown[] = (() => {
          if (Array.isArray(payload)) return payload;
          if (payload && typeof payload === 'object') {
            const obj = payload as Record<string, unknown>;
            const maybeList = obj.items ?? obj.data ?? obj.list ?? obj.rows ?? obj.result;
            if (Array.isArray(maybeList)) return maybeList;
          }
          return [];
        })();

        const mapped = list.map((raw, i) => {
          const obj = record(raw);
          const idRaw = obj.id ?? obj.unit_id ?? obj.vehicle_id ?? i;
          const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? idRaw : i;
          const vehicle_id = getString(obj.vehicle_id);
          const plate_number = getString(obj.plate_number);
          const fleet_name = getString(obj.fleet_name);
          const engine = getString(obj.engine);
          const transmision = getString(obj.transmision);
          const production_year = getYearString(obj.production_year);
          const capacity = getNumber(obj.capacity);
          const created_at = getString(obj.created_at);
          return { id, vehicle_id, plate_number, fleet_name, engine, transmision, production_year, capacity, created_at };
        });

        setUnits(mapped);
        if (Array.isArray(payload)) {
          setTotalCount(mapped.length);
        } else if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          setTotalCount(Number(obj.total ?? mapped.length) || mapped.length);
        }
      } else {
        setUnits([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [currentPage, itemsPerPage, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalItems = totalCount;

  type UnitRow = (typeof units)[number];

  const exportSheetRows = useMemo(() => {
    return units.map((row, index) => ({
      No: startIndex + index + 1,
      'Unit ID': row.vehicle_id || '-',
      'Plat Nomor': row.plate_number || '-',
      'Nama Unit': row.fleet_name || '-',
      Mesin: row.engine || '-',
      Transmisi: row.transmision || '-',
      'Tahun Produksi': row.production_year || '-',
      Kapasitas: row.capacity ?? 0,
      Timestamp: row.created_at || '-',
    }));
  }, [startIndex, units]);

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const downloadExcel = () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data unit untuk diunduh.', type: 'warning' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportSheetRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 24 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Units');
    XLSX.writeFile(workbook, `Travego-units-${moment().format('YYYYMMDDHH-mm')}.xlsx`);
  };

  const copyToGoogleSheet = async () => {
    if (!exportSheetRows.length) {
      showAlert({ title: 'Gagal', description: 'Tidak ada data unit untuk dicopy.', type: 'warning' });
      return;
    }

    const headers = ['No', 'Unit ID', 'Plat Nomor', 'Nama Unit', 'Mesin', 'Transmisi', 'Tahun Produksi', 'Kapasitas', 'Timestamp'];
    const rowsTsv = exportSheetRows.map((row) => [
      row.No,
      row['Unit ID'],
      row['Plat Nomor'],
      row['Nama Unit'],
      row.Mesin,
      row.Transmisi,
      row['Tahun Produksi'],
      row.Kapasitas,
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
        description: 'Data unit disalin ke clipboard. Tempel di Google Sheet dengan Ctrl+V.',
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

  const columns: Array<DataTableColumn<UnitRow>> = [
    {
      label: 'No',
      key: '__no__',
      width: 68,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>
    },
    {
      label: 'Unit ID',
      key: 'vehicle_id',
      sortable: true,
      width: 180,
      render: (unit) => (
        <Link
          to={`/dashboard/partner/fleet-units/detail/${encodeURIComponent(String(unit.id))}`}
          className="font-medium text-blue-600 hover:no-underline hover:text-bold dark:text-blue-400"
        >
          <span className="whitespace-nowrap">{unit.vehicle_id}</span>
        </Link>
      )
    },
    { label: 'Plat Nomor', key: 'plate_number', sortable: true, width: 170, render: (unit) => <span className="text-foreground whitespace-nowrap">{unit.plate_number || '-'}</span> },
    { label: 'Nama Unit', key: 'fleet_name', sortable: true, width: 320, render: (unit) => <span className="text-foreground whitespace-nowrap">{unit.fleet_name || '-'}</span> },
    { label: 'Mesin', key: 'engine', sortable: true, width: 220, render: (unit) => <span className="text-foreground whitespace-nowrap">{unit.engine || '-'}</span> },
    {
      label: 'Tahun Produksi',
      key: 'production_year',
      sortable: true,
      width: 160,
      align: 'center',
      render: (unit) => <span className="text-foreground whitespace-nowrap">{unit.production_year || '-'}</span>
    },
    {
      label: 'Kapasitas',
      key: 'capacity',
      sortable: true,
      width: 140,
      align: 'center',
      render: (unit) => <span className="text-foreground">{unit.capacity} Pax</span>
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Unit Armada</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Kelola unit armada spesifik (berdasarkan plat nomor/ID)
          </p>
        </div>
        <div className="flex items-center gap-2">
        {canCreate ? (
          <Button
            className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600"
            onClick={() => navigate(createUnitPath)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Unit Baru
          </Button>
        ) : null}
        <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-2xl bg-blue-500 hover:bg-blue-700 no-border"
                        aria-label="Aksi armada"
                      >
                        <Download className="h-4 w-4 text-white hover:transition scale-y-0.5" />
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex w-full gap-2 sm:flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari Unit ID, nama unit, atau plat nomor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-2xl flex-shrink-0 sm:hidden"
            onClick={resetFilters}
            disabled={!searchTerm && currentPage === 1}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden sm:flex sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl px-3 sm:w-auto"
            onClick={resetFilters}
            disabled={!searchTerm && currentPage === 1}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={units}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full"
        emptyTitle="Tidak ada data unit armada"
        emptyDescription="Coba ubah pencarian."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (row) => navigate(`/dashboard/partner/fleet-units/detail/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: Edit,
              onSelect: (row) => navigate(`/dashboard/partner/fleet-units/edit/${encodeURIComponent(String(row.id))}`)
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              disabled: true,
              onSelect: () => void 0
            }
          ]
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'vehicle_id', direction: 'asc' } }}
        rowKey={(row) => row.id}
      />

      {canCreate ? (
        <Button
          onClick={() => navigate(createUnitPath)}
          className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
          size="icon"
          title="Tambah Unit Armada"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
};
