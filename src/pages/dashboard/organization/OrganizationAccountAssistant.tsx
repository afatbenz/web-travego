import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BotMessageSquare,
  MessageCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Pencil,
  Users,
  ShieldCheck,
  ChevronsUpDown,
  Shield,
  Info,
  BadgeCheck,
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

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
      const assistantId = toText(raw.assistant_id ?? raw.id);
      const id = toText(raw.id ?? raw.user_id ?? raw.uuid ?? assistantId);
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
    .filter((item): item is NonNullable<typeof item> => Boolean(item && item.id));
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
    .filter((item): item is NonNullable<typeof item> => Boolean(item && item.id && item.name));
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
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

  return parts.filter(Boolean).join(' ');
}

function formatWABusinessInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function parseWABusinessInput(value: string): string {
  return value.replace(/\D/g, '');
}

export const OrganizationAccountAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AssistantUser[]>([]);
  const [totalAccount, setTotalAccount] = useState(0);
  const [remainingLimit, setRemainingLimit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageLoading, setPageLoading] = useState(true);

  const [subscriptionData, setSubscriptionData] = useState<{ package_price?: number } | null>(null);
  const [whatsappBusinessData, setWhatsappBusinessData] = useState<{
    account_number?: string;
    status_label?: string;
    device_id?: string;
    total_received?: number;
    total_sent?: number;
  } | null>(null);

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

  const [isWABusinessModalOpen, setIsWABusinessModalOpen] = useState(false);
  const [waBusinessInputRaw, setWaBusinessInputRaw] = useState('');
  const [waBusinessSubmitting, setWaBusinessSubmitting] = useState(false);
  const [waBusinessError, setWaBusinessError] = useState('');

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeePhoneLoading, setEmployeePhoneLoading] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPageLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        console.log("Calling APIs with headers:", headers);

        const [subscriptionRes, waBusinessRes, listRes] = await Promise.all([
          api.get<unknown>('/account/subscription', headers),
          api.get<unknown>('/organization/assistant/whatsapp-business', headers),
          api.get<unknown>('/organization/assistant/list', headers),
        ]);

        console.log("API responses:", { subscriptionRes, waBusinessRes, listRes });

        if (cancelled) return;

        if (subscriptionRes.status === 'success') {
          setSubscriptionData(subscriptionRes.data as { package_price?: number });
        }

        if (waBusinessRes.status === 'success') {
          setWhatsappBusinessData(
            waBusinessRes.data as {
              account_number?: string;
              statusLabel?: string;
              total_received?: number;
              total_sent?: number;
            },
          );
        }

        if (listRes.status === 'success') {
          const data = listRes.data as Record<string, unknown> | undefined;
          console.log("Data from list API:", data);
          const usersList = parseAssistantUsers(data?.users ?? data?.data ?? []);
          console.log("Parsed users list:", usersList);
          setUsers(usersList);
          setTotalAccount(toNumber(data?.total_account ?? data?.totalAccounts ?? usersList.length));
          setRemainingLimit(toNumber(data?.remaining_limit ?? data?.remainingLimit ?? 0));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        console.log("check status ", cancelled)
        if (!cancelled) {
          setPageLoading(false);
          setLoading(false);
        }
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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(users.length / Math.max(1, itemsPerPage))), [itemsPerPage, users.length]);
  const pagedUsers = useMemo(() => users.slice(startIndex, startIndex + Math.max(1, itemsPerPage)), [currentPage, itemsPerPage, users]);
  console.log({ pagedUsers, users });

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
  }, [addFormValues.accountName, addFormValues.accountNumber, addFormValues.employeeId, addFormValues.userType]);

  const reloadList = async (headers?: Record<string, string>) => {
    const listRes = await api.get<unknown>('/organization/assistant/list', headers);
    if (listRes.status !== 'success') return;
    const data = listRes.data as Record<string, unknown> | undefined;
    const usersList = parseAssistantUsers(data?.users ?? data?.data ?? []);
    setUsers(usersList);
    setTotalAccount(toNumber(data?.total_account ?? data?.totalAccounts ?? usersList.length));
    setRemainingLimit(toNumber(data?.remaining_limit ?? data?.remainingLimit ?? 0));
  };

  const reloadWABusiness = async (headers?: Record<string, string>) => {
    const waBusinessRes = await api.get<unknown>('/organization/assistant/whatsapp-business', headers);
    if (waBusinessRes.status === 'success') {
      setWhatsappBusinessData(
        waBusinessRes.data as {
          account_number?: string;
          status_label?: string;
          device_id?: string;
          total_received?: number;
          total_sent?: number;
        },
      );
    }
  };

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

  const closeDialog = () => {
    setIsFormOpen(false);
    setAddFormStep('type-select');
    setEmployeeOpen(false);
    setEmployeeSearch('');
  };

  const openWABusinessModal = () => {
    if (whatsappBusinessData?.account_number) {
      const num = whatsappBusinessData.account_number;
      setWaBusinessInputRaw(num.startsWith('62') ? num.slice(2) : num);
    } else {
      setWaBusinessInputRaw('');
    }
    setWaBusinessError('');
    setIsWABusinessModalOpen(true);
  };

  const handleWABusinessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseWABusinessInput(e.target.value);
    setWaBusinessInputRaw(value);
    setWaBusinessError('');
  };

  const handleWABusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaBusinessError('');

    if (waBusinessInputRaw.length < 8) {
      setWaBusinessError('Nomor WhatsApp minimal 8 digit');
      return;
    }
    if (waBusinessInputRaw.length > 13) {
      setWaBusinessError('Nomor WhatsApp maksimal 13 digit');
      return;
    }

    setWaBusinessSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const fullNumber = `62${waBusinessInputRaw}`;
      const payload = { account_number: fullNumber };

      const res = await api.post<unknown>('/organization/assistant/whatsapp-business/update', payload, headers);

      if (res.status !== 'success') {
        setWaBusinessError(res.message || 'Gagal menyimpan nomor WhatsApp');
        return;
      }

      const isUpdate = !!whatsappBusinessData?.account_number;
      toast({ title: 'Berhasil', description: isUpdate ? 'Nomor WhatsApp berhasil diperbarui' : 'Nomor WhatsApp berhasil ditambahkan' });
      await reloadWABusiness(headers);
      setIsWABusinessModalOpen(false);
    } finally {
      setWaBusinessSubmitting(false);
    }
  };

  const handleAddFormChange = (field: keyof AddFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'accountNumber' ? normalizeWhatsappNumber(event.target.value) : event.target.value;
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
        toast({ title: 'Error', description: res.message || 'Gagal menambah akses', variant: 'destructive' });
        return;
      }

      toast({ title: 'Berhasil', description: 'Akses berhasil ditambahkan' });
      setLoading(false);
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
      setLoading(false);
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
      setLoading(false);
      await reloadList(headers);
      closeDialog();
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const statsCards = [
    {
      title: 'Pesan Dari Pelanggan',
      value: whatsappBusinessData?.total_received ?? 0,
      icon: MessageCircle,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pesan Ke Pelanggan',
      value: whatsappBusinessData?.total_sent ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Jumlah Akun',
      value: totalAccount,
      subdesc: 'Akses ke System Assistant',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Sisa Limit',
      value: remainingLimit,
      subdesc: '',
      totalCredit: totalAccount + remainingLimit,
      icon: ShieldCheck,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xl sm:text-2xl font-semibold text-foreground">
              { whatsappBusinessData?.account_number ? 'Dengan Trave AI Assistant' : 'Hubungkan WA Business' } <br />
              Jangkau Pelanggan Lebih Dekat, Lebih Cepat
            </div>
            { !whatsappBusinessData?.account_number ? (
            <div className="mt-3 text-sm text-muted-foreground">
              Hubungkan nomor WhatsApp Business Anda untuk mulai menggunakan layanan AI Assistant dan memberikan pengalaman terbaik bagi pelanggan.
            </div>
           ) : ( null )}
            <div className="mt-6">
              {pageLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat...
                </div>
              ) : whatsappBusinessData?.account_number ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Nomor WhatsApp Business { whatsappBusinessData?.device_id === '' ? 'Sedang Ditinjau' : 'Telah Terhubung' }</div>
                  <div className="flex items-center gap-4">
                    
                    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatWhatsappNumber(whatsappBusinessData.account_number)}
                      </span>
                      { whatsappBusinessData?.device_id === '' ? null : (
                      <button
                                type="button"
                                onClick={openWABusinessModal}
                                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      )}
                    </div>
                      {whatsappBusinessData?.device_id === '' ? (
                        <div className="flex items-center gap-1 text-xs text-white font-semibold bg-red-600 rounded-full px-2 py-1">
                          <Info className="h-4 w-4" type='Menunggu verifikasi sistem' />
                          <span>{whatsappBusinessData?.status_label}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                          <span>{whatsappBusinessData?.status_label}</span>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div>
                  {subscriptionData?.package_price && subscriptionData.package_price > 0 ? (
                    <Button
                      variant="outline"
                      onClick={openWABusinessModal}
                      className="h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-5 text-center no-shadow"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Nomor WA Business
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`${location.pathname}/subscription/pricing`)}
                      className="h-11 rounded-xl border-2 border-primary px-5 text-primary hover:bg-primary/5"
                    >
                      Lihat Penawaran
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-green-100">
              <BotMessageSquare className="h-20 w-20 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-border bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-border', card.iconBg, card.iconColor)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
                    <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{card.value}</div>
                    {card.subdesc && <div className="mt-1 text-xs text-muted-foreground">{card.subdesc}</div>}
                    {card.totalCredit !== undefined && <div className="mt-1 text-xs text-muted-foreground">Total Kredit: {card.totalCredit}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground">Daftar Nomor Member yang Menggunakan AI Assistant (ERP)</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Daftar nomor WhatsApp member yang terdaftar di sistem ERP dan dapat menggunakan AI Assistant.
            </div>
          </div>
          <Button onClick={openAddDialog} className="h-11 rounded-xl border-2 border-primary px-5 text-primary hover:bg-primary/5" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Akses
          </Button>
        </div>

        {loading || pageLoading ? (
          <div className="py-10 text-sm text-muted-foreground">Memuat data...</div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <MessageCircle className="h-8 w-8" />
            </div>
            <div className="mt-4 text-lg font-semibold text-foreground">Belum ada pengguna</div>
            <div className="mx-auto mt-1 max-w-xl text-xs md:text-sm text-muted-foreground">
              Tambahkan nomor WhatsApp untuk mulai menggunakan layanan AI Assistant.
            </div>
            <div className="mt-6 flex justify-center">
              <Button onClick={openAddDialog} className="h-11 rounded-xl bg-primary hover:bg-primary/90 px-5 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Akses
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border overflow-hidden">
              <Table className="w-full">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    {[
                      { label: 'No', className: 'w-[72px] text-center' },
                      { label: 'Nama Pengguna', className: 'min-w-[220px]' },
                      { label: 'Posisi', className: 'min-w-[180px]' },
                      { label: 'Nomor Telepon', className: 'min-w-[200px]' },
                      { label: 'Tipe', className: 'min-w-[120px]' },
                      { label: 'Tanggal Ditambahkan', className: 'min-w-[200px]' },
                      { label: 'Aksi', className: 'w-[120px] text-right' },
                    ].map((h) => (
                      <TableHead
                        key={h.label}
                        className={cn('h-14 px-4 text-xs font-semibold uppercase tracking-wide text-white', h.className)}
                      >
                        {h.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedUsers.map((row, rowIndex) => {
                    console.log("--- ", {row})
                    const no = startIndex + rowIndex + 1;
                    const displayName = row.fullname || '-';
                    const isAdmin = row.user_type === 1;
                    const typeLabel = isAdmin ? 'Admin' : 'Member';
                    const TypeIcon = isAdmin ? Shield : Users;
                    const typeBadgeClass = isAdmin ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';

                    return (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">{no}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm font-semibold text-foreground">{displayName}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">{row.role_name || '-'}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                              <MessageCircle className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="text-sm font-medium text-foreground">{row.account_number || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="default" className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', typeBadgeClass)}>
                            <TypeIcon className="h-3 w-3" />
                            {typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-foreground">{formatDate(row.created_at || '')}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
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
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <option key={n} value={String(n)}>{n}</option>
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

      {/* WhatsApp Business Modal */}
      <Dialog open={isWABusinessModalOpen} onOpenChange={(open) => !open && setIsWABusinessModalOpen(false)}>
        <DialogContentScrollable className="max-w-[500px] w-[calc(100vw-2rem)] border border-border bg-background p-0 shadow-2xl sm:rounded-[24px]">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-16 items-center justify-center rounded-2xl bg-green-500 text-white">
                  <BotMessageSquare className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-foreground">
                    {whatsappBusinessData?.account_number ? 'Ubah Nomor WhatsApp Business' : 'Tambah Nomor WhatsApp Business'}
                  </div>
                  <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                    Masukkan nomor WhatsApp Business yang akan dijadikan sebagai assistant dalam melayani pelanggan.
                  </div>
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={() => setIsWABusinessModalOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup modal"
                  disabled={waBusinessSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <div className="mt-6 h-px bg-border" />
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleWABusinessSubmit}>
            <DialogScrollableBody className="px-6 py-6 space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                <div className="flex items-center gap-2">
                  <div className="flex h-12 items-center justify-center rounded-xl border border-border bg-muted/50 px-4 text-sm font-medium text-muted-foreground">
                    62
                  </div>
                  <Input
                    value={formatWABusinessInput(waBusinessInputRaw)}
                    onChange={handleWABusinessInputChange}
                    className="h-12 rounded-xl"
                    placeholder="812-3456-7890"
                    disabled={waBusinessSubmitting}
                    maxLength={15}
                  />
                </div>
                {waBusinessError && (
                  <div className="text-xs text-red-600">{waBusinessError}</div>
                )}
              </label>
            </DialogScrollableBody>

            <DialogStickyFooter className="flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWABusinessModalOpen(false)}
                  className="h-11 rounded-xl"
                  disabled={waBusinessSubmitting}
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold px-5 text-center no-shadow"
                disabled={waBusinessSubmitting}
              >
                {waBusinessSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {whatsappBusinessData?.account_number ? 'Update Nomor' : 'Tambah Nomor'}
              </Button>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>

      {/* Add Access Modal */}
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
                      ? 'Pilih tipe akun yang akan diberikan akses ke layanan AI Assistant.'
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
              {addFormStep === 'type-select' && (
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
              )}

              {addFormValues.userType === 1 && addFormStep === 'admin' && (
                <>
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
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                    <Input
                      value={addFormValues.accountNumber}
                      onChange={handleAddFormChange('accountNumber')}
                      className="h-12 rounded-xl"
                      placeholder="Masukkan nomor WhatsApp"
                      disabled={isSubmitting}
                    />
                  </label>
                </>
              )}

              {addFormValues.userType === 2 && addFormStep === 'employee' && (
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
                            className="h-11 border-b border-border"
                          />
                          <CommandList className="max-h-[300px] overflow-auto">
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                              Tidak ada karyawan ditemukan
                            </CommandEmpty>
                            <CommandGroup className="p-2">
                              {filteredEmployees.map((employee) => (
                                <CommandItem
                                  key={employee.id}
                                  onSelect={() => handleEmployeeSelect(employee)}
                                  className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted"
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <Users className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-foreground">{employee.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {employee.employee_id}
                                      {employee.division_name ? ` • ${employee.division_name}` : ''}
                                    </div>
                                  </div>
                                  {selectedEmployee?.id === employee.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                    <div className="relative">
                      <Input
                        value={addFormValues.accountNumber}
                        onChange={handleAddFormChange('accountNumber')}
                        className="h-12 rounded-xl pr-10"
                        placeholder="Masukkan nomor WhatsApp"
                        disabled={isSubmitting || employeePhoneLoading}
                      />
                      {employeePhoneLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </label>
                </>
              )}
            </DialogScrollableBody>

            <DialogStickyFooter className="flex justify-between gap-3 border-t border-border bg-background px-6 py-4">
              {addFormStep !== 'type-select' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddFormStep('type-select')}
                  className="h-11 rounded-xl"
                  disabled={isSubmitting}
                >
                  Kembali
                </Button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                </DialogClose>
                {addFormStep !== 'type-select' && (
                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white"
                    disabled={isSubmitting || !canSubmitAddAccess}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tambah Akses
                  </Button>
                )}
              </div>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>

      {/* Edit Access Modal */}
      <Dialog open={isFormOpen && formMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContentScrollable className="max-w-[500px] w-[calc(100vw-2rem)] border border-border bg-background p-0 shadow-2xl sm:rounded-[24px]">
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
                  <BotMessageSquare className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-foreground">Edit Akses</div>
                  <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                    Ubah data akses untuk AI Assistant.
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

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleEditFormSubmit}>
            <DialogScrollableBody className="px-6 py-6 space-y-5">
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
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
                <Input
                  value={editFormValues.accountNumber}
                  onChange={handleEditFormChange('accountNumber')}
                  className="h-12 rounded-xl"
                  placeholder="Masukkan nomor WhatsApp"
                  disabled={isSubmitting}
                />
              </label>
            </DialogScrollableBody>

            <DialogStickyFooter className="flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="h-11 rounded-xl"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>
    </div>
  );
};
