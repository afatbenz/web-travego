import React, { useEffect, useState } from 'react';
import { KeyRound, User, Mail, Phone, Calendar, MapPin, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, toFileUrl } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '@/assets/general/avatar.svg';

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil Partner</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi profil anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 md:col-span-1 flex">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Foto Profil</h2>
            </div>
            <div className="mt-3 h-px bg-gray-200" />
            <div className="flex flex-col items-center justify-center flex-1 min-h-[260px]">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {data.avatar ? (
                  <img src={toFileUrl(data.avatar)} alt="Foto Profil" className="h-full w-full object-cover" />
                ) : (
                  <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 object-contain opacity-80" />
                )}
              </div>
              {loading ? <div className="mt-4 text-sm text-gray-600">Memuat...</div> : null}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          {loading ? (
            <div className="text-sm text-gray-600">Memuat...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Informasi Profil</h2>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Nama</div>
                  <div className="font-medium">{data.name || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{data.email || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Telepon</div>
                  <div className="font-medium">{data.phone || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IdCard className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">NPWP</div>
                  <div className="font-medium">{data.npwp || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Tanggal Lahir</div>
                  <div className="font-medium">{data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Alamat</div>
                  <div className="font-medium">{data.address || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Kota / Provinsi</div>
                  <div className="font-medium">{[data.city_label ?? data.city, data.province_label ?? data.province].filter(Boolean).join(' / ') || '-'}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Kode Pos</div>
                  <div className="font-medium">{data.postal_code || '-'}</div>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/dashboard/partner/profile/password')}>
          <KeyRound className="h-4 w-4 mr-2" />
          Ubah Password
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/dashboard/partner/profile/edit')}>
          Edit Profil
        </Button>
      </div>
    </div>
  );
};
