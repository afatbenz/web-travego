import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import avatarFallback from '@/assets/general/avatar.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/common/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Option = { id: string; label: string };

type TeamScheduleRow = {
  employeeId: string;
  name: string;
  divisionName: string;
  roleName: string;
  shiftDates: Record<string, { shiftId?: string; state: 'api' | 'submit' }>;
  avatarUrl: string;
  totalWorkday: number;
  totalOffday: number;
};

const ENDPOINTS = {
  schedule: '/services/employee/shift/schedule',
  setSchedule: '/services/employee/shift/set-schedule',
  divisions: '/services/team/divisions',
  roles: '/services/team/roles',
} as const;

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toNumberSafe = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toDateKey = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return toYmd(d);
  return '';
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const extractList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  const list = root.items ?? root.data ?? root.list ?? root.rows ?? root.result ?? root.schedules ?? root.employees;
  return Array.isArray(list) ? list : [];
};

const fetchOptions = async (url: string, token: string): Promise<Option[]> => {
  const res = await api.get<unknown>(url, token ? { Authorization: token } : undefined);
  if (res.status !== 'success') return [];
  return extractList(res.data).map((raw) => {
    const it = record(raw);
    const idRaw = it.id ?? it.division_id ?? it.role_id ?? it.value ?? it.code ?? it.key;
    const labelRaw = it.name ?? it.division_name ?? it.role_name ?? it.label ?? it.title ?? it.text;
    const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
    const label = typeof labelRaw === 'string' ? labelRaw : id;
    return { id, label };
  }).filter((o) => o.id && o.label);
};

const normalizeScheduleRows = (payload: unknown): TeamScheduleRow[] => {
  const items = extractList(payload);
  if (!items.length) return [];

  const byEmployee: Record<string, TeamScheduleRow> = {};

  const ensureRow = (employeeId: string, meta: Partial<Omit<TeamScheduleRow, 'employeeId' | 'shiftDates'>> = {}) => {
    if (!byEmployee[employeeId]) {
      byEmployee[employeeId] = {
        employeeId,
        name: '',
        divisionName: '',
        roleName: '',
        shiftDates: {},
        avatarUrl: '',
        totalWorkday: 0,
        totalOffday: 0,
      };
    }
    const row = byEmployee[employeeId];
    if (meta.name && !row.name) row.name = meta.name;
    if (meta.divisionName && !row.divisionName) row.divisionName = meta.divisionName;
    if (meta.roleName && !row.roleName) row.roleName = meta.roleName;
    if (meta.avatarUrl && !row.avatarUrl) row.avatarUrl = meta.avatarUrl;
    if (typeof meta.totalWorkday === 'number' && meta.totalWorkday && !row.totalWorkday) row.totalWorkday = meta.totalWorkday;
    if (typeof meta.totalOffday === 'number' && meta.totalOffday && !row.totalOffday) row.totalOffday = meta.totalOffday;
    return row;
  };

  items.forEach((raw) => {
    const item = record(raw);

    const employeeNode = item.employee && typeof item.employee === 'object' ? record(item.employee) : null;
    const userNode = item.user && typeof item.user === 'object' ? record(item.user) : null;

    const employeeIdRaw =
      item.uuid ??
      item.employee_uuid ??
      item.employeeUuid ??
      item.user_uuid ??
      item.userUuid ??
      item.employee_id ??
      item.employeeId ??
      item.user_id ??
      item.userId ??
      item.id ??
      employeeNode?.uuid ??
      employeeNode?.employee_uuid ??
      employeeNode?.employeeUuid ??
      employeeNode?.employee_id ??
      employeeNode?.id ??
      userNode?.uuid ??
      userNode?.user_uuid ??
      userNode?.userUuid ??
      userNode?.user_id ??
      userNode?.id;
    const employeeId = typeof employeeIdRaw === 'string' || typeof employeeIdRaw === 'number' ? String(employeeIdRaw) : '';
    if (!employeeId) return;

    const nameRaw =
      item.employee_name ??
      item.fullname ??
      item.full_name ??
      item.name ??
      item.user_name ??
      employeeNode?.employee_name ??
      employeeNode?.fullname ??
      employeeNode?.name ??
      userNode?.fullname ??
      userNode?.name ??
      userNode?.username;
    const name = typeof nameRaw === 'string' ? nameRaw : '';

    const divisionRaw =
      item.division_name ??
      item.divisionName ??
      (item.division && typeof item.division === 'object' ? record(item.division).name : undefined) ??
      employeeNode?.division_name ??
      employeeNode?.divisionName;
    const divisionName = typeof divisionRaw === 'string' ? divisionRaw : '';

    const roleRaw =
      item.role_name ??
      item.roleName ??
      (item.role && typeof item.role === 'object' ? record(item.role).name : undefined) ??
      employeeNode?.role_name ??
      employeeNode?.roleName;
    const roleName = typeof roleRaw === 'string' ? roleRaw : '';

    const shiftDateRaw = item.shift_date ?? item.shiftDate ?? item.date;
    const shiftDate = typeof shiftDateRaw === 'string' ? shiftDateRaw.trim() : '';

    const avatarRaw =
      item.avatar_url ??
      item.avatarUrl ??
      employeeNode?.avatar_url ??
      employeeNode?.avatarUrl ??
      userNode?.avatar_url ??
      userNode?.avatarUrl ??
      userNode?.avatar;
    const avatarUrl = typeof avatarRaw === 'string' ? avatarRaw : '';

    const totalWorkday = toNumberSafe(item.total_workday ?? item.totalWorkday ?? employeeNode?.total_workday ?? employeeNode?.totalWorkday);
    const totalOffday = toNumberSafe(item.total_offday ?? item.totalOffday ?? employeeNode?.total_offday ?? employeeNode?.totalOffday);

    const row = ensureRow(employeeId, { name, divisionName, roleName, avatarUrl, totalWorkday, totalOffday });

    const shiftsNode = item.shifts ?? item.schedule ?? item.schedules ?? item.shift_schedule ?? item.shiftSchedules;
    if (Array.isArray(shiftsNode)) {
      shiftsNode.forEach((s) => {
        const shift = record(s);
        const dRaw = shift.shift_date ?? shift.shiftDate ?? shift.date;
        const d = typeof dRaw === 'string' ? toDateKey(dRaw) : '';
        const shiftIdRaw = shift.shift_id ?? shift.shiftId ?? shift.id ?? shift.uuid;
        const shiftId = typeof shiftIdRaw === 'string' || typeof shiftIdRaw === 'number' ? String(shiftIdRaw) : '';
        if (d) row.shiftDates[d] = { shiftId: shiftId || undefined, state: 'api' };
      });
      return;
    }

    const singleKey = shiftDate ? toDateKey(shiftDate) : '';
    const singleShiftIdRaw = item.shift_id ?? item.shiftId ?? item.id ?? item.uuid;
    const singleShiftId =
      typeof singleShiftIdRaw === 'string' || typeof singleShiftIdRaw === 'number' ? String(singleShiftIdRaw) : '';
    if (singleKey) row.shiftDates[singleKey] = { shiftId: singleShiftId || undefined, state: 'api' };
  });

  return Object.values(byEmployee).sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
};

