import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronsUpDown, Building2, Bus, Calendar, Loader2, MapPin, Navigation, Pencil, Plus, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DialogClose, DialogContentScrollable, DialogScrollableBody, DialogStickyFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
 
type ServiceTypeId = 1 | 2 | 3;
 
type CityOption = { id: string; label: string; raw?: Record<string, unknown> };

type PreferenceCityRow = {
  preference_id: string;
  province_id: string;
  province_label: string;
  city_id: string;
  city_label: string;
  minimal_day: number;
  service_type: ServiceTypeId[];
  raw: Record<string, unknown>;
};
 
type PreferenceDetail = {
  preference_id: string;
  province_id: string;
  province_label: string;
  city_id: string;
  city_label: string;
  minimal_day: number;
  service_type: ServiceTypeId[];
};

type TripCardId = 'overland' | 'citytour' | 'droponly';
 
const SERVICE_TYPE_LABEL: Record<ServiceTypeId, string> = {
  1: 'Citytour',
  2: 'Overland',
  3: 'Drop Only',
};

const serviceTypeBadgeTone = (t: ServiceTypeId) => {
  if (t === 1) return 'bg-blue-400 text-white dark:bg-blue-900/20 dark:text-blue-300';
  if (t === 2) return 'bg-amber-500 text-white dark:bg-amber-900/20 dark:text-amber-300';
  if (t === 3) return 'bg-slate-600 text-white dark:bg-slate-900/20 dark:text-slate-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
};
 
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
 
function toIdString(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return String(v ?? '').trim();
}
 
function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
 
function normalizeServiceTypeIds(raw: unknown): ServiceTypeId[] {
  const out: ServiceTypeId[] = [];
  const push = (id: number) => {
    if ((id === 1 || id === 2 || id === 3) && !out.includes(id as ServiceTypeId)) out.push(id as ServiceTypeId);
  };
  const fromKey = (s: string): ServiceTypeId | null => {
    const key = s.trim().toLowerCase();
    if (!key) return null;
    if (key === 'city_tour' || key === 'citytour' || key === 'city_tourism' || key === 'city-tour') return 1;
    if (key === 'overland' || key === 'luar_kota' || key === 'luar kota' || key === 'overland / luar kota') return 2;
    if (key === 'drop_only' || key === 'drop only' || key === 'drop' || key === 'pickup_drop' || key === 'pickup / drop only') return 3;
    const n = Number(key);
    if (Number.isFinite(n)) return (n === 1 || n === 2 || n === 3) ? (n as ServiceTypeId) : null;
    return null;
  };

  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v === 'number') push(v);
      else {
        const mapped = fromKey(String(v ?? ''));
        if (mapped) push(mapped);
      }
    }
    return out;
  }
  if (typeof raw === 'string') {
    raw
      .split(',')
      .map((x) => fromKey(x))
      .filter(Boolean)
      .forEach((x) => push(x as number));
    return out;
  }
  return out;
}

const AddPreferenceCitiesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { selectedTrips: string[]; selectedCities: CityOption[]; minDays: number; service_type: ServiceTypeId[] }) => void | Promise<void>;
  cityOptions: CityOption[];
}> = ({ isOpen, onClose, onSubmit, cityOptions }) => {
  const [selectedTrips, setSelectedTrips] = useState<TripCardId[]>([]);
  const [selectedCities, setSelectedCities] = useState<CityOption[]>([]);
  const [minDays, setMinDays] = useState(1);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityLoading, setCityLoading] = useState(false);
  const [localOptions, setLocalOptions] = useState<CityOption[]>(cityOptions);
  const [saving, setSaving] = useState(false);
  const [loadedAllCities, setLoadedAllCities] = useState(false);

  useEffect(() => {
    setLocalOptions(cityOptions);
  }, [cityOptions]);

  useEffect(() => {
    if (!isOpen) return;
    if (!cityOpen) return;
    if (loadedAllCities) return;
    let active = true;
    const run = async () => {
      setCityLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.get<unknown>('/general/cities', headers);
        if (!active) return;
        const payload = res.data as unknown;
        let items: unknown[] = [];
        if (Array.isArray(payload)) items = payload;
        else if (payload && typeof payload === 'object') {
          const root = payload as Record<string, unknown>;
          const list = root.items ?? root.data ?? root.list ?? root.rows ?? root.result;
          if (Array.isArray(list)) items = list;
        }
        const mapped = items
          .map((it) => (it && typeof it === 'object' && !Array.isArray(it) ? (it as Record<string, unknown>) : null))
          .filter(Boolean)
          .map((it) => {
            const idRaw = it?.id ?? it?.city_id ?? it?.cityId ?? it?.value ?? it?.key;
            const labelRaw = it?.label ?? it?.city_label ?? it?.cityLabel ?? it?.city_name ?? it?.name ?? it?.title;
            const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
            const label = typeof labelRaw === 'string' ? labelRaw : id;
            return id && label ? ({ id, label, raw: it ?? undefined } satisfies CityOption) : null;
          })
          .filter(Boolean) as CityOption[];
        setLocalOptions(mapped);
        setLoadedAllCities(true);
      } catch {
        setLocalOptions([]);
      } finally {
        if (active) setCityLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [cityOpen, isOpen, loadedAllCities]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTrips([]);
    setSelectedCities([]);
    setMinDays(1);
    setCityQuery('');
    setCityOpen(false);
    setLoadedAllCities(false);
  }, [isOpen]);

  const tripCards = [
    { id: 'overland', icon: Bus, label: 'Overland', desc: 'Perjalanan luar kota', serviceTypeId: 2 as const },
    { id: 'citytour', icon: Building2, label: 'Citytour', desc: 'Tour dalam kota', serviceTypeId: 1 as const },
    { id: 'droponly', icon: Navigation, label: 'Drop Only', desc: 'Antar tanpa menunggu', serviceTypeId: 3 as const },
  ] as const;

  const selectedTripCount = selectedTrips.length;

  const mappedServiceType = useMemo(() => {
    const map = new Map(tripCards.map((t) => [t.id, t.serviceTypeId] as const));
    const list = selectedTrips.map((t) => map.get(t)).filter(Boolean) as ServiceTypeId[];
    return Array.from(new Set(list));
  }, [selectedTrips]);

  const onToggleTrip = (id: TripCardId) => {
    setSelectedTrips((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleCity = (opt: CityOption) => {
    setSelectedCities((prev) => {
      const exists = prev.some((x) => x.id === opt.id);
      if (exists) return prev.filter((x) => x.id !== opt.id);
      return [...prev, opt];
    });
    setCityQuery('');
  };

  const removeCity = (id: string) => {
    setSelectedCities((prev) => prev.filter((x) => x.id !== id));
  };

  const validate = (): string | null => {
    if (mappedServiceType.length < 1) return 'Pilih minimal 1 jenis trip.';
    if (selectedCities.length < 1) return 'Pilih minimal 1 kota.';
    if (!Number.isFinite(minDays) || minDays < 1) return 'Minimal hari booking minimal 1.';
    return null;
  };

  const handleSubmit = async () => {
    if (saving) return;
    const err = validate();
    if (err) {
      toast({ title: 'Validasi gagal', description: err, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ selectedTrips, selectedCities, minDays: Math.max(1, Math.trunc(minDays)), service_type: mappedServiceType });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (saving) return;
        if (!open) onClose();
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <DialogContentScrollable className="max-w-3xl border-none bg-white p-0 dark:bg-gray-900">
                <div className="px-6 sm:px-8 pt-6 sm:pt-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-md sm:text-2xl font-bold text-slate-900 dark:text-white">Tambah Preferensi Kota</div>
                        <div className="text-xs sm:text-lg text-slate-500 dark:text-slate-300 mt-1">
                          Tambahkan preferensi kota tujuan wisata beserta minimal hari booking dan jenis trip
                        </div>
                      </div>
                    </div>
                    <DialogClose asChild>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                        disabled={saving}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </DialogClose>
                  </div>
                  <div className="mt-6 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <DialogScrollableBody className="px-6 sm:px-8 py-6 space-y-6">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">JENIS TRIP</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {tripCards.map((t) => {
                        const selected = selectedTrips.includes(t.id);
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => onToggleTrip(t.id)}
                            className={cn(
                              'relative text-left rounded-xl border p-4 transition-colors',
                              selected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900'
                            )}
                          >
                            {selected ? (
                              <div className="absolute left-3 top-3 h-6 w-6 rounded-full bg-indigo-600 text-white grid place-items-center">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : null}
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'h-10 w-10 rounded-xl grid place-items-center',
                                  selected ? 'bg-white/70 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white">{t.label}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-300">{t.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-2">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">PILIH KOTA</div>
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">MIN. HARI BOOKING</div>
                      </div>

                      <div className="md:col-span-3 space-y-3">
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              className="w-full h-12 justify-between rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 font-normal"
                              disabled={saving}
                            >
                              <span
                                className={cn(
                                  'truncate text-left',
                                  selectedCities.length ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                )}
                              >
                                {selectedCities.length ? `${selectedCities.length} kota dipilih` : 'Pilih satu atau lebih kota tujuan'}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 dark:border-slate-700 shadow-xl"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Cari kota..." value={cityQuery} onValueChange={setCityQuery} />
                              <CommandList>
                                {cityLoading ? (
                                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memuat...
                                  </div>
                                ) : null}
                                <CommandEmpty>Tidak ada data</CommandEmpty>
                                <CommandGroup>
                                  {localOptions.map((opt) => {
                                    const selected = selectedCities.some((c) => c.id === opt.id);
                                    return (
                                      <CommandItem
                                        key={opt.id}
                                        value={`${opt.id} ${opt.label}`}
                                        onSelect={() => toggleCity(opt)}
                                        className="rounded-lg"
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                        <span className="truncate">{opt.label}</span>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedCities.length ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedCities.map((c) => (
                              <Badge key={c.id} variant="secondary" className="rounded-full gap-2 pr-1">
                                <span className="truncate max-w-[16rem]">{c.label}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCity(c.id)}
                                  className="h-6 w-6 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10"
                                  disabled={saving}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="md:col-span-1">
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={minDays}
                            onChange={(e) => setMinDays(Math.max(1, Number(e.target.value || 1)))}
                            className="h-12 rounded-xl pl-11 pr-16"
                            disabled={saving}
                          />
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                            hari
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">RINGKASAN</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Kota dipilih</div>
                        <div className="font-medium text-slate-900 dark:text-white">{selectedCities.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Jenis trip</div>
                        <div className="font-medium text-slate-900 dark:text-white">{selectedTripCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Minimal hari</div>
                        <div className="font-medium text-slate-900 dark:text-white">{minDays}</div>
                      </div>
                    </div>
                  </div>
                </DialogScrollableBody>

                <DialogStickyFooter className="flex justify-end gap-2 border-t border-slate-100 px-6 pb-6 pt-4 dark:border-slate-800 sm:px-8">
                  <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Preferensi'
                    )}
                  </Button>
                </DialogStickyFooter>
              </DialogContentScrollable>
            </motion.div>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

const DetailPreferenceCityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  detail: PreferenceDetail | null;
  onSave: (payload: { city_id: number; preference_id: string; minimal_day: number; service_types: ServiceTypeId[] }) => void | Promise<void>;
}> = ({ isOpen, onClose, loading, detail, onSave }) => {
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<ServiceTypeId[]>([]);
  const [minDays, setMinDays] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const ids = detail?.service_type ?? [];
    setSelectedServiceTypes(Array.from(new Set(ids)).filter((x): x is ServiceTypeId => x === 1 || x === 2 || x === 3));
    setMinDays(Math.max(1, Math.trunc(Number(detail?.minimal_day ?? 1))));
  }, [detail, isOpen]);

  const toggleType = (id: ServiceTypeId) => {
    setSelectedServiceTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const validate = (): string | null => {
    if (!detail?.preference_id) return 'Preference ID tidak ditemukan.';
    if (!detail?.city_id) return 'City ID tidak ditemukan.';
    if (selectedServiceTypes.length < 1) return 'Pilih minimal 1 jenis service.';
    if (!Number.isFinite(minDays) || minDays < 1) return 'Minimal hari booking minimal 1.';
    return null;
  };

  const handleSave = async () => {
    if (saving) return;
    const err = validate();
    if (err) {
      toast({ title: 'Validasi gagal', description: err, variant: 'destructive' });
      return;
    }
    const city_id = toInt(detail?.city_id, 0);
    if (!city_id) {
      toast({ title: 'Validasi gagal', description: 'City ID tidak valid.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onSave({
        city_id,
        preference_id: detail?.preference_id ?? '',
        minimal_day: Math.max(1, Math.trunc(minDays)),
        service_types: Array.from(new Set(selectedServiceTypes)).filter((x): x is ServiceTypeId => x === 1 || x === 2 || x === 3),
      });
      onClose();
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    { id: 2 as const, icon: Bus, label: 'Overland', desc: 'Perjalanan luar kota' },
    { id: 1 as const, icon: Building2, label: 'Citytour', desc: 'Tour dalam kota' },
    { id: 3 as const, icon: Navigation, label: 'Drop Only', desc: 'Antar tanpa menunggu' },
  ] as const;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (saving) return;
        if (!open) onClose();
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <DialogContentScrollable className="max-w-3xl border-none bg-white p-0 dark:bg-gray-900">
                <div className="px-6 sm:px-8 pt-6 sm:pt-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">Detail Preferensi Kota</div>
                        <div className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                          Lihat dan perbarui preferensi kota tujuan wisata
                        </div>
                      </div>
                    </div>
                    <DialogClose asChild>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                        disabled={saving}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </DialogClose>
                  </div>
                  <div className="mt-6 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <DialogScrollableBody className="px-6 sm:px-8 py-6 space-y-6">
                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat detail...
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">JENIS SERVICE</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {cards.map((t) => {
                        const selected = selectedServiceTypes.includes(t.id);
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleType(t.id)}
                            className={cn(
                              'relative text-left rounded-xl border p-4 transition-colors',
                              selected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900'
                            )}
                            disabled={saving || loading}
                          >
                            {selected ? (
                              <div className="absolute left-3 top-3 h-6 w-6 rounded-full bg-indigo-600 text-white grid place-items-center">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : null}
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'h-10 w-10 rounded-xl grid place-items-center',
                                  selected
                                    ? 'bg-white/70 text-indigo-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white">{t.label}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-300">{t.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-2">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">NAMA KOTA</div>
                        <Input className="h-12 rounded-xl" value={detail?.city_label ?? ''} disabled />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">MINIMAL HARI</div>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={minDays}
                            onChange={(e) => setMinDays(Math.max(1, Number(e.target.value || 1)))}
                            className="h-12 rounded-xl pl-11 pr-16"
                            disabled={saving || loading}
                          />
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                            hari
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogScrollableBody>

                <DialogStickyFooter className="flex justify-end gap-2 border-t border-slate-100 px-6 pb-6 pt-4 dark:border-slate-800 sm:px-8">
                  <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={saving || loading}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </DialogStickyFooter>
              </DialogContentScrollable>
            </motion.div>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};
 
export const PartnerPreferencesCities: React.FC = () => {
  const [rows, setRows] = useState<PreferenceCityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
 
  const [addOpen, setAddOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PreferenceDetail | null>(null);
 
  const startIndex = (Math.max(1, page) - 1) * Math.max(1, pageSize);
 
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const city = r.city_label.toLowerCase();
      const province = r.province_label.toLowerCase();
      return city.includes(q) || province.includes(q);
    });
  }, [rows, searchTerm]);
 
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);
 
  const fetchRows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const res = await api.get<unknown>('/services/preferences/cities', headers);
      const payload = res.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(record(payload).data) ? (record(payload).data as unknown[]) : [];
      const mapped: PreferenceCityRow[] = items.map((x) => {
        const item = record(x);
 
        const preference_id = toIdString(item.preference_id ?? item.preferenceId ?? item.id);
        const city_id = toIdString(item.city_id ?? item.cityId);
        const province_id = toIdString(item.province_id ?? item.provinceId);
        const city_label = String(item.city_label ?? item.cityLabel ?? '').trim();
        const province_label = String(item.province_label ?? item.provinceLabel ?? '').trim();
        const minimal_day = toInt(item.minimal_day ?? item.minimalDay ?? 0, 0);
        const service_type = normalizeServiceTypeIds(item.service_types ?? item.serviceTypes);
 
        return {
          preference_id,
          province_id,
          province_label,
          city_id,
          city_label,
          minimal_day,
          service_type,
          raw: item,
        };
      });
 
      setRows(mapped);
    } catch {
      toast({ title: 'Gagal memuat data', description: 'Terjadi kesalahan saat mengambil preferensi kota.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    void fetchRows();
  }, []);
 
  const fetchDetail = async (cityId: string) => {
    const cid = cityId.trim();
    if (!cid) return;
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const endpoint = `/services/preferences/cities?city_id=${encodeURIComponent(cid)}`;
      const res = await api.get<unknown>(endpoint, headers);
      const root = record(res.data);
      const list = Array.isArray(root.data) ? (root.data as unknown[]) : Array.isArray(res.data) ? (res.data as unknown[]) : [];
      const data = record(list[0]);
 
      const next: PreferenceDetail = {
        preference_id: toIdString(data.preference_id ?? data.preferenceId ?? data.id),
        province_id: toIdString(data.province_id ?? data.provinceId),
        province_label: String(data.province_label ?? data.provinceLabel ?? '').trim(),
        city_id: toIdString(data.city_id ?? data.cityId),
        city_label: String(data.city_label ?? data.cityLabel ?? '').trim(),
        minimal_day: toInt(data.minimal_day ?? data.minimalDay ?? 0, 0),
        service_type: normalizeServiceTypeIds(data.service_type_ids ?? data.serviceTypeIds ?? data.service_types ?? data.serviceTypes),
      };
 
      setDetail(next);
    } catch {
      toast({ title: 'Gagal memuat detail', description: 'Tidak dapat mengambil detail preferensi.', variant: 'destructive' });
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };
 
  const openAdd = () => {
    setAddOpen(true);
  };
 
  const openDetail = async (row: PreferenceCityRow) => {
    setDetail(null);
    setModalOpen(true);
    await fetchDetail(row.city_id);
  };
 
  const handleAddSubmit = async (data: {
    selectedTrips: string[];
    selectedCities: CityOption[];
    minDays: number;
    service_type: ServiceTypeId[];
  }) => {
    const cityIds = data.selectedCities
      .map((c) => toInt(c.id, 0))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (cityIds.length < 1) {
      toast({ title: 'Validasi gagal', description: 'Pilih minimal 1 kota.', variant: 'destructive' });
      return;
    }
    const service_type = Array.from(new Set(data.service_type)).filter((x): x is ServiceTypeId => x === 1 || x === 2 || x === 3);
    if (service_type.length < 1) {
      toast({ title: 'Validasi gagal', description: 'Pilih minimal 1 jenis trip.', variant: 'destructive' });
      return;
    }
 
    const minimal_day = Math.max(1, Math.trunc(Number(data.minDays || 1)));
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
 
    const provinceIds = data.selectedCities
      .map((c) => toInt((c.raw as Record<string, unknown> | undefined)?.province_id ?? (c.raw as Record<string, unknown> | undefined)?.provinceId ?? 0, 0))
      .filter((x) => Number.isFinite(x) && x > 0);
    const provinceIdUnique = Array.from(new Set(provinceIds));
    if (provinceIdUnique.length !== 1) {
      toast({
        title: 'Validasi gagal',
        description: 'Semua kota yang dipilih harus berada pada provinsi yang sama.',
        variant: 'destructive',
      });
      return;
    }
    const province_id = provinceIdUnique[0] ?? 0;
    if (!province_id) {
      toast({ title: 'Validasi gagal', description: 'Province ID tidak ditemukan dari data kota.', variant: 'destructive' });
      return;
    }
 
    const payload = { city_id: cityIds, province_id, minimal_day, service_type };
    const res = await api.post<unknown>('/services/preferences/cities/create', payload, headers);
    if (res.status !== 'success') {
      toast({ title: 'Gagal', description: res.message ?? 'Tidak dapat menyimpan preferensi.', variant: 'destructive' });
      return;
    }
 
    toast({ title: 'Berhasil', description: 'Preferensi kota berhasil ditambahkan.' });
    setAddOpen(false);
    await fetchRows();
  };
 
 
  const handleDetailSave = async (payload: { city_id: number; preference_id: string; minimal_day: number; service_types: ServiceTypeId[] }) => {
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/preferences/cities/update', payload, headers);
    if (res.status !== 'success') {
      toast({ title: 'Gagal', description: res.message ?? 'Tidak dapat memperbarui preferensi.', variant: 'destructive' });
      throw new Error('update_failed');
    }
    toast({ title: 'Berhasil', description: 'Preferensi kota berhasil diperbarui.' });
    setModalOpen(false);
    setDetail(null);
    await fetchRows();
  };
 
  const columns: Array<DataTableColumn<PreferenceCityRow>> = [
    {
      label: 'NO',
      key: '__no__',
      width: 64,
      align: 'center',
      sortable: false,
      render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{startIndex + rowIndex + 1}</span>,
    },
    {
      label: 'KOTA TUJUAN',
      key: 'city_label',
      sortable: true,
      width: 260,
      render: (r) => <span className="font-medium text-foreground whitespace-nowrap">{r.city_label || '-'}</span>,
    },
    {
      label: 'PROVINSI',
      key: 'province_label',
      sortable: false,
      width: 220,
      render: (r) => <span className="text-foreground/80 whitespace-nowrap">{r.province_label || '-'}</span>,
    },
    {
      label: 'MINIMAL HARI',
      key: 'minimal_day',
      sortable: true,
      width: 190,
      align: 'center',
      render: (r) => <span className="tabular-nums">{r.minimal_day || 0} Hari</span>,
    },
    {
      label: 'JENIS LAYANAN',
      key: 'service_type',
      sortable: false,
      width: 260,
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {r.service_type.length > 0 ? (
            r.service_type.map((t) => (
              <Badge key={t} className={cn('rounded-full border-transparent ', serviceTypeBadgeTone(t))}>
                {SERVICE_TYPE_LABEL[t] ?? `Type ${t}`}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">-</Badge>
          )}
        </div>
      ),
    },
    {
      label: 'ACTIONS',
      key: '__actions__',
      sortable: false,
      width: 120,
      align: 'right',
      render: (r) => (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetail(r)}>
            <Pencil className="h-4 w-4" />
            Detail
          </Button>
        </div>
      ),
    },
  ];
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Preferensi Tujuan Wisata</h1>
          <p className="text-xs sm:text-lg text-gray-600 dark:text-gray-300 mt-1">
            Kelola daftar kota tujuan wisata beserta minimal hari booking dan jenis trip
          </p>
        </div>
        <Button
          className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-white shadow-lg shadow-blue-500/25 transition-all"
          onClick={() => void openAdd()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Preferensi
        </Button>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari kota / provinsi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
 
      <DataTable
        data={filteredRows}
        columns={columns}
        loading={loading}
        stickyHeader
        zebra
        tableClassName="table-auto w-full min-w-[1120px]"
        emptyTitle="Tidak ada data"
        emptyDescription="Coba ubah kata kunci pencarian."
        pagination={{
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (n) => {
            setPageSize(n);
            setPage(1);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        sorting={{ initialSort: { key: 'city_label', direction: 'asc' } }}
        rowKey={(r) => r.preference_id || `${r.province_id}-${r.city_id}`}
      />
 
      <AddPreferenceCitiesModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
        cityOptions={[]}
      />

      <DetailPreferenceCityModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setDetail(null);
        }}
        loading={detailLoading}
        detail={detail}
        onSave={handleDetailSave}
      />
    </div>
  );
};
