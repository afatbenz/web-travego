import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BotMessageSquare,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  CircleOff,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  User,
  MessageCircleOff,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContentScrollable,
  DialogScrollableBody,
  DialogStickyFooter,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AssistantUser = {
  id: string;
  assistant_id: string;
  fullname: string;
  employee_id: string;
  role_name: string;
  division_name: string;
  account_number: string;
  account_name?: string;
  user_type: number;
  avatar?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  last_active_at?: string;
  raw: Record<string, unknown>;
};

type EmployeeOption = {
  id: string;
  name: string;
  employee_id: string;
  role_name?: string;
  division_name?: string;
};

type AddFormMode = 'type-select' | 'admin' | 'employee';
type FormMode = 'add' | 'edit';

type AddFormValues = {
  userType: number | null;
  accountName: string;
  accountNumber: string;
  employeeId: string;
};

type EditFormValues = {
  assistantId: string;
  accountName: string;
  accountNumber: string;
  userType: number;
};

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseAssistantUsers(payload: unknown): AssistantUser[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const raw = item as Record<string, unknown>;
      const id = toText(raw.id ?? raw.user_id ?? raw.uuid);
      const assistantId = toText(raw.assistant_id ?? raw.id);
      const fullname = toText(raw.fullname ?? raw.full_name ?? raw.name ?? '');
      const employeeId = toText(raw.employee_id ?? raw.emp_id ?? '');
      const roleName = toText(raw.role_name ?? raw.role ?? '');
      const divisionName = toText(raw.division_name ?? raw.division ?? '');
      const accountNumber = toText(raw.account_number ?? raw.whatsapp_number ?? raw.phone ?? '');
      const accountName = toText(raw.account_name ?? raw.name ?? '');
      const userType = toNumber(raw.user_type ?? 0);
      const avatar = toText(raw.avatar ?? raw.photo ?? '');
      const statusRaw = toText(raw.status ?? 'active');
      const status = (statusRaw === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive';
      const createdAt = toText(raw.created_at ?? raw.createdAt ?? '');
      const lastActiveAt = toText(
        raw.last_active_at ??
          raw.last_active ??
          raw.lastActiveAt ??
          raw.lastActive ??
          raw.last_seen_at ??
          raw.last_seen ??
          raw.lastSeenAt ??
          raw.lastSeen ??
          '',
      );

      return {
        id: id || assistantId,
        assistant_id: assistantId,
        fullname,
        employee_id: employeeId,
        role_name: roleName,
        division_name: divisionName,
        account_number: accountNumber,
        account_name: accountName,
        user_type: userType,
        avatar,
        status,
        created_at: createdAt,
        last_active_at: lastActiveAt,
        raw,
      };
    })
    .filter((item): item is AssistantUser => Boolean(item && item.id));
}

function parseEmployees(payload: unknown): EmployeeOption[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const raw = item as Record<string, unknown>;
      const id = toText(raw.uuid ?? raw.id ?? raw.employee_id);
      const name = toText(raw.name ?? raw.fullname ?? raw.full_name ?? '');
      const employeeId = toText(raw.employee_id ?? raw.emp_id ?? '');
      const roleName = toText(raw.role_name ?? raw.role ?? '');
      const divisionName = toText(raw.division_name ?? raw.division ?? '');

      return {
        id: id || employeeId,
        name,
        employee_id: employeeId,
        role_name: roleName,
        division_name: divisionName,
      };
    })
    .filter((item): item is EmployeeOption => Boolean(item && item.id && item.name));
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function normalizeWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function formatWhatsappNumber(value: string): string {
  const digits = normalizeWhatsappNumber(value);
  if (!digits) return '';
  if (digits.length <= 2) return digits;

  const firstChunk = digits.slice(2, 5);
  const rest = digits.slice(5);
  const parts = ['+62'];

  if (firstChunk) parts.push(firstChunk);
  for (let index = 0; index < rest.length; index += 4) {
    parts.push(rest.slice(index, index + 4));
  }

  return parts.filter(Boolean).join('-');
}

