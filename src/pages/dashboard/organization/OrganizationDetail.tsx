import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, toFileUrl } from '@/lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Landmark, MapPin, Phone, Mail, IdCard, Pencil, Lock, Trash2, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

type OrgDetail = {
  organization_name: string;
  company_name: string;
  address: string;
  province: string;
  city: string;
  phone: string;
  email: string;
  organization_code: string;
  npwp_number: string;
  postal_code: string;
  organization_type: string;
  logo: string;
};

const emptyDetail: OrgDetail = {
  organization_name: '',
  company_name: '',
  address: '',
  province: '',
  city: '',
  phone: '',
  email: '',
  organization_code: '',
  npwp_number: '',
  postal_code: '',
  organization_type: '',
  logo: '',
};

export const OrganizationDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [data, setData] = useState<OrgDetail>(emptyDetail);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let orgName = '';
    try {
      const payloadStr = token.split('.')[1];
      if (payloadStr) {
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        orgName = String(json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? '');
      }
    } catch {}

    const orgCode = localStorage.getItem('organization_code') ?? '';
    setLoading(true);
    (async () => {
      const res = await api.get<Record<string, unknown>>('/organization/detail', token ? { Authorization: token } : undefined);
      setLoading(false);
      if (res.status === 'success' && res.data && typeof res.data === 'object') {
        const d = res.data as Record<string, unknown>;
        setData({
          organization_name: String(d['organization_name'] ?? orgName ?? ''),
          organization_code: String(d['organization_code'] ?? orgCode ?? ''),
          company_name: String(d['company_name'] ?? ''),
          address: String(d['address'] ?? ''),
          province: String(d['province_name'] ?? ''),
          city: String(d['city_name'] ?? ''),
          phone: String(d['phone'] ?? ''),
          email: String(d['email'] ?? ''),
          npwp_number: String(d['npwp_number'] ?? ''),
          postal_code: String(d['postal_code'] ?? ''),
          organization_type: String(d['organization_type'] ?? ''),
          logo: String(d['logo'] ?? ''),
        });
      } else {
        setData((p) => ({
          ...p,
          organization_name: orgName || localStorage.getItem('organization_name') || '',
          organization_code: orgCode,
        }));
      }
    })();
  }, []);

  const Item: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/50 dark:bg-gray-900/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-gray-400">{icon}</span>
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className="mt-1 font-medium text-gray-900 dark:text-gray-100 break-words">{value || '-'}</div>
    </div>
  );

  const ActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tone?: 'primary' | 'danger';
    onClick: () => void;
  }> = ({ icon, title, subtitle, tone = 'primary', onClick }) => {
    const isDanger = tone === 'danger';
    return (
      <button
        type="button"
        onClick={onClick}
        className="group w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-[28px]"
      >
        <Card
          className={[
            'pb-0 transition-colors',
            isDanger
              ? 'border-red-200/70 hover:bg-red-50/40 dark:border-red-900/40 dark:hover:bg-red-950/30'
              : 'border-blue-200/70 hover:bg-blue-50/40 dark:border-blue-900/40 dark:hover:bg-blue-950/30',
            'dark:bg-gray-900',
          ].join(' ')}
        >
          <div className="flex items-center gap-4 p-5">
            <div
              className={[
                'flex h-11 w-11 items-center justify-center rounded-2xl ring-1',
                isDanger
                  ? 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40'
                  : 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40',
              ].join(' ')}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className={['font-semibold', isDanger ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'].join(' ')}>
                {title}
              </div>
              <div className={['mt-1 text-sm', isDanger ? 'text-red-700/80 dark:text-red-200/80' : 'text-gray-600 dark:text-gray-300'].join(' ')}>
                {subtitle}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-200" />
          </div>
        </Card>
      </button>
    );
  };

  async function clearAuthAndCache(): Promise<void> {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch {}
  }

  async function handleDeleteAccount(): Promise<void> {
    if (deleting) return;

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus akun?',
      text: 'Hapus akun organisasi secara permanen. Tindakan ini tidak dapat dibatalkan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    setDeleting(true);
    Swal.fire({
      title: 'Menghapus akun...',
      text: 'Mohon tunggu sebentar.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await api.put<unknown>('/services/profile/delete', undefined, token ? { Authorization: token } : undefined);
    setDeleting(false);
    Swal.close();

    if (res.status === 'success') {
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: res.message ?? 'Akun berhasil dihapus.',
        confirmButtonText: 'OK',
      });
      await clearAuthAndCache();
      window.location.href = '/auth/login';
      return;
    }

    await Swal.fire({
      icon: 'error',
      title: 'Gagal menghapus akun',
      text: res.message ?? 'Terjadi kesalahan. Silakan coba lagi.',
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-10">
      <Card className="pb-0 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Organisasi</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi organisasi anda</p>
          </div>
          <div className="w-full md:w-[360px] shrink-0">
            <div className="relative h-32 md:h-36 rounded-2xl overflow-hidden border border-blue-100/70 dark:border-gray-700 bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-blue-950/40 dark:via-gray-900 dark:to-gray-800">
              <svg
                viewBox="0 0 400 200"
                className="absolute -right-6 -top-10 h-[220px] w-[440px] opacity-80"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="orgBanner" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d="M40 140 C 110 60, 200 220, 330 120 C 370 90, 390 70, 410 50 L 410 210 L 0 210 Z"
                  fill="url(#orgBanner)"
                />
                <circle cx="290" cy="70" r="32" fill="#93c5fd" fillOpacity="0.18" />
                <circle cx="330" cy="95" r="18" fill="#60a5fa" fillOpacity="0.16" />
              </svg>
              <div className="relative h-full flex items-end justify-between gap-4 p-4">
                {/* <div className="shrink-0"> */}
                  {loading ? (
                    <div className="w-full rounded-2xl bg-white/70 dark:bg-gray-800/80 ring-1 ring-gray-200/70 dark:ring-gray-700 animate-pulse" />
                  ) : data.logo ? (
                    <div className="w-full rounded-2xl bg-white/70 dark:bg-gray-800/80 ring-1 ring-gray-200/70 dark:ring-gray-700 p-1 flex items-center justify-center">
                      <img src={toFileUrl(data.logo)} alt="Logo Organisasi" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full rounded-2xl bg-white/70 dark:bg-gray-800/80 ring-1 ring-gray-200/70 dark:ring-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                      <Landmark className="h-5 w-5" />
                    </div>
                  )}
                {/* </div> */}
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-6">
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40">
                <IdCard className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="border-0 pb-0 text-lg text-gray-900 dark:text-white">Informasi Organisasi</CardTitle>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Detail informasi organisasi Anda</p>
              </div>
            </div>
            <div className="mt-4 h-px bg-gray-200 dark:bg-gray-700" />
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Item icon={<Landmark className="h-4 w-4" />} label="Nama Organisasi" value={data.organization_name} />
                <Item icon={<Landmark className="h-4 w-4" />} label="Nama Perusahaan" value={data.company_name} />
                <Item icon={<IdCard className="h-4 w-4" />} label="Kode Organisasi" value={data.organization_code} />
                <Item icon={<IdCard className="h-4 w-4" />} label="NPWP" value={data.npwp_number} />
                <Item icon={<Mail className="h-4 w-4" />} label="Email" value={data.email} />
                <Item icon={<Phone className="h-4 w-4" />} label="Telepon" value={data.phone} />
                <Item icon={<MapPin className="h-4 w-4" />} label="Provinsi" value={data.province} />
                <Item icon={<MapPin className="h-4 w-4" />} label="Kota" value={data.city} />
                <Item icon={<MapPin className="h-4 w-4" />} label="Kode Pos" value={data.postal_code} />
                <Item icon={<Landmark className="h-4 w-4" />} label="Jenis Usaha" value={data.organization_type} />
                <div className="sm:col-span-2">
                  <Item icon={<MapPin className="h-4 w-4" />} label="Alamat" value={data.address} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <ActionCard
          tone="primary"
          icon={<Pencil className="h-5 w-5" />}
          title="Perbarui Informasi"
          subtitle="Edit informasi organisasi Anda"
          onClick={() => navigate(`${basePrefix}/organization/settings`)}
        />
        <ActionCard
          tone="primary"
          icon={<Lock className="h-5 w-5" />}
          title="Ubah Password"
          subtitle="Ganti password akun Anda"
          onClick={() => navigate(`${basePrefix}/organization/settings?tab=password`)}
        />
        <ActionCard
          tone="danger"
          icon={<Trash2 className="h-5 w-5" />}
          title="Hapus Akun"
          subtitle="Hapus akun organisasi secara permanen. Tindakan ini tidak dapat dibatalkan."
          onClick={handleDeleteAccount}
        />
      </div>
    </div>
  );
};
