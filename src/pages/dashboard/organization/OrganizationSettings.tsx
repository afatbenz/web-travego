import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Landmark, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrganizationSettings: React.FC = () => {
  const [form, setForm] = useState({
    organization_name: '',
    company_name: '',
    address: '',
    province: '',
    city: '',
    phone: '',
    email: '',
    organization_code: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let orgName = '';
    try {
      const payloadStr = token.split('.')[1];
      if (payloadStr) {
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        orgName = String(
          json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? ''
        );
      }
    } catch {}
    const orgCode = localStorage.getItem('organization_code') ?? '';
    setForm((p) => ({
      ...p,
      organization_name: orgName || localStorage.getItem('organization_name') || '',
      organization_code: orgCode,
      company_name: '',
      address: '',
      province: '',
      city: '',
      phone: '',
      email: '',
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Perbarui informasi organisasi</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Organisasi</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="organization_name" value={form.organization_name} onChange={handleChange} className="pl-10 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Organisasi</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="organization_code" value={form.organization_code} onChange={handleChange} className="pl-10 h-12" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Perusahaan</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="company_name" value={form.company_name} onChange={handleChange} className="pl-10 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="phone" value={form.phone} onChange={handleChange} className="pl-10 h-12" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Alamat</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="address" value={form.address} onChange={handleChange} className="pl-10 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provinsi</label>
              <Select value={form.province} onValueChange={(v) => setForm((p) => ({ ...p, province: v }))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DKI JAKARTA">DKI JAKARTA</SelectItem>
                  <SelectItem value="JAWA BARAT">JAWA BARAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kota</label>
              <Select value={form.city} onValueChange={(v) => setForm((p) => ({ ...p, city: v }))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAKARTA SELATAN">JAKARTA SELATAN</SelectItem>
                  <SelectItem value="BANDUNG">BANDUNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input name="email" value={form.email} onChange={handleChange} className="pl-10 h-12" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
