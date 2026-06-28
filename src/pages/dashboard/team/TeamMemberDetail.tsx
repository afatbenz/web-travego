import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, IdCard, Pencil, Trash2, MapPin, MoreVertical, Download, FileSpreadsheet, Map, Phone, Mail, CalendarDays } from 'lucide-react';
import Swal from 'sweetalert2';
import moment from 'moment';
import { api, toFileUrl } from '@/lib/api';
import avatarFallback from '@/assets/general/avatar.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EmployeeDetailData = {
  uuid: string;
  employee_id: string;
  fullname: string;
  division_name: string;
  role_name: string;
  nik: string;
  date_of_birth: string;
  phone: string;
  email: string;
  address: string;
  address_city_name: string;
  join_date: string;
  contract_type: string;
  contract_status_label: string;
  avatar_url: string;
  operational_role?: string;
  sim_type?: string;
  sim_expiry?: string;
  availability_status?: string;
  preferred_fleet?: string;
};

type HistoryItem = {
  order_id: string;
  start_date: string;
  end_date: string;
  destinations: string;
  rent_type_label: string;
  fleet_name: string;
  vehicle_id: string,
  plate_number: string,
  status?: string;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

const formatDateOnly = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

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

export const TeamMemberDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EmployeeDetailData | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleDelete = async () => {
    if (!detail) return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus karyawan?',
      text: detail.fullname && detail.fullname !== '-' ? `Karyawan "${detail.fullname}" akan dihapus.` : 'Data yang dihapus tidak dapat dikembalikan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    const employeeId = String(detail.employee_id ?? '').trim();
    const targetId = employeeId && employeeId !== '-' ? employeeId : String(uuid ?? '').trim();
    const res = await api.delete<unknown>(
      `/services/employee/delete/${encodeURIComponent(targetId)}`,
      token ? { Authorization: token } : undefined
    );
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Karyawan berhasil dihapus.' });
      navigate(`${basePrefix}/organization/team-members`);
    } else {
      await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus karyawan. Silakan coba lagi.' });
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await api.post<unknown>(
          '/services/employee/operations/history',
          { period, employee_id: uuid },
          token ? { Authorization: token } : undefined
        );
        if (res.status === 'success') {
          const payload = res.data as { order_history?: HistoryItem[] };
          const list = Array.isArray(payload?.order_history) ? payload.order_history : [];
          setHistories(list);
        } else {
          setHistories([]);
        }
      } catch (err) {
        console.log(err)
        setHistories([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [period, token]);

  useEffect(() => {
    if (!uuid) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<unknown>(
          `/services/employee/detail/${encodeURIComponent(uuid)}`,
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setDetail(null);
          return;
        }

        const payload = res.data as unknown;
        const root = toRecord(payload);
        const dataRaw = root.data && typeof root.data === 'object' ? root.data : payload;
        const data = toRecord(dataRaw);

        const employee_id = toStringSafe(data.employee_id ?? data.employeeId ?? data.emp_id ?? data.nip ?? data.id).trim();
        const fullname = toStringSafe(data.fullname ?? data.full_name ?? data.fullName ?? data.name).trim();

        const division_name = toStringSafe(
          data.division_name ??
          data.divisionName ??
          (data.division && typeof data.division === 'object' ? toStringSafe(toRecord(data.division).division_name ?? toRecord(data.division).name) : data.division)
        ).trim();

        const role_name = toStringSafe(
          data.role_name ??
          data.roleName ??
          (data.role && typeof data.role === 'object' ? toStringSafe(toRecord(data.role).role_name ?? toRecord(data.role).name) : data.role)
        ).trim();

        const nik = toStringSafe(data.nik ?? data.national_id).trim();
        const date_of_birth = toStringSafe(data.date_of_birth ?? data.dob ?? data.birth_date ?? data.birthDate).trim();
        const phone = toStringSafe(data.phone ?? data.phone_number ?? data.telephone ?? data.no_telephone).trim();
        const email = toStringSafe(data.email ?? data.employee_email).trim();
        const address = toStringSafe(data.address ?? data.employee_address).trim();
        const address_city_name = toStringSafe(data.address_city_name ?? data.city ?? data.city_label ?? data.cityName).trim();
        const join_date = toStringSafe(data.join_date ?? data.joinDate ?? data.date_join ?? data.joined_at).trim();
        const contract_type = toStringSafe(
          data.contract_type ??
          data.contractType ??
          data.contract_type_name ??
          data.contractTypeName ??
          (data.contract && typeof data.contract === 'object'
            ? toStringSafe(toRecord(data.contract).name ?? toRecord(data.contract).contract_type_name)
            : data.contract)
        ).trim();
        const contract_status_label = toStringSafe(data.contract_status_label ?? data.contractStatusName).trim();

        const avatarRaw =
          data.avatar ??
          data.employee_photo ??
          data.employeePhoto ??
          data.photo ??
          data.photo_url ??
          data.photoUrl ??
          data.image;
        const avatarMaybe = toAvatarUrl(avatarRaw);
        const avatar_url = avatarMaybe ? toFileUrl(avatarMaybe) : avatarFallback;

        setDetail({
          uuid,
          employee_id: employee_id || '-',
          fullname: fullname || '-',
          division_name: division_name || '-',
          role_name: role_name || '-',
          nik: nik || '-',
          date_of_birth,
          phone: phone || '-',
          email: email || '-',
          address: address || '-',
          address_city_name: address_city_name || '-',
          join_date,
          contract_type: contract_type || '-',
          contract_status_label: contract_status_label || '-',
          avatar_url,
          operational_role: toStringSafe(data.operational_role) || 'Driver Utama',
          sim_type: toStringSafe(data.sim_type) || 'SIM B1 Umum',
          sim_expiry: toStringSafe(data.sim_expiry) || '2028-08-12',
          availability_status: toStringSafe(data.availability_status) || 'Tersedia',
          preferred_fleet: toStringSafe(data.preferred_fleet) || 'Hiace Commuter, Elf Long',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uuid, token]);

  const addressText = useMemo(() => {
    if (!detail) return '-';
    const a = detail.address || '-';
    const c = detail.address_city_name || '-';
    if (a !== '-' && c !== '-') return `${a}, ${c}`;
    return a !== '-' ? a : c;
  }, [detail]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b sm:border-0 border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => navigate(`${basePrefix}/organization/team-members`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Detail Employee</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Informasi detail karyawan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loading || !detail}
            onClick={() => navigate(`${basePrefix}/organization/team-members/edit/${encodeURIComponent(String(uuid ?? ''))}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Ubah Data
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors dark:border-red-900/50 dark:text-red-500 dark:hover:bg-red-900/20"
            disabled={loading || !detail}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <Card className="rounded-[24px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <CardContent className="p-6 md:p-8">
          {loading ? (
            <div className="animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            </div>
          ) : !detail ? (
            <div className="py-8 text-center text-gray-500">Data employee tidak ditemukan</div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  className="relative h-20 w-20 md:h-24 md:w-24 p-0 rounded-full overflow-hidden border-4 border-white shadow-md dark:border-gray-800 cursor-pointer bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  onClick={() => setPhotoOpen(true)}
                >
                  <img
                    src={detail.avatar_url || avatarFallback}
                    alt={detail.fullname}
                    className="block h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>
                <div className="min-w-0 flex flex-col items-start">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate max-w-full">{detail.fullname}</div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1 mb-3">
                    ID: {detail.employee_id}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-lg px-3 py-1 font-medium">
                      {detail.role_name}
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0 rounded-lg px-3 py-1 font-medium">
                      {detail.division_name}
                    </Badge>
                    {detail.contract_status_label && (
                      <Badge className={`border-0 rounded-lg px-3 py-1 font-medium ${detail.contract_status_label.toLowerCase().includes('aktif') && !detail.contract_status_label.toLowerCase().includes('non')
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : detail.contract_status_label.toLowerCase().includes('kontrak')
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {detail.contract_status_label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="text-center px-2 sm:px-4 flex-1 sm:flex-none">
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{histories.length}</div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Jadwal Bulan Ini</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200 dark:bg-gray-700" />
                <div className="text-center px-2 sm:px-4 flex-1 sm:flex-none w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-0 border-gray-200 dark:border-gray-800 pt-4 sm:pt-0">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1.5">{moment(detail.join_date).format('MMMM YYYY')}</div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Bergabung</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-75">
        <div className="border-b border-gray-100 dark:border-gray-800 p-6 flex items-center gap-3 bg-white/50 dark:bg-gray-950/50">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <IdCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informasi Karyawan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Detail identitas dan kontak karyawan</p>
          </div>
        </div>
        <CardContent className="p-6">
          {loading ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`s-${i}`} className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          ) : !detail ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Data employee tidak tersedia.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <IdCard className="h-3.5 w-3.5" /> NIK
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{detail.nik || '-'}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" /> Tanggal Lahir
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDateOnly(detail.date_of_birth)}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> Nomor Telepon
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{detail.phone || '-'}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Email
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">{detail.email || '-'}</div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Alamat Lengkap
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">{addressText}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Perjalanan</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Daftar perjalanan yang pernah dijalankan driver</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus-visible:ring-blue-400"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl animate-in zoom-in-95 duration-200">
                <DropdownMenuItem className="cursor-pointer gap-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span>Export Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Export Google Sheet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">Tanggal</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">Order ID</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">Jenis Layanan</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">Tujuan</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">Jenis Armada</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12">ID Armada</TableHead>
                  <TableHead className="font-semibold text-gray-600 dark:text-gray-300 h-12 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin mb-3"></div>
                        <span>Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : histories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                          <MapPin className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">Belum ada data perjalanan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  histories.map((row, i) => (
                    <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDateOnly(row.start_date)}
                        {row.end_date && row.end_date !== row.start_date ? ` - ${formatDateOnly(row.end_date)}` : ''}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{row.order_id || '-'}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{row.rent_type_label || '-'}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{row.destinations || '-'}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{row.fleet_name || '-'}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{row.plate_number || '-'} - {row.vehicle_id || '-'}</TableCell>
                      <TableCell className="text-right">
                        {new Date(row.end_date) < new Date() ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-0 rounded-md px-2.5 py-0.5 whitespace-nowrap">
                            Selesai
                          </Badge>
                        ) : new Date(row.end_date) > new Date() ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-md px-2.5 py-0.5 whitespace-nowrap">
                            Terjadwal
                          </Badge>
                        ) : new Date(row.end_date) < new Date() && new Date(row.start_date) > new Date() ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-0 rounded-md px-2.5 py-0.5 whitespace-nowrap">
                            Sedang Berjalan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-md px-2.5 py-0.5 whitespace-nowrap">{row.status || '-'}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-center">
            <img
              src={detail?.avatar_url || avatarFallback}
              alt={detail?.fullname || 'Foto karyawan'}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
