import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatPhoneNumberId } from '@/lib/utils';
import { Building2, Lock, Check, Phone, User, Globe, Mail, FileText } from 'lucide-react';

type OrganizationData = {
  address: string;
  address_label: string;
  city: string;
  city_name: string;
  company_name: string;
  domain_url: string;
  email: string;
  logo: string;
  npwp_number: string;
  organization_code: string;
  organization_lat: string;
  organization_lng: string;
  organization_name: string;
  organization_type: string;
  phone: string;
  postal_code: string;
  province: string;
  province_name: string;
  whatsapp: string;
};

export const OrganizationCompany: React.FC = () => {
  const [data, setData] = useState<OrganizationData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    (async () => {
      const res = await api.get<Record<string, unknown>>('/organization/detail', { Authorization: token });
      if (res.status === 'success' && res.data && typeof res.data === 'object') {
        setData(res.data as unknown as OrganizationData);
      }
    })();
  }, []);

  const displayValue = (value: string | null | undefined): string => {
    if (!value || value === '') return '-';
    return value;
  };

  const ContactRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayValue(value)}</p>
      </div>
    </div>
  );

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Informasi Organisasi</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Ringkasan profil organisasi dan perusahaan (read-only).</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
          <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Read-only</span>
        </div>
      </div>

      <Card>
        <CardHeaderWithBadge
          badgeIcon={Building2}
          title="Profil Organisasi"
        />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              {data.logo ? (
                <img src={data.logo} alt={data.organization_name} className="w-30 h-24 rounded-lg object-contain" />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 mb-4" />
              )}
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{data.organization_name}</h3>
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kode Organisasi</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mt-2">
                {data.organization_code}
              </span>
            </div>

            <div className="space-y-4">
              <ContactRow icon={Building2} label="Nama Perusahaan" value={data.company_name} />
              <ContactRow icon={Phone} label="Telepon" value={formatPhoneNumberId(data.phone)} />
              <ContactRow icon={User} label="Contact Person" value={data.address_label} />
              <ContactRow icon={Globe} label="Domain" value={data.domain_url} />
            </div>

            <div className="space-y-4">
              <ContactRow icon={Mail} label="Email" value={data.email} />
              <ContactRow icon={FileText} label="Jenis Usaha" value={data.organization_type} />
              <ContactRow icon={FileText} label="NPWP" value={data.npwp_number} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeaderWithBadge
          badgeIcon={Building2}
          title="Alamat"
        />
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className='mb-6'>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alamat Lengkap</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-10">
                  {`${data.address}${data.address ? ', ' : ''}${data.city_name}${data.city_name ? ', ' : ''}${data.province_name}`}
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Kode Pos</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{displayValue(data.postal_code)}</p>
            </div>

            <div className="h-40 rounded-lg overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${data.organization_lat},${data.organization_lng}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Lokasi Organisasi"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};