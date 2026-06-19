import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';
import Swal from 'sweetalert2';

type OrderFormData = {
  supplier_id: string;
  supplier_name_manual: string;
};

export const InventoryOrdersCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    supplier_id: '',
    supplier_name_manual: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.supplier_name_manual.trim()) {
      next.supplier_name_manual = 'Nama supplier wajib diisi';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) {
      showAlert({ title: 'Validasi', description: 'Periksa kembali field yang wajib diisi.', type: 'warning' });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';

    try {
      const payload = {
        supplier_name: formData.supplier_name_manual.trim(),
      };

      const res = await api.post<unknown>(
        '/inventories/orders/create',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pemesanan berhasil dibuat.' });
        navigate(`${basePrefix}/inventories/orders`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Tambah Pemesanan Asset</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Buat pemesanan asset baru</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeaderWithBadge
            badgeIcon={Save}
            title="Informasi Pemesanan"
            subtitle="Lengkapi detail pemesanan asset."
          />
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">Nama Supplier *</label>
              <Input
                placeholder="Masukkan nama supplier"
                value={formData.supplier_name_manual}
                onChange={(e) => setFormData((p) => ({ ...p, supplier_name_manual: e.target.value }))}
                className={errors.supplier_name_manual ? 'border-red-500' : ''}
              />
              {errors.supplier_name_manual && <p className="text-sm text-red-500">{errors.supplier_name_manual}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/inventories/orders`)}>
            Batal
          </Button>
          <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-blue-500">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};