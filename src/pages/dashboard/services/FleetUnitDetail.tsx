import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type UnitDetail = {
  unit_id: string;
  fleet_id?: string;
  fleet_name: string;
  vehicle_id: string;
  plate_number: string;
  engine: string;
  capacity: number;
  production_year: number;
  transmission: string;
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const getString = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

const getNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const FleetUnitDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const unitIdParam = params.unit_id ?? params.id ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UnitDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      const unitId = decodeURIComponent(unitIdParam);
      if (!unitId) return;
      setLoading(true);
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/fleet-units/detail/${encodeURIComponent(unitId)}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const payload = record(res.data);
        const obj = record(payload.data && typeof payload.data === 'object' ? payload.data : payload);
        const unit_id = getString(obj.unit_id ?? obj.id ?? unitId);
        const fleet_id = getString(obj.fleet_id ?? obj.fleetId);
        const fleet_name = getString(obj.fleet_name ?? obj.fleetName ?? obj.fleet);
        const vehicle_id = getString(obj.vehicle_id ?? obj.vehicleId ?? obj.unit_id);
        const plate_number = getString(obj.plate_number ?? obj.plateNumber ?? obj.license_plate);
        const engine = getString(obj.engine ?? obj.chassis ?? obj.machine);
        const capacity = getNumber(obj.capacity);
        const production_year = getNumber(obj.production_year ?? obj.productionYear ?? obj.year);
        const transmission = getString(obj.transmission);
        setDetail({
          unit_id,
          fleet_id: fleet_id || undefined,
          fleet_name,
          vehicle_id,
          plate_number,
          engine,
          capacity,
          production_year,
          transmission,
        });
      } else {
        setDetail(null);
      }
      setLoading(false);
    };

    load();
  }, [unitIdParam]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePrefix}/fleet-units`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Unit Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 truncate">{detail?.vehicle_id || unitIdParam}</p>
        </div>
        {detail && (
          <Button variant="outline" onClick={() => navigate(`${basePrefix}/fleet-units/edit/${encodeURIComponent(detail.unit_id)}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Unit</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`s-${i}`} className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : !detail ? (
            <div className="py-10 text-center text-gray-500">Data unit tidak ditemukan</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">ID Armada</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.vehicle_id || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">Jenis Armada</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.fleet_name || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">Plat Nomor</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.plate_number || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">Chassis / Mesin</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.engine || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">Kapasitas</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.capacity ? `${detail.capacity} Pax` : '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">Tahun Produksi</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.production_year || '-'}</div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-300">Transmisi</div>
                <div className="font-medium text-gray-900 dark:text-white">{detail.transmission || '-'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

