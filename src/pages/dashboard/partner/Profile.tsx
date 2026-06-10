import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, IdCard, KeyRound, Mail, MapPin, Pencil, Phone, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
};

export const PartnerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<ProfileData>('/profile/detail', { Authorization: token });
      setLoading(false);
      if (res.status === 'success' && res.data) {
        const avatarRaw = (res.data as Record<string, unknown>).avatar ?? (res.data as Record<string, unknown>).photo ?? (res.data as Record<string, unknown>).profile_photo;
        const avatar = typeof avatarRaw === 'string' ? avatarRaw : '';
        const city_label = typeof (res.data as Record<string, unknown>).city_label === 'string' ? (res.data as Record<string, unknown>).city_label as string : undefined;
        const province_label = typeof (res.data as Record<string, unknown>).province_label === 'string' ? (res.data as Record<string, unknown>).province_label as string : undefined;
        setData({ ...res.data, avatar, city_label, province_label });
      }
    })();
  }, []);

  const formatBirthDate = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  };

  const locationLabel = [data.city_label ?? data.city, data.province_label ?? data.province].filter(Boolean).join(', ');
  const addressValue = [data.address, locationLabel, data.postal_code ? `Kode Pos ${data.postal_code}` : '']
    .filter(Boolean)
    .join('\n');

  const Item: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/50 dark:bg-gray-900/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-gray-400">{icon}</span>
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className="mt-1 font-medium text-gray-900 dark:text-gray-100 break-words whitespace-pre-line">{value || '-'}</div>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil Partner</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi profil anda</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700 transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {data.avatar ? (
                      <img src={toFileUrl(data.avatar)} alt="Foto Profil" className="h-full w-full object-cover" />
                    ) : (
                      <img src={defaultAvatar} alt="Foto Profil" className="h-full w-full object-contain opacity-80 p-2.5" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </button>
                </DialogTrigger>
                <div className="min-w-0 flex-1">
                  <CardTitle className="border-0 pb-0 text-lg text-gray-900 dark:text-white">Informasi Profil</CardTitle>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Detail informasi profil Anda</p>
                </div>
              </div>
              <div className="mt-4 h-px bg-gray-200 dark:bg-gray-700" />
            </CardHeader>

            <CardContent className="pt-0">
              {loading ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Item icon={<User className="h-4 w-4" />} label="Nama" value={data.name ?? ''} />
                  <Item icon={<Mail className="h-4 w-4" />} label="Email" value={data.email ?? ''} />
                  <Item icon={<Phone className="h-4 w-4" />} label="Telepon" value={data.phone ?? ''} />
                  <Item icon={<IdCard className="h-4 w-4" />} label="NPWP" value={data.npwp ?? ''} />
                  <Item icon={<Calendar className="h-4 w-4" />} label="Tanggal Lahir" value={formatBirthDate(data.date_of_birth)} />
                  <div className="sm:col-span-2">
                    <Item icon={<MapPin className="h-4 w-4" />} label="Alamat" value={addressValue} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-0">
            <div className="bg-white dark:bg-gray-900">
              <div className="px-6 pt-6 pb-4">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">Foto Profil</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">Klik di luar untuk menutup</div>
              </div>
              <div className="px-6 pb-6">
                <div className="w-full overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-800/60 ring-1 ring-gray-200/70 dark:ring-gray-700">
                  {data.avatar ? (
                    <img src={toFileUrl(data.avatar)} alt="Foto Profil" className="w-full max-h-[70vh] object-contain" />
                  ) : (
                    <div className="flex items-center justify-center py-14">
                      <img src={defaultAvatar} alt="Foto Profil" className="h-28 w-28 object-contain opacity-80" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <ActionCard
          icon={<Pencil className="h-5 w-5" />}
          title="Edit Profil"
          subtitle="Perbarui informasi profil Anda"
          onClick={() => navigate('/dashboard/partner/profile/edit')}
        />
        <ActionCard
          icon={<KeyRound className="h-5 w-5" />}
          title="Ubah Password"
          subtitle="Ganti password akun Anda"
          onClick={() => navigate('/dashboard/partner/profile/password')}
        />
        <ActionCard
          tone="danger"
          icon={<Trash2 className="h-5 w-5" />}
          title="Hapus Akun"
          subtitle="Hapus akun secara permanen. Tindakan ini tidak dapat dibatalkan."
          onClick={handleDeleteAccount}
        />
      </div>
    </div>
  );
};
