import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Ban, Calendar, CreditCard, Mail, MapPin, MoreHorizontal, Pencil, Phone, Printer, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { TourPackageOrderForm } from '@/pages/dashboard/orders/TourPackageOrderForm';

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

type PackageAddon = {
  addon_id: string;
  description: string;
  price: number;
};

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

const toNumberSafe = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0
  );

const formatDate = (value: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (value: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
};

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchPackageDetail(
  token: string,
  packageId: string
): Promise<{ itineraries: PackageItinerary[]; facilities: string[]; addons: PackageAddon[] }> {
  const headers = token ? { Authorization: token } : undefined;
  const res = await api.post<unknown>('/services/tour-packages/detail', { package_id: packageId }, headers);
  if (!res || res.status !== 'success') return { itineraries: [], facilities: [], addons: [] };
  const root = record(res.data);
  const meta = record(root.meta && typeof root.meta === 'object' ? root.meta : root);

  const facilitiesRaw = root.facilities ?? root.features ?? meta.facilities ?? meta.features;
  const facilities = Array.isArray(facilitiesRaw)
    ? (facilitiesRaw as unknown[]).map((x) => (typeof x === 'string' ? x : '')).filter((x) => x)
    : [];

  const addonsRaw = root.addons ?? meta.addons;
  const addons: PackageAddon[] = Array.isArray(addonsRaw)
    ? (addonsRaw as unknown[])
        .map((x) => {
          if (!x || typeof x !== 'object') return null;
          const obj = x as Record<string, unknown>;
          const addonIdRaw = obj.uuid ?? obj.addon_id ?? obj.id ?? obj.addonId;
          const addon_id = typeof addonIdRaw === 'string' || typeof addonIdRaw === 'number' ? String(addonIdRaw) : '';
          const description = typeof obj.description === 'string' ? obj.description : '';
          const price = typeof obj.price === 'number' ? obj.price : Number(obj.price ?? 0);
          return addon_id && description ? ({ addon_id, description, price } satisfies PackageAddon) : null;
        })
        .filter((v): v is PackageAddon => v !== null)
    : [];

  const itinerariesRaw = root.itineraries ?? root.itinerary ?? meta.itineraries ?? meta.itinerary;
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

  const itineraries: PackageItinerary[] = (() => {
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

  return { itineraries, facilities, addons };
}

export const TourOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams<{ order_id: string }>();
  const orderId = String(params.order_id ?? '').trim();
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rootDetail, setRootDetail] = useState<Record<string, unknown> | null>(null);
  const [packageItineraries, setPackageItineraries] = useState<PackageItinerary[]>([]);
  const [packageFacilities, setPackageFacilities] = useState<string[]>([]);
  const [packageAddons, setPackageAddons] = useState<PackageAddon[]>([]);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [orderTab, setOrderTab] = useState<'overview' | 'itinerary' | 'addons' | 'facilities' | 'tour_guide'>('overview');

  const loadDetail = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get<unknown>(`/services/tour-package/order/detail/${encodeURIComponent(orderId)}`, token ? { Authorization: token } : undefined);
      if (!res || res.status !== 'success') {
        setRootDetail(null);
        return;
      }
      setRootDetail(record(res.data));
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const customer = useMemo(() => record(rootDetail?.customers ?? rootDetail?.customer), [rootDetail]);
  const order = useMemo(() => record(rootDetail?.order), [rootDetail]);
  const addonsSelected = useMemo(() => {
    const arr = rootDetail?.addons;
    if (!Array.isArray(arr)) return [] as Array<{ addon_id: string; description: string; price: number }>;
    return (arr as unknown[])
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : null))
      .filter((x): x is Record<string, unknown> => Boolean(x))
      .map((x) => ({
        addon_id: toStringSafe(x.uuid ?? x.addon_id ?? x.id ?? x.addonId),
        description: toStringSafe(x.description),
        price: toNumberSafe(x.price, 0),
      }))
      .filter((x) => x.addon_id || x.description);
  }, [rootDetail]);

  const tourPackageId = useMemo(() => toStringSafe(order.tour_package_id ?? order.package_id ?? order.packageId), [order]);

  useEffect(() => {
    let active = true;
    const loadPackage = async () => {
      setPackageItineraries([]);
      setPackageFacilities([]);
      setPackageAddons([]);
      const pkgId = tourPackageId.trim();
      if (!pkgId) return;
      setLoadingPackage(true);
      try {
        const res = await fetchPackageDetail(token, pkgId);
        if (!active) return;
        setPackageItineraries(res.itineraries);
        setPackageFacilities(res.facilities);
        setPackageAddons(res.addons);
      } finally {
        if (active) setLoadingPackage(false);
      }
    };
    loadPackage();
    return () => {
      active = false;
    };
  }, [token, tourPackageId]);

  const paymentStatusNum = useMemo(() => toNumberSafe(order.payment_status ?? order.paymentStatus, 0), [order]);
  const scheduled = useMemo(() => Boolean(order.scheduled ?? order.is_scheduled ?? order.isScheduled), [order]);

  const paymentBadge = useMemo(() => {
    if (paymentStatusNum === 1) {
      return <Badge className="rounded-full bg-emerald-500/10 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">Lunas</Badge>;
    }
    if (paymentStatusNum === 0) {
      return <Badge className="rounded-full bg-amber-500/10 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">Belum Dibayar</Badge>;
    }
    return <Badge variant="secondary" className="rounded-full">{String(paymentStatusNum)}</Badge>;
  }, [paymentStatusNum]);

  const initialValues = useMemo(() => {
    const addon_ids = addonsSelected.map((a) => a.addon_id).filter((x) => x);
    const pickupCityId = toStringSafe(order.pickup_city_id ?? order.pickupCityId);
    const pickupCityName = toStringSafe(order.pickup_city_label ?? order.pickup_city_name ?? order.pickupCityName);
    return {
      order_id: toStringSafe(order.order_id ?? orderId),
      customer_id: toStringSafe(customer.customer_id ?? customer.id),
      customer_name: toStringSafe(customer.customer_name ?? customer.name),
      package_id: toStringSafe(order.tour_package_id ?? order.package_id ?? order.packageId),
      package_name: toStringSafe(order.tour_package_name ?? order.package_name ?? order.packageName),
      start_date: toStringSafe(order.start_date ?? order.startDate),
      end_date: toStringSafe(order.end_date ?? order.endDate),
      member_pax: toNumberSafe(order.member_pax ?? order.memberPax, 0),
      official_pax: toNumberSafe(order.official_pax ?? order.officialPax, 0),
      pickup_address: toStringSafe(order.pickup_address ?? order.pickupAddress),
      pickup_city_id: pickupCityId,
      pickup_city_name: pickupCityName,
      price_id: toStringSafe(order.price_id ?? order.priceId),
      addon_ids,
      special_request: toStringSafe(order.special_request ?? order.specialRequest),
      discount_amount: toNumberSafe(order.discount_amount ?? order.discountAmount, 0),
      additional_amount: toNumberSafe(order.additional_amount ?? order.additionalAmount, 0),
    };
  }, [addonsSelected, customer, order, orderId]);

  const onCancelOrder = async () => {
    if (!orderId) return;
    const result = await Swal.fire({
      title: 'Batalkan pesanan?',
      input: 'textarea',
      inputLabel: 'Alasan pembatalan',
      inputPlaceholder: 'Tulis alasan pembatalan...',
      inputAttributes: { autocapitalize: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Batalkan',
      cancelButtonText: 'Batal',
      preConfirm: (reason) => {
        const v = String(reason ?? '').trim();
        if (!v) {
          Swal.showValidationMessage('Alasan wajib diisi');
          return false;
        }
        return v;
      },
    });
    if (!result.isConfirmed) return;
    const reason = String(result.value ?? '').trim();
    const res = await api.post<unknown>(
      '/tour-package/order/cancel',
      { order_id: orderId, reason },
      token ? { Authorization: token } : undefined
    );
    if (res && res.status === 'success') {
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pesanan dibatalkan.' });
      navigate(`${basePrefix}/orders/tour`);
      return;
    }
    await Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan pesanan.' });
  };

  const onPrintInvoice = async () => {
    const customerName = toStringSafe(customer.customer_name ?? customer.name) || '-';
    const customerEmail = toStringSafe(customer.customer_email ?? customer.email) || '-';
    const customerPhone = toStringSafe(customer.customer_phone ?? customer.phone) || '-';
    const pickupAddress = toStringSafe(order.pickup_address ?? order.pickupAddress) || '-';
    const pickupCityLabel = toStringSafe(order.pickup_city_label ?? order.pickup_city_name ?? order.pickupCityName) || '-';
    const packageName = toStringSafe(order.tour_package_name ?? order.package_name ?? order.packageName) || '-';
    const startDate = toStringSafe(order.start_date ?? order.startDate);
    const endDate = toStringSafe(order.end_date ?? order.endDate);

    const memberPax = toNumberSafe(order.member_pax ?? order.memberPax, 0);
    const officialPax = toNumberSafe(order.official_pax ?? order.officialPax, 0);
    const totalPax = toNumberSafe(order.total_pax ?? order.totalPax, memberPax + officialPax);

    const totalAmount = toNumberSafe(order.total_amount ?? order.totalAmount, 0);
    const discountAmount = toNumberSafe(order.discount_amount ?? order.discountAmount, 0);
    const additionalAmount = toNumberSafe(order.additional_amount ?? order.additionalAmount, 0);
    const addonsTotal = addonsSelected.reduce((acc, a) => acc + toNumberSafe(a.price, 0), 0);
    const computed = Math.max(0, totalAmount + addonsTotal + additionalAmount - discountAmount);

    const addonsHtml =
      addonsSelected.length > 0
        ? `
      <div style="margin-top:12px">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px">Addons</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">Addon</th>
              <th style="border:1px solid #e5e7eb;padding:8px;text-align:right;background:#f9fafb">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${addonsSelected
              .map(
                (a) => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(a.description || '-')}</td>
                <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${escapeHtml(formatCurrency(a.price))}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
        : '';

    const html = `
      <div style="text-align:left;background:#f3f4f6;padding:12px;border-radius:14px">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
          <div style="padding:12px 16px">
            <div style="font-size:14px;font-weight:700">Invoice</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">${escapeHtml(orderId)}</div>
            <div style="height:1px;background:#e5e7eb;margin:10px 0 0 0"></div>
          </div>

          <div style="padding:14px 16px;font-size:13px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <div style="font-weight:600;margin-bottom:8px">Customer</div>
                <div><b>Nama</b>: ${escapeHtml(customerName)}</div>
                <div><b>Telepon</b>: ${escapeHtml(customerPhone)}</div>
                <div><b>Email</b>: ${escapeHtml(customerEmail)}</div>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:8px">Pesanan</div>
                <div><b>Paket</b>: ${escapeHtml(packageName)}</div>
                <div><b>Tanggal</b>: ${escapeHtml(formatDate(startDate))} - ${escapeHtml(formatDate(endDate))}</div>
                <div><b>Alamat</b>: ${escapeHtml(pickupAddress)}</div>
                <div><b>Kota</b>: ${escapeHtml(pickupCityLabel)}</div>
              </div>
            </div>

            <div style="height:1px;background:#e5e7eb;margin:14px 0"></div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <div style="font-weight:600;margin-bottom:8px">Peserta</div>
                <div><b>Member</b>: ${escapeHtml(String(memberPax))}</div>
                <div><b>Official</b>: ${escapeHtml(String(officialPax))}</div>
                <div><b>Total</b>: ${escapeHtml(String(totalPax))}</div>
              </div>
              <div>
                <div style="font-weight:600;margin-bottom:8px">Pembayaran</div>
                <div><b>Total Amount</b>: ${escapeHtml(formatCurrency(totalAmount))}</div>
                <div><b>Addons</b>: ${escapeHtml(formatCurrency(addonsTotal))}</div>
                <div><b>Biaya Tambahan</b>: ${escapeHtml(formatCurrency(additionalAmount))}</div>
                <div><b>Discount</b>: ${escapeHtml(formatCurrency(discountAmount))}</div>
                <div style="margin-top:6px"><b>Total Tagihan</b>: ${escapeHtml(formatCurrency(computed))}</div>
              </div>
            </div>

            ${addonsHtml}
          </div>
        </div>
      </div>
    `;

    const printWindowHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice</title>
    <style>
      @page { margin: 16mm; }
      body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #ffffff; }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;

    await Swal.fire({
      html,
      width: 900,
      showCloseButton: true,
      showDenyButton: true,
      denyButtonText:
        '<span style="display:inline-flex;align-items:center;gap:8px">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M6 9V2h12v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 14h12v8H6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        'Print Invoice' +
        '</span>',
      confirmButtonText:
        '<span style="display:inline-flex;align-items:center;gap:8px">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
        'Tutup' +
        '</span>',
      heightAuto: false,
      customClass: {
        popup: 'order-preview-popup',
      },
      preDeny: () => {
        const w = window.open('', 'ORDER_INVOICE_PRINT', 'height=700,width=900');
        if (!w) return false;
        w.document.open();
        w.document.write(printWindowHtml);
        w.document.close();
        w.focus();
        w.print();
        w.close();
        return false;
      },
    });
  };

  const scheduleLabel = paymentStatusNum === 1 ? (scheduled ? 'Lihat Jadwal' : 'Buat Jadwal Tim') : 'Update Pembayaran';

  const onScheduleOrPayment = () => {
    if (paymentStatusNum === 1) {
      navigate(`${basePrefix}/schedules/team-schedules?order_id=${encodeURIComponent(orderId)}`);
      return;
    }
    Swal.fire({ icon: 'info', title: 'Update Pembayaran', text: 'Fitur ini belum tersedia untuk tour order.' });
  };

  if (!orderId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="!w-auto !h-auto p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Pesanan Paket Wisata</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">Order ID tidak ditemukan</CardContent>
        </Card>
      </div>
    );
  }

  const orderIdLabel = toStringSafe(order.order_id ?? orderId);
  const createdAt = toStringSafe(order.created_at ?? order.createdAt);
  const startDate = toStringSafe(order.start_date ?? order.startDate);
  const endDate = toStringSafe(order.end_date ?? order.endDate);
  const pickupAddress = toStringSafe(order.pickup_address ?? order.pickupAddress);
  const pickupCityLabel = toStringSafe(order.pickup_city_label ?? order.pickup_city_name ?? order.pickupCityName);
  const memberPax = toNumberSafe(order.member_pax ?? order.memberPax, 0);
  const officialPax = toNumberSafe(order.official_pax ?? order.officialPax, 0);
  const totalPax = toNumberSafe(order.total_pax ?? order.totalPax, memberPax + officialPax);
  const totalAmount = toNumberSafe(order.total_amount ?? order.totalAmount, 0);
  const discountAmount = toNumberSafe(order.discount_amount ?? order.discountAmount, 0);
  const additionalAmount = toNumberSafe(order.additional_amount ?? order.additionalAmount, 0);
  const addonsTotal = addonsSelected.reduce((acc, a) => acc + toNumberSafe(a.price, 0), 0);
  const computedTotal = Math.max(0, totalAmount + addonsTotal + additionalAmount - discountAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="!w-auto !h-auto p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Order {orderIdLabel}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi lengkap pesanan paket wisata</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {paymentBadge}
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
            onClick={onPrintInvoice}
            disabled={loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
          {paymentStatusNum !== 1 ? (
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              onClick={onScheduleOrPayment}
              disabled={loading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Update Pembayaran
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              onClick={onScheduleOrPayment}
              disabled={loading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {scheduleLabel}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[190px]">
              <DropdownMenuItem className="cursor-pointer" onSelect={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Pesanan
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onSelect={onCancelOrder}>
                <Ban className="mr-2 h-4 w-4" />
                Batalkan Pesanan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Memuat...</CardTitle>
          </CardHeader>
          <CardContent className="p-6" />
        </Card>
      ) : editing ? (
        <TourPackageOrderForm mode="edit" orderId={orderId} readOnly={false} initialValues={initialValues} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Informasi Customer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama</div>
                    <div className="text-gray-900 dark:text-white">{toStringSafe(customer.customer_name ?? customer.name) || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telepon
                    </div>
                    <div className="text-gray-900 dark:text-white">{toStringSafe(customer.customer_phone ?? customer.phone) || '-'}</div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div className="text-gray-900 dark:text-white">{toStringSafe(customer.customer_email ?? customer.email) || '-'}</div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Alamat
                    </div>
                    <div className="text-gray-900 dark:text-white">{toStringSafe(customer.customer_address ?? customer.address) || '-'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{toStringSafe(customer.customer_city ?? customer.city) || ''}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informasi Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={orderTab} onValueChange={(v) => setOrderTab(v as typeof orderTab)}>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="addons">Addons</TabsTrigger>
                    <TabsTrigger value="facilities">Fasilitas</TabsTrigger>
                    <TabsTrigger value="tour_guide">Tour Guide</TabsTrigger>
                  </TabsList>

                  <div className="min-h-[420px] max-h-[620px] overflow-y-auto">
                    <TabsContent value="overview" className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID</div>
                          <div className="text-gray-900 dark:text-white font-medium">{orderIdLabel}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Paket Wisata</div>
                          <div className="text-gray-900 dark:text-white">{toStringSafe(order.tour_package_name ?? order.package_name ?? order.packageName) || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Tanggal Wisata</div>
                          <div className="text-gray-900 dark:text-white">{formatDate(startDate)} - {formatDate(endDate)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Jumlah Peserta</div>
                          <div className="text-gray-900 dark:text-white">{totalPax} pax</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Penjemputan
                          </div>
                          <div className="text-gray-900 dark:text-white">{pickupAddress || '-'}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{pickupCityLabel || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Member Pax</div>
                          <div className="text-gray-900 dark:text-white">{memberPax}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Official Pax</div>
                          <div className="text-gray-900 dark:text-white">{officialPax}</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="itinerary" className="pt-4">
                      {loadingPackage ? (
                        <div className="py-8 text-center text-gray-500">Memuat itinerary...</div>
                      ) : packageItineraries.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">Itinerary tidak tersedia</div>
                      ) : (
                        <div className="space-y-4">
                          {packageItineraries.map((day) => (
                            <div key={day.day} className="border-l-4 border-blue-500 pl-4">
                              <div className="font-medium text-gray-900 dark:text-white mb-2">Hari {day.day}</div>
                              <div className="space-y-2">
                                {day.activities.map((a, idx) => (
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
                      )}
                    </TabsContent>

                    <TabsContent value="addons" className="pt-4">
                      {addonsSelected.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">Addon tidak tersedia</div>
                      ) : (
                        <div className="space-y-3">
                          {addonsSelected.map((a) => (
                            <div key={a.addon_id || a.description} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.description || '-'}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{a.addon_id || '-'}</div>
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(a.price)}</div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-gray-600 dark:text-gray-300">Total Addon</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(addonsTotal)}</div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="facilities" className="pt-4">
                      {loadingPackage ? (
                        <div className="py-8 text-center text-gray-500">Memuat fasilitas...</div>
                      ) : packageFacilities.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">Fasilitas tidak tersedia</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {packageFacilities.map((f) => (
                            <Badge key={f} variant="outline">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="tour_guide" className="pt-4 space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Tour guide</div>
                      <div className="text-gray-900 dark:text-white">{toStringSafe(order.tour_guide ?? order.tourGuide ?? '') || '-'}</div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Informasi Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Status Pembayaran</div>
                  <div className="mt-1">{paymentBadge}</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Amount</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Addons</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(addonsTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Biaya Tambahan</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(additionalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Discount</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(discountAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Total Tagihan</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(computedTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Line Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', createdAt ? 'bg-blue-500' : 'bg-gray-300')} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Order Dibuat</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{formatDateTime(createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', paymentStatusNum === 1 ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Pembayaran</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{paymentStatusNum === 1 ? 'Lunas' : 'Belum Dibayar'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', startDate ? 'bg-blue-500' : 'bg-gray-300')} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Dimulai</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{formatDate(startDate)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={cn('w-3 h-3 rounded-full', endDate ? 'bg-blue-500' : 'bg-gray-300')} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Perjalanan Selesai</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{formatDate(endDate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
