import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';
import Swal from 'sweetalert2';

type ItemOption = {
  id: string;
  item_name: string;
};

type GarageOption = {
  id: string;
  garage_name: string;
};

const getItemId = (it: Record<string, unknown>): string => {
  const v = it.item_id ?? it.id;
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
};

const getGarageId = (it: Record<string, unknown>): string => {
  const v = it.garage_id ?? it.id;
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
};

type RequestFormData = {
  item_id: string;
  item_name_manual: string;
  garage_id: string;
  quantity: string;
};

export const InventoryRequestCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<RequestFormData>({
    item_id: '',
    item_name_manual: '',
    garage_id: '',
    quantity: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  const [garageOptions, setGarageOptions] = useState<GarageOption[]>([]);
  const [garagePickerOpen, setGaragePickerOpen] = useState(false);
  const [garageQuery, setGarageQuery] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      const token = localStorage.getItem('token') ?? '';
      const [itemsRes, garagesRes] = await Promise.all([
        api.get<unknown>('/inventories/items', token ? { Authorization: token } : undefined),
        api.get<unknown>('/organization/garage/list', token ? { Authorization: token } : undefined),
      ]);

      if (itemsRes.status === 'success') {
        const raw = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const mapped = raw
          .filter((it): it is Record<string, unknown> => it && typeof it === 'object')
          .map((it) => {
            const id = getItemId(it);
            const item_name = typeof it.item_name === 'string' ? it.item_name : '';
            return id && item_name ? { id, item_name } : null;
          })
          .filter((x): x is ItemOption => x !== null);
        setItemOptions(mapped);
      }

      if (garagesRes.status === 'success') {
        const raw = Array.isArray(garagesRes.data) ? garagesRes.data : [];
        const mapped = raw
          .filter((it): it is Record<string, unknown> => it && typeof it === 'object')
          .map((it) => {
            const id = getGarageId(it);
            const garage_name = typeof it.garage_name === 'string' ? it.garage_name : '';
            return id && garage_name ? { id, garage_name } : null;
          })
          .filter((x): x is GarageOption => x !== null);
        setGarageOptions(mapped);
      }
    };
    loadOptions();
  }, []);

  const selectedItemName = useMemo(() => {
    const found = itemOptions.find((o) => o.id === formData.item_id);
    return found?.item_name ?? '';
  }, [itemOptions, formData.item_id]);

  const selectedGarageName = useMemo(() => {
    const found = garageOptions.find((o) => o.id === formData.garage_id);
    return found?.garage_name ?? '';
  }, [garageOptions, formData.garage_id]);

  const filteredItems = useMemo(() => {
    if (!itemQuery) return itemOptions;
    return itemOptions.filter((o) => o.item_name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [itemOptions, itemQuery]);

  const filteredGarages = useMemo(() => {
    if (!garageQuery) return garageOptions;
    return garageOptions.filter((o) => o.garage_name.toLowerCase().includes(garageQuery.toLowerCase()));
  }, [garageOptions, garageQuery]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.item_id && !formData.item_name_manual.trim()) {
      next.item_id = 'Item harus dipilih atau ditulis manual';
    }
    if (!formData.garage_id) next.garage_id = 'Garasi harus dipilih';
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      next.quantity = 'Jumlah harus berupa angka > 0';
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
      const payload: Record<string, unknown> = {
        garage_id: formData.garage_id,
        quantity: Number(formData.quantity),
      };
      if (formData.item_id) {
        payload.item_id = formData.item_id;
      } else {
        payload.item_name = formData.item_name_manual.trim();
      }

      const res = await api.post<unknown>(
        '/inventories/request/create',
        payload,
        token ? { Authorization: token } : undefined
      );

      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Permintaan berhasil dibuat.' });
        navigate(`${basePrefix}/inventories/request`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/inventories/request`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Tambah Permintaan Asset</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Buat permintaan asset baru</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeaderWithBadge
            badgeIcon={Save}
            title="Informasi Permintaan"
            subtitle="Lengkapi detail permintaan asset."
          />
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">Item *</label>
              <Popover open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between rounded-2xl"
                  >
                    <span className={formData.item_id ? '' : 'text-muted-foreground'}>
                      {formData.item_id ? selectedItemName : (formData.item_name_manual || 'Pilih atau ketik nama item')}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Cari item..."
                      value={itemQuery}
                      onValueChange={setItemQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                      <CommandGroup>
                        {filteredItems.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.item_name}
                            onSelect={() => {
                              setFormData((p) => ({ ...p, item_id: opt.id, item_name_manual: '' }));
                              setItemPickerOpen(false);
                            }}
                          >
                            <Check className={formData.item_id === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                            {opt.item_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {!formData.item_id && (
                <Input
                  placeholder="Atau ketik nama item manual..."
                  value={formData.item_name_manual}
                  onChange={(e) => setFormData((p) => ({ ...p, item_name_manual: e.target.value }))}
                  className="mt-2"
                />
              )}
              {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">Garasi *</label>
              <Popover open={garagePickerOpen} onOpenChange={setGaragePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between rounded-2xl"
                  >
                    <span className={formData.garage_id ? '' : 'text-muted-foreground'}>
                      {formData.garage_id ? selectedGarageName : 'Pilih garasi'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Cari garasi..."
                      value={garageQuery}
                      onValueChange={setGarageQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                      <CommandGroup>
                        {filteredGarages.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.garage_name}
                            onSelect={() => {
                              setFormData((p) => ({ ...p, garage_id: opt.id }));
                              setGaragePickerOpen(false);
                            }}
                          >
                            <Check className={formData.garage_id === opt.id ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'} />
                            {opt.garage_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.garage_id && <p className="text-sm text-red-500">{errors.garage_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">Jumlah *</label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="Masukkan jumlah"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePrefix}/inventories/request`)}>
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