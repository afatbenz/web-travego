import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, Save, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import type { OrganizationLocation } from '@/types/location';
import { OrganizationLocationMap } from './OrganizationLocationMap';

const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM = 5;
const MARKER_ZOOM = 15;

const INPUT_CLS =
  'h-14 rounded-2xl border-slate-200 bg-slate-50 pl-11 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50';
const COMBO_CLS =
  'h-14 w-full justify-between rounded-2xl border-slate-200 bg-slate-50 font-normal transition-all duration-300 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50';

function parseCoord(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'id',
      'User-Agent': 'TraveGo-OrganizationSettings/1.0',
    },
  });
  if (!res.ok) throw new Error('Gagal mengambil alamat dari peta');
  const data = (await res.json()) as { display_name?: string };
  return data.display_name?.trim() || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

interface OrganizationPinLocationTabProps {
  province: string;
  city: string;
  postalCode: string;
  onProvinceSelect: (name: string, id: string) => void;
  onCitySelect: (name: string, id: string) => void;
  onPostalCodeChange: (val: string) => void;
  provinces: { id: string; name: string }[];
  cities: { id: string; name: string; province_id?: string }[];
  selectedProvinceId: string | null;
  selectedCityId: string | null;
  onAddressChange?: (val: string) => void;
}

export const OrganizationPinLocationTab: React.FC<OrganizationPinLocationTabProps> = ({
  province,
  city,
  postalCode,
  onProvinceSelect,
  onCitySelect,
  onPostalCodeChange,
  provinces,
  cities,
  selectedProvinceId,
  selectedCityId,
  onAddressChange,
}) => {
  const [locationLoading, setLocationLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [marker, setMarker] = useState<[number, number] | null>(null);
  const [pickupLabel, setPickupLabel] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const mapCenter = useMemo<[number, number]>(() => marker ?? DEFAULT_CENTER, [marker]);
  const mapZoom = marker ? MARKER_ZOOM : DEFAULT_ZOOM;

  const loadLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    const token = localStorage.getItem('token') ?? '';
    try {
      const res = await api.get<Record<string, unknown>>('/organization/detail', { Authorization: token });
      if (res.status === 'success' && res.data && typeof res.data === 'object') {
        const d = res.data as Record<string, unknown>;
        const lat = parseCoord(d['organization_lat']);
        const lng = parseCoord(d['organization_lng']);
        if (lat !== null && lng !== null) {
          setMarker([lat, lng]);
          const addr = String(d['address'] ?? '');
          setPickupAddress(addr);
          setPickupLabel(String(d['address_label'] ?? ''));
          setResolvedAddress(addr);
          if (onAddressChange) onAddressChange(addr);
        }
      }
    } catch {
      setLocationError('Gagal memuat data lokasi');
    } finally {
      setLocationLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const handleMapClick = async (lat: number, lng: number) => {
    setMarker([lat, lng]);
    setLocationError(null);
    setGeocoding(true);
    setResolvedAddress(null);
    try {
      const address = await reverseGeocode(lat, lng);
      setPickupAddress(address);
      setResolvedAddress(address);
      if (onAddressChange) onAddressChange(address);
    } catch {
      setLocationError('Gagal mencari alamat. Anda masih dapat mengisi alamat secara manual.');
      setPickupAddress('');
      setResolvedAddress(null);
      if (onAddressChange) onAddressChange('');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!marker) return;
    const label = pickupLabel.trim();
    if (!label) {
      setLocationError('Label lokasi wajib diisi');
      return;
    }
    const address = pickupAddress.trim();
    if (!address) {
      setLocationError('Alamat wajib diisi');
      return;
    }

    setSavingLocation(true);
    setLocationError(null);
    const token = localStorage.getItem('token') ?? '';
    const payload: OrganizationLocation = {
      organization_lat: marker[0],
      organization_lng: marker[1],
      address: address,
      address_label: label,
      province_id: selectedProvinceId ?? '',
      city_id: selectedCityId ?? '',
      postal_code: postalCode,
    };

    const res = await api.post('/organization/update', payload, { Authorization: token });
    setSavingLocation(false);

    if (res.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Lokasi berhasil disimpan',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      setLocationError(res.message ?? 'Gagal menyimpan lokasi. Silakan coba lagi.');
    }
  };

  if (locationLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Memuat data lokasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Klik pada peta untuk menentukan lokasi organisasi Anda
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
        <OrganizationLocationMap center={mapCenter} zoom={mapZoom} marker={marker} onMapClick={handleMapClick} />
      </div>

      {marker && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          {geocoding ? (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Mencari alamat...
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alamat terdeteksi</p>
              <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                {resolvedAddress || pickupAddress || '—'}
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                Lat: {marker[0].toFixed(6)} · Lng: {marker[1].toFixed(6)}
              </p>
            </>
          )}
        </div>
      )}

      {locationError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {locationError}
        </p>
      )}

      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="space-y-2">
          <label htmlFor="pickup_label" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Label Lokasi <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="pickup_label"
              value={pickupLabel}
              onChange={(e) => setPickupLabel(e.target.value)}
              placeholder="Contoh: Kantor Pusat, Gudang"
              className={INPUT_CLS}
              disabled={!marker || savingLocation}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="pickup_address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Alamat <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="pickup_address"
              value={pickupAddress}
              onChange={(e) => {
                setPickupAddress(e.target.value);
                if (onAddressChange) onAddressChange(e.target.value);
              }}
              placeholder="Alamat lengkap organisasi"
              className={INPUT_CLS}
              disabled={!marker || savingLocation || geocoding}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Provinsi</label>
            <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={provinceOpen} className={COMBO_CLS} disabled={!marker || savingLocation}>
                  <span className="truncate">{province || 'Pilih Provinsi...'}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] rounded-2xl p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari provinsi..." />
                  <CommandList>
                    <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {provinces.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={(val) => {
                            const selected = provinces.find((x) => x.name.toLowerCase() === val.toLowerCase()) || p;
                            onProvinceSelect(selected.name, selected.id);
                            setProvinceOpen(false);
                          }}
                        >
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kota</label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={cityOpen} className={COMBO_CLS} disabled={!marker || savingLocation}>
                  <span className="truncate">{city || 'Pilih Kota...'}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] rounded-2xl p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kota..." />
                  <CommandList>
                    <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {(selectedProvinceId ? cities.filter((c) => c.province_id === selectedProvinceId) : cities).map(
                        (c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={(val) => {
                              const selected = cities.find((x) => x.name.toLowerCase() === val.toLowerCase()) || c;
                              onCitySelect(selected.name, selected.id);
                              setCityOpen(false);
                            }}
                          >
                            {c.name}
                          </CommandItem>
                        )
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label htmlFor="postal_code_tab" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Kode Pos
            </label>
            <Input
              id="postal_code_tab"
              value={postalCode}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                onPostalCodeChange(v);
              }}
              className={cn(INPUT_CLS, 'pl-4')}
              disabled={!marker || savingLocation}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleSaveLocation}
            disabled={!marker || savingLocation || geocoding || !pickupLabel.trim()}
            className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
          >
            {savingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Lokasi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
