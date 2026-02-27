import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type CompanyInfo = {
  organization_name: string;
  organization_code: string;
  company_name: string;
  phone: string;
  address: string;
  province_name: string;
  city_name: string;
  email: string;
  logo: string;
  contact_person: string;
  domain_url: string;
  npwp_number: string;
  postal_code: string;
  province: string;
  business_type: string;
};

export const OrganizationCompany: React.FC = () => {
  const [info, setInfo] = useState<CompanyInfo>({
    organization_name: '',
    organization_code: '',
    company_name: '',
    phone: '',
    address: '',
    province_name: '',
    city_name: '',
    email: '',
    logo: '',
    contact_person: '',
    domain_url: '',
    npwp_number: '',
    postal_code: '',
    province: '',
    business_type: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';

    const userStr = localStorage.getItem('user');
    let contactName = '';
    try {
      if (userStr) {
        const u = JSON.parse(userStr) as { name?: string };
        contactName = String(u.name ?? '');
      }
    } catch { contactName = ''; }

    const toTitle = (s: string) => s.trim().replace(/[_\s-]+/g, ' ').toLowerCase().split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const fallback: CompanyInfo = {
      organization_name: localStorage.getItem('organization_name') ?? '',
      organization_code: localStorage.getItem('organization_code') ?? '',
      company_name: localStorage.getItem('company_name') ?? '',
      phone: localStorage.getItem('company_phone') ?? '',
      address: localStorage.getItem('company_address') ?? '',
      province_name: localStorage.getItem('company_province_name') ?? '',
      city_name: localStorage.getItem('company_city_name') ?? '',
      email: localStorage.getItem('company_email') ?? '',
      logo: localStorage.getItem('company_logo') ?? '',
      contact_person: contactName,
      domain_url: localStorage.getItem('company_domain_url') ?? '',
      npwp_number: localStorage.getItem('company_npwp_number') ?? '',
      postal_code: localStorage.getItem('company_postal_code') ?? '',
      province: localStorage.getItem('company_province') ?? '',
      business_type: toTitle(localStorage.getItem('company_business_type') ?? ''),
    };

    (async () => {
      const res = await api.get<Record<string, unknown>>('/organization/detail', { Authorization: token });
      if (res.status === 'success' && res.data && typeof res.data === 'object') {
        const obj = res.data as Record<string, unknown>;
        const org = (obj['organization'] && typeof obj['organization'] === 'object') ? obj['organization'] as Record<string, unknown> : undefined;
        const getStr = (o: Record<string, unknown>, k: string, alt?: string) => {
          const v = o[k];
          return typeof v === 'string' ? v : (alt ?? '');
        };
        

        const organization_name = String(
          (obj['organization_name'] as string) ?? (obj['org_name'] as string) ?? (org ? getStr(org, 'name') : '') ?? fallback.organization_name
        );
        const organization_code = String(
          (obj['organization_code'] as string) ?? (org ? getStr(org, 'code') : '') ?? fallback.organization_code
        );
        const company_name = String(
          (obj['company_name'] as string) ?? (org ? getStr(org, 'company_name') : '') ?? fallback.company_name
        );
        const phone = String(
          (obj['phone'] as string) ?? (org ? getStr(org, 'phone') : '') ?? fallback.phone
        );
        const address = String(
          (obj['address'] as string) ?? (org ? getStr(org, 'address') : '') ?? fallback.address
        );
        const province_name = String(
          (obj['province_name'] as string) ?? fallback.province_name
        );
        const city_name = String(
          (obj['city_name'] as string) ?? fallback.city_name
        );
        const email = String(
          (obj['email'] as string) ?? (org ? getStr(org, 'email') : '') ?? fallback.email
        );
        const logo = String(
          (obj['logo'] as string) ?? fallback.logo
        );
        const domain_url = String(
          (obj['domain_url'] as string) ?? fallback.domain_url
        );
        const npwp_number = String(
          (obj['npwp_number'] as string) ?? fallback.npwp_number
        );
        const postal_code = String(
          (obj['postal_code'] as string) ?? fallback.postal_code
        );
        const province = String(
          (obj['province'] as string) ?? fallback.province
        );
        const orgTypeRaw = obj['organization_type'];
        const business_type = typeof orgTypeRaw === 'string' ? toTitle(orgTypeRaw) : fallback.business_type;

        setInfo({
          organization_name,
          organization_code,
          company_name,
          phone,
          address,
          province_name,
          city_name,
          email,
          logo,
          contact_person: fallback.contact_person,
          domain_url,
          npwp_number,
          postal_code,
          province,
          business_type,
        });
      } else {
        setInfo(fallback);
      }
    })();
  }, []);

  const Item: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{info.organization_name}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi organisasi (read-only).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Organisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <div className="space-y-6">
              <div className="relative w-full">
                {info.logo ? (
                  <img src={info.logo} alt={info.organization_name} className="w-full h-32 rounded-lg object-contain bg-slate-50 dark:bg-slate-900" />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Item label="Kode Organisasi" value={info.organization_code} />
              <Item label="Nama Perusahaan" value={info.company_name} />
              <Item label="Telepon" value={info.phone} />
              <Item label="Email" value={info.email} />
              <Item label="Contact Person" value={info.contact_person} />
              <Item label="Jenis Usaha" value={info.business_type} />
              <Item label="Domain" value={info.domain_url} />
              <Item label="NPWP" value={info.npwp_number} />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <Item label="Kode Pos" value={info.postal_code} />
            </div>
            <div>
              <Item label="Alamat Lengkap" value={`${info.address}${info.address ? ', ' : ''}${info.city_name}${info.city_name ? ', ' : ''}${info.province_name} ${info.postal_code}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