export const TeamSchedules: React.FC = () => {
  const token = localStorage.getItem('token') ?? '';
  const windowDays = 9;

  const [divisionOptions, setDivisionOptions] = useState<Option[]>([]);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);
  const [divisionId, setDivisionId] = useState('all');
  const [roleId, setRoleId] = useState('all');

  const [periodStart, setPeriodStart] = useState(() => startOfDay(new Date()));
  const periodEnd = useMemo(() => addDays(periodStart, windowDays - 1), [periodStart]);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TeamScheduleRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sort, setSort] = useState<{ key: 'name' | 'roleName' | 'totalWorkday' | 'totalOffday'; direction: 'asc' | 'desc' } | null>({
    key: 'name',
    direction: 'asc',
  });

  const dates = useMemo(() => {
    return Array.from({ length: windowDays }).map((_, i) => addDays(periodStart, i));
  }, [periodStart]);

  const majorityMonthLabel = useMemo(() => {
    if (!dates.length) return '';
    const counts: Record<string, number> = {};
    dates.forEach((d) => {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[k] = (counts[k] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].localeCompare(a[0], 'en');
    });
    const monthKey = sorted[0]?.[0] ?? `${dates[dates.length - 1].getFullYear()}-${String(dates[dates.length - 1].getMonth() + 1).padStart(2, '0')}`;
    return new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short' });
  }, [dates]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const [divs, roles] = await Promise.all([
        fetchOptions(ENDPOINTS.divisions, token),
        fetchOptions(ENDPOINTS.roles, token),
      ]);
      setDivisionOptions(divs);
      setRoleOptions(roles);
    };
    load();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          start_date: toYmd(periodStart),
          end_date: toYmd(periodEnd),
        };
        if (divisionId !== 'all') body.division_id = divisionId;
        if (roleId !== 'all') body.role_id = roleId;

        const res = await api.post<unknown>(ENDPOINTS.schedule, body, token ? { Authorization: token } : undefined);
        if (res.status !== 'success') {
          setRows([]);
          setCurrentPage(1);
          return;
        }
        setRows(normalizeScheduleRows(res.data));
        setCurrentPage(1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, periodStart, periodEnd, divisionId, roleId]);

  const headerRangeLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(periodStart)} - ${fmt(periodEnd)}`;
  }, [periodStart, periodEnd]);

  const shiftPeriod = (dir: -1 | 1) => {
    setPeriodStart((prev) => addDays(prev, dir * windowDays));
  };

  const totalColumns = 3 + dates.length + 2;

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const next = [...rows];
    const dirMul = sort.direction === 'asc' ? 1 : -1;
    next.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dirMul;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'id-ID') * dirMul;
    });
    return next;
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIndex = (pageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = useMemo(() => sortedRows.slice(startIndex, endIndex), [sortedRows, startIndex, endIndex]);

  const onSortClick = (key: 'name' | 'roleName' | 'totalWorkday' | 'totalOffday') => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const renderSortIcon = (key: 'name' | 'roleName' | 'totalWorkday' | 'totalOffday') => {
    if (!sort || sort.key !== key) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const onClickCell = async (row: TeamScheduleRow, dateKey: string) => {
    if (!token || loading) return;

    const entry = row.shiftDates[dateKey];
    if (entry) {
      if (!entry.shiftId) {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Shift ID tidak ditemukan. Silakan refresh.' });
        return;
      }
      const dateLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Konfirmasi',
        text: `Apakah akan membatalkan shift off di hari ${dateLabel}?`,
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626',
      });
      if (!confirm.isConfirmed) return;

      const res = await api.post<unknown>(
        ENDPOINTS.setSchedule,
        { shift_id: entry.shiftId, employee_id: row.employeeId, type: 'delete' },
        token ? { Authorization: token } : undefined
      );
      if (res.status !== 'success') {
        await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan shift off.' });
        return;
      }
      setRows((prev) =>
        prev.map((x) => {
          if (x.employeeId !== row.employeeId) return x;
          const nextShiftDates = { ...x.shiftDates };
          delete nextShiftDates[dateKey];
          return {
            ...x,
            shiftDates: nextShiftDates,
            totalWorkday: Math.max(0, x.totalWorkday + 1),
            totalOffday: Math.max(0, x.totalOffday - 1),
          };
        })
      );
      return;
    }

    const dateLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Konfirmasi',
      text: `Tambahkan sebagai shift off di tanggal ${dateLabel}?`,
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    const res = await api.post<unknown>(
      ENDPOINTS.setSchedule,
      { employee_id: row.employeeId, shift_date: dateKey, type: 'submit' },
      token ? { Authorization: token } : undefined
    );
    if (res.status !== 'success') {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menambahkan shift off.' });
      return;
    }
    const resRoot = record(res.data);
    const newShiftIdRaw = resRoot.shift_id ?? resRoot.shiftId ?? resRoot.id ?? resRoot.uuid;
    const newShiftId =
      typeof newShiftIdRaw === 'string' || typeof newShiftIdRaw === 'number' ? String(newShiftIdRaw) : undefined;

    setRows((prev) =>
      prev.map((x) => {
        if (x.employeeId !== row.employeeId) return x;
        return {
          ...x,
          shiftDates: {
            ...x.shiftDates,
            [dateKey]: { shiftId: newShiftId, state: 'submit' },
          },
          totalWorkday: Math.max(0, x.totalWorkday - 1),
          totalOffday: Math.max(0, x.totalOffday + 1),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Schedules</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Shift schedule tim</p>
      </div>

      {!token ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-300">Silakan login untuk melihat jadwal.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-transparent p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center">
                <Select value={divisionId} onValueChange={setDivisionId}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Semua Divisi</SelectItem>
                    {divisionOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">Semua Role</SelectItem>
                    {roleOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-2xl sm:px-3" onClick={() => shiftPeriod(-1)} disabled={loading}>
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="min-w-[170px] rounded-2xl border border-border/60 px-4 py-2 text-center text-sm font-medium text-muted-foreground">
                  {headerRangeLabel}
                </div>
                <Button variant="outline" size="sm" className="rounded-2xl sm:px-3" onClick={() => shiftPeriod(1)} disabled={loading}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="w-full overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[72px] px-3 text-center text-xs font-semibold tracking-wide uppercase">No.</TableHead>
                      <TableHead
                        className="min-w-[240px] px-3 text-xs font-semibold tracking-wide uppercase cursor-pointer select-none hover:text-foreground"
                        onClick={() => onSortClick('name')}
                        role="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">Nama</span>
                          <span className="shrink-0">{renderSortIcon('name')}</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="min-w-[200px] px-3 text-xs font-semibold tracking-wide uppercase cursor-pointer select-none hover:text-foreground"
                        onClick={() => onSortClick('roleName')}
                        role="button"
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">Posisi</span>
                          <span className="shrink-0">{renderSortIcon('roleName')}</span>
                        </div>
                      </TableHead>
                      {dates.map((d) => {
                        const dateKey = toYmd(d);
                        const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                        const dow = d.toLocaleDateString('id-ID', { weekday: 'short' });
                        return (
                          <TableHead key={dateKey} className="w-[64px] px-2 text-center text-xs font-semibold tracking-wide uppercase">
                            <div className="leading-tight">
                              <div className="text-sm">{label}</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{dow}</div>
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead
                        className="w-[80px] px-2 text-center bg-gray-50 dark:bg-gray-900/40 border-l border-gray-200 dark:border-gray-800 text-xs font-semibold tracking-wide uppercase cursor-pointer select-none hover:text-foreground"
                        onClick={() => onSortClick('totalWorkday')}
                        role="button"
                      >
                        <div className="leading-tight">
                          <div className="flex items-center justify-center gap-2">
                            <span className="truncate">On Duty</span>
                            <span className="shrink-0">{renderSortIcon('totalWorkday')}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{majorityMonthLabel}</div>
                        </div>
                      </TableHead>
                      <TableHead
                        className="w-[80px] px-2 text-center bg-gray-50 dark:bg-gray-900/40 border-l border-gray-200 dark:border-gray-800 text-xs font-semibold tracking-wide uppercase cursor-pointer select-none hover:text-foreground"
                        onClick={() => onSortClick('totalOffday')}
                        role="button"
                      >
                        <div className="leading-tight">
                          <div className="flex items-center justify-center gap-2">
                            <span className="truncate">Off Duty</span>
                            <span className="shrink-0">{renderSortIcon('totalOffday')}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{majorityMonthLabel}</div>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={totalColumns} className="py-10 text-center text-gray-600 dark:text-gray-300">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : pageRows.length ? (
                      pageRows.map((r, idx) => (
                        <TableRow key={r.employeeId} className="odd:bg-muted/20">
                          <TableCell className="px-3 text-center text-sm text-muted-foreground tabular-nums">
                            {startIndex + idx + 1}
                          </TableCell>
                          <TableCell className="font-medium border-l border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={r.avatarUrl || avatarFallback} />
                                <AvatarFallback>{(r.name || r.employeeId || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 truncate">{r.name || r.employeeId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="border-l border-gray-200 dark:border-gray-800">{r.roleName || '-'}</TableCell>
                          {dates.map((d) => {
                            const key = toYmd(d);
                            const entry = r.shiftDates[key];
                            const isOff = Boolean(entry);
                            const baseState = isOff ? 'bg-red-600 text-white' : '';
                            return (
                              <TableCell
                                key={`${r.employeeId}-${key}`}
                                className="px-0 py-0 border-l border-gray-200 dark:border-gray-800"
                              >
                                <button
                                  type="button"
                                  className={[
                                    'w-full h-full py-3 px-2 text-center cursor-pointer select-none',
                                    isOff
                                      ? `${baseState} hover:bg-green-500/40`
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-green-700 dark:text-green-400',
                                  ].join(' ')}
                                  onClick={() => onClickCell(r, key)}
                                  disabled={loading}
                                >
                                  {isOff ? 'X' : '✓'}
                                </button>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center px-2 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 font-medium tabular-nums">
                            {r.totalWorkday}
                          </TableCell>
                          <TableCell className="text-center px-2 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 font-medium tabular-nums">
                            {r.totalOffday}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={totalColumns} className="py-10 text-center text-gray-600 dark:text-gray-300">
                          Tidak ada data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t px-4 py-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Menampilkan {sortedRows.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sortedRows.length)} dari {sortedRows.length}
                </div>
                <div className="flex items-center justify-end">
                  <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
