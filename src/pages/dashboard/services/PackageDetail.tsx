import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { api, toFileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImagePopup } from '@/components/common/ImagePopup';
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

  const getStatusBadge = (status: 'active' | 'inactive') => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Aktif</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Tidak Aktif</Badge>;
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
      const toMinutes = (time: string) => {
        const hh = Number(time.slice(0, 2));
        const mm = Number(time.slice(3, 5));
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return -1;
        return hh * 60 + mm;
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
          return arr
            .map((x, i) => {
              if (!x || typeof x !== 'object') return null;
              const obj = x as Record<string, unknown>;
              const dayRaw = obj.day ?? i + 1;
              const day = typeof dayRaw === 'number' ? dayRaw : typeof dayRaw === 'string' ? Number(dayRaw) : i + 1;
              const activitiesRaw = obj.activities;
              const activities = Array.isArray(activitiesRaw)
                ? (activitiesRaw as unknown[])
                    .map((a) => readActivity(a))
                    .filter((v): v is PackageActivity => v !== null && Boolean(v.time || v.description || v.location))
                : [];
              return { day: Number.isFinite(day) ? day : i + 1, activities } satisfies PackageItinerary;
            })
            .filter((v): v is PackageItinerary => v !== null);
        }

        const flat = arr
          .map((x) => readActivity(x))
          .filter((v): v is PackageActivity => v !== null && Boolean(v.time || v.description || v.location));

        let day = 1;
        let prevMin = -1;
        const byDay = new Map<number, PackageActivity[]>();
        for (const a of flat) {
          const m = toMinutes(a.time);
          if (prevMin !== -1 && m !== -1 && m < prevMin) day += 1;
          prevMin = m !== -1 ? m : prevMin;
          const list = byDay.get(day) ?? [];
          list.push(a);
          byDay.set(day, list);
        }

        return Array.from(byDay.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([d, activities]) => ({ day: d, activities }));
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

  if (loading) return <div>Memuat...</div>;
  if (!pkg) return <div>Paket tidak ditemukan</div>;

  const handleActivate = async () => {
    if (pkg.status === 'active') return;
    const result = await Swal.fire({
      title: 'Aktifkan paket?',
      text: 'Paket akan diset menjadi aktif.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
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
      confirmButtonColor: '#3085d6',
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
      confirmButtonColor: '#3085d6',
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
      navigate('/dashboard/partner/services/packages');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="!w-auto !h-auto p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pkg.package_name}</h1>
          {getStatusBadge(pkg.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Paket {pkg.package_type ? `| ${pkg.package_type}` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pkg.package_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi</label>
                    <div className="text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: pkg.package_description }} />
                  </div>
                )}

                {pkg.facilities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Fasilitas</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pkg.facilities.map((f, i) => (
                        <Badge key={i} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pkg.pickup_areas.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Pickup Area</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pkg.pickup_areas.map((p) => (
                        <Badge key={`${p.id}-${p.name}`} variant="outline">{p.name || `City ID: ${p.id}`}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {pkg.itineraries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkg.itineraries.map((day) => (
                    <div key={day.day} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hari {day.day}</h4>
                      <div className="space-y-2">
                        {day.activities?.map((a, idx) => (
                          <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">{a.time ? a.time.slice(0, 5) : '-'}</span>
                            <span className="mx-2">•</span>
                            <span>{a.description || '-'}</span>
                            {a.location ? <span className="mx-2">•</span> : null}
                            {a.location ? <span>{a.location}</span> : null}
                            {a.city_name || a.city_id ? <span className="mx-2">•</span> : null}
                            {a.city_name ? <span>{a.city_name}</span> : a.city_id ? <span>City ID: {a.city_id}</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(pkg.pricing.length > 0 || pkg.addons.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Harga</CardTitle>
              </CardHeader>
              <CardContent>
                {pkg.pricing.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pkg.pricing.map((pr, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{pr.min_pax} - {pr.max_pax} pax</p>
                        <p className="mt-2 text-lg font-bold text-blue-600">
                          {formatCurrency(pr.price)} <span className="text-sm font-medium text-blue-600">/pax</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {pkg.addons.length > 0 && (
                  <div className={pkg.pricing.length > 0 ? 'mt-6 pt-6 border-t' : ''}>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Addons</p>
                    <div className="mt-3 space-y-2">
                      {pkg.addons.map((a, i) => (
                        <div key={i} className="flex items-start justify-between gap-4">
                          <p className="text-sm text-gray-900 dark:text-white">{a.description}</p>
                          <p className="text-sm font-medium text-blue-600">{formatCurrency(a.price)}</p>
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
          {mainImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setSelectedImageIndex(0);
                      setIsPopupOpen(true);
                    }}
                  >
                    <img
                      src={mainImages[0]}
                      alt={pkg.package_name}
                      className="w-full h-56 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400';
                      }}
                    />
                  </button>

                  {mainImages.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {mainImages.slice(0, 6).map((img, idx) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => {
                            setSelectedImageIndex(idx);
                            setIsPopupOpen(true);
                          }}
                        >
                          <img
                            src={img}
                            alt={`img-${idx}`}
                            className="w-full h-16 object-cover rounded-md"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-start">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate(`/dashboard/partner/services/packages/edit/${encodeURIComponent(pkg.package_id)}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Paket
        </Button>
        {pkg.status === 'inactive' ? (
          <Button
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={handleActivate}
          >
            Aktifkan Paket
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            onClick={handleInactive}
          >
            Nonaktifkan Paket
          </Button>
        )}
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus Paket
        </Button>
      </div>

      <ImagePopup
        images={mainImages}
        currentIndex={selectedImageIndex}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onImageChange={setSelectedImageIndex}
        itemType="package"
        itemId={pkg.package_id}
      />
    </div>
  );
};
