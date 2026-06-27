import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight, CreditCard, Edit, Image as ImageIcon, Info, MapPin, Package as PackageIcon, Tag, Trash2 } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImagePopup } from '@/components/common/ImagePopup';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

type PackageActivity = {
  time: string;
  description: string;
  location: string;
  city_id: number | undefined;
  city_name: string | undefined;
};

type PackageItinerary = {
  day: number;
  activities: PackageActivity[];
};

type PackagePricing = {
  min_pax: number;
  max_pax: number;
  price: number;
};

type PackageAddon = {
  description: string;
  price: number;
};

type PackageDetailData = {
  package_id: string;
  package_name: string;
  package_type: string;
  package_category?: string;
  duration_days?: number;
  created_at?: string;
  updated_at?: string;
  package_description: string;
  status: 'active' | 'inactive';
  thumbnail: string;
  images: string[];
  facilities: string[];
  pickup_areas: Array<{ id: number; name: string }>;
  itineraries: PackageItinerary[];
  pricing: PackagePricing[];
  addons: PackageAddon[];
};

export const PackageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard');
  const packagesPath = `${basePrefix}/services/packages`;
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<PackageDetailData | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const normalizeStatus = (raw: unknown): 'active' | 'inactive' => {
    if (raw === 1 || raw === '1') return 'active';
    if (raw === 0 || raw === '0') return 'inactive';
    if (raw === true) return 'active';
    if (raw === false) return 'inactive';
    if (typeof raw === 'string') {
      const s = raw.toLowerCase();
      if (s === 'active') return 'active';
      if (s === 'inactive') return 'inactive';
    }
    return 'inactive';
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDateTime = (value?: string) => {
    const v = String(value ?? '').trim();
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: 'active' | 'inactive') => {
    if (status === 'active') {
      return (
        <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          Aktif
        </Badge>
      );
    }
    return (
      <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
        Tidak Aktif
      </Badge>
    );
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const packageIdParam = decodeURIComponent(id);
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;

      const res = await api.post<unknown>(
        '/services/tour-packages/detail',
        { package_id: packageIdParam },
        headers
      );

      if (!res || res.status !== 'success') {
        setPkg(null);
        setLoading(false);
        return;
      }

      const payload = res.data;
      const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
      const metaRaw = (root.meta && typeof root.meta === 'object' ? (root.meta as Record<string, unknown>) : root) as Record<string, unknown>;

      const package_name = String(metaRaw.package_name ?? metaRaw.name ?? '');
      const package_type_label = metaRaw.package_type_label;
      const package_type = typeof package_type_label === 'string' && package_type_label ? package_type_label : String(metaRaw.package_type ?? metaRaw.type ?? '');
      const package_category = String(
        metaRaw.package_category_label ??
          metaRaw.category_label ??
          metaRaw.package_category ??
          metaRaw.category ??
          ''
      ).trim();
      const durationRaw = metaRaw.duration_days ?? metaRaw.duration_day ?? metaRaw.duration ?? metaRaw.days ?? metaRaw.total_days;
      const durationNum = typeof durationRaw === 'number' ? durationRaw : typeof durationRaw === 'string' ? Number(durationRaw) : NaN;
      const duration_days = Number.isFinite(durationNum) && durationNum > 0 ? durationNum : undefined;
      const created_at = String(metaRaw.created_at ?? metaRaw.createdAt ?? root.created_at ?? root.createdAt ?? '').trim() || undefined;
      const updated_at = String(metaRaw.updated_at ?? metaRaw.updatedAt ?? root.updated_at ?? root.updatedAt ?? '').trim() || undefined;
      const package_description = String(metaRaw.package_description ?? metaRaw.description ?? '');
      const thumbnail = toFileUrl(String(metaRaw.thumbnail ?? ''));
      const status = normalizeStatus(metaRaw.status ?? metaRaw.active ?? root.status ?? root.active);

      const facilitiesRaw = root.facilities ?? root.features ?? metaRaw.facilities ?? metaRaw.features;
      const facilities = Array.isArray(facilitiesRaw)
        ? (facilitiesRaw as unknown[]).map((x) => (typeof x === 'string' ? x : '')).filter((x) => x)
        : [];

      const pickupRaw = root.pickup_areas ?? root.pickup ?? metaRaw.pickup_areas ?? metaRaw.pickup;
      const pickup_areas = Array.isArray(pickupRaw)
        ? (pickupRaw as unknown[])
            .map((x, i) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const idVal = obj.id ?? obj.city_id ?? i;
              const idNum =
                typeof idVal === 'number' ? idVal : typeof idVal === 'string' ? Number(idVal) : i;
              const id = Number.isFinite(idNum) ? idNum : i;
              const name = typeof obj.name === 'string' ? obj.name : (typeof obj.city_name === 'string' ? obj.city_name : '');
              return { id, name };
            })
            .filter((v): v is { id: number; name: string } => Boolean(v && v.id !== undefined))
        : [];

      const itinerariesRaw = root.itineraries ?? root.itinerary ?? metaRaw.itineraries ?? metaRaw.itinerary;
      const groupItineraryByDay = (days: PackageItinerary[]): PackageItinerary[] => {
        const byDay = new Map<number, PackageItinerary>();
        for (const entry of days) {
          const existing = byDay.get(entry.day);
          if (existing) {
            existing.activities.push(...entry.activities);
          } else {
            byDay.set(entry.day, { day: entry.day, activities: [...entry.activities] });
          }
        }
        return Array.from(byDay.values()).sort((a, b) => a.day - b.day);
      };
      const readDay = (obj: Record<string, unknown>, fallback: number) => {
        const dayRaw = obj.day ?? fallback;
        const day = typeof dayRaw === 'number' ? dayRaw : typeof dayRaw === 'string' ? Number(dayRaw) : fallback;
        return Number.isFinite(day) ? day : fallback;
      };
      const readActivity = (input: unknown): PackageActivity | null => {
        if (!input || typeof input !== 'object') return null;
        const ao = input as Record<string, unknown>;
        const time = typeof ao.time === 'string' ? ao.time : '';
        const description = typeof ao.description === 'string' ? ao.description : '';
        const location = typeof ao.location === 'string' ? ao.location : '';
        const city_id_raw = ao.city_id ?? ao.cityId;
        const city_name_raw = ao.city_name ?? ao.cityName;
        const city_id_num = typeof city_id_raw === 'number' ? city_id_raw : typeof city_id_raw === 'string' ? Number(city_id_raw) : undefined;
        const city_id = typeof city_id_num === 'number' && Number.isFinite(city_id_num) ? city_id_num : undefined;
        const city_name = typeof city_name_raw === 'string' ? city_name_raw : undefined;

        const city = ao.city;
        if ((city_id === undefined || city_name === undefined) && city && typeof city === 'object') {
          const co = city as Record<string, unknown>;
          const idVal = co.id;
          const nameVal = co.name;
          const idNum = typeof idVal === 'number' ? idVal : typeof idVal === 'string' ? Number(idVal) : undefined;
          const resolvedId = typeof idNum === 'number' && Number.isFinite(idNum) ? idNum : undefined;
          const resolvedName = typeof nameVal === 'string' ? nameVal : undefined;
          return { time, description, location, city_id: city_id ?? resolvedId, city_name: city_name ?? resolvedName };
        }

        return { time, description, location, city_id, city_name };
      };

      const itineraries = (() => {
        if (!Array.isArray(itinerariesRaw)) return [];
        const arr = itinerariesRaw as unknown[];
        const first = arr[0];
        if (first && typeof first === 'object' && 'activities' in (first as Record<string, unknown>)) {
          const nested = arr
            .map((x, i) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const day = readDay(obj, i + 1);
              const activitiesRaw = obj.activities;
              const activities = Array.isArray(activitiesRaw)
                ? (activitiesRaw as unknown[])
                    .map((a) => readActivity(a))
                    .filter((v): v is PackageActivity => v !== null && Boolean(v.time || v.description || v.location))
                : [];
              return { day, activities } satisfies PackageItinerary;
            })
            .filter((v): v is PackageItinerary => v !== null);
          return groupItineraryByDay(nested);
        }

        const byDay = new Map<number, PackageActivity[]>();
        for (const x of arr) {
          if (!x || typeof x !== 'object') continue;
          const obj = x as Record<string, unknown>;
          const activity = readActivity(x);
          if (!activity) continue;
          const day = readDay(obj, 1);
          const list = byDay.get(day) ?? [];
          list.push(activity);
          byDay.set(day, list);
        }

        return groupItineraryByDay(
          Array.from(byDay.entries()).map(([d, activities]) => ({ day: d, activities }))
        );
      })();

      const pricingRaw = root.pricing ?? metaRaw.pricing;
      const pricing = Array.isArray(pricingRaw)
        ? (pricingRaw as unknown[])
            .map((x) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const min_pax = typeof obj.min_pax === 'number' ? obj.min_pax : Number(obj.min_pax ?? 0);
              const max_pax = typeof obj.max_pax === 'number' ? obj.max_pax : Number(obj.max_pax ?? 0);
              const price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
              return { min_pax, max_pax, price } satisfies PackagePricing;
            })
            .filter((v): v is PackagePricing => Boolean(v))
        : [];

      const addonsRaw = root.addons ?? metaRaw.addons;
      const addons = Array.isArray(addonsRaw)
        ? (addonsRaw as unknown[])
            .map((x) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const description = typeof obj.description === 'string' ? obj.description : '';
              const price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
              return description ? ({ description, price } satisfies PackageAddon) : null;
            })
            .filter((v): v is PackageAddon => v !== null)
        : [];

      const imagesRaw = root.images ?? metaRaw.images;
      const extraImages = Array.isArray(imagesRaw)
        ? (imagesRaw as unknown[])
            .map((x) => {
              if (typeof x === 'string') return x;
              if (x && typeof x === 'object') {
                const obj = x as Record<string, unknown>;
                const s = obj.path_file ?? obj.url ?? obj.path ?? obj.image;
                return typeof s === 'string' ? s : '';
              }
              return '';
            })
            .filter((x) => x)
        : [];

      const allImages = [thumbnail, ...extraImages].filter((x) => x).map((x) => toFileUrl(x));
      const images = Array.from(new Set(allImages));

      setPkg({
        package_id: String(metaRaw.package_id ?? metaRaw.id ?? packageIdParam),
        package_name,
        package_type,
        package_category: package_category || undefined,
        duration_days,
        created_at,
        updated_at,
        package_description,
        status,
        thumbnail,
        images,
        facilities,
        pickup_areas,
        itineraries,
        pricing,
        addons,
      });
      setLoading(false);
    };
    load();
  }, [id, reloadNonce]);

  const mainImages = useMemo(() => (pkg?.images?.length ? pkg.images : pkg?.thumbnail ? [pkg.thumbnail] : []), [pkg]);
  const durationText = useMemo(() => {
    if (!pkg) return '-';
    const days = pkg.duration_days ?? (pkg.itineraries?.length ? pkg.itineraries.length : 0);
    if (!days) return '-';
    return `${days} hari`;
  }, [pkg]);

  const mainDestinationText = useMemo(() => {
    if (!pkg) return '-';
    const fromActivities = (pkg.itineraries ?? [])
      .flatMap((d) => d.activities ?? [])
      .map((a) => String(a.city_name ?? '').trim())
      .filter(Boolean);
    const fromPickup = (pkg.pickup_areas ?? []).map((p) => String(p.name ?? '').trim()).filter(Boolean);
    const first = [...new Set([...fromActivities, ...fromPickup])][0];
    return first || '-';
  }, [pkg]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Memuat...
        </div>
      </div>
    );
  }
  if (!pkg) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Paket tidak ditemukan
        </div>
      </div>
    );
  }

  const handleActivate = async () => {
    if (pkg.status === 'active') return;
    const result = await Swal.fire({
      title: 'Aktifkan paket?',
      text: 'Paket akan diset menjadi aktif.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#295BFF',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, aktifkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/tour-packages/active', { package_id: pkg.package_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Paket berhasil diaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleInactive = async () => {
    if (pkg.status === 'inactive') return;
    const result = await Swal.fire({
      title: 'Nonaktifkan paket?',
      text: 'Paket akan diset menjadi tidak aktif.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#295BFF',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, nonaktifkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/tour-packages/inactive', { package_id: pkg.package_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Paket berhasil dinonaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus paket?',
      text: 'Data yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#295BFF',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? { Authorization: token } : undefined;
    const res = await api.post<unknown>('/services/tour-packages/delete', { package_id: pkg.package_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Paket berhasil dihapus.' });
      navigate(packagesPath);
    }
  };

  const cardBaseClass =
    'rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950';
  const headerWrapClass =
    'rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-5';
  const actionButtonBase =
    'h-10 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900';

  const maxThumbs = 6;
  const thumbs = mainImages.slice(0, maxThumbs);
  const remainingThumbs = Math.max(0, mainImages.length - thumbs.length);
  const safeSelectedIndex = Math.min(Math.max(0, selectedImageIndex), Math.max(0, mainImages.length - 1));
  const heroImage = mainImages[safeSelectedIndex] ?? mainImages[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in-0 duration-300">
      <div className={headerWrapClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-2xl border-slate-200 bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
              title="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => navigate(basePrefix)}
                  className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Dashboard
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => navigate(`${basePrefix}/services/packages`)}
                  className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Paket
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Detail</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {pkg.package_name}
                </h1>
                {getStatusBadge(pkg.status)}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Informasi lengkap paket wisata dan detail itinerary
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(actionButtonBase, 'border-[#295BFF]/40 bg-[#295BFF]/10 text-[#295BFF] hover:bg-[#295BFF]/15 dark:border-[#295BFF]/40 dark:bg-[#295BFF]/15 dark:text-[#7FA0FF]')}
              onClick={() => navigate(`${packagesPath}/edit/${encodeURIComponent(pkg.package_id)}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Paket
            </Button>

            {pkg.status === 'inactive' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(actionButtonBase, 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200')}
                onClick={handleActivate}
              >
                Aktifkan
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(actionButtonBase, 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200')}
                onClick={handleInactive}
              >
                Nonaktifkan
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(actionButtonBase, 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200')}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {mainImages.length > 0 && (
            <Card className={cn(cardBaseClass, 'overflow-hidden')}>
              <CardHeaderWithBadge
                className="pb-2"
                badgeIcon={ImageIcon}
                title="Photo Gallery"
                subtitle="Klik foto untuk melihat lebih besar."
              />
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <button
                    type="button"
                    className="group w-full text-left"
                    onClick={() => {
                      setSelectedImageIndex(safeSelectedIndex);
                      setIsPopupOpen(true);
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <img
                        src={heroImage}
                        alt={pkg.package_name}
                        className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800';
                        }}
                      />
                    </div>
                  </button>

                  {mainImages.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {thumbs.map((img, idx) => {
                        const isActive = idx === safeSelectedIndex;
                        const isLastWithOverlay = idx === thumbs.length - 1 && remainingThumbs > 0;
                        return (
                          <button
                            key={`${img}-${idx}`}
                            type="button"
                            className={cn(
                              'group relative overflow-hidden rounded-xl border transition-all duration-300',
                              isActive
                                ? 'border-[#295BFF]/50 ring-2 ring-[#295BFF]/25'
                                : 'border-slate-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800'
                            )}
                            onClick={() => {
                              setSelectedImageIndex(idx);
                              setIsPopupOpen(true);
                            }}
                          >
                            <img
                              src={img}
                              alt={`thumb-${idx}`}
                              className="h-16 w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200';
                              }}
                            />
                            {isLastWithOverlay && (
                              <div className="absolute inset-0 grid place-items-center bg-slate-950/50 text-sm font-semibold text-white">
                                +{remainingThumbs}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={cardBaseClass}>
            <CardHeaderWithBadge
              className="pb-2"
              badgeIcon={Info}
              title="Informasi Paket"
              subtitle="Ringkasan detail dan informasi penting paket."
            />
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-6">
                  {pkg.package_description ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Deskripsi</div>
                      <div
                        className="prose prose-slate max-w-none text-slate-700 dark:prose-invert dark:text-slate-200"
                        dangerouslySetInnerHTML={{ __html: pkg.package_description }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                      Tidak ada deskripsi.
                    </div>
                  )}

                  {pkg.facilities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Fasilitas</div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.facilities.map((f, i) => (
                          <Badge
                            key={`${f}-${i}`}
                            className="rounded-full border border-[#295BFF]/20 bg-[#295BFF]/10 text-[#295BFF] shadow-sm dark:border-[#295BFF]/30 dark:bg-[#295BFF]/15 dark:text-[#7FA0FF]"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pkg.pickup_areas.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Pickup Area</div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.pickup_areas.map((p) => (
                          <span
                            key={`${p.id}-${p.name}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/60 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-950"
                          >
                            <MapPin className="h-3.5 w-3.5 text-[#295BFF]" />
                            {p.name || `City ID: ${p.id}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <PackageIcon className="h-4 w-4" />
                      Tipe Paket
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {pkg.package_type || '-'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      Durasi
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {durationText}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Tag className="h-4 w-4" />
                      Kategori
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {pkg.package_category || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {pkg.itineraries.length > 0 && (
            <Card className={cardBaseClass}>
              <CardHeaderWithBadge
                className="pb-2"
                badgeIcon={Calendar}
                title="Itinerary"
                subtitle="Timeline aktivitas per hari."
              />
              <CardContent className="pt-4">
                <div className="relative pl-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-4">
                    {pkg.itineraries.map((day) => (
                      <div key={day.day} className="relative">
                        <div className="absolute left-[6px] top-6 h-2.5 w-2.5 rounded-full bg-[#295BFF]" />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Badge className="rounded-full border border-[#295BFF]/20 bg-[#295BFF]/10 text-[#295BFF] shadow-sm dark:border-[#295BFF]/30 dark:bg-[#295BFF]/15 dark:text-[#7FA0FF]">
                              Hari {day.day}
                            </Badge>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {day.activities?.length ?? 0} aktivitas
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {(day.activities ?? []).map((a, idx) => (
                              <div key={idx} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                                      {a.time ? a.time.slice(0, 5) : '-'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                      {a.description || '-'}
                                    </span>
                                  </div>
                                  {(a.location || a.city_name || a.city_id) && (
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {a.location ? <span>{a.location}</span> : null}
                                      {a.location && (a.city_name || a.city_id) ? <span className="mx-2">•</span> : null}
                                      {a.city_name ? <span>{a.city_name}</span> : a.city_id ? <span>City ID: {a.city_id}</span> : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(pkg.pricing.length > 0 || pkg.addons.length > 0) && (
            <Card className={cardBaseClass}>
              <CardHeaderWithBadge
                className="pb-2"
                badgeIcon={CreditCard}
                title="Harga"
                subtitle="Harga per pax dan addons (jika tersedia)."
              />
              <CardContent className="pt-4">
                {pkg.pricing.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pkg.pricing.map((pr, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-950"
                      >
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {pr.min_pax} - {pr.max_pax} pax
                        </div>
                        <div className="mt-2 text-lg font-bold text-[#295BFF]">
                          {formatCurrency(pr.price)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/pax</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Harga final dapat menyesuaikan jadwal & kebijakan paket
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pkg.addons.length > 0 && (
                  <div className={cn(pkg.pricing.length > 0 && 'mt-6 pt-6 border-t border-slate-200 dark:border-slate-800')}>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Addons</div>
                    <div className="mt-3 space-y-2">
                      {pkg.addons.map((a, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-sm text-slate-900 dark:text-white">{a.description}</div>
                          <div className="shrink-0 text-sm font-semibold text-[#295BFF]">{formatCurrency(a.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className={cn(cardBaseClass, 'hover:shadow-md lg:sticky lg:top-24')}>
            <CardHeaderWithBadge
              className="pb-2"
              badgeIcon={PackageIcon}
              title="Ringkasan"
              subtitle="Detail cepat paket."
            />
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tipe Perjalanan</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{pkg.package_type || '-'}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Durasi</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{durationText}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Destinasi Utama</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{mainDestinationText}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</div>
                  <div className="mt-2">{getStatusBadge(pkg.status)}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Created At</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDateTime(pkg.created_at)}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Updated At</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatDateTime(pkg.updated_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImagePopup
        images={mainImages}
        currentIndex={safeSelectedIndex}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onImageChange={setSelectedImageIndex}
        itemType="package"
        itemId={pkg.package_id}
      />
    </div>
  );
};