export const OrganizationAccountAssistant: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AssistantUser[]>([]);
  const [totalAccount, setTotalAccount] = useState(0);
  const [remainingLimit, setRemainingLimit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formMode, setFormMode] = useState<FormMode>('add');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addFormStep, setAddFormStep] = useState<AddFormMode>('type-select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addFormValues, setAddFormValues] = useState<AddFormValues>({
    userType: null,
    accountName: '',
    accountNumber: '',
    employeeId: '',
  });

  const [editFormValues, setEditFormValues] = useState<EditFormValues>({
    assistantId: '',
    accountName: '',
    accountNumber: '',
    userType: 0,
  });

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeePhoneLoading, setEmployeePhoneLoading] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/organization/assistant/list', headers);

        if (cancelled || res.status !== 'success') {
          setUsers([]);
          return;
        }

        const data = res.data as Record<string, unknown> | undefined;
        const usersList = parseAssistantUsers(data?.users ?? data?.data ?? []);

        setUsers(usersList);
        setTotalAccount(toNumber(data?.total_account ?? data?.totalAccount ?? usersList.length));
        setRemainingLimit(toNumber(data?.remaining_limit ?? data?.remainingLimit ?? 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentPage <= 1) return;
    const totalPages = Math.max(1, Math.ceil(users.length / Math.max(1, itemsPerPage)));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, itemsPerPage, users.length]);

  useEffect(() => {
    if (!isFormOpen || addFormStep !== 'employee' || employees.length > 0 || employeesLoading) return;

    let cancelled = false;

    (async () => {
      setEmployeesLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/services/employee/all', headers);
        if (cancelled || res.status !== 'success') return;
        setEmployees(parseEmployees(res.data ?? []));
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addFormStep, employees.length, isFormOpen]);

  const maxQuota = totalAccount + remainingLimit;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(users.length / Math.max(1, itemsPerPage))), [itemsPerPage, users.length]);

  const pagedUsers = useMemo(() => {
    const start = (Math.max(1, currentPage) - 1) * Math.max(1, itemsPerPage);
    return users.slice(start, start + Math.max(1, itemsPerPage));
  }, [currentPage, itemsPerPage, users]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const search = employeeSearch.toLowerCase();
    return employees.filter((e) => e.name.toLowerCase().includes(search) || e.employee_id.toLowerCase().includes(search));
  }, [employeeSearch, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === addFormValues.employeeId) ?? null;
  }, [addFormValues.employeeId, employees]);

  const canSubmitAddAccess = useMemo(() => {
    if (addFormValues.userType === null) return false;

    const phoneOk = normalizeWhatsappNumber(addFormValues.accountNumber).length > 2;
    if (!phoneOk) return false;
    if (addFormValues.userType === 1) return Boolean(addFormValues.accountName.trim());
    if (addFormValues.userType === 2) return Boolean(addFormValues.employeeId);
    return false;
  }, [
    addFormValues.accountName,
    addFormValues.accountNumber,
    addFormValues.employeeId,
    addFormValues.userType,
  ]);

  const openAddDialog = () => {
    setFormMode('add');
    setAddFormStep('type-select');
    setAddFormValues({
      userType: null,
      accountName: '',
      accountNumber: '',
      employeeId: '',
    });
    setEmployeeSearch('');
    setIsFormOpen(true);
  };

  const openEditDialog = (user: AssistantUser) => {
    setFormMode('edit');
    const existingAccountName =
      user.user_type === 1
        ? (user.account_name || '').trim() || (user.fullname || '').trim()
        : (user.fullname || '').trim() || (user.account_name || '').trim();
    setEditFormValues({
      assistantId: user.assistant_id,
      accountName: existingAccountName,
      accountNumber: user.account_number,
      userType: user.user_type,
    });
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setAddFormStep('type-select');
    setEmployeeOpen(false);
    setEmployeeSearch('');
  };

  const handleAddFormChange = (field: keyof AddFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      field === 'accountNumber'
        ? normalizeWhatsappNumber(event.target.value)
        : event.target.value;
    setAddFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleEditFormChange = (field: keyof EditFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const selectUserType = (userType: number) => {
    setAddFormValues((current) => ({
      ...current,
      userType,
      accountName: userType === 1 ? current.accountName : '',
      employeeId: userType === 2 ? current.employeeId : '',
      accountNumber: userType === current.userType ? current.accountNumber : '',
    }));
    setAddFormStep(userType === 1 ? 'admin' : 'employee');
    setEmployeeSearch('');
    setEmployeeOpen(false);
  };

  const selectEmployee = (employee: EmployeeOption) => {
    setAddFormValues((current) => ({ ...current, employeeId: employee.id }));
    setEmployeeOpen(false);
  };

  const handleEmployeeSelect = async (employee: EmployeeOption) => {
    selectEmployee(employee);

    setEmployeePhoneLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.get<unknown>(`/organization/employee/whatsapp/${employee.id}`, headers);
      if (res.status !== 'success') return;

      const data = (res.data ?? {}) as Record<string, unknown>;
      const phone = normalizeWhatsappNumber(toText(data.phone));
      setAddFormValues((current) => ({
        ...current,
        employeeId: employee.id,
        accountNumber: phone || current.accountNumber,
      }));
    } finally {
      setEmployeePhoneLoading(false);
    }
  };

  const reloadList = async (headers?: Record<string, string>) => {
    const listRes = await api.get<unknown>('/organization/assistant/list', headers);
    if (listRes.status !== 'success') return;
    const data = listRes.data as Record<string, unknown> | undefined;
    const usersList = parseAssistantUsers(data?.users ?? data?.data ?? []);
    setUsers(usersList);
    setTotalAccount(toNumber(data?.total_account ?? data?.totalAccount ?? usersList.length));
    setRemainingLimit(toNumber(data?.remaining_limit ?? data?.remainingLimit ?? 0));
  };

  const handleAddFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loading && remainingLimit <= 0) {
      toast({
        title: 'Kuota Habis',
        description: 'Sisa kuota akun sudah habis. Upgrade paket untuk menambah akses.',
        variant: 'destructive',
      });
      return;
    }

    if (addFormValues.userType === null) {
      toast({ title: 'Error', description: 'Silakan pilih tipe akun', variant: 'destructive' });
      return;
    }
    if (normalizeWhatsappNumber(addFormValues.accountNumber).length <= 2) {
      toast({ title: 'Error', description: 'Nomor WhatsApp tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (addFormValues.userType === 1 && !addFormValues.accountName.trim()) {
      toast({ title: 'Error', description: 'Nama akun tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (addFormValues.userType === 2 && !addFormValues.employeeId) {
      toast({ title: 'Error', description: 'Silakan pilih karyawan', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload = {
        user_type: addFormValues.userType,
        account_number: normalizeWhatsappNumber(addFormValues.accountNumber),
        ...(addFormValues.userType === 1 ? { account_name: addFormValues.accountName } : {}),
        ...(addFormValues.userType === 2 ? { employee_id: addFormValues.employeeId } : {}),
      };

      const res = await api.post<unknown>('/organization/assistant/submit', payload, headers);
      if (res.status !== 'success') {
        toast({ title: 'Error', description: res.message || 'Gagal menambahkan akses', variant: 'destructive' });
        return;
      }

      toast({ title: 'Berhasil', description: 'Akses berhasil ditambahkan' });
      setLoading(true);
      await reloadList(headers);
      closeDialog();
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleEditFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editFormValues.accountNumber.trim()) {
      toast({ title: 'Error', description: 'Nomor WhatsApp tidak boleh kosong', variant: 'destructive' });
      return;
    }
    if (editFormValues.userType === 1 && !editFormValues.accountName.trim()) {
      toast({ title: 'Error', description: 'Nama akun tidak boleh kosong', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload = {
        assistant_id: editFormValues.assistantId,
        account_number: editFormValues.accountNumber,
        ...(editFormValues.userType === 1 ? { account_name: editFormValues.accountName } : {}),
      };

      const res = await api.post<unknown>('/organization/assistant/update', payload, headers);
      if (res.status !== 'success') {
        toast({ title: 'Error', description: res.message || 'Gagal memperbarui akses', variant: 'destructive' });
        return;
      }

      toast({ title: 'Berhasil', description: 'Akses berhasil diperbarui' });
      setLoading(true);
      await reloadList(headers);
      closeDialog();
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: AssistantUser) => {
    const result = await Swal.fire({
      title: 'Hapus Akses',
      text: `Apakah Anda yakin ingin menghapus akses untuk ${user.fullname || user.account_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.post<unknown>('/organization/assistant/delete', { assistant_id: user.assistant_id }, headers);
      if (res.status !== 'success') {
        toast({ title: 'Error', description: res.message || 'Gagal menghapus akses', variant: 'destructive' });
        return;
      }

      toast({ title: 'Berhasil', description: 'Akses berhasil dihapus' });
      setLoading(true);
      await reloadList(headers);
      closeDialog();
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Akses AI Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola nomor WhatsApp yang memiliki izin untuk menggunakan layanan AI Assistant organisasi.
          </p>
        </div>
        <Button onClick={openAddDialog} className="h-11 rounded-xl border-2 border-green-400 hover:border-green-600 px-5 text-green-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Akses
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-green-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary ring-1 ring-primary/20">
            <BotMessageSquare className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base sm:text-lg font-semibold text-foreground">
                Kelola Akses AI Assistant melalui WhatsApp
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-medium text-green-600 ring-1 ring-primary/20">
                AI Assistant Access
              </span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Nomor WhatsApp yang terdaftar pada halaman ini dapat berinteraksi dengan AI Assistant organisasi sesuai hak akses yang diberikan.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            icon: Users,
            iconBg: 'bg-blue-100',
            iconTone: 'text-blue-900',
            title: 'Total Akun',
            value: totalAccount,
            description: 'Nomor WhatsApp terdaftar',
          },
          {
            icon: ShieldCheck,
            iconBg: 'bg-emerald-500/10',
            iconTone: 'text-emerald-800',
            title: 'Sisa Kuota',
            value: remainingLimit,
            description: 'Masih dapat ditambahkan',
          },
          {
            icon: BarChart3,
            iconBg: 'bg-purple-500/10',
            iconTone: 'text-purple-700',
            title: 'Kuota Maksimal',
            value: maxQuota,
            description: 'Sesuai paket aktif',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group rounded-2xl border border-border bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-border', card.iconBg, card.iconTone)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{card.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{card.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-background shadow-sm">
        {loading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Memuat data...</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <MessageCircleOff className="h-8 w-8" />
            </div>
            <div className="mt-4 text-lg font-semibold text-foreground">Belum ada akun WhatsApp</div>
            <div className="mx-auto mt-1 max-w-xl text-xs md:text-sm text-muted-foreground">
              Tambahkan nomor WhatsApp untuk mulai menggunakan layanan AI Assistant.
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={openAddDialog} className="h-11 rounded-xl bg-green-500 hover:bg-green-600 px-5 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Akses
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-6 py-4">
              <div className="text-sm font-semibold text-foreground">Daftar Akses</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Nomor yang terdaftar dapat menggunakan AI Assistant. Admin dapat menambah atau menghapus akses.
              </div>
            </div>

            <Table className="w-full">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  {[
                    { label: 'No', className: 'w-[72px] text-center' },
                    { label: 'Nomor WhatsApp', className: 'min-w-[180px]' },
                    { label: 'Nama Pengguna', className: 'min-w-[220px]' },
                    { label: 'Role', className: 'min-w-[140px]' },
                    { label: 'Status', className: 'min-w-[140px]' },
                    { label: 'Terdaftar Pada', className: 'min-w-[180px]' },
                    { label: 'Terakhir Aktif', className: 'min-w-[180px]' },
                    { label: 'Aksi', className: 'w-[120px] text-right' },
                  ].map((h) => (
                    <TableHead key={h.label} className={cn('h-14 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground', h.className)}>
                      {h.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map((row, rowIndex) => {
                  const no = startIndex + rowIndex + 1;
                  const isAdmin = row.user_type === 1;
                  const roleLabel = isAdmin ? 'Admin' : 'Karyawan';
                  const RoleIcon = isAdmin ? Shield : User;
                  const roleBadgeClass = isAdmin ? 'bg-orange-500 text-white' : 'bg-emerald-500/10 text-emerald-700';
                  const statusLabel = row.status === 'active' ? 'Aktif' : 'Nonaktif';
                  const StatusIcon = row.status === 'active' ? CheckCircle2 : CircleOff;
                  const statusBadgeClass =
                    row.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-muted text-muted-foreground';
                  const displayName = (isAdmin ? row.account_name : row.fullname) || row.fullname || row.account_name || '-';

                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">{no}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{row.account_number || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-semibold text-foreground">{displayName}</div>
                        {row.employee_id ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {row.employee_id}
                            {row.role_name || row.division_name ? (
                              <span className="text-muted-foreground">
                                {' '}
                                • {row.role_name || '-'}
                                {row.division_name ? ` (${row.division_name})` : ''}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium', roleBadgeClass)}>
                          <RoleIcon className="h-4 w-4" />
                          {roleLabel}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium', statusBadgeClass)}>
                          <StatusIcon className="h-4 w-4" />
                          {statusLabel}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-foreground">{formatDate(row.created_at || '')}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-foreground">{formatDateTime(row.last_active_at || '')}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDialog(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Edit akses"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-red-600 shadow-sm transition-colors hover:bg-red-50"
                            aria-label="Hapus akses"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, users.length)} dari {users.length}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows</span>
                  <select
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                    value={String(itemsPerPage)}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Rows per page"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Halaman sebelumnya"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">{currentPage}</span> / {totalPages}
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    aria-label="Halaman berikutnya"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-4 text-amber-950">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-200/70">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Security Notice</div>
            <div className="mt-1 text-sm text-amber-900">
              Pastikan hanya nomor WhatsApp yang berwenang yang diberikan akses untuk menjaga keamanan data dan layanan AI Assistant.
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isFormOpen && formMode === 'add'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContentScrollable className="max-w-[700px] w-[calc(100vw-2rem)] border border-border bg-background p-0 shadow-2xl sm:rounded-[24px]">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <BotMessageSquare className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-foreground">
                    {addFormStep === 'type-select' ? 'Tambah Akses AI Assistant' : 'Lengkapi Data Akses'}
                  </div>
                  <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                    {addFormStep === 'type-select'
                      ? 'Pilih jenis akun yang akan diberikan akses ke layanan AI Assistant.'
                      : addFormStep === 'admin'
                        ? 'Tambahkan nomor WhatsApp baru dengan akses penuh ke AI Assistant.'
                        : 'Pilih pengguna dari daftar karyawan untuk diberikan akses AI Assistant.'}
                  </div>
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup modal"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <div className="mt-6 h-px bg-border" />
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleAddFormSubmit}>
            <DialogScrollableBody className="px-6 py-6 space-y-5">
              <div role="radiogroup" aria-label="Pilih tipe akun" className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-10">
                {[
                  {
                    value: 1,
                    title: 'Akun Admin',
                    description: 'Tambahkan nomor WhatsApp baru dengan akses penuh ke AI Assistant.',
                    icon: ShieldCheck,
                  },
                  {
                    value: 2,
                    title: 'Akun Karyawan',
                    description: 'Pilih pengguna dari daftar karyawan untuk diberikan akses AI Assistant.',
                    icon: Users,
                  },
                ].map((opt) => {
                  const selected = addFormValues.userType === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectUserType(opt.value)}
                      className={cn(
                        'group rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                        selected ? 'border-primary/50 bg-primary/5 shadow-[0_0_0_4px_rgba(59,130,246,0.10)]' : 'border-border bg-background',
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-border transition-colors',
                            selected ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold text-foreground">{opt.title}</div>
                          <div className="mt-1 text-xs md:text-sm text-muted-foreground">{opt.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {addFormValues.userType === 1 ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Nama Akun</span>
                  <Input
                    value={addFormValues.accountName}
                    onChange={handleAddFormChange('accountName')}
                    className="h-12 rounded-xl"
                    placeholder="Masukkan nama akun admin"
                    disabled={isSubmitting}
                  />
                </label>
              ) : null}

              {addFormValues.userType === 2 ? (
                <>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Pilih Karyawan</span>
                    <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={employeeOpen}
                          className="h-12 w-full justify-between rounded-xl border-border bg-background font-normal"
                          disabled={employeesLoading || isSubmitting}
                        >
                          <span className={cn('truncate text-left', selectedEmployee ? 'text-foreground' : 'text-muted-foreground')}>
                            {selectedEmployee
                              ? `${selectedEmployee.name} (${selectedEmployee.employee_id || selectedEmployee.id})`
                              : employeesLoading
                                ? 'Memuat karyawan...'
                                : 'Pilih karyawan'}
                          </span>
                          {employeesLoading ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-70" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-border p-0 shadow-lg" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari karyawan..."
                            value={employeeSearch}
                            onValueChange={setEmployeeSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{employeesLoading ? 'Memuat karyawan...' : 'Karyawan tidak ditemukan.'}</CommandEmpty>
                            <CommandGroup>
                              {filteredEmployees.map((employee) => {
                                const selected = addFormValues.employeeId === employee.id;
                                return (
                                  <CommandItem
                                    key={employee.id}
                                    value={`${employee.name} ${employee.employee_id} ${employee.id}`}
                                    onSelect={() => void handleEmployeeSelect(employee)}
                                    className="rounded-lg"
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="truncate">{employee.name}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">{employee.employee_id || employee.id}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedEmployee ? (
                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{selectedEmployee.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {selectedEmployee.employee_id || selectedEmployee.id}
                            {selectedEmployee.role_name ? ` • ${selectedEmployee.role_name}` : ''}
                            {selectedEmployee.division_name ? ` (${selectedEmployee.division_name})` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {addFormValues.userType !== null ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-green-500 text-white">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <Input
                      value={formatWhatsappNumber(addFormValues.accountNumber)}
                      onChange={handleAddFormChange('accountNumber')}
                      inputMode="numeric"
                      className="h-12 rounded-xl pl-14"
                      placeholder="62 812 3456 7890"
                      disabled={isSubmitting || employeePhoneLoading}
                    />
                    {employeePhoneLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">Nomor hanya angka dan kode negara (+62).</p>
                </label>
              ) : null}

              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">Keamanan & Privasi</div>
                    <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                      Hanya berikan akses kepada nomor WhatsApp yang telah diverifikasi dan memiliki kewenangan menggunakan layanan AI Assistant.
                    </div>
                  </div>
                </div>
              </div>
            </DialogScrollableBody>

            <DialogStickyFooter className="border-t border-border px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Sisa kuota: <span className="font-medium text-foreground">{remainingLimit}</span> akun
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={closeDialog} disabled={isSubmitting}>
                    <X className="mr-2 h-4 w-4" />
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    disabled={isSubmitting || employeePhoneLoading || !canSubmitAddAccess}
                  >
                    Simpan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>

      <Dialog open={isFormOpen && formMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContentScrollable className="max-w-[700px] w-[calc(100vw-2rem)] border border-border bg-background p-0 shadow-2xl sm:rounded-[24px]">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <BotMessageSquare className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-foreground">Edit Akses AI Assistant</div>
                  <div className="mt-1 text-sm text-muted-foreground">Perbarui informasi akses untuk nomor WhatsApp ini.</div>
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup modal"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <div className="mt-6 h-px bg-border" />
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleEditFormSubmit}>
            <DialogScrollableBody className="px-6 py-6 space-y-5">
              {editFormValues.userType === 1 ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Nama Akun</span>
                  <Input
                    value={editFormValues.accountName}
                    onChange={handleEditFormChange('accountName')}
                    className="h-12 rounded-xl"
                    placeholder="Masukkan nama akun"
                    disabled={isSubmitting}
                  />
                </label>
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                <Input
                  value={editFormValues.accountNumber}
                  onChange={handleEditFormChange('accountNumber')}
                  inputMode="numeric"
                  className="h-12 rounded-xl"
                  placeholder="Contoh: 628123456789"
                  disabled={isSubmitting}
                />
              </label>
            </DialogScrollableBody>

            <DialogStickyFooter className="border-t border-border px-6 py-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() =>
                    handleDelete(
                      users.find((u) => u.assistant_id === editFormValues.assistantId) ||
                        ({ fullname: 'Akun ini', assistant_id: editFormValues.assistantId } as AssistantUser),
                    )
                  }
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={closeDialog} disabled={isSubmitting}>
                    <X className="mr-2 h-4 w-4" />
                    Batal
                  </Button>
                  <Button type="submit" className="h-11 rounded-xl bg-green-600 text-white shadow-sm hover:bg-green-700" disabled={isSubmitting}>
                    Simpan Perubahan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>
    </div>
  );
};
