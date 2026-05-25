import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  Cpu,
  Gauge,
  Handshake,
  Hash,
  IdCard,
  Loader2,
  Phone,
  Plus,
  Save,
  Settings2,
  Trash2,
  BusFront
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
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
  ownership_type: 'Milik Sendiri' | 'Kerjasama Operasional';
  owner_name: string;
  owner_contact: string;
  owner_email: string;
  partner_choice_id?: string;
};

type TransmissionOption = {
  id: string;
  label: string;
};

type PartnerOption = {
  id: string;
  name: string;
  phone: string;
  source: 'api' | 'manual';
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

const normalizePartnershipOptions = (payload: unknown): PartnerOption[] => {
  const root = record(payload);
  const raw = Array.isArray(payload) ? (payload as unknown[]) : (Array.isArray(root.data) ? (root.data as unknown[]) : []);
  return raw
    .map((x) => record(x))
    .map((it) => {
      const id = getString(it.partner_id ?? it.id).trim();
      const name = getString(it.partner_name ?? it.name ?? it.partner).trim();
      const phone = getString(it.partner_phone ?? it.phone).trim();
      if (!id || !name) return null;
      return { id, name, phone, source: 'api' as const };
    })
    .filter((x): x is PartnerOption => x !== null);
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
      ownership_type: 'Milik Sendiri',
      owner_name: '',
      owner_contact: '',
      owner_email: '',
      partner_choice_id: undefined,
    },
  ]);
  const [manualPartnerOptions, setManualPartnerOptions] = useState<PartnerOption[]>([]);
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [partnerPickerUnitIndex, setPartnerPickerUnitIndex] = useState<number | null>(null);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerApiOptions, setPartnerApiOptions] = useState<PartnerOption[]>([]);
  const partnerReqSeq = useRef(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedFleetLabel = useMemo(() => {
    const found = fleetOptions.find((o) => o.id === fleetId);
    return found?.label ?? '';
  }, [fleetOptions, fleetId]);

  const mergedPartnerOptions = useMemo(() => {
    const byId = new Map<string, PartnerOption>();
    for (const o of manualPartnerOptions) byId.set(o.id, o);
    for (const o of partnerApiOptions) byId.set(o.id, o);
    const query = partnerQuery.trim().toLowerCase();
    const list = Array.from(byId.values());
    if (!query) return list;
    return list.filter((o) => o.name.toLowerCase().includes(query) || o.phone.toLowerCase().includes(query));
  }, [manualPartnerOptions, partnerApiOptions, partnerQuery]);

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
      if (u.ownership_type === 'Kerjasama Operasional') {
        if (!u.owner_name.trim()) return false;
        if (!u.owner_contact.trim()) return false;
        if (!u.owner_email.trim()) return false;
      }
    }
    return true;
  }, [fleetId, units]);

  useEffect(() => {
    if (!partnerPickerOpen) return;
    if (partnerPickerUnitIndex === null) return;
    const query = partnerQuery.trim();
    if (query.length < 3) {
      setPartnerLoading(false);
      setPartnerApiOptions([]);
      return;
    }

    const currentSeq = ++partnerReqSeq.current;
    const run = async () => {
      setPartnerLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const qs = new URLSearchParams();
      qs.set('q', query);
      const res = await api.get<unknown>(
        `/services/partnership/operations?${qs.toString()}`,
        token ? { Authorization: token } : undefined
      );
      if (partnerReqSeq.current !== currentSeq) return;
      if (res.status === 'success') setPartnerApiOptions(normalizePartnershipOptions(res.data));
      else setPartnerApiOptions([]);
      setPartnerLoading(false);
    };

    const t = window.setTimeout(() => void run(), 250);
    return () => window.clearTimeout(t);
  }, [partnerPickerOpen, partnerPickerUnitIndex, partnerQuery]);

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
    setManualPartnerOptions((prev) => {
      const byId = new Map<string, PartnerOption>(prev.map((x) => [x.id, x]));
      for (const u of units) {
        if (u.ownership_type !== 'Kerjasama Operasional') continue;
        const name = u.owner_name.trim();
        const phone = u.owner_contact.trim();
        const isApiChoice = Boolean(u.partner_choice_id) && !String(u.partner_choice_id).startsWith('manual:');
        if (!name || !phone || isApiChoice) continue;
        const id = `manual:${name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}:${phone.replace(/\s+/g, '').slice(0, 30)}`;
        if (!byId.has(id)) byId.set(id, { id, name, phone, source: 'manual' });
      }
      return Array.from(byId.values());
    });

    setUnits((prev) => [
      ...prev,
      {
        vehicle_id: '',
        plate_number: '',
        engine: '',
        capacity: '',
        production_year: '',
        transmission: '',
        ownership_type: 'Milik Sendiri',
        owner_name: '',
        owner_contact: '',
        owner_email: '',
        partner_choice_id: undefined,
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
      if (u.ownership_type === 'Kerjasama Operasional') {
        if (!u.owner_name.trim()) next[`units.${idx}.owner_name`] = 'Nama perusahaan wajib diisi';
        if (!u.owner_contact.trim()) next[`units.${idx}.owner_contact`] = 'Kontak perusahaan wajib diisi';
        if (!u.owner_email.trim()) next[`units.${idx}.owner_email`] = 'Owner perusahaan wajib diisi';
      }
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
          ownership_type: u.ownership_type,
          owner_name: u.ownership_type === 'Kerjasama Operasional' ? u.owner_name.trim() : '',
          owner_contact: u.ownership_type === 'Kerjasama Operasional' ? u.owner_contact.trim() : '',
          owner_email: u.ownership_type === 'Kerjasama Operasional' ? u.owner_email.trim() : '',
          ...(u.ownership_type === 'Kerjasama Operasional'
            ? (() => {
                const choiceId = String(u.partner_choice_id ?? '').trim();
                const isApiPartner = Boolean(choiceId) && !choiceId.startsWith('manual:');
                if (isApiPartner) return { partner_id: choiceId };
                return { partner_name: u.owner_name.trim(), partner_phone: u.owner_contact.trim() };
              })()
            : {}),
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
          <CardHeaderWithBadge
            badgeIcon={BusFront}
            title="Jenis Armada"
            subtitle="Pilih jenis armada untuk melanjutkan penambahan unit."
          />
          <CardContent className="pt-6">
            <div className="space-y-2">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white"></h2>
          <Button type="button" variant="outline" onClick={addUnit} className="bg-white border-2xl hover:bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Unit
          </Button>
        </div>

        {units.map((unit, idx) => (
          <Card
            key={`unit-${idx}`}
            className="rounded-[28px] border border-gray-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <CardHeaderWithBadge
              badgeIcon={BadgeCheck}
              title={`Unit ${idx + 1}`}
              subtitle="Lengkapi detail unit armada beserta status kepemilikannya."
            />

            {units.length > 1 && idx > 0 ? (
              <div className="px-6 pt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeUnit(idx)}
                  className="h-10 rounded-full border-gray-200/70 bg-white px-4 text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Unit
                </Button>
              </div>
            ) : null}

            <CardContent className="pt-6">
              <div className="space-y-8">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Detail Unit</div>
                  <div className="mt-0.5 text-sm text-gray-500">Informasi identitas dan spesifikasi unit.</div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Vehicle ID *</label>
                      <div className="relative">
                        <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={unit.vehicle_id}
                          onChange={(e) => setUnitField(idx, 'vehicle_id', e.target.value)}
                          placeholder="Contoh: UNIT-001"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors[`units.${idx}.vehicle_id`] && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors[`units.${idx}.vehicle_id`] && <p className="text-sm text-red-500">{errors[`units.${idx}.vehicle_id`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Plate Number *</label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={unit.plate_number}
                          onChange={(e) => setUnitField(idx, 'plate_number', e.target.value)}
                          placeholder="Contoh: B 1234 ABC"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors[`units.${idx}.plate_number`] && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors[`units.${idx}.plate_number`] && <p className="text-sm text-red-500">{errors[`units.${idx}.plate_number`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Engine *</label>
                      <div className="relative">
                        <Cpu className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={unit.engine}
                          onChange={(e) => setUnitField(idx, 'engine', e.target.value)}
                          placeholder="Contoh: 2.5L Diesel"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors[`units.${idx}.engine`] && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors[`units.${idx}.engine`] && <p className="text-sm text-red-500">{errors[`units.${idx}.engine`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Transmission *</label>
                      <div className="relative">
                        <Settings2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Select value={unit.transmission} onValueChange={(v) => setUnitField(idx, 'transmission', v)}>
                          <SelectTrigger
                            className={cn(
                              'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0',
                              errors[`units.${idx}.transmission`] && 'border-red-500'
                            )}
                          >
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
                      </div>
                      {errors[`units.${idx}.transmission`] && <p className="text-sm text-red-500">{errors[`units.${idx}.transmission`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Capacity *</label>
                      <div className="relative">
                        <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={unit.capacity}
                          onChange={(e) => setUnitField(idx, 'capacity', e.target.value)}
                          placeholder="Contoh: 14"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors[`units.${idx}.capacity`] && 'border-red-500'
                          )}
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                      {errors[`units.${idx}.capacity`] && <p className="text-sm text-red-500">{errors[`units.${idx}.capacity`]}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Production Year *</label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1900}
                          max={new Date().getFullYear() + 1}
                          value={unit.production_year}
                          onChange={(e) => setUnitField(idx, 'production_year', e.target.value)}
                          placeholder="Contoh: 2022"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors[`units.${idx}.production_year`] && 'border-red-500'
                          )}
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                      {errors[`units.${idx}.production_year`] && (
                        <p className="text-sm text-red-500">{errors[`units.${idx}.production_year`]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200/70" />

                <div>
                  <div className="text-sm font-semibold text-gray-900">Status Kepemilikan</div>
                  <div className="mt-0.5 text-sm text-gray-500">Pilih tipe kepemilikan untuk menentukan kebutuhan data tambahan.</div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(
                      [
                        {
                          key: 'Milik Sendiri',
                          icon: BadgeCheck,
                          title: 'Milik Sendiri',
                          desc: 'Unit dimiliki dan dikelola internal.',
                        },
                        {
                          key: 'Kerjasama Operasional',
                          icon: Handshake,
                          title: 'Kerjasama Operasional',
                          desc: 'Unit dikelola bersama mitra perusahaan.',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = unit.ownership_type === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setUnits((prev) =>
                              prev.map((u, i) =>
                                i !== idx
                                  ? u
                                  : {
                                      ...u,
                                      ownership_type: opt.key,
                                      ...(opt.key === 'Milik Sendiri'
                                        ? { owner_name: '', owner_contact: '', owner_email: '' }
                                        : { owner_name: u.owner_name, owner_contact: u.owner_contact, owner_email: u.owner_email }),
                                    }
                              )
                            );
                            setErrors((prev) => ({
                              ...prev,
                              [`units.${idx}.owner_name`]: '',
                              [`units.${idx}.owner_contact`]: '',
                              [`units.${idx}.owner_email`]: '',
                            }));
                          }}
                          className={cn(
                            'group relative flex w-full items-start gap-3 rounded-[22px] border p-4 text-left shadow-sm transition-all',
                            active
                              ? 'border-blue-300/70 bg-blue-50/60 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]'
                              : 'border-gray-200/70 bg-white hover:border-blue-200/70 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.05)]'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-2xl ring-1 transition-colors',
                              active ? 'bg-blue-100 text-blue-700 ring-blue-200/60' : 'bg-gray-50 text-gray-600 ring-gray-200/60'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-900">{opt.title}</div>
                              <span
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                                  active ? 'border-blue-500 bg-blue-600' : 'border-gray-300 bg-white'
                                )}
                              >
                                <span className={cn('h-2 w-2 rounded-full', active ? 'bg-white' : 'bg-transparent')} />
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={cn(
                      'mt-4 overflow-hidden transition-all duration-300 ease-out',
                      unit.ownership_type === 'Kerjasama Operasional'
                        ? 'max-h-[520px] translate-y-0 opacity-100'
                        : 'max-h-0 -translate-y-1 opacity-0 pointer-events-none'
                    )}
                    aria-hidden={unit.ownership_type !== 'Kerjasama Operasional'}
                  >
                    <div className="rounded-[22px] border border-blue-200/60 bg-blue-50/60 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-blue-700 ring-1 ring-blue-200/60">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">Informasi Perusahaan Mitra</div>
                          <div className="mt-0.5 text-sm text-gray-600">Data ini membantu validasi dan administrasi unit kerjasama.</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nama Partner *</label>
                          <Popover
                            open={partnerPickerOpen && partnerPickerUnitIndex === idx}
                            onOpenChange={(open) => {
                              setPartnerPickerOpen(open);
                              setPartnerPickerUnitIndex(open ? idx : null);
                              setPartnerQuery(open ? unit.owner_name : '');
                              if (!open) {
                                setPartnerLoading(false);
                                setPartnerApiOptions([]);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={partnerPickerOpen && partnerPickerUnitIndex === idx}
                                className={cn(
                                  'h-12 w-full justify-between rounded-[18px] border-blue-200/60 bg-white px-4 font-normal text-gray-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                                  !unit.owner_name.trim() && 'text-gray-500',
                                  errors[`units.${idx}.owner_name`] && 'border-red-500'
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Building2 className="h-4 w-4 shrink-0 text-blue-700" />
                                  <span className="truncate">
                                    {unit.owner_name.trim() ? unit.owner_name : 'Ketik min. 3 karakter untuk cari partner'}
                                  </span>
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[--radix-popover-trigger-width] rounded-xl border border-gray-200/70 bg-white p-0 shadow-xl"
                              align="start"
                            >
                              <Command shouldFilter={false} className="rounded-xl">
                                <CommandInput
                                  placeholder="Cari partner..."
                                  value={partnerQuery}
                                  onValueChange={(v) => {
                                    setPartnerQuery(v);
                                    setUnits((prev) =>
                                      prev.map((u, i) =>
                                        i !== idx ? u : { ...u, owner_name: v, partner_choice_id: undefined }
                                      )
                                    );
                                    const errKey = `units.${idx}.owner_name`;
                                    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: '' }));
                                  }}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {partnerQuery.trim().length < 3
                                      ? 'Ketik minimal 3 karakter untuk mencari partner.'
                                      : partnerLoading
                                        ? 'Memuat...'
                                        : 'Tidak ada hasil.'}
                                  </CommandEmpty>
                                  <CommandGroup heading="Partner">
                                    {mergedPartnerOptions.map((o) => (
                                      <CommandItem
                                        key={o.id}
                                        value={`${o.name} ${o.phone} ${o.id}`}
                                        className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                                        onSelect={() => {
                                          setUnits((prev) =>
                                            prev.map((u, i) =>
                                              i !== idx
                                                ? u
                                                : {
                                                    ...u,
                                                    owner_name: o.name,
                                                    owner_contact: o.phone || u.owner_contact,
                                                    partner_choice_id: o.id,
                                                  }
                                            )
                                          );
                                          setPartnerQuery(o.name);
                                          setPartnerPickerOpen(false);
                                          setPartnerPickerUnitIndex(null);
                                          const nameKey = `units.${idx}.owner_name`;
                                          const phoneKey = `units.${idx}.owner_contact`;
                                          if (errors[nameKey] || errors[phoneKey]) {
                                            setErrors((prev) => ({ ...prev, [nameKey]: '', [phoneKey]: '' }));
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            unit.partner_choice_id === o.id ? 'opacity-100' : 'opacity-0'
                                          )}
                                        />
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-gray-900">{o.name}</div>
                                            <div className="truncate text-xs text-gray-500">
                                              {o.source === 'manual' ? 'Custom' : 'Direktori partner'}
                                            </div>
                                          </div>
                                          <div className="flex shrink-0 items-center gap-2">
                                            <span className="rounded-full border border-gray-200/70 bg-white px-2 py-0.5 text-xs text-gray-700">
                                              {o.phone || '-'}
                                            </span>
                                            {o.source === 'manual' ? (
                                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                                                Custom
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {errors[`units.${idx}.owner_name`] && <p className="text-sm text-red-500">{errors[`units.${idx}.owner_name`]}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">No. Telepon *</label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                            <Input
                              value={unit.owner_contact}
                              onChange={(e) => setUnitField(idx, 'owner_contact', e.target.value)}
                              placeholder="Contoh: 0812-3456-7890"
                              className={cn(
                                'h-12 rounded-[18px] border-blue-200/60 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                                errors[`units.${idx}.owner_contact`] && 'border-red-500'
                              )}
                            />
                          </div>
                          {errors[`units.${idx}.owner_contact`] && (
                            <p className="text-sm text-red-500">{errors[`units.${idx}.owner_contact`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 rounded-[18px] border border-blue-200/60 bg-white/60 px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-700" />
                          Data kemitraan diperlukan untuk verifikasi, penagihan, dan audit operasional.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <div className="flex items-center gap-3 rounded-[22px] border border-gray-200/60 bg-white/80 px-3 py-3 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-gray-200/70 bg-transparent px-5 hover:bg-gray-50"
              onClick={() => navigate(`${basePrefix}/fleet-units`)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-white shadow-sm hover:from-blue-700 hover:to-blue-600"
              disabled={saving || !submitReady}
            >
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
        </div>
      </form>
    </div>
  );
};
