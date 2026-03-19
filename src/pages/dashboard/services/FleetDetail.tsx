import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, toFileUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ImagePopup } from '@/components/common/ImagePopup';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';

type FleetMeta = {
  fleet_id: string;
  fleet_type: string;
  fleet_name: string;
  capacity: number;
  engine: string;
  body: string;
  thumbnail: string;
  active?: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  description?: string;
};

type FleetPickup = { uuid: string; city_id: number; city_name: string };
type FleetPricing = { uuid: string; duration: number; rent_type: number; rent_type_label: string; price: number; disc_amount: number; disc_price: number; uom: string };
type FleetImageItem = { uuid: string; path_file: string };

type FleetDetailData = {
  meta: FleetMeta;
  facilities: string[];
  pickup: FleetPickup[];
  addon: unknown[];
  pricing: FleetPricing[];
  images: FleetImageItem[];
};

export const FleetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [fleet, setFleet] = useState<FleetDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd MMMM yyyy HH:mm', { locale: idLocale });
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const token = localStorage.getItem('token') ?? '';
      const res = await api.post<unknown>('/services/fleet/detail', { fleet_id: id }, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = res.data as unknown;
        const p = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
        const meta = p.meta as unknown;
        const facilities = p.facilities as unknown;
        const pickup = p.pickup as unknown;
        const addon = p.addon as unknown;
        const pricing = p.pricing as unknown;
        const images = p.images as unknown;

        const activeRaw = (meta as { active?: unknown; status?: unknown })?.active ?? (meta as { status?: unknown })?.status;
        const active =
          typeof activeRaw === 'boolean'
            ? activeRaw
            : activeRaw === 1 || activeRaw === '1'
              ? true
              : activeRaw === 0 || activeRaw === '0'
                ? false
                : undefined;

        const metaObj: FleetMeta = {
          fleet_id: typeof (meta as { fleet_id?: unknown })?.fleet_id === 'string' ? (meta as { fleet_id?: unknown }).fleet_id as string : '',
          fleet_type: typeof (meta as { fleet_type?: unknown })?.fleet_type === 'string' ? (meta as { fleet_type?: unknown }).fleet_type as string : '',
          fleet_name: typeof (meta as { fleet_name?: unknown })?.fleet_name === 'string' ? (meta as { fleet_name?: unknown }).fleet_name as string : '',
          capacity: typeof (meta as { capacity?: unknown })?.capacity === 'number' ? (meta as { capacity?: unknown }).capacity as number : 0,
          engine: typeof (meta as { engine?: unknown })?.engine === 'string' ? (meta as { engine?: unknown }).engine as string : '',
          body: typeof (meta as { body?: unknown })?.body === 'string' ? (meta as { body?: unknown }).body as string : '',
          thumbnail: typeof (meta as { thumbnail?: unknown })?.thumbnail === 'string' ? toFileUrl((meta as { thumbnail?: unknown }).thumbnail as string) : '',
          active,
          created_at: typeof (meta as { created_at?: unknown })?.created_at === 'string' ? (meta as { created_at?: unknown }).created_at as string : '',
          created_by: typeof (meta as { created_by?: unknown })?.created_by === 'string' ? (meta as { created_by?: unknown }).created_by as string : '',
          updated_at: typeof (meta as { updated_at?: unknown })?.updated_at === 'string' ? (meta as { updated_at?: unknown }).updated_at as string : '',
          updated_by: typeof (meta as { updated_by?: unknown })?.updated_by === 'string' ? (meta as { updated_by?: unknown }).updated_by as string : '',
          description: typeof (meta as { description?: unknown })?.description === 'string' ? (meta as { description?: unknown }).description as string : '',
        };

        const facilitiesArr = Array.isArray(facilities) ? (facilities as unknown[]).map((x) => (typeof x === 'string' ? x : '')).filter((x) => x) : [];
        const pickupArr = Array.isArray(pickup)
          ? (pickup as unknown[])
              .map((x) => {
                const obj = x as Record<string, unknown>;
                const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
                const city_id = typeof obj.city_id === 'number' ? obj.city_id : 0;
                const city_name = typeof obj.city_name === 'string' ? obj.city_name : '';
                return uuid && city_name ? { uuid, city_id, city_name } : null;
              })
              .filter((v): v is FleetPickup => Boolean(v))
          : [];
        const pricingArr = Array.isArray(pricing)
          ? (pricing as unknown[])
              .map((x) => {
                const obj = x as Record<string, unknown>;
                const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
                const duration = typeof obj.duration === 'number' ? obj.duration : 0;
                const rent_type = typeof obj.rent_type === 'number' ? obj.rent_type : 0;
                const rent_type_label = typeof obj.rent_type_label === 'string' ? obj.rent_type_label : '';
                const price = typeof obj.price === 'number' ? obj.price : 0;
                const disc_amount = typeof obj.disc_amount === 'number' ? obj.disc_amount : 0;
                const disc_price = typeof obj.disc_price === 'number' ? obj.disc_price : 0;
                const uom = typeof obj.uom === 'string' ? obj.uom : 'hari';
                return uuid ? { uuid, duration, rent_type, rent_type_label, price, disc_amount, disc_price, uom } : null;
              })
              .filter((v): v is FleetPricing => Boolean(v))
          : [];
        const imagesRaw = Array.isArray(images)
          ? (images as unknown[])
          : Array.isArray((meta as unknown as { images?: unknown[] })?.images)
            ? ((meta as unknown as { images?: unknown[] }).images as unknown[])
            : [];
        const imagesArr = imagesRaw
          .map((x) => {
            const obj = x as Record<string, unknown>;
            const uuid = typeof obj.uuid === 'string' ? obj.uuid : '';
            const path_file = typeof obj.path_file === 'string' ? toFileUrl(obj.path_file) : '';
            return path_file ? { uuid: uuid || `${Math.random()}`.slice(2), path_file } : null;
          })
          .filter((v): v is FleetImageItem => Boolean(v));

        setFleet({ meta: metaObj, facilities: facilitiesArr, pickup: pickupArr, addon: Array.isArray(addon) ? addon : [], pricing: pricingArr, images: imagesArr });
      }
      setLoading(false);
    };
    load();
  }, [id, reloadNonce]);

  if (loading) return <div>Memuat...</div>;
  if (!fleet) return <div>Armada tidak ditemukan</div>;

  const handleActivate = async () => {
    if (fleet.meta.active === true) return;
    const result = await Swal.fire({
      title: 'Aktifkan armada?',
      text: 'Armada akan diset menjadi aktif.',
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
    const res = await api.post<unknown>('/services/fleet/active', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Armada berhasil diaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleInactive = async () => {
    if (fleet.meta.active === false) return;
    const result = await Swal.fire({
      title: 'Nonaktifkan armada?',
      text: 'Armada akan diset menjadi tidak aktif.',
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
    const res = await api.post<unknown>('/services/fleet/inactive', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Armada berhasil dinonaktifkan.' });
      setReloadNonce((v) => v + 1);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus armada?',
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
    const res = await api.post<unknown>('/services/fleet/delete', { fleet_id: fleet.meta.fleet_id }, headers);
    if (res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Armada berhasil dihapus.' });
      navigate(`${basePrefix}/services/fleet`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fleet.meta.fleet_name}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Armada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Spesifikasi</label>
                    <p className="text-gray-900 dark:text-white">{fleet.meta.body} - {fleet.meta.engine}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tipe</label>
                    <p className="text-gray-900 dark:text-white">{fleet.meta.fleet_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Kapasitas</label>
                    <p className="text-gray-900 dark:text-white">{fleet.meta.capacity} pax</p>
                  </div>
                </div>

                {fleet.meta.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Deskripsi</label>
                    <div className="text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: fleet.meta.description || '' }} />
                  </div>
                )}

                {fleet.facilities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Fasilitas</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fleet.facilities.map((f, i) => (
                        <Badge key={i} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {fleet.pickup.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Pickup Point</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fleet.pickup.map((p) => (
                        <Badge key={p.uuid} variant="outline">{p.city_name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {fleet.pricing.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Harga Sewa</label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fleet.pricing.map((pr) => (
                        <div key={pr.uuid} className="border rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{pr.rent_type_label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Durasi {pr.duration} {pr.uom}</p>
                          {pr.disc_price > 0 ? (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 line-through">{formatCurrency(pr.price)}</p>
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(pr.disc_price)}</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-lg font-bold text-blue-600">{formatCurrency(pr.price)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Dibuat Oleh</label>
                        <p className="text-gray-900 dark:text-white">{fleet.meta.created_by}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Dibuat</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(fleet.meta.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Diperbarui</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(fleet.meta.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <img src={fleet.meta.thumbnail} alt={fleet.meta.fleet_name} className="w-full h-48 object-cover rounded-lg" />
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Galeri</label>
                  {fleet.images.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {fleet.images.map((img, idx) => (
                        <img
                          key={img.uuid}
                          src={img.path_file}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => { setSelectedImageIndex(idx); setIsPopupOpen(true); }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada gambar</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-start">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate(`${basePrefix}/services/fleet/edit/${encodeURIComponent(fleet.meta.fleet_id)}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Armada
        </Button>
        {fleet.meta.active === false ? (
          <Button
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={handleActivate}
          >
            Aktifkan Armada
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            onClick={handleInactive}
          >
            Nonaktifkan Armada
          </Button>
        )}
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus Armada
        </Button>
      </div>

      <ImagePopup
        images={fleet.images.map((x) => x.path_file)}
        currentIndex={selectedImageIndex}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onImageChange={(i) => setSelectedImageIndex(i)}
        itemType="fleet"
        itemId={fleet.meta.fleet_id}
      />
    </div>
  );
};
