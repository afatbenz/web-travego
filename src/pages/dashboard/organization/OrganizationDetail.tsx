import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, toFileUrl } from '@/lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Landmark, MapPin, Phone, Mail, IdCard, Pencil } from 'lucide-react';

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
    <div className="flex items-start gap-3">
      <div className="mt-1 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="font-medium text-gray-900 dark:text-gray-100 break-words">{value || '-'}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Organisasi</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi organisasi anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 md:col-span-1 flex">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logo Organisasi</h2>
            </div>
            <div className="mt-3 h-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-col items-center justify-center flex-1 min-h-[260px]">
              {loading ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
              ) : data.logo ? (
                <img src={toFileUrl(data.logo)} alt="Logo Organisasi" className="w-full h-44 rounded bg-slate-100 dark:bg-gray-800 object-contain" />
              ) : (
                <div className="w-full h-44 rounded bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  Belum ada logo
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 md:col-span-2">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Organisasi</h2>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2">
                  <Item icon={<MapPin className="h-4 w-4" />} label="Alamat" value={data.address} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate(`${basePrefix}/organization/settings`)}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Perbarui Informasi
        </Button>
      </div>
    </div>
  );
};
