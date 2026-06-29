import React, { useEffect, useState } from 'react';
import {
  Search,
  RotateCcw,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toFileUrl } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type OrgItem = {
  organization_id: string;
  organization_code: string;
  organization_name: string;
  company_name: string;
  company_address: string;
  company_city: string;
  company_province: string;
  phone: string;
  logo: string;
  package_id: string;
  package_name: string;
  expiry_date: string;
  status: string;
};

function parseOrgs(payload: unknown): OrgItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      return {
        organization_id: String(raw.organization_id ?? ''),
        organization_code: String(raw.organization_code ?? ''),
        organization_name: String(raw.organization_name ?? ''),
        company_name: String(raw.company_name ?? ''),
        company_address: String(raw.company_address ?? ''),
        company_city: String(raw.company_city ?? ''),
        company_province: String(raw.company_province ?? ''),
        phone: String(raw.phone ?? ''),
        logo: String(raw.logo ?? ''),
        package_id: String(raw.package_id ?? ''),
        package_name: String(raw.package_name ?? ''),
        expiry_date: String(raw.expiry_date ?? ''),
        status: String(raw.status ?? 'inactive'),
      } as OrgItem;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item && item.organization_id));
}

export const SystemOrganizations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrgItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' || statusFilter !== 'all') {
        fetchData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (statusFilter !== 'all') query.set('status', statusFilter);
      const qs = query.toString();
      const res = await api.get<unknown>(`/system/organizations${qs ? '?' + qs : ''}`, headers);
      if (res.status === 'success') {
        setData(parseOrgs(res.data));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const logoUrl = (logo: string): string | undefined => {
    if (!logo) return undefined;
    return toFileUrl(logo);
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '-';
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    let formatted = digits;
    
    // If starts with 0, replace with 62
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.slice(1);
    } else if (!formatted.startsWith('62')) {
      formatted = '62' + formatted;
    }
    
    // Format as 62 xxx-xxxx-xxxx
    if (formatted.length >= 12) {
      return `62 ${formatted.slice(2, 5)}-${formatted.slice(5, 9)}-${formatted.slice(9)}`;
    } else if (formatted.length >= 9) {
      return `62 ${formatted.slice(2, 5)}-${formatted.slice(5)}`;
    } else if (formatted.length >= 5) {
      return `62 ${formatted.slice(2)}`;
    }
    return formatted;
  };

  const columns: Array<DataTableColumn<OrgItem>> = [
    {
      label: 'No',
      key: '__no__',
      width: 72,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span>
    },
    {
      label: 'Kode Organisasi',
      key: 'organization_code',
      width: 150,
      sortable: true,
      render: (item) => <span className="text-sm font-mono text-foreground">{item.organization_code || '-'}</span>
    },
    {
      label: 'Nama Perusahaan',
      key: 'organization_name',
      sortable: true,
      width: 320,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.logo ? (
            <img src={logoUrl(item.logo)} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{item.organization_name}</div>
            <div className="text-xs text-muted-foreground truncate">{item.company_name || '-'}</div>
          </div>
        </div>
      )
    },
    {
      label: 'Alamat',
      key: 'company_address',
      sortable: true,
      width: 300,
      render: (item) => (
        <div className="min-w-0">
          <div className="text-sm text-foreground truncate">{item.company_address || '-'}</div>
          <div className="text-xs text-muted-foreground truncate">
            {[item.company_city, item.company_province].filter(Boolean).join(', ') || '-'}
          </div>
        </div>
      )
    },
    {
      label: 'No. Telepon',
      key: 'phone',
      width: 180,
      sortable: true,
      render: (item) => <span className="text-sm text-foreground">{formatPhoneNumber(item.phone)}</span>
    },
    {
      label: 'Nama Paket',
      key: 'package_name',
      sortable: true,
      width: 220,
      render: (item) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{item.package_name || '-'}</div>
          {item.expiry_date && (
            <div className="text-xs text-muted-foreground truncate">
              {new Date(item.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      sortable: true,
      render: (item) => {
        const active = item.status === 'active';
        return (
          <Badge variant="default" className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {active ? 'Aktif' : 'Tidak Aktif'}
          </Badge>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Perusahaan</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Daftar seluruh perusahaan yang terdaftar di sistem
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-5">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama perusahaan, kode organisasi, atau no. telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-[160px] rounded-2xl">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetFilters}
              size="icon"
              className="h-11 w-11 rounded-2xl bg-transparent hover:bg-white text-red-600 hover:text-red-700"
              title="Reset filter"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1260px]"
        emptyTitle="Tidak ada data perusahaan"
        emptyDescription="Coba ubah pencarian atau filter."
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: data.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        rowKey={(row) => row.organization_id}
      />
    </div>
  );
};
