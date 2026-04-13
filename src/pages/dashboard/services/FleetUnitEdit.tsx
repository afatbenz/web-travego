import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Save } from 'lucide-react';
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

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

export const FleetUnitEdit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const unitIdParam = params.unit_id ?? params.id ?? '';

  const [loadingFleetOptions, setLoadingFleetOptions] = useState(false);
  const [fleetOptions, setFleetOptions] = useState<FleetOption[]>([]);
  const [fleetPickerOpen, setFleetPickerOpen] = useState(false);
  const [loadingTransmissionOptions, setLoadingTransmissionOptions] = useState(false);
  const [transmissionOptions, setTransmissionOptions] = useState<TransmissionOption[]>([]);

  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    unit_id: '',
    fleet_id: '',
    vehicle_id: '',
    plate_number: '',
    engine: '',
    capacity: '',
    production_year: '',
    transmission: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedFleetLabel = useMemo(() => {
    const found = fleetOptions.find((o) => o.id === formData.fleet_id);
    return found?.label ?? '';
  }, [fleetOptions, formData.fleet_id]);

  const submitReady = useMemo(() => {
    const capacity = Number(formData.capacity);
    const year = Number(formData.production_year);
    return (
      Boolean(formData.unit_id) &&
      Boolean(formData.fleet_id) &&
      Boolean(formData.vehicle_id.trim()) &&
      Boolean(formData.plate_number.trim()) &&
      Boolean(formData.engine.trim()) &&
      Boolean(formData.transmission.trim()) &&
      Number.isFinite(capacity) &&
      capacity > 0 &&
      Number.isFinite(year) &&
      year > 0
    );
  }, [formData]);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingFleetOptions(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>('/services/fleet/list?search_for=unit', token ? { Authorization: token } : undefined);
      if (res.status === 'success') setFleetOptions(normalizeFleetOptions(res.data));
      else setFleetOptions([]);
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
        const getStr = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
        const payload = res.data as unknown;
        const list: unknown[] = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).items)
            ? ((payload as Record<string, unknown>).items as unknown[])
            : [];
        const mapped = list
          .map((raw) => record(raw))
          .map((o) => {
            const id = getStr(o.id ?? o.value).trim();
            const label = getStr(o.label ?? o.name ?? o.text).trim();
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

  useEffect(() => {
    if (!formData.transmission) return;
    if (!transmissionOptions.length) return;
    const byId = transmissionOptions.some((o) => o.id === formData.transmission);
    if (byId) return;
    const match = transmissionOptions.find((o) => o.label.toLowerCase() === formData.transmission.toLowerCase());
    if (!match) return;
    setFormData((prev) => ({ ...prev, transmission: match.id }));
  }, [formData.transmission, transmissionOptions]);

  useEffect(() => {
    const loadDetail = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setLoadingDetail(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/fleet-units/detail/${encodeURIComponent(unitId)}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = record(res.data);
        const obj = record(payload.data && typeof payload.data === 'object' ? payload.data : payload);
        const unit_id = getString(obj.unit_id ?? obj.id ?? unitId);
        const fleet_id = getString(obj.fleet_id ?? obj.fleetId);
        const vehicle_id = getString(obj.vehicle_id ?? obj.vehicleId ?? obj.unit_id);
        const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate);
        const engine = getString(obj.engine ?? obj.chassis ?? obj.machine);
        const capacity = getString(obj.capacity);
        const production_year = getString(obj.production_year ?? obj.productionYear ?? obj.year);
        const transmission = getString(obj.transmission);

        setFormData({
          unit_id,
          fleet_id,
          vehicle_id,
          plate_number,
          engine,
          capacity,
          production_year,
          transmission,
        });
      }
      setLoadingDetail(false);
    };

    loadDetail();
  }, [unitIdParam]);

  const setField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.fleet_id) next.fleet_id = 'Jenis armada wajib dipilih';
    if (!formData.vehicle_id.trim()) next.vehicle_id = 'Vehicle ID wajib diisi';
    if (!formData.plate_number.trim()) next.plate_number = 'Plate number wajib diisi';
    if (!formData.engine.trim()) next.engine = 'Engine wajib diisi';
    if (!formData.transmission.trim()) next.transmission = 'Transmission wajib diisi';
    const capacity = Number(formData.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) next.capacity = 'Capacity harus berupa angka > 0';
    const year = Number(formData.production_year);
    if (!Number.isFinite(year) || year <= 0) next.production_year = 'Production year harus berupa angka valid';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    const payload = {
      unit_id: formData.unit_id,
      fleet_id: formData.fleet_id,
      vehicle_id: formData.vehicle_id.trim(),
      plate_number: formData.plate_number.trim(),
      engine: formData.engine.trim(),
      capacity: Number(formData.capacity),
      production_year: Number(formData.production_year),
      transmission: formData.transmission.trim(),
    };

    try {
      const res = await api.post<unknown>('/services/fleet-units/update', payload, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Unit berhasil diperbarui.' });
        navigate(`${basePrefix}/fleet-units/detail/${encodeURIComponent(String(formData.unit_id))}`);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Unit Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{formData.vehicle_id || unitIdParam}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Unit</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`s-${i}`} className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jenis Armada *</label>
                  <Popover open={fleetPickerOpen} onOpenChange={setFleetPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={fleetPickerOpen}
                        className={cn(
                          'w-full justify-between',
                          !formData.fleet_id && 'text-muted-foreground',
                          errors.fleet_id && 'border-red-500'
                        )}
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
                                <Check className={cn('mr-2 h-4 w-4', formData.fleet_id === o.id ? 'opacity-100' : 'opacity-0')} />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Vehicle ID (Nomor Unit) *</label>
                  <Input
                    value={formData.vehicle_id}
                    onChange={(e) => setField('vehicle_id', e.target.value)}
                    placeholder="Contoh: UNIT-001"
                    className={errors.vehicle_id ? 'border-red-500' : ''}
                  />
                  {errors.vehicle_id && <p className="text-sm text-red-500">{errors.vehicle_id}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Plate Number *</label>
                  <Input
                    value={formData.plate_number}
                    onChange={(e) => setField('plate_number', e.target.value)}
                    placeholder="Contoh: B 1234 ABC"
                    className={errors.plate_number ? 'border-red-500' : ''}
                  />
                  {errors.plate_number && <p className="text-sm text-red-500">{errors.plate_number}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Engine *</label>
                  <Input
                    value={formData.engine}
                    onChange={(e) => setField('engine', e.target.value)}
                    placeholder="Contoh: D4BB-123"
                    className={errors.engine ? 'border-red-500' : ''}
                  />
                  {errors.engine && <p className="text-sm text-red-500">{errors.engine}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Capacity *</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setField('capacity', e.target.value)}
                    placeholder="Contoh: 14"
                    className={errors.capacity ? 'border-red-500' : ''}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Production Year *</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={formData.production_year}
                    onChange={(e) => setField('production_year', e.target.value)}
                    placeholder="Contoh: 2022"
                    className={errors.production_year ? 'border-red-500' : ''}
                    style={{ colorScheme: 'light' }}
                  />
                  {errors.production_year && <p className="text-sm text-red-500">{errors.production_year}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Transmission *</label>
                  <Select value={formData.transmission} onValueChange={(v) => setField('transmission', v)}>
                    <SelectTrigger className={errors.transmission ? 'border-red-500' : ''}>
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
                  {errors.transmission && <p className="text-sm text-red-500">{errors.transmission}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving || loadingDetail || !submitReady}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
