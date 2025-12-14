import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type ProfileData = {
  name?: string;
  email?: string;
  phone?: string;
  npwp?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
};

export const PartnerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<ProfileData>('http://localhost:3100/api/profile/detail', { Authorization: token });
      setLoading(false);
      if (res.status === 'success' && res.data) {
        setData(res.data);
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
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/dashboard/partner/profile/edit')}>
          Edit Profil
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Memuat...</div>
        ) : (
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
                <div className="font-medium">{[data.city, data.province].filter(Boolean).join(' / ') || '-'}</div>
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
        )}
      </div>
    </div>
  );
};
