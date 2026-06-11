import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Bus,
  CalendarDays,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Scale,
  User2,
  Users,
  Wallet,
  WalletMinimal,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardHeaderWithBadge, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContentScrollable,
  DialogScrollableBody,
  DialogStickyFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn, formatPhoneNumberId } from '@/lib/utils';
import * as XLSX from 'xlsx';

type PartnerOperationDetailData = {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAddress: string;
  partnerCity: string;
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

type PartnerFormValues = {
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  picName: string;
  partnerAddress: string;
  partnerCity: string;
  partnerCityLabel: string;
};

type CityOption = {
  value: string;
  label: string;
};

type FleetExportRow = {
  '#': number;
  'Nama Armada': string;
  'Jenis Armada': string;
  'Vehicle ID': string;
  'Plat Nomor': string;
  'Total Booking': number;
  'Total Pendapatan': number;
  'Total Pengeluaran': number;
  'Est Profit': number;
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

function formatDate(value: unknown): string {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDefaultFormValues(detail: PartnerOperationDetailData | null): PartnerFormValues {
  return {
    partnerName: detail?.partnerName ?? '',
    partnerEmail: detail?.partnerEmail ?? '',
    partnerPhone: detail?.partnerPhone ?? '',
    picName: detail?.picName ?? '',
    partnerAddress: detail?.partnerAddress ?? '',
    partnerCity: detail?.partnerCity ?? '',
    partnerCityLabel: detail?.partnerCityLabel ?? '',
  };
}

function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

function getCityOptions(payload: unknown): CityOption[] {
  return list(payload).map((item) => {
    const city = record(item);
    const value = toText(pickValue(city, ['city_id', 'cityId', 'id', 'value']));
    const label = toText(pickValue(city, ['city_name', 'cityName', 'name', 'label']));

    return {
      value,
      label: label || value,
    };
  }).filter((item) => item.value && item.label);
}

function formatTimestampForFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function toFleetExportRows(rows: ArmadaRow[]): FleetExportRow[] {
  return rows.map((armada, index) => ({
    '#': index + 1,
    'Nama Armada': armada.name || '-',
    'Jenis Armada': armada.fleetType || '-',
    'Vehicle ID': armada.vehicleId || '-',
    'Plat Nomor': armada.plateNumber || '-',
    'Total Booking': armada.totalBooking,
    'Total Pendapatan': armada.totalRevenue,
    'Total Pengeluaran': armada.totalExpense,
    'Est Profit': armada.totalRevenue - armada.totalExpense,
  }));
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<PartnerFormValues>(getDefaultFormValues(null));
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          partnerCity: String(obj.partner_city ?? obj.partnerCity ?? obj.city_id ?? obj.cityId ?? ''),
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

  useEffect(() => {
    setFormValues(getDefaultFormValues(detail));
  }, [detail]);

  useEffect(() => {
    if (!isFormOpen) setCityOpen(false);
  }, [isFormOpen]);

  useEffect(() => {
    if (!isFormOpen || cityOptions.length > 0) return;

    let cancelled = false;

    (async () => {
      setCitiesLoading(true);
      try {
        const res = await api.get<unknown>('/general/cities');
        if (cancelled || res.status !== 'success') return;

        const root = record(res.data);
        const cityData = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(root.data) ? root.data : (root.cities ?? root.items ?? res.data));

        setCityOptions(getCityOptions(cityData));
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cityOptions.length, isFormOpen]);

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
  const [fleetPage, setFleetPage] = useState(1);
  const [fleetPageSize, setFleetPageSize] = useState(10);
  const fleetStartIndex = (Math.max(1, fleetPage) - 1) * Math.max(1, fleetPageSize);

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
    () => ({
      left: [
        { label: 'Nama', value: detail?.partnerName || '-', icon: User2 },
        { label: 'Email', value: detail?.partnerEmail || partnerEmail || '-', icon: Mail },
        { label: 'Telepon', value: formatPhoneNumberId(detail?.partnerPhone), icon: Phone },
      ],
      right: [
        { label: 'PIC', value: detail?.picName || '-', icon: User2 },
        { label: 'Alamat', value: addressText, icon: MapPin },
        {
          label: 'Tanggal Bergabung',
          value: formatDate(
            pickValue(partnerRaw, ['joined_at', 'joinedAt', 'created_at', 'createdAt', 'register_date', 'registerDate']),
          ),
          icon: CalendarDays,
        },
      ],
    }),
    [addressText, detail?.partnerEmail, detail?.partnerName, detail?.partnerPhone, detail?.picName, partnerEmail, partnerRaw],
  );

  const formMode = detail ? 'edit' : 'create';
  const selectedCityLabel = useMemo(() => {
    return cityOptions.find((item) => item.value === formValues.partnerCity)?.label || formValues.partnerCityLabel || '-';
  }, [cityOptions, formValues.partnerCity, formValues.partnerCityLabel]);
  const fleetExportRows = useMemo(() => toFleetExportRows(armadaRows), [armadaRows]);

  const handleFormChange =
    (field: keyof PartnerFormValues) => (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const nextValue =
        field === 'partnerPhone' ? normalizePhoneNumber(event.target.value) : event.target.value;

      setFormValues((current) => ({ ...current, [field]: nextValue }));
    };

  const selectCity = (city: CityOption) => {
    setFormValues((current) => ({
      ...current,
      partnerCity: city.value,
      partnerCityLabel: city.label,
    }));
    setCityOpen(false);
  };

  const openForm = () => {
    setFormValues(getDefaultFormValues(detail));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setFormValues(getDefaultFormValues(detail));
    setIsFormOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeForm();
      return;
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = normalizePhoneNumber(formValues.partnerPhone);
    const payload = {
      partner_id: detail?.partnerId ?? '',
      partner_name: formValues.partnerName,
      partner_phone: normalizedPhone,
      partner_email: formValues.partnerEmail,
      partner_pic: formValues.picName,
      partner_address: formValues.partnerAddress,
      partner_city: formValues.partnerCity,
    };

    if (formMode === 'edit' && detail?.partnerId) {
      setIsSubmitting(true);
      try {
        const res = await api.post<unknown>('/partnership/operations/update', payload);
        if (res.status !== 'success') return;
      } finally {
        setIsSubmitting(false);
      }
    }

    setDetail((current) => ({
      partnerId: current?.partnerId ?? payload.partner_id,
      partnerName: formValues.partnerName,
      partnerEmail: formValues.partnerEmail,
      partnerAddress: formValues.partnerAddress,
      partnerCity: formValues.partnerCity,
      partnerCityLabel: formValues.partnerCityLabel,
      partnerPhone: normalizedPhone,
      picName: formValues.picName,
      raw: {
        ...(current?.raw ?? {}),
        partner_name: formValues.partnerName,
        partner_email: formValues.partnerEmail,
        partner_phone: normalizedPhone,
        pic_name: formValues.picName,
        partner_address: formValues.partnerAddress,
        partner_city: formValues.partnerCity,
        partner_city_label: formValues.partnerCityLabel,
      },
      totalUnit: current?.totalUnit ?? 0,
      totalSchedules: current?.totalSchedules ?? 0,
      totalRevenue: current?.totalRevenue ?? 0,
      totalExpenses: current?.totalExpenses ?? 0,
    }));

    setFormValues((current) => ({
      ...current,
      partnerPhone: normalizedPhone,
      partnerCityLabel: current.partnerCityLabel || selectedCityLabel,
    }));
    setIsFormOpen(false);
  };

  const handleDownloadFleetExcel = () => {
    if (!fleetExportRows.length) {
      toast({ title: 'Tidak ada data', description: 'Data armada belum tersedia untuk diunduh.', variant: 'destructive' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(fleetExportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Armada');
    XLSX.writeFile(workbook, `travego-fleet_revenue-${formatTimestampForFileName()}.xlsx`);
    toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh.' });
  };

  const handleCopyFleetToGoogleSheet = async () => {
    if (!fleetExportRows.length) {
      toast({ title: 'Tidak ada data', description: 'Data armada belum tersedia untuk disalin.', variant: 'destructive' });
      return;
    }

    const headers = Object.keys(fleetExportRows[0]);
    const rows = fleetExportRows.map((row) => headers.map((header) => String(row[header as keyof FleetExportRow] ?? '')));
    const tsv = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      toast({ title: 'Berhasil', description: 'Data armada disalin. Tempelkan langsung ke Google Sheet.' });
    } catch {
      toast({ title: 'Gagal', description: 'Tidak dapat menyalin data ke clipboard.', variant: 'destructive' });
    }
  };

  const fleetColumns = useMemo<Array<DataTableColumn<ArmadaRow>>>(() => {
    return [
      {
        label: '#',
        key: '__no__',
        width: 64,
        align: 'center',
        sortable: false,
        render: (_, rowIndex) => <span className="text-sm text-muted-foreground">{fleetStartIndex + rowIndex + 1}</span>,
      },
      {
        label: 'Nama Armada',
        key: 'name',
        sortable: true,
        width: 260,
        render: (row) => <span className="font-medium text-foreground whitespace-nowrap">{row.name || '-'}</span>,
      },
      {
        label: 'Jenis Armada',
        key: 'fleetType',
        sortable: true,
        width: 160,
        render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.fleetType || '-'}</span>,
      },
      {
        label: 'Vehicle ID',
        key: 'vehicleId',
        sortable: true,
        width: 160,
        render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.vehicleId || '-'}</span>,
      },
      {
        label: 'Plat Nomor',
        key: 'plateNumber',
        sortable: true,
        width: 160,
        render: (row) => <span className="text-sm text-foreground whitespace-nowrap">{row.plateNumber || '-'}</span>,
      },
      {
        label: 'Total Booking',
        key: 'totalBooking',
        sortable: true,
        width: 160,
        align: 'right',
        render: (row) => <span className="tabular-nums">{formatCount(row.totalBooking)}</span>,
      },
      {
        label: 'Total Pendapatan',
        key: 'totalRevenue',
        sortable: true,
        width: 200,
        align: 'right',
        render: (row) => <span className="tabular-nums">{formatCurrency(row.totalRevenue)}</span>,
      },
      {
        label: 'Total Pengeluaran',
        key: 'totalExpense',
        sortable: true,
        width: 200,
        align: 'right',
        render: (row) => <span className="tabular-nums">{formatCurrency(row.totalExpense)}</span>,
      },
    ];
  }, [fleetStartIndex]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-2xl border-slate-200 bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => navigate(`${basePrefix}`)}
                  className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Dashboard
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => navigate(`${basePrefix}/orders`)}
                  className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Mitra Operasional
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Detail</span>
              </div>
              <h1 className="mt-1 text-lg md:text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                <span className="sm:hidden">Detail Pertner Operasional</span>
                <span className="hidden sm:inline">Detail Pertner Operasional</span>
              </h1>
              <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Informasi lengkap partner operasional
              </p>
            </div>
          </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 sm:h-8 w-24 sm:w-28" />
                  <Skeleton className="h-4 w-44" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-8 w-56" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
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
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">Data mitra tidak ditemukan. Anda tetap bisa menambahkan informasi partner baru.</div>
              <Button onClick={openForm}>Tambah Informasi</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/60 shadow-sm">
                  <CardContent className="min-w-0 p-4 sm:p-5">
                    <div className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl ${item.className}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="mt-3 sm:mt-4 min-w-0 space-y-1">
                      <p className="text-[11px] sm:text-sm font-medium leading-tight text-muted-foreground">{item.title}</p>
                      <p className="break-words text-sm sm:text-xl lg:text-2xl font-semibold md:font-bold leading-tight tracking-tight text-foreground">
                        {item.value}
                      </p>
                      <p className="text-[10px] sm:text-xs leading-tight text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeaderWithBadge
                badgeIcon={Users}
                title="Informasi Customer"
                subtitle="Ringkasan data partner operasional"
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="sm:hidden h-9 w-9 rounded-2xl border-gray-200 bg-white hover:bg-gray-100 text-blue-600 hover:text-black"
                      onClick={openForm}
                      aria-label="Edit Informasi"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      className="hidden sm:flex h-10 rounded-2xl bg-white hover:bg-gray-100 px-4 text-blue-600 border-gray-200 hover:text-black transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-500/40 border-blue-500"
                      onClick={openForm}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Informasi
                    </Button>
                  </div>
                }
              />
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {[partnerFields.left, partnerFields.right].map((group, groupIndex) => (
                    <div key={groupIndex} className="divide-y divide-border rounded-2xl border border-border/60">
                      {group.map((field) => {
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeaderWithBadge
              className="pb-4"
              badgeIcon={Bus}
              title="Daftar Armada"
              subtitle="Ringkasan performa armada partner operasional"
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-2xl">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem className="gap-2" onClick={handleDownloadFleetExcel}>
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      Download ke excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => void handleCopyFleetToGoogleSheet()}>
                      <Copy className="h-4 w-4 text-blue-600" />
                      Copy ke Google Sheet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
            <CardContent>
              <DataTable
                data={armadaRows}
                columns={fleetColumns}
                loading={false}
                stickyHeader
                zebra
                tableClassName="table-auto w-full min-w-[1120px]"
                emptyTitle="Tidak ada data armada"
                emptyDescription="Data armada belum tersedia."
                pagination={{
                  page: fleetPage,
                  pageSize: fleetPageSize,
                  totalItems: armadaRows.length,
                  onPageChange: setFleetPage,
                  onPageSizeChange: (n) => {
                    setFleetPageSize(n);
                    setFleetPage(1);
                  },
                  pageSizeOptions: [10, 20, 50, 100],
                }}
                sorting={{ initialSort: { key: 'name', direction: 'asc' } }}
                rowKey={(row) => row.id}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContentScrollable className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 border-none bg-white overflow-hidden max-h-[80vh] md:max-h-[650px] flex flex-col">
          <div className="px-5 sm:px-6 pt-5 sm:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formMode === 'edit' ? 'Edit Informasi Partner' : 'Buat Informasi Partner'}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">
                    {formMode === 'edit'
                      ? 'Perbarui informasi partner operasional pada form berikut.'
                      : 'Lengkapi informasi partner operasional baru.'}
                  </div>
                </div>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </DialogClose>
            </div>
            <div className="mt-6 h-px bg-slate-100" />
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleFormSubmit}>
            <DialogScrollableBody className="px-5 sm:px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">NAMA</span>
                  <Input
                    value={formValues.partnerName}
                    onChange={handleFormChange('partnerName')}
                    className="h-12 rounded-xl"
                    placeholder="Masukkan nama partner"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">EMAIL</span>
                  <Input
                    type="email"
                    value={formValues.partnerEmail}
                    onChange={handleFormChange('partnerEmail')}
                    className="h-12 rounded-xl"
                    placeholder="Masukkan email"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">TELEPON</span>
                  <Input
                    value={formValues.partnerPhone}
                    onChange={handleFormChange('partnerPhone')}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-12 rounded-xl"
                    placeholder="Contoh: 628123456789"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">NAMA PIC</span>
                  <Input
                    value={formValues.picName}
                    onChange={handleFormChange('picName')}
                    className="h-12 rounded-xl"
                    placeholder="Masukkan nama PIC"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-800">ALAMAT</span>
                  <textarea
                    rows={4}
                    value={formValues.partnerAddress}
                    onChange={handleFormChange('partnerAddress')}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Masukkan alamat lengkap"
                  />
                </label>

                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-semibold text-slate-800">PILIH KOTA</div>
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityOpen}
                        className="w-full h-12 justify-between rounded-xl border-slate-200 bg-white font-normal"
                        disabled={citiesLoading || isSubmitting}
                      >
                        <span
                          className={cn(
                            'truncate text-left',
                            formValues.partnerCity ? 'text-slate-900' : 'text-slate-400',
                          )}
                        >
                          {formValues.partnerCity ? selectedCityLabel : citiesLoading ? 'Memuat kota...' : 'Pilih kota'}
                        </span>
                        {citiesLoading ? (
                          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl" align="start">
                      <Command>
                        <CommandInput placeholder="Cari kota..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada data</CommandEmpty>
                          <CommandGroup>
                            {cityOptions.map((city) => {
                              const selected = formValues.partnerCity === city.value;
                              return (
                                <CommandItem
                                  key={city.value}
                                  value={`${city.value} ${city.label}`}
                                  onSelect={() => selectCity(city)}
                                  className="rounded-lg"
                                >
                                  <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                  <span className="truncate">{city.label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </DialogScrollableBody>

            <DialogStickyFooter className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                className="rounded-xl shadow-none border-gray-200 border-2 transition-all text-gray-800"
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl shadow-none bg-blue-500 hover:bg-blue-600 transition-all text-white"
                disabled={isSubmitting || citiesLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : formMode === 'edit' ? (
                  'Simpan Perubahan'
                ) : (
                  'Simpan Informasi'
                )}
              </Button>
            </DialogStickyFooter>
          </form>
        </DialogContentScrollable>
      </Dialog>
    </div>
  );
};
