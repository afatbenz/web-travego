import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  Save,
  Settings2,
  UserRound,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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

const normalizeOwnershipType = (raw: string) => {
  const key = raw.toLowerCase();
  if (key === '1') return 'Kerjasama Operasional';
  if (key === '0') return 'Milik Sendiri';
  if (key.includes('operasional') || key.includes('kerjasama') || key.includes('partner')) return 'Kerjasama Operasional';
  if (key.includes('milik') || key.includes('own') || key.includes('owned') || key.includes('in-house')) return 'Milik Sendiri';
  return raw || 'Milik Sendiri';
};

const normalizePhone62 = (raw: string): string => {
  const digits = String(raw ?? '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits === '6') return '62';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  if (digits.startsWith('6')) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

const ownershipTypeToNumber = (value: string): 0 | 1 =>
  value === 'Kerjasama Operasional' ? 1 : 0;

type PartnerOption = {
  id: string;
  name: string;
  phone: string;
};

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
      return { id, name, phone };
    })
    .filter((x): x is PartnerOption => x !== null);
};

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
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const partnerReqSeq = useRef(0);

  const [formData, setFormData] = useState({
    unit_id: '',
    fleet_id: '',
    vehicle_id: '',
    plate_number: '',
    engine: '',
    transmission: '',
    capacity: '',
    production_year: '',
    ownership_type: 'Milik Sendiri',
    owner_name: '',
    owner_contact: '',
    owner_email: '',
    partner_choice_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedFleetLabel = useMemo(() => {
    const found = fleetOptions.find((o) => o.id === formData.fleet_id);
    return found?.label ?? '';
  }, [fleetOptions, formData.fleet_id]);

  const submitReady = useMemo(() => {
    const capacity = Number(formData.capacity);
    const year = Number(formData.production_year);
    const needsPartnerInfo = formData.ownership_type === 'Kerjasama Operasional';
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
      year > 0 &&
      (!needsPartnerInfo ||
        (Boolean(formData.owner_name.trim()) && Boolean(formData.owner_contact.trim()) && Boolean(formData.owner_email.trim())))
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
    if (!partnerPickerOpen) return;
    const query = partnerQuery.trim();
    if (query.length < 3) {
      setPartnerLoading(false);
      setPartnerOptions([]);
      return;
    }

    const currentSeq = ++partnerReqSeq.current;
    const run = async () => {
      setPartnerLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const qs = new URLSearchParams();
      qs.set('q', query);
      const res = await api.get<unknown>(`/services/partnership/operations?${qs.toString()}`, token ? { Authorization: token } : undefined);
      if (partnerReqSeq.current !== currentSeq) return;
      if (res.status === 'success') setPartnerOptions(normalizePartnershipOptions(res.data));
      else setPartnerOptions([]);
      setPartnerLoading(false);
    };

    const t = window.setTimeout(() => void run(), 250);
    return () => window.clearTimeout(t);
  }, [partnerPickerOpen, partnerQuery]);

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
        const ownership_type = normalizeOwnershipType(getString(obj.ownership_type ?? obj.ownershipType ?? obj.owner_type ?? obj.ownerType));
        const owner_name = getString(obj.owner_name ?? obj.ownerName ?? obj.owner ?? obj.pic_name ?? obj.picName);
        const owner_contact = getString(obj.owner_contact ?? obj.ownerContact ?? obj.phone ?? obj.contact ?? obj.pic_phone ?? obj.picPhone);
        const owner_email = getString(obj.owner_email ?? obj.ownerEmail ?? obj.email ?? obj.pic_email ?? obj.picEmail);
        const partner_choice_id = getString(obj.partner_id ?? obj.partnerId);

        setFormData({
          unit_id,
          fleet_id,
          vehicle_id,
          plate_number,
          engine,
          transmission,
          capacity,
          production_year,
          ownership_type,
          owner_name,
          owner_contact,
          owner_email,
          partner_choice_id,
        });
      }
      setLoadingDetail(false);
    };

    loadDetail();
  }, [unitIdParam]);

  const setField = (key: keyof typeof formData, value: string) => {
    const nextValue = key === 'owner_contact' ? normalizePhone62(value) : value;
    setFormData((prev) => ({ ...prev, [key]: nextValue }));
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
    if (formData.ownership_type === 'Kerjasama Operasional') {
      if (!formData.owner_name.trim()) next.owner_name = 'Nama perusahaan wajib diisi';
      if (!formData.owner_contact.trim()) next.owner_contact = 'Kontak perusahaan wajib diisi';
      if (!formData.owner_email.trim()) next.owner_email = 'Owner perusahaan wajib diisi';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    const token = localStorage.getItem('token') ?? '';
    const needsPartnerInfo = formData.ownership_type === 'Kerjasama Operasional';
    const choiceId = String(formData.partner_choice_id ?? '').trim();
    const isApiPartner = Boolean(choiceId) && !choiceId.startsWith('manual:');
    const payload = {
      unit_id: formData.unit_id,
      fleet_id: formData.fleet_id,
      vehicle_id: formData.vehicle_id.trim(),
      plate_number: formData.plate_number.trim(),
      engine: formData.engine.trim(),
      capacity: Number(formData.capacity),
      production_year: Number(formData.production_year),
      transmission: formData.transmission.trim(),
      ownership_type: ownershipTypeToNumber(formData.ownership_type),
      owner_name: needsPartnerInfo ? formData.owner_name.trim() : '',
      owner_contact: needsPartnerInfo ? formData.owner_contact.trim() : '',
      owner_email: needsPartnerInfo ? formData.owner_email.trim() : '',
      ...(needsPartnerInfo ? (isApiPartner ? { partner_id: choiceId } : { partner_name: formData.owner_name.trim(), partner_phone: formData.owner_contact.trim() }) : {}),
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
        <Card className="rounded-[28px] border border-gray-200/70 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-0">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl font-semibold text-gray-900">Informasi Unit Armada</CardTitle>
                <p className="mt-1 text-sm text-gray-600">Lengkapi detail unit armada beserta status kepemilikannya.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingDetail ? (
              <div className="animate-pulse space-y-8">
                <div className="space-y-3">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-64 rounded bg-gray-200" />
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`s-f-${i}`} className="h-12 rounded-[18px] bg-gray-200" />
                    ))}
                    <div className="h-12 rounded-[18px] bg-gray-200 md:col-span-2" />
                  </div>
                </div>
                <div className="h-px w-full bg-gray-200/70" />
                <div className="space-y-3">
                  <div className="h-4 w-44 rounded bg-gray-200" />
                  <div className="h-3 w-72 rounded bg-gray-200" />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="h-16 rounded-[22px] bg-gray-200" />
                    <div className="h-16 rounded-[22px] bg-gray-200" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Detail Unit</div>
                      <div className="mt-0.5 text-sm text-gray-500">Informasi identitas dan spesifikasi unit.</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Jenis Armada *</label>
                      <Popover open={fleetPickerOpen} onOpenChange={setFleetPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={fleetPickerOpen}
                            className={cn(
                              'h-12 w-full justify-between rounded-[18px] border-gray-200/70 bg-white px-4 font-normal text-gray-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                              !formData.fleet_id && 'text-gray-500',
                              errors.fleet_id && 'border-red-500'
                            )}
                            disabled={loadingFleetOptions}
                          >
                            <span className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-blue-700" />
                              <span className="truncate">
                                {loadingFleetOptions ? 'Memuat...' : selectedFleetLabel || 'Pilih jenis armada'}
                              </span>
                            </span>
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
                      <label className="text-sm font-medium text-gray-700">Vehicle ID *</label>
                      <div className="relative">
                        <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={formData.vehicle_id}
                          onChange={(e) => setField('vehicle_id', e.target.value)}
                          placeholder="Contoh: UNIT-001"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors.vehicle_id && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors.vehicle_id && <p className="text-sm text-red-500">{errors.vehicle_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Plate Number *</label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={formData.plate_number}
                          onChange={(e) => setField('plate_number', e.target.value)}
                          placeholder="Contoh: B 1234 ABC"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors.plate_number && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors.plate_number && <p className="text-sm text-red-500">{errors.plate_number}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Engine *</label>
                      <div className="relative">
                        <Cpu className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          value={formData.engine}
                          onChange={(e) => setField('engine', e.target.value)}
                          placeholder="Contoh: 2.5L Diesel"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors.engine && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors.engine && <p className="text-sm text-red-500">{errors.engine}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Transmission *</label>
                      <div className="relative">
                        <Settings2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Select value={formData.transmission} onValueChange={(v) => setField('transmission', v)}>
                          <SelectTrigger
                            className={cn(
                              'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0',
                              errors.transmission && 'border-red-500'
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
                      {errors.transmission && <p className="text-sm text-red-500">{errors.transmission}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Capacity *</label>
                      <div className="relative">
                        <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={formData.capacity}
                          onChange={(e) => setField('capacity', e.target.value)}
                          placeholder="Contoh: 14"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors.capacity && 'border-red-500'
                          )}
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                      {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
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
                          value={formData.production_year}
                          onChange={(e) => setField('production_year', e.target.value)}
                          placeholder="Contoh: 2022"
                          className={cn(
                            'h-12 rounded-[18px] border-gray-200/70 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                            errors.production_year && 'border-red-500'
                          )}
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                      {errors.production_year && <p className="text-sm text-red-500">{errors.production_year}</p>}
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
                      const active = formData.ownership_type === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              ownership_type: opt.key,
                              ...(opt.key === 'Milik Sendiri'
                                ? { owner_name: '', owner_contact: '', owner_email: '' }
                                : { owner_name: prev.owner_name, owner_contact: prev.owner_contact, owner_email: prev.owner_email }),
                            }));
                            setErrors((prev) => ({
                              ...prev,
                              owner_name: '',
                              owner_contact: '',
                              owner_email: '',
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
                      formData.ownership_type === 'Kerjasama Operasional'
                        ? 'max-h-[520px] translate-y-0 opacity-100'
                        : 'max-h-0 -translate-y-1 opacity-0 pointer-events-none'
                    )}
                    aria-hidden={formData.ownership_type !== 'Kerjasama Operasional'}
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
                          <label className="text-sm font-medium text-gray-700">Nama Perusahaan *</label>
                          <Popover
                            open={partnerPickerOpen}
                            onOpenChange={(open) => {
                              setPartnerPickerOpen(open);
                              setPartnerQuery(open ? formData.owner_name : '');
                              if (!open) {
                                setPartnerLoading(false);
                                setPartnerOptions([]);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={partnerPickerOpen}
                                className={cn(
                                  'h-12 w-full justify-between rounded-[18px] border-blue-200/60 bg-white px-4 font-normal text-gray-900 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                                  !formData.owner_name.trim() && 'text-gray-500',
                                  errors.owner_name && 'border-red-500'
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Building2 className="h-4 w-4 shrink-0 text-blue-700" />
                                  <span className="truncate">
                                    {formData.owner_name.trim() ? formData.owner_name : 'Ketik min. 3 karakter untuk cari partner'}
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
                                    setFormData((prev) => ({ ...prev, owner_name: v, partner_choice_id: '' }));
                                    if (errors.owner_name) setErrors((prev) => ({ ...prev, owner_name: '' }));
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
                                  {partnerQuery.trim() ? (
                                    <CommandGroup heading="Teks">
                                      <CommandItem
                                        value={`__custom__:${partnerQuery.trim()}`}
                                        className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                                        onSelect={() => {
                                          const v = partnerQuery.trim();
                                          setFormData((prev) => ({ ...prev, owner_name: v, partner_choice_id: '' }));
                                          setPartnerPickerOpen(false);
                                          if (errors.owner_name) setErrors((prev) => ({ ...prev, owner_name: '' }));
                                        }}
                                      >
                                        Gunakan: {partnerQuery.trim()}
                                      </CommandItem>
                                    </CommandGroup>
                                  ) : null}
                                  <CommandGroup heading="Partner">
                                    {partnerOptions.map((o) => (
                                      <CommandItem
                                        key={o.id}
                                        value={`${o.name} ${o.phone} ${o.id}`}
                                        className="rounded-lg px-3 py-2.5 data-[selected=true]:bg-blue-50 data-[selected=true]:text-gray-900"
                                        onSelect={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            owner_name: o.name,
                                            owner_contact: normalizePhone62(o.phone || prev.owner_contact),
                                            partner_choice_id: o.id,
                                          }));
                                          setPartnerQuery(o.name);
                                          setPartnerPickerOpen(false);
                                          if (errors.owner_name || errors.owner_contact) {
                                            setErrors((prev) => ({ ...prev, owner_name: '', owner_contact: '' }));
                                          }
                                        }}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', formData.partner_choice_id === o.id ? 'opacity-100' : 'opacity-0')} />
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-gray-900">{o.name}</div>
                                            <div className="truncate text-xs text-gray-500">Direktori partner</div>
                                          </div>
                                          <div className="flex shrink-0 items-center gap-2">
                                            <span className="rounded-full border border-gray-200/70 bg-white px-2 py-0.5 text-xs text-gray-700">
                                              {o.phone || '-'}
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {errors.owner_name && <p className="text-sm text-red-500">{errors.owner_name}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Kontak Perusahaan *</label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                            <Input
                              value={formData.owner_contact}
                              onChange={(e) => setField('owner_contact', e.target.value)}
                              placeholder="Contoh: 62xxxxxxxxxxx"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={cn(
                                'h-12 rounded-[18px] border-blue-200/60 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                                errors.owner_contact && 'border-red-500'
                              )}
                            />
                          </div>
                          {errors.owner_contact && <p className="text-sm text-red-500">{errors.owner_contact}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">Owner Perusahaan *</label>
                          <div className="relative">
                            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700" />
                            <Input
                              value={formData.owner_email}
                              onChange={(e) => setField('owner_email', e.target.value)}
                              placeholder="Contoh: Budi Santoso"
                              className={cn(
                                'h-12 rounded-[18px] border-blue-200/60 bg-white pl-10 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0',
                                errors.owner_email && 'border-red-500'
                              )}
                            />
                          </div>
                          {errors.owner_email && <p className="text-sm text-red-500">{errors.owner_email}</p>}
                        </div>
                      </div>

                      <div className="mt-4 rounded-[18px] border border-blue-200/60 bg-white/60 px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-blue-700" />
                          Data kemitraan diperlukan untuk verifikasi, penagihan, dan audit operasional.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              disabled={saving || loadingDetail || !submitReady}
            >
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
        </div>
      </form>
    </div>
  );
};
