import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FleetOption = {
  id: string;
  label: string;
};

type UnitDraft = {
  vehicle_id: string;
  plate_number: string;
  engine: string;
  capacity: string;
  production_year: string;
  transmission: string;
};

type TransmissionOption = {
  id: string;
  label: string;
};

const normalizeFleetOptions = (payload: unknown): FleetOption[] => {
  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const takeArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const root = asRecord(payload);
  const rawItems =
    Array.isArray(payload)
      ? (payload as unknown[])
      : takeArray(root.items) || takeArray(root.fleets) || takeArray(root.data);

  return rawItems
    .map((raw) => asRecord(raw))
    .map((it) => {
      const idRaw = it.fleet_id ?? it.id;
      const labelRaw = it.fleet_name ?? it.name ?? it.label;
      const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
      const label = typeof labelRaw === 'string' ? labelRaw : '';
      return id && label ? { id, label } : null;
    })
    .filter((x): x is FleetOption => x !== null);
};

export const FleetUnitCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [loadingFleetOptions, setLoadingFleetOptions] = useState(false);
  const [fleetOptions, setFleetOptions] = useState<FleetOption[]>([]);
  const [fleetPickerOpen, setFleetPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTransmissionOptions, setLoadingTransmissionOptions] = useState(false);
  const [transmissionOptions, setTransmissionOptions] = useState<TransmissionOption[]>([]);

  const [fleetId, setFleetId] = useState('');
  const [units, setUnits] = useState<UnitDraft[]>([
    {
      vehicle_id: '',
      plate_number: '',
      engine: '',
      capacity: '',
      production_year: '',
      transmission: '',
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedFleetLabel = useMemo(() => {
    const found = fleetOptions.find((o) => o.id === fleetId);
    return found?.label ?? '';
  }, [fleetOptions, fleetId]);

  const submitReady = useMemo(() => {
    if (!fleetId) return false;
    if (!units.length) return false;
    for (const u of units) {
      const capacity = Number(u.capacity);
      const year = Number(u.production_year);
      if (!u.vehicle_id.trim()) return false;
      if (!u.plate_number.trim()) return false;
      if (!u.engine.trim()) return false;
      if (!u.transmission.trim()) return false;
      if (!Number.isFinite(capacity) || capacity <= 0) return false;
      if (!Number.isFinite(year) || year <= 0) return false;
    }
    return true;
  }, [fleetId, units]);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingFleetOptions(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>('/services/fleet/list?search_for=unit', token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        setFleetOptions(normalizeFleetOptions(res.data));
      } else {
        setFleetOptions([]);
      }
      setLoadingFleetOptions(false);
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const loadTransmissionOptions = async () => {
      setLoadingTransmissionOptions(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>('/general/fleet-transmission', token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const record = (v: unknown): Record<string, unknown> =>
          v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        const getString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];

        const mapped = list
          .map((raw) => record(raw))
          .map((o) => {
            const id = getString(o.id ?? o.value).trim();
            const label = getString(o.label ?? o.name ?? o.text).trim();
            return id && label ? { id, label } : null;
          })
          .filter((x): x is TransmissionOption => x !== null);
        setTransmissionOptions(mapped);
      } else {
        setTransmissionOptions([]);
      }
      setLoadingTransmissionOptions(false);
    };

    loadTransmissionOptions();
  }, []);

  const setField = (key: string, value: string) => {
    if (key === 'fleet_id') setFleetId(value);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setUnitField = (index: number, key: keyof UnitDraft, value: string) => {
    setUnits((prev) => prev.map((u, i) => (i === index ? { ...u, [key]: value } : u)));
    const errKey = `units.${index}.${key}`;
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
  };

  const addUnit = () => {
    setUnits((prev) => [
      ...prev,
      {
        vehicle_id: '',
        plate_number: '',
        engine: '',
        capacity: '',
        production_year: '',
        transmission: '',
      },
    ]);
  };

  const removeUnit = (index: number) => {
    setUnits((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(`units.${index}.`)) next[k] = v;
      }
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fleetId) next.fleet_id = 'Jenis armada wajib dipilih';

    units.forEach((u, idx) => {
      if (!u.vehicle_id.trim()) next[`units.${idx}.vehicle_id`] = 'Vehicle ID wajib diisi';
      if (!u.plate_number.trim()) next[`units.${idx}.plate_number`] = 'Plate number wajib diisi';
      if (!u.engine.trim()) next[`units.${idx}.engine`] = 'Engine wajib diisi';
      if (!u.transmission.trim()) next[`units.${idx}.transmission`] = 'Transmission wajib diisi';
      const capacity = Number(u.capacity);
      if (!Number.isFinite(capacity) || capacity <= 0) next[`units.${idx}.capacity`] = 'Capacity harus berupa angka > 0';
      const year = Number(u.production_year);
      if (!Number.isFinite(year) || year <= 0) next[`units.${idx}.production_year`] = 'Production year harus berupa angka valid';
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';

    try {
      const payload = {
        fleet_id: fleetId,
        units: units.map((u) => ({
          vehicle_id: u.vehicle_id.trim(),
          plate_number: u.plate_number.trim(),
          engine: u.engine.trim(),
          capacity: Number(u.capacity),
          production_year: Number(u.production_year),
          transmission: u.transmission,
        })),
      };
      const res = await api.post<unknown>('/services/fleet-units/create', payload, token ? { Authorization: token } : undefined);
      if (res.message === 'DUPLICATE_VEHICLE_ID') {
        await Swal.fire({
          icon: 'warning',
          title: 'Vehicle ID tidak valid',
          text: 'Pastikan vehicle id unik dan tidak ada duplikasi',
        });
        return;
      }
      if (res.message === 'DUPLICATE_PLATE_NUMBER') {
        await Swal.fire({
          icon: 'warning',
          title: 'Plat Nomor Tidak Valid',
          text: 'Pastikan plat nomor unik tidak ada duplikasi',
        });
        return;
      }
      if (res.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: units.length === 1 ? 'Unit berhasil ditambahkan.' : `${units.length} unit berhasil ditambahkan.`,
        });
        navigate(`${basePrefix}/fleet-units`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/fleet-units`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tambah Unit Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Lengkapi informasi unit armada</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Jenis Armada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jenis Armada *</label>
              <Popover open={fleetPickerOpen} onOpenChange={setFleetPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={fleetPickerOpen}
                    className={cn('w-full justify-between', !fleetId && 'text-muted-foreground', errors.fleet_id && 'border-red-500')}
                    disabled={loadingFleetOptions}
                  >
                    {loadingFleetOptions ? 'Memuat...' : selectedFleetLabel || 'Pilih jenis armada'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari jenis armada..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                      <CommandGroup>
                        {fleetOptions.map((o) => (
                          <CommandItem
                            key={o.id}
                            value={`${o.label} ${o.id}`}
                            onSelect={() => {
                              setField('fleet_id', o.id);
                              setFleetPickerOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', fleetId === o.id ? 'opacity-100' : 'opacity-0')} />
                            {o.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.fleet_id && <p className="text-sm text-red-500">{errors.fleet_id}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Unit</h2>
          <Button type="button" variant="outline" onClick={addUnit} className="bg-transparent hover:bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Unit
          </Button>
        </div>

        {units.map((unit, idx) => (
          <Card key={`unit-${idx}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{`Unit ${idx + 1}`}</CardTitle>
                {units.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeUnit(idx)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Vehicle ID (Nomor Unit) *</label>
                  <Input
                    value={unit.vehicle_id}
                    onChange={(e) => setUnitField(idx, 'vehicle_id', e.target.value)}
                    placeholder="Contoh: UNIT-001"
                    className={errors[`units.${idx}.vehicle_id`] ? 'border-red-500' : ''}
                  />
                  {errors[`units.${idx}.vehicle_id`] && <p className="text-sm text-red-500">{errors[`units.${idx}.vehicle_id`]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Plate Number *</label>
                  <Input
                    value={unit.plate_number}
                    onChange={(e) => setUnitField(idx, 'plate_number', e.target.value)}
                    placeholder="Contoh: B 1234 ABC"
                    className={errors[`units.${idx}.plate_number`] ? 'border-red-500' : ''}
                  />
                  {errors[`units.${idx}.plate_number`] && <p className="text-sm text-red-500">{errors[`units.${idx}.plate_number`]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Engine *</label>
                  <Input
                    value={unit.engine}
                    onChange={(e) => setUnitField(idx, 'engine', e.target.value)}
                    placeholder="Contoh: 2.5L Diesel"
                    className={errors[`units.${idx}.engine`] ? 'border-red-500' : ''}
                  />
                  {errors[`units.${idx}.engine`] && <p className="text-sm text-red-500">{errors[`units.${idx}.engine`]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Transmission *</label>
                  <Select value={unit.transmission} onValueChange={(v) => setUnitField(idx, 'transmission', v)}>
                    <SelectTrigger className={errors[`units.${idx}.transmission`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder={loadingTransmissionOptions ? 'Memuat...' : 'Pilih transmisi'} />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissionOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`units.${idx}.transmission`] && <p className="text-sm text-red-500">{errors[`units.${idx}.transmission`]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Capacity *</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={unit.capacity}
                    onChange={(e) => setUnitField(idx, 'capacity', e.target.value)}
                    placeholder="Contoh: 14"
                    className={errors[`units.${idx}.capacity`] ? 'border-red-500' : ''}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors[`units.${idx}.capacity`] && <p className="text-sm text-red-500">{errors[`units.${idx}.capacity`]}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Production Year *</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={unit.production_year}
                    onChange={(e) => setUnitField(idx, 'production_year', e.target.value)}
                    placeholder="Contoh: 2022"
                    className={errors[`units.${idx}.production_year`] ? 'border-red-500' : ''}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors[`units.${idx}.production_year`] && (
                    <p className="text-sm text-red-500">{errors[`units.${idx}.production_year`]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || !submitReady}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Unit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
