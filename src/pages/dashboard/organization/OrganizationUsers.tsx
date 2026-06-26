import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MoreVertical, RotateCcw, Search, Trash2, UserCheck, XCircle } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, toFileUrl } from '@/lib/api';
import { cn, formatPhoneNumberId } from '@/lib/utils';
import avatarFallback from '@/assets/general/avatar.svg';
import Swal from 'sweetalert2';

type UserStatus = 'enable' | 'disable';
type StatusFilter = 'all' | UserStatus;

type OrganizationUserRow = {
  user_id: string;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  avatar?: string;
  created_at?: string;
  is_active: boolean;
  status: UserStatus;
};

type RowAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  onSelect: () => void;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const toText = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '');

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'enable', 'enabled', 'active'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'disable', 'disabled', 'inactive'].includes(normalized)) return false;
  }
  return false;
};

const toAvatarUrl = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  const record = toRecord(value);
  return toText(record.url ?? record.path ?? record.file ?? record.image ?? record.avatar ?? record.photo ?? record.photo_url ?? record.photoUrl);
};

const getStatusFromActive = (value: unknown): UserStatus => (toBoolean(value) ? 'enable' : 'disable');

export const OrganizationUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<OrganizationUserRow[]>([]);
  const [updatingUserIds, setUpdatingUserIds] = useState<Set<string>>(new Set());

  const setUpdating = useCallback((userId: string, isUpdating: boolean) => {
    setUpdatingUserIds((prev) => {
      const next = new Set(prev);
      if (isUpdating) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token') ?? '';
    return token ? { Authorization: token } : undefined;
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/organization/users', getHeaders());
      if (res.status !== 'success') {
        setUsers([]);
        return;
      }

      const payload = res.data as unknown;
      const root = toRecord(payload);
      const items: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(root.data)
          ? root.data
          : Array.isArray(root.items)
            ? root.items
            : Array.isArray(root.users)
              ? root.users
              : [];

      const mapped = (items as unknown[]).map((raw, index) => {
        const record = toRecord(raw);
        const userId = toText(record.user_id ?? record.userId ?? record.id) || `temp-${index}`;
        const activeValue = record.is_active ?? record.isActive ?? record.active;
        const rawStatus = toText(record.status ?? record.user_status).toLowerCase();
        const statusFromField: UserStatus | null =
          rawStatus === 'enable' || rawStatus === 'enabled'
            ? 'enable'
            : rawStatus === 'disable' || rawStatus === 'disabled'
              ? 'disable'
              : null;
        const isActive = activeValue !== undefined ? toBoolean(activeValue) : statusFromField === 'enable';
        const status = statusFromField ?? getStatusFromActive(activeValue);
        const avatar = toAvatarUrl(record.avatar ?? record.avatar_url ?? record.photo ?? record.photo_url ?? record.image);

        return {
          user_id: userId,
          username: toText(record.username ?? record.user_name ?? record.name) || '-',
          fullname: toText(record.fullname ?? record.full_name ?? record.fullName ?? record.name) || '-',
          email: toText(record.email) || '-',
          phone: toText(record.phone ?? record.phone_number ?? record.phoneNumber ?? record.no_telp ?? record.no_telephone) || '-',
          address: toText(record.address) || undefined,
          city: toText(record.city) || undefined,
          province: toText(record.province) || undefined,
          avatar: avatar ? toFileUrl(avatar) : undefined,
          created_at: toText(record.created_at ?? record.createdAt) || undefined,
          is_active: isActive,
          status,
        };
      });

      setUsers(mapped);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = [user.fullname, user.username, user.email, user.phone, user.city, user.province, user.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleStatusChange = useCallback(async (user: OrganizationUserRow, nextStatus: UserStatus) => {
    if (user.status === nextStatus || updatingUserIds.has(user.user_id)) return;

    const action = nextStatus;
    const prevStatus = user.status;
    const prevActive = user.is_active;
    const nextActive = nextStatus === 'enable';

    setUsers((prev) =>
      prev.map((item) =>
        item.user_id === user.user_id ? { ...item, status: nextStatus, is_active: nextActive } : item
      )
    );
    setUpdating(user.user_id, true);

    try {
      const res = await api.put(`/organization/users/${action}/${encodeURIComponent(user.user_id)}`, undefined, getHeaders());
      if (res.status !== 'success') {
        setUsers((prev) =>
          prev.map((item) =>
            item.user_id === user.user_id ? { ...item, status: prevStatus, is_active: prevActive } : item
          )
        );
        const message = res.message ? res.message : 'Gagal mengubah status akses pengguna.';
        await Swal.fire('Maaf, ada kesalahan', message, 'error');
      }
    } catch {
      setUsers((prev) =>
        prev.map((item) =>
          item.user_id === user.user_id ? { ...item, status: prevStatus, is_active: prevActive } : item
        )
      );
      await Swal.fire('Error', 'Terjadi kesalahan saat mengubah status akses pengguna.', 'error');
    } finally {
      setUpdating(user.user_id, false);
    }
  }, [getHeaders, setUpdating, updatingUserIds]);

  const handleApprove = useCallback(async (user: OrganizationUserRow) => {
    if (updatingUserIds.has(user.user_id)) return;

    setUpdating(user.user_id, true);
    try {
      const res = await api.put(`/organization/join/approve/${encodeURIComponent(user.user_id)}`, undefined, getHeaders());
      if (res.status !== 'success') {
        await Swal.fire('Error', 'Gagal mengonfirmasi akses pengguna.', 'error');
        return;
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.user_id === user.user_id ? { ...item, status: 'enable', is_active: true } : item
        )
      );
      await Swal.fire('Berhasil', 'Akses pengguna berhasil dikonfirmasi.', 'success');
    } catch {
      await Swal.fire('Error', 'Terjadi kesalahan saat mengonfirmasi akses pengguna.', 'error');
    } finally {
      setUpdating(user.user_id, false);
    }
  }, [getHeaders, setUpdating, updatingUserIds]);

  const handleReject = useCallback(async (user: OrganizationUserRow) => {
    if (updatingUserIds.has(user.user_id)) return;

    setUpdating(user.user_id, true);
    try {
      const res = await api.put(`/organization/join/reject/${encodeURIComponent(user.user_id)}`, undefined, getHeaders());
      if (res.status !== 'success') {
        await Swal.fire('Error', 'Gagal menolak akses pengguna.', 'error');
        return;
      }

      setUsers((prev) =>
        prev.map((item) =>
          item.user_id === user.user_id ? { ...item, status: 'disable', is_active: false } : item
        )
      );
      await Swal.fire('Berhasil', 'Akses pengguna berhasil ditolak.', 'success');
    } catch {
      await Swal.fire('Error', 'Terjadi kesalahan saat menolak akses pengguna.', 'error');
    } finally {
      setUpdating(user.user_id, false);
    }
  }, [getHeaders, setUpdating, updatingUserIds]);

  const handleDelete = useCallback(async (user: OrganizationUserRow) => {
    if (updatingUserIds.has(user.user_id)) return;

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus user?',
      text: `User "${user.fullname}" akan dihapus dan tidak dapat dikembalikan.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    setUpdating(user.user_id, true);
    try {
      const res = await api.put(`/organization/join/delete/${encodeURIComponent(user.user_id)}`, undefined, getHeaders());
      if (res.status !== 'success') {
        await Swal.fire('Error', 'Gagal menghapus user.', 'error');
        return;
      }

      setUsers((prev) => prev.filter((item) => item.user_id !== user.user_id));
      await Swal.fire('Terhapus', 'User berhasil dihapus.', 'success');
    } catch {
      await Swal.fire('Error', 'Terjadi kesalahan saat menghapus user.', 'error');
    } finally {
      setUpdating(user.user_id, false);
    }
  }, [getHeaders, setUpdating, updatingUserIds]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const columns = useMemo<Array<DataTableColumn<OrganizationUserRow>>>(() => [
    {
      label: 'No',
      key: '__no__',
      width: 72,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>,
    },
    {
      label: 'Nama',
      key: 'fullname',
      sortable: true,
      width: 320,
      render: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || avatarFallback}
            alt={user.fullname}
            className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-700"
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{user.fullname}</div>
            <div className="truncate text-xs text-muted-foreground">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      label: 'Username',
      key: 'username',
      sortable: true,
      width: 180,
      render: (user) => <span className="text-sm text-foreground">{user.username}</span>,
    },
    {
      label: 'Email',
      key: 'email',
      sortable: true,
      width: 260,
      render: (user) => <span className="text-sm text-foreground">{user.email}</span>,
    },
    {
      label: 'No. Telp',
      key: 'phone',
      sortable: true,
      width: 180,
      render: (user) => <span className="text-sm text-foreground">{formatPhoneNumberId(user.phone)}</span>,
    },
    {
      label: 'Status',
      key: 'status',
      sortable: true,
      width: 190,
      align: 'center',
      render: (user) => (
        <div
          className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800"
          role="radiogroup"
          aria-label={`Status akses ${user.fullname}`}
        >
          {(['enable', 'disable'] as UserStatus[]).map((status) => {
            const selected = user.status === status;
            return (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={updatingUserIds.has(user.user_id)}
                onClick={() => void handleStatusChange(user, status)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'bg-white text-green-700 shadow-sm dark:bg-gray-700 dark:text-green-300'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                )}
              >
                {status === 'enable' ? 'Enable' : 'Disable'}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      label: 'Actions',
      key: '__actions__',
      width: 88,
      align: 'right',
      sortable: false,
      render: (user) => {
        const actions: RowAction[] = user.is_active
          ? [
              {
                key: 'delete',
                label: 'Hapus User',
                icon: Trash2,
                variant: 'destructive',
                onSelect: () => void handleDelete(user),
              },
            ]
          : [
              {
                key: 'approve',
                label: 'Konfirmasi Akses',
                icon: UserCheck,
                onSelect: () => void handleApprove(user),
              },
              {
                key: 'reject',
                label: 'Tolak Akses',
                icon: XCircle,
                onSelect: () => void handleReject(user),
              },
            ];

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={updatingUserIds.has(user.user_id)}
                aria-label="Aksi user"
              >
                {updatingUserIds.has(user.user_id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {actions.map((action, index) => (
                <React.Fragment key={action.key}>
                  {index > 0 && action.variant === 'destructive' ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      action.onSelect();
                    }}
                    disabled={updatingUserIds.has(user.user_id)}
                  >
                    <action.icon className={cn('h-4 w-4', action.variant === 'destructive' ? 'text-red-600' : 'text-foreground')} />
                    <span className={cn(action.variant === 'destructive' ? 'text-red-600' : '')}>{action.label}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleApprove, handleDelete, handleReject, handleStatusChange, startIndex, updatingUserIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Users</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">Kelola anggota organisasi</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari nama, username, email, atau no. telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="enable">Enable</SelectItem>
              <SelectItem value="disable">Disable</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl px-4"
            onClick={handleResetFilters}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1080px]"
        emptyTitle="Tidak ada data user"
        emptyDescription="Coba ubah pencarian atau filter status."
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: filteredUsers.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'fullname', direction: 'asc' } }}
        rowKey={(user) => user.user_id}
      />
    </div>
  );
};
