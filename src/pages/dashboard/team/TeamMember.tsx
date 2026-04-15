import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import avatarFallback from '@/assets/general/avatar.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';

export const TeamMember: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

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
    v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

  const toAvatarUrl = (raw: unknown): string => {
    if (!raw) return '';
    if (typeof raw === 'string') return raw.trim();
    if (typeof raw === 'number') return String(raw).trim();
    if (typeof raw === 'object') {
      const o = toRecord(raw);
      const url =
        toStringSafe(o.url ?? o.photo_url ?? o.photoUrl ?? o.path ?? o.file ?? o.image ?? o.avatar).trim();
      return url;
    }
    return '';
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
              (obj.role && typeof obj.role === 'object' ? toStringSafe(toRecord(obj.role).role_name ?? toRecord(obj.role).name) : obj.role)
          ).trim();
          const phone = toStringSafe(obj.phone ?? obj.phone_number ?? obj.phoneNumber ?? obj.telephone ?? obj.no_telephone).trim();

          const avatarRaw =
            obj.avatar ??
            obj.employee_photo ??
            obj.employeePhoto ??
            obj.photo ??
            obj.photo_url ??
            obj.photoUrl ??
            obj.image;
          const avatarMaybe = toAvatarUrl(avatarRaw);
          const avatar_url = avatarMaybe ? toFileUrl(avatarMaybe) : avatarFallback;
          return {
            uuid,
            employee_id,
            fullname: fullname || '-',
            division_name: division_name || '-',
            role_name: role_name || '-',
            phone: phone || '-',
            avatar_url,
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
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((member) => {
      const matchesSearch =
        !q ||
        member.fullname.toLowerCase().includes(q) ||
        member.employee_id.toLowerCase().includes(q) ||
        member.division_name.toLowerCase().includes(q) ||
        member.role_name.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q);
      const matchesDivision = divisionFilter === 'all' || member.division_name === divisionFilter;
      return matchesSearch && matchesDivision;
    });
  }, [employees, searchTerm, divisionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredMembers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Member</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola anggota tim perusahaan
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`${basePrefix}/organization/team-members/create`)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Team Member
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, employee id, divisi, role, telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                {divisionOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Team Member ({filteredMembers.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900">
                  <TableHead>Nama</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>No. telephone</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`s-${i}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                      Tidak ada data karyawan
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMembers.map((member) => (
                    <TableRow key={member.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <img
                            src={member.avatar_url || avatarFallback}
                            alt={member.fullname}
                            className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <span>{member.fullname}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{member.employee_id}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{member.division_name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{member.role_name}</TableCell>
                      <TableCell className="text-gray-900 dark:text-white">{member.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() =>
                              navigate(
                                `${basePrefix}/organization/team-members/detail/${encodeURIComponent(member.uuid || member.employee_id)}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" type="button">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && filteredMembers.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} dari {filteredMembers.length} karyawan
              </div>
              <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
};
