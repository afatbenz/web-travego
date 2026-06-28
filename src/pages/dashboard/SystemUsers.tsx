import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RotateCcw,
  Shield,
  User,
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

type UserItem = {
  fullname: string;
  email: string;
  phone: string;
  avatar: string;
  organization_name: string;
  organization_role: number;
  is_active: boolean;
};

function parseUsers(payload: unknown): UserItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      return {
        fullname: String(raw.fullname ?? ''),
        email: String(raw.email ?? ''),
        phone: String(raw.phone ?? ''),
        avatar: String(raw.avatar ?? ''),
        organization_name: String(raw.organization_name ?? ''),
        organization_role: typeof raw.organization_role === 'number' ? raw.organization_role : Number(raw.organization_role ?? 0),
        is_active: raw.is_active === true || raw.is_active === 'true',
      } as UserItem;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item && (item.fullname || item.email)));
}

export const SystemUsers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' || activeFilter !== 'all') {
        fetchData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (activeFilter !== 'all') query.set('is_active', activeFilter);
      const qs = query.toString();
      const res = await api.get<unknown>(`/system/users${qs ? '?' + qs : ''}`, headers);
      if (res.status === 'success') {
        setData(parseUsers(res.data));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    setCurrentPage(1);
  };

  const roleLabel = (role: number): string => {
    if (role === 1) return 'Admin';
    return 'Members';
  };

  const avatarUrl = (avatar: string): string | undefined => {
    if (!avatar) return undefined;
    return toFileUrl(avatar);
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

  const columns: Array<DataTableColumn<UserItem>> = [
    {
      label: 'No',
      key: '__no__',
      width: 72,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{(currentPage - 1) * itemsPerPage + rowIndex + 1}</span>
    },
    {
      label: 'Nama Pengguna',
      key: 'fullname',
      sortable: true,
      width: 300,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.avatar ? (
            <img src={avatarUrl(item.avatar)} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{item.fullname || '-'}</div>
            <div className="text-xs text-muted-foreground truncate">{item.email || '-'}</div>
          </div>
        </div>
      )
    },
    {
      label: 'Nama Perusahaan',
      key: 'organization_name',
      sortable: true,
      width: 250,
      render: (item) => <span className="text-sm text-foreground">{item.organization_name || '-'}</span>
    },
    {
      label: 'Nomor Telepon',
      key: 'phone',
      width: 180,
      sortable: true,
      render: (item) => <span className="text-sm text-foreground">{formatPhoneNumber(item.phone)}</span>
    },
    {
      label: 'Role',
      key: 'organization_role',
      width: 120,
      align: 'center',
      sortable: true,
      render: (item) => {
        const role = item.organization_role;
        const isAdmin = role === 1;
        return (
          <Badge variant="default" className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            isAdmin ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {roleLabel(role)}
          </Badge>
        );
      }
    },
    {
      label: 'Status',
      key: 'is_active',
      width: 120,
      align: 'center',
      sortable: true,
      render: (item) => {
        const active = item.is_active;
        return (
          <Badge variant="default" className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {active ? 'Active' : 'Inactive'}
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pengguna</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Daftar seluruh pengguna yang terdaftar di sistem
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-5">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama pengguna, perusahaan, email, atau no. telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Status:</span>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="h-11 w-[160px] rounded-2xl">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
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
        tableClassName="table-auto w-full min-w-[960px]"
        emptyTitle="Tidak ada data pengguna"
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
        rowKey={(row) => row.email}
      />
    </div>
  );
};
