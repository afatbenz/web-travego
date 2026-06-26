import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Plus, Save, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api, toFileUrl } from '@/lib/api';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const LeaveManagement: React.FC = () => {
  type LeaveRow = {
    id: string;
    employeeId: string;
    employeeNip: string;
    employeeName: string;
    employeeAvatarUrl?: string;
    divisionName: string;
    totalDays: number;
    startDate: string;
    endDate: string;
    leaveType: string;
    status: string;
    attachmentUrl?: string;
  };

  type EmployeeOption = { value: string; label: string };

  const toRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const toStringSafe = (v: unknown): string =>
    typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

  const tryParseDate = (value: string): Date | null => {
    const v = String(value ?? '').trim();
    if (!v) return null;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const iso = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(iso.getTime()) ? null : iso;
  };

  const formatDdMmmYy = (value: string) => {
    const d = tryParseDate(value);
    if (!d) return '-';
    const formatted = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
    return formatted.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  };

  const formatDateRange = (start: string, end: string) => {
    const s = formatDdMmmYy(start);
    const e = formatDdMmmYy(end);
    if (s === '-' && e === '-') return '-';
    if (s !== '-' && (e === '-' || s === e)) return s;
    return `${s} - ${e}`;
  };

  const diffDaysInclusive = (start: string, end: string) => {
    const s = tryParseDate(start);
    const e = tryParseDate(end);
    if (!s || !e) return 0;
    const s0 = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
    const e0 = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
    const d = Math.floor((e0 - s0) / (1000 * 60 * 60 * 24));
    return d >= 0 ? d + 1 : 0;
  };

  const statusBadge = (status: string) => {
    const v = String(status ?? '').trim().toLowerCase();
    if (!v) return <Badge variant="outline">-</Badge>;
    if (['approved', 'approve', 'disetujui', 'accepted', 'accept'].includes(v)) {
      return (
        <Badge className="rounded-full border-transparent bg-transparent px-3 py-1 font-medium text-emerald-700 hover:bg-gray-200/10 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/15">
          Disetujui
        </Badge>
      );
    }
    if (['rejected', 'reject', 'ditolak', 'declined', 'decline'].includes(v)) {
      return (
        <Badge className="rounded-full border-transparent bg-transparent px-3 py-1 font-medium text-rose-700 hover:bg-gray-200/10 dark:bg-rose-400/15 dark:text-rose-300 dark:hover:bg-rose-400/15">
          Ditolak
        </Badge>
      );
    }
    if (['pending', 'menunggu', 'waiting', 'waiting_approval', 'waiting-approval', 'in_review', 'review'].includes(v)) {
      return (
        <Badge className="rounded-full border-transparent bg-transparent px-3 py-1 font-medium text-amber-700 hover:bg-gray-200/10 dark:bg-amber-400/15 dark:text-amber-300 dark:hover:bg-amber-400/15">
          Menunggu
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const monthNames = useMemo(
    () => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    []
  );

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 9 }).map((_, i) => y - 4 + i);
  }, []);

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return d;
    });
  };

  const setMonth = (monthIndex: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), monthIndex, 1));
  };

  const setYear = (year: number) => {
    setCurrentDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  const requestIdRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      const month = String(selectedMonth + 1).padStart(2, '0');
      const year = String(selectedYear);
      const currentReq = (requestIdRef.current += 1);

      setLoading(true);
      setNotFound(false);
      try {
        const token = localStorage.getItem('token') ?? '';
        const qs = new URLSearchParams();
        qs.set('month', month);
        qs.set('year', year);
        const res = await api.get<unknown>(
          `/services/leave-management/list?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );

        if (currentReq !== requestIdRef.current) return;

        if (res.status !== 'success') {
          setRows([]);
          setNotFound(res.statusCode === 404);
          return;
        }

        const payload = res.data as unknown;
        const root = toRecord(payload);
        const dataNode = root.data;
        const dataObj = toRecord(dataNode);
        const listNode =
          (Array.isArray(payload) ? payload : undefined) ??
          (Array.isArray(dataNode) ? dataNode : undefined) ??
          (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
          (Array.isArray(dataObj.rows) ? dataObj.rows : undefined) ??
          (Array.isArray(dataObj.data) ? dataObj.data : undefined) ??
          (Array.isArray(root.items) ? root.items : undefined) ??
          (Array.isArray(root.rows) ? root.rows : undefined) ??
          (Array.isArray(root.data) ? root.data : undefined) ??
          [];

        const mapped = (listNode as unknown[]).map((raw, idx) => {
          const o = toRecord(raw);
          const employee = toRecord(o.employee ?? o.user ?? o.karyawan);
          const division = toRecord(o.division ?? employee.division);

          const id = toStringSafe(o.leave_id ?? o.leaveId ?? o.id ?? o.uuid ?? o.request_id ?? o.requestId).trim() || `tmp-${idx}`;

          const employeeId = toStringSafe(o.employee_id ?? o.employeeId ?? employee.uuid ?? employee.id ?? employee.employee_uuid ?? employee.employeeUuid).trim();
          const employeeNip = toStringSafe(o.employee_nip ?? o.employeeNip ?? employee.nip ?? employee.nik).trim();
          const employeeName =
            toStringSafe(o.customer_name ?? o.customerName ?? o.employee_name ?? o.employeeName ?? employee.fullname ?? employee.full_name ?? employee.name).trim() ||
            '-';
          const avatarRaw = o.avatar ?? o.avatar_url ?? o.avatarUrl ?? employee.avatar_url ?? employee.avatarUrl ?? employee.avatar;
          const employeeAvatarUrl = toStringSafe(avatarRaw).trim();

          const divisionName =
            toStringSafe(o.division_name ?? o.divisionName ?? division.division_name ?? division.name ?? employee.division_name).trim() || '-';

          const startDate = toStringSafe(o.start_date ?? o.startDate ?? o.date_start ?? o.dateStart ?? o.from_date ?? o.fromDate ?? o.date).trim();
          const endDate = toStringSafe(o.end_date ?? o.endDate ?? o.date_end ?? o.dateEnd ?? o.to_date ?? o.toDate ?? startDate).trim();

          const totalDays = diffDaysInclusive(startDate, endDate);

          const leaveType =
            toStringSafe(o.leave_type_label ?? o.leaveTypeLabel ?? o.type_label ?? o.typeLabel).trim() ||
            toStringSafe(o.leave_type ?? o.leaveType ?? o.type_name ?? o.typeName ?? o.leave_type_name ?? o.leaveTypeName).trim() ||
            '-';

          const status = toStringSafe(o.status ?? o.status_label ?? o.statusLabel ?? o.approval_status ?? o.approvalStatus).trim() || '-';
          const attachmentRaw =
            o.attachment ??
            o.attachment_url ??
            o.attachmentUrl ??
            o.file ??
            o.file_url ??
            o.fileUrl ??
            o.document ??
            o.document_url ??
            o.documentUrl;
          const attachmentUrl = toStringSafe(attachmentRaw).trim();

          return {
            id,
            employeeId,
            employeeNip,
            employeeName,
            employeeAvatarUrl: employeeAvatarUrl ? toFileUrl(employeeAvatarUrl) : undefined,
            divisionName,
            totalDays,
            startDate,
            endDate,
            leaveType,
            status,
            attachmentUrl: attachmentUrl ? toFileUrl(attachmentUrl) : undefined,
          } satisfies LeaveRow;
        });

        setRows(mapped);
      } finally {
        if (currentReq === requestIdRef.current) setLoading(false);
      }
    };
    load();
    setPage(1);
  }, [selectedMonth, selectedYear, reloadKey]);

  const columns: Array<DataTableColumn<LeaveRow>> = useMemo(
    () => [
      {
        label: 'Nama',
        key: 'employeeName',
        width: '28%',
        render: (row) => {
          const href = `${basePrefix}/organization/team-members/detail/${encodeURIComponent(row.employeeId || '')}`;
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                {row.employeeAvatarUrl ? (
                  <img src={row.employeeAvatarUrl} alt={row.employeeName} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <Link to={href} className="font-medium text-blue-700 hover:no-underline text-bold dark:text-blue-300 truncate block">
                  {row.employeeName || '-'}
                </Link>
                <div className="text-xs text-muted-foreground truncate">{row.employeeNip || '-'}</div>
              </div>
            </div>
          );
        },
      },
      { label: 'Divisi', key: 'divisionName', width: '18%' },
      {
        label: 'Jumlah Hari',
        key: 'totalDays',
        width: 120,
        align: 'center',
        render: (row) => (row.totalDays > 0 ? row.totalDays : '-'),
      },
      {
        label: 'Tanggal',
        key: 'startDate',
        width: '18%',
        render: (row) => formatDateRange(row.startDate, row.endDate),
      },
      { label: 'Jenis Cuti', key: 'leaveType', width: '16%' },
      {
        label: 'Status',
        key: 'status',
        width: 140,
        align: 'center',
        render: (row) => statusBadge(row.status),
      },
      {
        label: 'Action',
        key: '__action',
        width: 140,
        align: 'right',
        sortable: false,
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            {row.attachmentUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => window.open(row.attachmentUrl, '_blank', 'noopener,noreferrer')}
              >
                Attachment
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="h-8" disabled>
              Detail
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentPath, setAttachmentPath] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    employeeNip: '',
    replacementEmployeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null as File | null,
  });

  const resetCreateForm = () => {
    setCreateForm({
      employeeId: '',
      employeeNip: '',
      replacementEmployeeId: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachment: null,
    });
    setAttachmentUploading(false);
    setAttachmentPath('');
    setAttachmentError('');
  };

  useEffect(() => {
    if (!createOpen) return;
    const loadEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/employee/all', token ? { Authorization: token } : undefined);
        if (res.status !== 'success') {
          setEmployees([]);
          return;
        }

        const payload = res.data as unknown;
        const root = toRecord(payload);
        const rootData = root.data;
        const dataObj = toRecord(rootData);
        const listNode =
          (Array.isArray(payload) ? payload : undefined) ??
          (Array.isArray(rootData) ? rootData : undefined) ??
          (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
          (Array.isArray(dataObj.employees) ? dataObj.employees : undefined) ??
          (Array.isArray(root.employees) ? root.employees : undefined) ??
          [];

        const mapped = (listNode as unknown[]).map((raw, idx) => {
          const o = toRecord(raw);
          const id = toStringSafe(o.uuid ?? o.id ?? o.employee_uuid ?? o.employeeUuid).trim() || `emp-${idx}`;
          const employeeNip = toStringSafe(o.employee_nip ?? o.employeeNip ?? o.nip ?? o.nik).trim();
          const fullname = toStringSafe(o.fullname ?? o.full_name ?? o.fullName ?? o.name).trim();
          const label = `${employeeNip || id}${fullname ? ` - ${fullname}` : ''}`.trim();
          return { value: id, label: label || id } satisfies EmployeeOption;
        });

        setEmployees(mapped);
      } finally {
        setEmployeesLoading(false);
      }
    };

    loadEmployees();
  }, [createOpen]);

  const replacementOptions = useMemo(() => {
    const selected = createForm.employeeId;
    return employees.filter((e) => e.value !== selected);
  }, [createForm.employeeId, employees]);



  const canSave =
    Boolean(createForm.employeeId) &&
    Boolean(createForm.leaveType) &&
    Boolean(createForm.startDate) &&
    Boolean(createForm.endDate) &&
    (!createForm.attachment || Boolean(attachmentPath)) &&
    !attachmentUploading &&
    !creating;

  const onSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const payload: Record<string, unknown> = {
        employee_id: String(createForm.employeeId ?? '').trim(),
        leave_type: String(createForm.leaveType ?? '').trim(),
        start_date: String(createForm.startDate ?? '').trim(),
        end_date: String(createForm.endDate ?? '').trim(),
        reason: String(createForm.reason ?? '').trim(),
      };
      const replacement = String(createForm.replacementEmployeeId ?? '').trim();
      if (replacement) payload.substitute_id = replacement;
      if (attachmentPath.trim()) payload.attachment_path = attachmentPath.trim();

      const res = await api.post<unknown>('/services/leave-management/create', payload, headers);
      if (res.status !== 'success') return;

      setCreateOpen(false);
      resetCreateForm();
      setReloadKey((k) => k + 1);
    } finally {
      setCreating(false);
    }
  };



  const extractAttachmentPath = (payload: unknown): string => {
    if (typeof payload === 'string') return payload.trim();
    const root = toRecord(payload);
    const dataNode = root.data;
    const dataObj = toRecord(dataNode);
    const direct =
      toStringSafe(
        root.attachment_path ??
          root.attachmentPath ??
          root.path ??
          root.file ??
          root.file_path ??
          root.filePath ??
          root.url ??
          root.first_url ??
          dataObj.attachment_path ??
          dataObj.attachmentPath ??
          dataObj.path ??
          dataObj.file ??
          dataObj.file_path ??
          dataObj.filePath ??
          dataObj.url ??
          dataObj.first_url
      ).trim();
    if (direct) return direct;
    const filesRaw = root.files ?? dataObj.files;
    if (Array.isArray(filesRaw) && filesRaw.length > 0) return toStringSafe(filesRaw[0]).trim();
    return '';
  };

  const onAttachmentChange = async (file: File | null) => {
    setCreateForm((p) => ({ ...p, attachment: file }));
    setAttachmentError('');
    setAttachmentPath('');
    if (!file) return;

    setAttachmentUploading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const fd = new FormData();
      fd.append('files', file);
      const res = await api.post<unknown>('/services/leave-management/attachment', fd, headers);
      if (res.status !== 'success') {
        setAttachmentError('Upload gagal');
        return;
      }
      const path = extractAttachmentPath(res.data as unknown);
      if (!path) {
        setAttachmentError('Upload gagal');
        return;
      }
      setAttachmentPath(path);
    } finally {
      setAttachmentUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Kelola cuti dan izin karyawan</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Cuti Baru
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Prev
          </Button>
          <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={() => navigateMonth('next')}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Bulan</div>
            <Select value={String(selectedMonth)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-10 w-full sm:w-[220px]">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, idx) => (
                  <SelectItem key={m} value={String(idx)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Tahun</div>
            <Select value={String(selectedYear)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-10 w-full sm:w-[140px]">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        emptyTitle={notFound ? 'Not found' : 'Tidak ada data'}
        emptyDescription={notFound ? 'Data cuti tidak ditemukan.' : 'Belum ada pengajuan cuti pada periode ini.'}
        pagination={{
          enabled: true,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[720px] p-0 border-none bg-white dark:bg-[#080b11] overflow-hidden">
          <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
<div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-slate-900 truncate">Tambah Cuti Baru</h2>
                  <p className="text-slate-500 text-sm truncate">Lengkapi form berikut untuk membuat pengajuan cuti.</p>
                </div>
              </div>
              <DialogClose className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
                <X className="w-5 h-5" />
              </DialogClose>
            </div>

            <div className="h-px bg-slate-100" />

            <form onSubmit={onSaveCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Pilih Karyawan</Label>
                  <Select
                    value={createForm.employeeId}
                    onValueChange={(v) =>
                      setCreateForm((p) => ({
                        ...p,
                        employeeId: v,
                        replacementEmployeeId: p.replacementEmployeeId === v ? '' : p.replacementEmployeeId,
                      }))
                    }
                    disabled={employeesLoading}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all">
                      <SelectValue placeholder={employeesLoading ? 'Memuat...' : 'Pilih karyawan'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {employees.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="rounded-lg">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Karyawan Pengganti</Label>
                  <Select
                    value={createForm.replacementEmployeeId}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, replacementEmployeeId: v }))}
                    disabled={employeesLoading || !createForm.employeeId}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all">
                      <SelectValue placeholder={employeesLoading ? 'Memuat...' : 'Pilih karyawan pengganti'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {replacementOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="rounded-lg">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold ml-1">Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold ml-1">Lampiran</Label>
                <Input
                  type="file"
                  className={cn('h-12 pt-3 rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all')}
                  disabled={attachmentUploading}
                  onChange={(e) => onAttachmentChange(e.target.files?.[0] ?? null)}
                />
                {attachmentUploading ? (
                  <div className="text-xs text-muted-foreground">Mengunggah...</div>
                ) : attachmentError ? (
                  <div className="text-xs text-red-600">{attachmentError}</div>
                ) : attachmentPath ? (
                  <div className="text-xs text-emerald-700">Lampiran terunggah</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold ml-1">Alasan Cuti</Label>
                <Textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Tulis alasan cuti..."
                  className="min-h-[96px] rounded-xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="w-full rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-2.5 flex items-start gap-2 md:max-w-[calc(100%-180px)]">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">Pastikan semua informasi sudah benar sebelum menyimpan data pengeluaran.</span>
                </div>

                <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end mt-3 md:mt-0">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    disabled={creating || attachmentUploading}
                    className="w-full md:w-auto h-12 px-8 rounded-2xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 border-2 border-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className="w-full md:w-auto h-12 px-8 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50"
                  >
                    {creating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Simpan Cuti
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
