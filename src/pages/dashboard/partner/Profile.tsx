import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Mail, MapPin, Phone, User, Shield, Clock, Circle, Key, Trash2, Pencil, X, Headset } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, toFileUrl } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '@/assets/general/avatar.svg';
import Swal from 'sweetalert2';

type ProfileData = {
  name?: string;
  email?: string;
  phone?: string;
  npwp?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  city_label?: string;
  province?: string;
  province_label?: string;
  postal_code?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
  status?: string;
};

export const PartnerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>({});
  const [photoOpen, setPhotoOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>('');

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<ProfileData>('/profile/detail', { Authorization: token });
      if (res.status === 'success' && res.data) {
        const avatarRaw = (res.data as Record<string, unknown>).avatar ?? (res.data as Record<string, unknown>).photo ?? (res.data as Record<string, unknown>).profile_photo;
        const avatar = typeof avatarRaw === 'string' ? avatarRaw : '';
        const city_label = typeof (res.data as Record<string, unknown>).city_label === 'string' ? (res.data as Record<string, unknown>).city_label as string : undefined;
        const province_label = typeof (res.data as Record<string, unknown>).province_label === 'string' ? (res.data as Record<string, unknown>).province_label as string : undefined;
        setData({ ...res.data, avatar, city_label, province_label });
        setCurrentAvatar(avatar);
      }
    })();
  }, []);

  const formatDate = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  };

  const formatDateTime = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const date = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d);
    return `${date}, ${time} WIB`;
  };

  const locationLabel = [data.city_label ?? data.city, data.province_label ?? data.province].filter(Boolean).join(', ');
  const addressValue = [data.address, locationLabel, data.postal_code ? `Kode Pos ${data.postal_code}` : ''].filter(Boolean).join('');

  async function clearAuthAndCache(): Promise<void> {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    if (deleting) return;

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus akun?',
      text: 'Hapus akun secara permanen. Tindakan ini tidak dapat dibatalkan.',
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

  const InfoItem = ({ icon: Icon, label, value }: { icon: unknown; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <div className="mt-0.5 text-gray-400">
        <User className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-line">{value || '-'}</div>
      </div>
    </div>
  );

  const ActionItem = ({ icon: Icon, title, subtitle, tone = 'primary', onClick }: { icon: any; title: string; subtitle: string; tone?: 'primary' | 'danger'; onClick: () => void }) => {
    const isDanger = tone === 'danger';
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={
            [
              'flex h-11 w-11 items-center justify-center rounded-2xl ring-1',
              isDanger
                ? 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40'
                : 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40',
            ].join(' ')
          }>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={
              [
                'font-semibold',
                isDanger ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'
              ].join(' ')
            }>
              {title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pt-3 pb-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil Saya</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Kelola informasi akun Anda</p>
      </div>

      {/* Identity Card */}
      <Card className="dark:bg-gray-900 dark:border-gray-800 overflow-hidden rounded-3xl border-0 shadow-sm shadow-slate-200/60">
        <div className="p-6 sm:p-8 pb-3">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Left: Photo */}
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setPhotoOpen(true)}
                className="h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-200 dark:hover:ring-blue-700 transition-all duration-300 hover:scale-105"
              >
                {currentAvatar ? (
                  <img src={toFileUrl(currentAvatar)} alt="Foto Profil" className="h-full w-full object-cover" />
                ) : (
                  <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 sm:h-20 sm:w-20 object-contain opacity-80" />
                )}
              </button>
             
            </div>

            {/* Middle: Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.name || '-'}</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  {data.role || 'User'}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{data.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{data.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Right: Edit Button */}
            <div className="flex justify-end sm:justify-start">
              <Button
                variant="default"
                onClick={() => navigate('/dashboard/profile/edit')}
                className="h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profil
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Personal Info (75% width) */}
        <Card className="dark:bg-gray-900 dark:border-gray-800 overflow-hidden rounded-3xl border-0 shadow-sm shadow-slate-200/60 lg:col-span-3">
          <div className="p-6 sm:p-7 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informasi Pribadi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Data diri lengkap Anda</p>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <InfoItem icon={User} label="Nama Lengkap" value={data.name || ''} />
              <InfoItem icon={Mail} label="Email" value={data.email || ''} />
              <InfoItem icon={Phone} label="Nomor Telepon" value={data.phone || ''} />
              <InfoItem icon={Calendar} label="Tanggal Lahir" value={formatDate(data.date_of_birth)} />
              <InfoItem icon={MapPin} label="Alamat" value={addressValue} />
            </div>
          </div>
        </Card>

        {/* Right Column: Account Info (25% width) */}
        <Card className="dark:bg-gray-900 dark:border-gray-800 overflow-hidden rounded-3xl border-0 shadow-sm shadow-slate-200/60 lg:col-span-1">
          <div className="p-6 sm:p-7">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informasi Akun</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Detail akun dan aktivitas</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InfoItem icon={Shield} label="Peran" value={data.role || ''} />
              <InfoItem icon={Calendar} label="Bergabung Sejak" value={formatDate(data.created_at)} />
              <InfoItem icon={Clock} label="Terakhir Login" value={formatDateTime(data.last_login)} />
              <div className="flex items-start gap-3 py-3">
                <div className="mt-0.5 text-gray-400">
                  <Circle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status Akun</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      data.status?.toLowerCase() === 'aktif' || data.status?.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                    }`}>
                      {data.status || 'Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Card */}
      <ActionItem
              icon={Key}
              title="Ubah Password"
              subtitle="Perbarui kata sandi akun Anda"
              onClick={() => navigate('/dashboard/profile/password')}
            />
            <ActionItem
              tone="danger"
              icon={Trash2}
              title="Hapus Akun"
              subtitle="Tindakan ini tidak dapat dibatalkan"
              onClick={handleDeleteAccount}
            />

      {/* Help Banner */}
      <Card className="dark:bg-gray-900 dark:border-gray-800 overflow-hidden rounded-3xl border-0 shadow-sm shadow-slate-200/60 bg-blue-50 dark:bg-blue-900/20">
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Butuh bantuan?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Hubungi tim support kami jika Anda membutuhkan bantuan terkait akun.</p>
            </div>
          </div>
          <Button
            variant="default"
            className="h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            Hubungi Support
          </Button>
        </div>
      </Card>

      {/* Photo Modal */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-0 bg-transparent shadow-2xl">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setPhotoOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Foto Profil</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Klik di luar untuk menutup</p>
            </div>
            <div className="w-full overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700">
              {currentAvatar ? (
                <img src={toFileUrl(currentAvatar)} alt="Foto Profil" className="w-full h-auto max-h-[70vh] object-contain" />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <img src={defaultAvatar} alt="Foto Profil" className="h-32 w-32 object-contain opacity-80" />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
