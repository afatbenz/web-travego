import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Ban, Calendar, ChevronRight, CreditCard, Mail, MapPin, MoreHorizontal, Pencil, Phone, Printer, Users } from 'lucide-react';
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
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  const params = useParams<{ order_id: string }>();
  const orderId = String(params.order_id ?? '').trim();
  const token = localStorage.getItem('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rootDetail, setRootDetail] = useState<Record<string, unknown> | null>(null);
  const [packageItineraries, setPackageItineraries] = useState<PackageItinerary[]>([]);
  const [packageFacilities, setPackageFacilities] = useState<string[]>([]);
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
      const pkgId = tourPackageId.trim();
      if (!pkgId) return;
      setLoadingPackage(true);
      try {
        const res = await fetchPackageDetail(token, pkgId);
        if (!active) return;
        setPackageItineraries(res.itineraries);
        setPackageFacilities(res.facilities);
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

  const paymentProgressPct = paymentStatusNum === 1 ? 100 : 0;

  const customerInitials = useMemo(() => {
    const raw = toStringSafe(customer.customer_name ?? customer.name).trim();
    if (!raw || raw === '-' || raw.toLowerCase() === 'null') return 'CU';
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? parts[0]?.[1] ?? '';
    const out = `${first}${second}`.toUpperCase().trim();
    return out || 'CU';
  }, [customer]);

  const orderTabsListRef = React.useRef<HTMLDivElement | null>(null);
  const orderTabTriggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [orderTabIndicator, setOrderTabIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const listEl = orderTabsListRef.current;
      const activeEl = orderTabTriggerRefs.current[orderTab];
      if (!listEl || !activeEl) {
        setOrderTabIndicator((prev) => (prev.width === 0 ? prev : { left: 0, width: 0 }));
        return;
      }
      const listRect = listEl.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const left = Math.max(0, activeRect.left - listRect.left);
      const width = Math.max(0, activeRect.width);
      setOrderTabIndicator({ left, width });
    };

    const raf = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, [orderTab]);

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
        <div className="sticky top-4 z-20 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
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
                  Pesanan
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Paket Wisata</span>
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Detail Pesanan Paket Wisata
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Order ID tidak ditemukan
              </p>
            </div>
          </div>
        </div>
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-6 text-sm text-slate-600 dark:text-slate-300">Order ID tidak ditemukan</CardContent>
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
      <div className="sticky top-4 z-20 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
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
                  Pesanan
                </button>
                <ChevronRight className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Paket Wisata</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Detail Pesanan
                </h1>
                <Badge className="rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {orderIdLabel}
                </Badge>
                {paymentBadge}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Informasi lengkap pesanan paket wisata
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              onClick={() => setEditing(true)}
              disabled={loading}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Pesanan
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              onClick={onScheduleOrPayment}
              disabled={loading}
            >
              {paymentStatusNum === 1 ? (
                <Calendar className="h-4 w-4 mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {scheduleLabel}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                >
                  More Action
                  <MoreHorizontal className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuItem className="cursor-pointer" onSelect={onPrintInvoice}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onSelect={onCancelOrder}>
                  <Ban className="mr-2 h-4 w-4" />
                  Batalkan Pesanan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 dark:text-white">Memuat...</CardTitle>
          </CardHeader>
          <CardContent className="p-6" />
        </Card>
      ) : editing ? (
        <TourPackageOrderForm mode="edit" orderId={orderId} readOnly={false} initialValues={initialValues} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Users className="h-5 w-5 text-[#295BFF]" />
                  <span>Informasi Customer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-slate-200 shadow-sm dark:border-slate-800">
                      <AvatarFallback className="bg-[#295BFF]/10 text-[#295BFF] font-semibold">
                        {customerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Customer</div>
                      <div className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                        {toStringSafe(customer.customer_name ?? customer.name) || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Phone className="h-4 w-4" />
                      Telepon
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                      {toStringSafe(customer.customer_phone ?? customer.phone) || '-'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-white">
                      {toStringSafe(customer.customer_email ?? customer.email) || '-'}
                    </div>
                  </div>
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <MapPin className="h-4 w-4" />
                      Alamat
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                      {toStringSafe(customer.customer_address ?? customer.address) || '-'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {toStringSafe(customer.customer_city ?? customer.city) || ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white">Informasi Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs value={orderTab} onValueChange={(v) => setOrderTab(v as typeof orderTab)}>
                  <div className="relative">
                    <TabsList ref={orderTabsListRef} className="relative w-full justify-start gap-6 border-slate-200 dark:border-slate-800">
                      <TabsTrigger
                        value="overview"
                        ref={(el) => {
                          orderTabTriggerRefs.current.overview = el;
                        }}
                        className="px-0 py-3 text-sm font-semibold text-slate-500 transition-colors data-[state=active]:border-[#295BFF] data-[state=active]:text-[#295BFF] dark:text-slate-400 dark:data-[state=active]:text-[#7FA0FF]"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="itinerary"
                        ref={(el) => {
                          orderTabTriggerRefs.current.itinerary = el;
                        }}
                        className="px-0 py-3 text-sm font-semibold text-slate-500 transition-colors data-[state=active]:border-[#295BFF] data-[state=active]:text-[#295BFF] dark:text-slate-400 dark:data-[state=active]:text-[#7FA0FF]"
                      >
                        Itinerary
                      </TabsTrigger>
                      <TabsTrigger
                        value="addons"
                        ref={(el) => {
                          orderTabTriggerRefs.current.addons = el;
                        }}
                        className="px-0 py-3 text-sm font-semibold text-slate-500 transition-colors data-[state=active]:border-[#295BFF] data-[state=active]:text-[#295BFF] dark:text-slate-400 dark:data-[state=active]:text-[#7FA0FF]"
                      >
                        Addons
                      </TabsTrigger>
                      <TabsTrigger
                        value="facilities"
                        ref={(el) => {
                          orderTabTriggerRefs.current.facilities = el;
                        }}
                        className="px-0 py-3 text-sm font-semibold text-slate-500 transition-colors data-[state=active]:border-[#295BFF] data-[state=active]:text-[#295BFF] dark:text-slate-400 dark:data-[state=active]:text-[#7FA0FF]"
                      >
                        Fasilitas
                      </TabsTrigger>
                      <TabsTrigger
                        value="tour_guide"
                        ref={(el) => {
                          orderTabTriggerRefs.current.tour_guide = el;
                        }}
                        className="px-0 py-3 text-sm font-semibold text-slate-500 transition-colors data-[state=active]:border-[#295BFF] data-[state=active]:text-[#295BFF] dark:text-slate-400 dark:data-[state=active]:text-[#7FA0FF]"
                      >
                        Tour Guide
                      </TabsTrigger>
                    </TabsList>
                    <div
                      className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-[#295BFF] transition-all duration-300"
                      style={{
                        width: `${orderTabIndicator.width}px`,
                        transform: `translateX(${orderTabIndicator.left}px)`,
                      }}
                    />
                  </div>

                  <div key={orderTab} className="pt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    {orderTab === 'overview' ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Order ID</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{orderIdLabel}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Paket Wisata</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                            {toStringSafe(order.tour_package_name ?? order.package_name ?? order.packageName) || '-'}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4" />
                            Tanggal Wisata
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Jumlah Peserta</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{totalPax} pax</div>
                        </div>
                        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <MapPin className="h-4 w-4" />
                            Penjemputan
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{pickupAddress || '-'}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pickupCityLabel || '-'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Member Pax</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{memberPax}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Official Pax</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{officialPax}</div>
                        </div>
                      </div>
                    ) : null}

                    {orderTab === 'itinerary' ? (
                      loadingPackage ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                          Memuat itinerary...
                        </div>
                      ) : packageItineraries.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                          Itinerary tidak tersedia
                        </div>
                      ) : (
                        <div className="relative space-y-4">
                          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                          {packageItineraries.map((day) => (
                            <div key={day.day} className="relative pl-7">
                              <div className="absolute left-[6px] top-6 h-2.5 w-2.5 rounded-full bg-[#295BFF]" />
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Hari {day.day}</div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Timeline</div>
                                  </div>
                                  <Badge className="rounded-full border border-[#295BFF]/20 bg-[#295BFF]/10 text-[#295BFF] shadow-sm">
                                    Itinerary
                                  </Badge>
                                </div>
                                <div className="mt-4 space-y-2">
                                  {day.activities.length === 0 ? (
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Aktivitas belum tersedia.</div>
                                  ) : (
                                    day.activities.map((a, idx) => (
                                      <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700 dark:text-slate-200">
                                          <span className="font-semibold text-slate-900 dark:text-white">
                                            {a.time ? a.time.slice(0, 5) : '-'}
                                          </span>
                                          <span className="text-slate-400">•</span>
                                          <span className="font-medium">{a.description || '-'}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          {[a.location, a.city_name ? a.city_name : a.city_id ? `City ID: ${a.city_id}` : '']
                                            .map((x) => String(x || '').trim())
                                            .filter(Boolean)
                                            .join(' • ')}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : null}

                    {orderTab === 'addons' ? (
                      addonsSelected.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                          Addon tidak tersedia
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {addonsSelected.map((a) => (
                            <div
                              key={a.addon_id || a.description}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-950"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{a.description || '-'}</div>
                                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{a.addon_id || '-'}</div>
                                </div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(a.price)}</div>
                              </div>
                            </div>
                          ))}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                              <span>Total Addon</span>
                              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(addonsTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : null}

                    {orderTab === 'facilities' ? (
                      loadingPackage ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                          Memuat fasilitas...
                        </div>
                      ) : packageFacilities.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                          Fasilitas tidak tersedia
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {packageFacilities.map((f) => (
                            <div
                              key={f}
                              className="group rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg/10 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-950"
                            >
                              {f}
                            </div>
                          ))}
                        </div>
                      )
                    ) : null}

                    {orderTab === 'tour_guide' ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tour guide</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {toStringSafe(order.tour_guide ?? order.tourGuide ?? '') || '-'}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-24">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-[#295BFF]" />
                  <span>Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment Status</div>
                    <div>{paymentBadge}</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Progress</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{paymentProgressPct}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-[#295BFF] transition-all duration-300" style={{ width: `${paymentProgressPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Total Tagihan</span>
                      <span className="text-base font-bold text-[#295BFF]">{formatCurrency(computedTotal)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Amount</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Addons</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(addonsTotal)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Biaya Tambahan</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(additionalAmount)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>Discount</span>
                      <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 dark:text-white">Timeline Order</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="relative space-y-4">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />

                  <div className="relative flex gap-3 pl-7">
                    <div className={cn('absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full', createdAt ? 'bg-[#295BFF]' : 'bg-slate-300 dark:bg-slate-700')} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Order Dibuat</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(createdAt)}</div>
                    </div>
                  </div>

                  <div className="relative flex gap-3 pl-7">
                    <div className={cn('absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full', paymentStatusNum === 1 ? 'bg-emerald-500' : 'bg-amber-500')} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Pembayaran</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{paymentStatusNum === 1 ? 'Lunas' : 'Belum Dibayar'}</div>
                    </div>
                  </div>

                  <div className="relative flex gap-3 pl-7">
                    <div className={cn('absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full', startDate ? 'bg-[#295BFF]' : 'bg-slate-300 dark:bg-slate-700')} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Perjalanan Dimulai</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(startDate)}</div>
                    </div>
                  </div>

                  <div className="relative flex gap-3 pl-7">
                    <div className={cn('absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full', endDate ? 'bg-[#295BFF]' : 'bg-slate-300 dark:bg-slate-700')} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Perjalanan Selesai</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(endDate)}</div>
                    </div>
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
