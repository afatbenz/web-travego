import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Bus,
  Download,
  Mail,
  MapPin,
  Phone,
  Scale,
  Shield,
  User2,
  Users,
  Wallet,
  WalletMinimal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardHeaderWithBadge, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type PartnerOperationDetailData = {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAddress: string;
  partnerCityLabel: string;
  partnerPhone: string;
  picName: string;
  raw: Record<string, unknown>;
  totalUnit: number;
  totalSchedules: number;
  totalRevenue: number;
  totalExpenses: number;
};

type ArmadaRow = {
  id: string;
  name: string;
  fleetType: string;
  vehicleId: string;
  plateNumber: string;
  totalBooking: number;
  totalRevenue: number;
  totalExpense: number;
};

function record(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return undefined;
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getArmadaRows(raw: Record<string, unknown>): ArmadaRow[] {
  const selected = list(raw.fleet_units);

  return selected.map((item, index) => {
    const armada = record(item);
    const id = toText(pickValue(armada, ['vehicle_id', 'id'])) || String(index + 1);

    return {
      id,
      name: toText(armada.fleet_name),
      fleetType: toText(armada.fleet_type),
      vehicleId: toText(armada.vehicle_id),
      plateNumber: toText(armada.plate_number),
      totalBooking: toNumber(armada.total_booking),
      totalRevenue: toNumber(armada.total_revenue),
      totalExpense: toNumber(armada.total_expenses),
    };
  });
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
          partnerEmail: String(obj.partner_email ?? obj.partnerEmail ?? obj.email ?? ''),
          partnerAddress: String(obj.partner_address ?? obj.partnerAddress ?? obj.address ?? ''),
          partnerCityLabel: String(obj.partner_city_label ?? obj.partnerCityLabel ?? obj.city_label ?? obj.cityLabel ?? ''),
          partnerPhone: String(obj.partner_phone ?? obj.partnerPhone ?? obj.phone ?? ''),
          picName: String(obj.pic_name ?? obj.picName ?? obj.pic ?? ''),
          raw: obj,
          totalUnit: toNumber(obj.total_unit ?? obj.totalUnit ?? list(obj.fleet_units).length),
          totalRevenue: toNumber(obj.total_revenue ?? obj.totalRevenue ?? 0),
          totalExpenses: toNumber(obj.total_expenses ?? obj.totalExpenses ?? obj.expesenses ?? obj.total_expense ?? obj.totalExpense ?? 0),
          totalSchedules: toNumber(obj.total_schedule ?? obj.totalSchedule ?? 0),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerIdParam]);

  const partnerRaw = useMemo(() => detail?.raw ?? {}, [detail]);

  const addressText = useMemo(() => {
    if (!detail) return '-';
    const addr = detail.partnerAddress?.trim() ?? '';
    const city = detail.partnerCityLabel?.trim() ?? '';
    return addr && city ? `${addr}, ${city}` : addr || city || '-';
  }, [detail]);

  const partnerEmail = useMemo(() => {
    return toText(pickValue(partnerRaw, ['partner_email', 'partnerEmail', 'email']));
  }, [partnerRaw]);

  const armadaRows = useMemo(() => getArmadaRows(partnerRaw), [partnerRaw]);

  const summary = useMemo(() => {
    const fleetCount = detail?.totalUnit || armadaRows.length;
    const tripCount = detail?.totalSchedules || armadaRows.reduce((total, item) => total + item.totalBooking, 0);
    const revenue = detail?.totalRevenue ?? 0;
    const expense = detail?.totalExpenses ?? 0;
    const estimatedProfit = revenue - expense;

    return { fleetCount, tripCount, revenue, expense, estimatedProfit };
  }, [armadaRows, detail?.totalExpenses, detail?.totalRevenue, detail?.totalSchedules, detail?.totalUnit]);

  const statCards = useMemo(
    () => [
      {
        title: 'Jumlah Perjalanan',
        value: formatCount(summary.tripCount),
        description: 'Total perjalanan yang telah dijalankan',
        icon: BriefcaseBusiness,
        className: 'bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-700 dark:text-blue-300',
      },
      {
        title: 'Total Pendapatan',
        value: formatCurrency(summary.revenue),
        description: 'Akumulasi pendapatan operasional',
        icon: Wallet,
        className: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
      },
      {
        title: 'Total Pengeluaran',
        value: formatCurrency(summary.expense),
        description: 'Akumulasi biaya operasional',
        icon: WalletMinimal,
        className: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
      },
      {
        title: 'Estimasi Profit',
        value: formatCurrency(summary.estimatedProfit),
        description: 'Pendapatan dikurangi total pengeluaran',
        icon: Scale,
        className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      },
    ],
    [summary],
  );

  const partnerFields = useMemo(
    () => [
      { label: 'Nama', value: detail?.partnerName || '-', icon: User2 },
      { label: 'Email', value: detail?.partnerEmail || partnerEmail || '-', icon: Mail },
      { label: 'Telepon', value: detail?.partnerPhone || '-', icon: Phone },
      { label: 'Alamat', value: addressText, icon: MapPin },
      { label: 'PIC / Person In Charge', value: detail?.picName || '-', icon: User2 },
    ],
    [addressText, detail?.partnerPhone, detail?.picName, partnerEmail],
  );

  const armadaSummaryFields = useMemo(
    () => [
      { label: 'Jumlah Armada', value: formatCount(summary.fleetCount) },
      { label: 'Total Perjalanan', value: formatCount(summary.tripCount) },
      { label: 'Total Pendapatan', value: formatCurrency(summary.revenue) },
      { label: 'Total Pengeluaran', value: formatCurrency(summary.expense) },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Dashboard &gt; Detail Mitra Operasional</div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(`${basePrefix}/partner-operations`)}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/15"
              aria-label="Kembali ke daftar partner operasional"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Detail Mitra Operasional</h1>
              <p className="mt-1 text-muted-foreground">Informasi lengkap mengenai partner operasional</p>
            </div>
          </div>
        </div>

        <Button variant="outline" className="gap-2 self-start" onClick={() => navigate(`${basePrefix}/partner-operations`)}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-44" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-56" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : !detail ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Data mitra tidak ditemukan.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/60 shadow-sm">
                  <CardContent className="p-5">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${item.className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                      <p className="text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardHeaderWithBadge
                className="pb-2"
                badgeIcon={<Users className="h-3 w-3 sm:h-6 sm:w-6" />}
                title="Informasi Customer"
                subtitle="Ringkasan data partner operasional"
              />
              <CardContent className="space-y-6">
                <div className="divide-y divide-border rounded-2xl border border-border/60">
                  {partnerFields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.label} className="flex items-center justify-between gap-4 px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                        </div>
                        <span className="max-w-[55%] text-right text-sm font-semibold text-foreground">{field.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeaderWithBadge
                className="pb-2"
                badgeIcon={<Users className="h-3 w-3 sm:h-6 sm:w-6" />}
                title="Informasi Armada"
                subtitle="Ringkasan data armada yang dimiliki"
              />
              <CardContent className="space-y-6">
                <div className="divide-y divide-border rounded-2xl border border-border/60">
                  {armadaSummaryFields.map((field) => (
                    <div key={field.label} className="flex items-center justify-between gap-4 px-4 py-4">
                      <span className="text-sm font-medium text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-semibold text-foreground">{field.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Daftar Armada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Nama Armada</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Jenis Armada</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Vehicle ID</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Plat Nomor</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Total Booking</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Total Pendapatan</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Total Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {armadaRows.length > 0 ? (
                      armadaRows.map((armada, index) => (
                        <tr key={`${armada.id}-${index}`} className="align-middle">
                          <td className="px-4 py-4 text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-4 font-medium text-foreground">{armada.name || '-'}</td>
                          <td className="px-4 py-4 text-foreground">{armada.fleetType || '-'}</td>
                          <td className="px-4 py-4 text-foreground">{armada.vehicleId || '-'}</td>
                          <td className="px-4 py-4 text-foreground">{armada.plateNumber || '-'}</td>
                          <td className="px-4 py-4 text-foreground">{formatCount(armada.totalBooking)}</td>
                          <td className="px-4 py-4 text-foreground">{formatCurrency(armada.totalRevenue)}</td>
                          <td className="px-4 py-4 text-foreground">{formatCurrency(armada.totalExpense)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Data armada belum tersedia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
