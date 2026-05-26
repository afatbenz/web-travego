import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Handshake, MapPin, Phone, User2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type PartnerOperationDetailData = {
  partnerId: string;
  partnerName: string;
  partnerAddress: string;
  partnerCityLabel: string;
  partnerPhone: string;
  picName: string;
  raw: Record<string, unknown>;
};

function record(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

export const PartnerOperationDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const params = useParams();
  const partnerIdParam = params.partner_id ?? params.partnerId ?? params.id ?? '';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PartnerOperationDetailData | null>(null);

  useEffect(() => {
    (async () => {
      const partnerId = decodeURIComponent(String(partnerIdParam ?? '').trim());
      if (!partnerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await api.post<unknown>('/services/partnership/operations/detail', { partner_id: partnerId }, headers);
        if (res.status !== 'success') return;

        const root = record(res.data);
        const obj = record(root.data && typeof root.data === 'object' ? root.data : root);

        const partnerIdRaw = obj.partner_id ?? obj.partnerId ?? obj.id ?? partnerId;
        const partnerIdNormalized =
          typeof partnerIdRaw === 'string' || typeof partnerIdRaw === 'number' ? String(partnerIdRaw) : partnerId;

        setDetail({
          partnerId: partnerIdNormalized,
          partnerName: String(obj.partner_name ?? obj.partnerName ?? obj.name ?? ''),
          partnerAddress: String(obj.partner_address ?? obj.partnerAddress ?? obj.address ?? ''),
          partnerCityLabel: String(obj.partner_city_label ?? obj.partnerCityLabel ?? obj.city_label ?? obj.cityLabel ?? ''),
          partnerPhone: String(obj.partner_phone ?? obj.partnerPhone ?? obj.phone ?? ''),
          picName: String(obj.pic_name ?? obj.picName ?? obj.pic ?? ''),
          raw: obj,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerIdParam]);

  const addressText = useMemo(() => {
    if (!detail) return '-';
    const addr = detail.partnerAddress?.trim() ?? '';
    const city = detail.partnerCityLabel?.trim() ?? '';
    return addr && city ? `${addr}, ${city}` : addr || city || '-';
  }, [detail]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Mitra Operasional</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi partnership operations</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`${basePrefix}/partner-operations`)}>
          Kembali
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Mitra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-72" />
              <Skeleton className="h-5 w-96" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-80" />
            </div>
          ) : !detail ? (
            <div className="text-sm text-muted-foreground">Data mitra tidak ditemukan.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  Nama
                </div>
                <div className="mt-1 text-base font-semibold">{detail.partnerName || '-'}</div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <div className="mt-1 text-base font-semibold">{detail.partnerPhone || '-'}</div>
              </div>

              <div className="rounded-xl border p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Alamat
                </div>
                <div className="mt-1 text-sm leading-relaxed">{addressText}</div>
              </div>

              <div className="rounded-xl border p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  PIC
                </div>
                <div className="mt-1 text-base font-semibold">{detail.picName || '-'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

