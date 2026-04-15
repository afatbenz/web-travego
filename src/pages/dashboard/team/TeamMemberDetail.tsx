import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import avatarFallback from '@/assets/general/avatar.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  avatar_url: string;
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
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EmployeeDetailData | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);

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
          avatar_url,
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/organization/team-members`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Employee</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi detail karyawan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>
            </div>
          ) : !detail ? (
            <div className="py-8 text-center text-gray-500">Data employee tidak ditemukan</div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative h-16 w-16 p-0 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer bg-gray-100 dark:bg-gray-800"
                onClick={() => setPhotoOpen(true)}
              >
                <img
                  src={detail.avatar_url || avatarFallback}
                  alt={detail.fullname}
                  className="block h-full w-full object-cover"
                />
              </button>
              <div className="min-w-0">
                <div className="text-xl font-semibold text-gray-900 dark:text-white truncate">{detail.fullname}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {detail.employee_id} • {detail.division_name} • {detail.role_name}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`s-${i}`} className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          ) : !detail ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Data employee tidak tersedia.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Employee ID</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.employee_id || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">NIK</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.nik || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tanggal Lahir</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{formatDateOnly(detail.date_of_birth)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Nomor Telepon</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.phone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{detail.email || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tanggal Bergabung</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{formatDateOnly(detail.join_date)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Divisi</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.division_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Role</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.role_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Status Kontrak</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{detail.contract_type || '-'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Alamat</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{addressText}</div>
              </div>
            </div>
          )}
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
