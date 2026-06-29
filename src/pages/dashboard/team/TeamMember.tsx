import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Eye, FileSpreadsheet, Plus, RotateCcw, Search, Sheet, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api, toFileUrl } from '@/lib/api';
import avatarFallback from '@/assets/general/avatar.svg';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { formatPhoneNumberId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EmployeeRow = {
  uuid: string;
  employee_id: string;
  fullname: string;
  division_name: string;
  role_name: string;
  phone: string;
  avatar_url?: string;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

const toAvatarUrl = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number') return String(raw).trim();
  if (typeof raw === 'object') {
    const o = toRecord(raw);
    return toStringSafe(o.url ?? o.photo_url ?? o.photoUrl ?? o.path ?? o.file ?? o.image ?? o.avatar).trim();
  }
  return '';
};

export const TeamMember: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const addButtonClass =
    "hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-blue-300 border-2 hover:text-black transition-all duration-300 hover:-translate-y-0.2 hover:from-blue-700 hover:to-blue-600";

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  const handleDelete = async (member: EmployeeRow) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus karyawan?',
      text: member.fullname && member.fullname !== '-' ? `Karyawan "${member.fullname}" akan dihapus.` : 'Data yang dihapus tidak dapat dikembalikan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.delete<unknown>(`/services/employee/delete/${encodeURIComponent(String(member.uuid))}`, headers);
    if (res.status === 'success') {
      setEmployees((prev) => prev.filter((x) => x.uuid !== member.uuid));
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Karyawan berhasil dihapus.' });
    } else {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus karyawan. Silakan coba lagi.' });
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
        const items =
          (Array.isArray(payload) ? payload : undefined) ??
          (Array.isArray(rootData) ? rootData : undefined) ??
          (Array.isArray(dataObj.items) ? dataObj.items : undefined) ??
          (Array.isArray(dataObj.employees) ? dataObj.employees : undefined) ??
          (Array.isArray(root.employees) ? root.employees : undefined) ??
          [];

        const mapped = (items as unknown[]).map((raw, idx) => {
          const obj = toRecord(raw);
          const uuid = toStringSafe(obj.uuid ?? obj.employee_uuid ?? obj.employeeUuid).trim();
          const employee_id = toStringSafe(obj.employee_id ?? obj.employeeId ?? obj.id).trim() || `temp-${idx}`;
          const fullname = toStringSafe(obj.fullname ?? obj.employee_name ?? obj.full_name ?? obj.fullName).trim();
          const division_name = toStringSafe(
            obj.division_name ??
              obj.divisionName ??
              (obj.division && typeof obj.division === 'object'
                ? toStringSafe(toRecord(obj.division).division_name ?? toRecord(obj.division).name)
                : obj.division)
          ).trim();
          const role_name = toStringSafe(
            obj.role_name ??
              obj.roleName ??
              (obj.role && typeof obj.role === 'object'
                ? toStringSafe(toRecord(obj.role).role_name ?? toRecord(obj.role).name)
                : obj.role)
          ).trim();
          const phone = toStringSafe(obj.phone ?? obj.phone_number ?? obj.phoneNumber ?? obj.telephone ?? obj.no_telephone).trim();
          const avatarRaw = obj.avatar ?? obj.employee_photo ?? obj.employeePhoto ?? obj.photo ?? obj.photo_url ?? obj.photoUrl ?? obj.image;
          const avatarMaybe = toAvatarUrl(avatarRaw);

          return {
            uuid,
            employee_id,
            fullname: fullname || '-',
            division_name: division_name || '-',
            role_name: role_name || '-',
            phone: phone || '-',
            avatar_url: avatarMaybe ? toFileUrl(avatarMaybe) : avatarFallback,
          };
        });

        setEmployees(mapped);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const divisionOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.division_name && e.division_name !== '-') set.add(e.division_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [employees]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.role_name && e.role_name !== '-') set.add(e.role_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [employees]);

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((member) => {
      const matchesSearch =
        !q ||
        member.fullname.toLowerCase().includes(q) ||
        member.employee_id.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q);
      const matchesDivision = divisionFilter === 'all' || member.division_name === divisionFilter;
      const matchesRole = roleFilter === 'all' || member.role_name === roleFilter;
      return matchesSearch && matchesDivision && matchesRole;
    });
  }, [divisionFilter, employees, roleFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, divisionFilter, roleFilter, filteredMembers.length]);

  const handleReset = () => {
    setSearchTerm('');
    setDivisionFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  const buildExportRows = () => {
    const headers = ['No.', 'Nama Team Member', 'Employee ID', 'Divisi', 'Role', 'No. Telepon'];
    const rows = filteredMembers.map((member, index) => [
      index + 1,
      member.fullname ?? '',
      member.employee_id ?? '',
      member.division_name ?? '',
      member.role_name ?? '',
      formatPhoneNumberId(member.phone),
    ]);
    return { headers, rows };
  };

  const handleDownloadExcel = () => {
    if (!filteredMembers.length) {
      void Swal.fire('Info', 'Tidak ada data team member untuk diunduh.', 'info');
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
    link.download = `team-members-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleCopyToGoogleSheet = async () => {
    if (!filteredMembers.length) {
      await Swal.fire('Info', 'Tidak ada data team member untuk disalin.', 'info');
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

  const startIndex = (currentPage - 1) * itemsPerPage;

  const columns = useMemo<Array<DataTableColumn<EmployeeRow>>>(() => {
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
        label: 'Nama',
        key: 'fullname',
        sortable: true,
        width: 280,
        render: (member) => (
          <div className="flex items-center gap-3">
            <img
              src={member.avatar_url || avatarFallback}
              alt={member.fullname}
              className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-700"
            />
            <span className="font-medium text-foreground">{member.fullname}</span>
          </div>
        ),
      },
      {
        label: 'Employee ID',
        key: 'employee_id',
        sortable: true,
        width: 160,
        render: (member) => <span className="text-sm text-foreground">{member.employee_id || '-'}</span>,
      },
      {
        label: 'Divisi',
        key: 'division_name',
        sortable: true,
        width: 180,
        render: (member) => <span className="text-sm text-foreground">{member.division_name || '-'}</span>,
      },
      {
        label: 'Role',
        key: 'role_name',
        sortable: true,
        width: 180,
        render: (member) => <span className="text-sm text-foreground">{member.role_name || '-'}</span>,
      },
      {
        label: 'No. Telepon',
        key: 'phone',
        sortable: true,
        width: 180,
        render: (member) => <span className="text-sm text-foreground">{formatPhoneNumberId(member.phone)}</span>,
      },
    ];
  }, [startIndex]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Member</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Kelola anggota tim perusahaan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className={addButtonClass} onClick={() => navigate(`${basePrefix}/organization/team-members/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Team Member
          </Button>
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
                <span>Download ke excel (.xlsx)</span>
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari nama, employee id, no. telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Divisi" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Semua Divisi</SelectItem>
              {divisionOptions.map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Semua Role</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="h-11 rounded-2xl px-4" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredMembers}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[980px]"
        emptyTitle="Tidak ada data karyawan"
        emptyDescription="Coba ubah pencarian atau filter."
        actions={{
          actions: [
            {
              key: 'detail',
              label: 'Detail',
              icon: Eye,
              onSelect: (member) =>
                navigate(`${basePrefix}/organization/team-members/detail/${encodeURIComponent(member.uuid || member.employee_id)}`),
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: Trash2,
              variant: 'destructive',
              onSelect: (member) => void handleDelete(member),
            },
          ],
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          totalItems: filteredMembers.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: (n) => {
            setItemsPerPage(n);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'fullname', direction: 'asc' } }}
        rowKey={(member, index) => member.uuid || `${member.employee_id}-${index}`}
      />

      <Button
        onClick={() => navigate(`${basePrefix}/organization/team-members/create`)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)] hover:bg-blue-700 md:hidden"
        size="icon"
        title="Tambah Team Member"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
