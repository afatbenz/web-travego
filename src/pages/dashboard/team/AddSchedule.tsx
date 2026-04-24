import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Car, Users, Check, ChevronsUpDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export const AddSchedule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('order_id') ?? '';

  const [orderId] = useState(initialOrderId);
  const [resolvedOrderId, setResolvedOrderId] = useState(initialOrderId);
  const [orderTypeLabel, setOrderTypeLabel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [scheduleStartAt, setScheduleStartAt] = useState('');
  const [scheduleEndAt, setScheduleEndAt] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [garageOutTime, setGarageOutTime] = useState('');
  const [garageInTime, setGarageInTime] = useState('');

  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitOptionsByFleet, setUnitOptionsByFleet] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [unitPickerOpen, setUnitPickerOpen] = useState<Record<number, boolean>>({});
  const [fleetUnitSlots, setFleetUnitSlots] = useState<Array<{ fleetId: string; fleetName: string }>>([]);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);

  const [assignments, setAssignments] = useState<
    Array<{ unitId: string; driverUuid: string; crewUuid: string; extraPairs: Array<{ driverUuid: string; crewUuid: string }> }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const record = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const toStringSafe = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
  const toNumberSafe = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const getErrorCode = (v: unknown) => {
    if (!v || typeof v !== 'object') return '';
    const obj = v as Record<string, unknown>;
    const nestedData = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : {};
    const nestedResponse =
      obj.response && typeof obj.response === 'object' ? (obj.response as Record<string, unknown>) : {};
    const nestedResponseData =
      nestedResponse.data && typeof nestedResponse.data === 'object'
        ? (nestedResponse.data as Record<string, unknown>)
        : {};
    return toStringSafe(
      obj.message ??
        obj.error ??
        nestedData.message ??
        nestedData.error ??
        nestedResponseData.message ??
        nestedResponseData.error
    ).trim();
  };

  const isEditMode = Boolean(searchParams.get('mode') === 'edit' || searchParams.get('schedule_id') || searchParams.get('scheduleId'));

  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/services/employee/operations', token ? { Authorization: token } : undefined);
        if (res.status !== 'success') {
          setEmployeeOptions([]);
          return;
        }

        const payload = res.data as unknown;
        let items: unknown[] = [];
        if (Array.isArray(payload)) items = payload;
        else if (payload && typeof payload === 'object') {
          const root = payload as Record<string, unknown>;
          const dataNode = root.data as unknown;
          const listNode =
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).items : undefined) ??
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).rows : undefined) ??
            (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).data : undefined) ??
            root.items ??
            root.rows ??
            root.data;
          if (Array.isArray(listNode)) items = listNode;
          else if (Array.isArray(dataNode)) items = dataNode;
        }

        const mapped = items
          .map((raw) => record(raw))
          .map((o) => {
            const value = toStringSafe(o.uuid ?? o.id ?? o.value).trim();
            const employeeId = toStringSafe(o.employee_id ?? o.employeeId ?? o.nik).trim();
            const fullname = toStringSafe(o.fullname ?? o.full_name ?? o.name).trim();
            const label = `${employeeId || value}${fullname ? ` - ${fullname}` : ''}`.trim();
            return value ? { value, label: label || value } : null;
          })
          .filter((x): x is { value: string; label: string } => Boolean(x));

        setEmployeeOptions(mapped);
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!orderId) {
      setResolvedOrderId('');
      setOrderTypeLabel('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setScheduleStartAt('');
      setScheduleEndAt('');
      setDestinationText('');
      setQuantity(0);
      setFleetUnitSlots([]);
      setUnitOptionsByFleet({});
      setGarageOutTime('');
      setGarageInTime('');
      setAssignments([]);
      return;
    }
    const loadDetail = async () => {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(
        `/services/fleet/order/detail/${encodeURIComponent(orderId)}`,
        token ? { Authorization: token } : undefined
      );
      if (res.status !== 'success') return;

      const root = record(res.data);
      const detail = record(root.order ?? root.transaction ?? root.detail ?? root);
      const pickup = record(detail.pickup);
      const customer = record(detail.customer);
      const itineraryRaw = detail.itinerary;
      const nextResolvedOrderId = toStringSafe(root.order_id ?? detail.order_id ?? detail.orderId ?? orderId).trim();
      const nextFleetId = toStringSafe(detail.fleet_id ?? detail.fleetId).trim();
      const nextQty = toNumberSafe(detail.quantity ?? detail.qty ?? detail.unit_qty ?? detail.unitQty);
      const rawFleets = Array.isArray(root.fleets) ? root.fleets : Array.isArray(detail.fleets) ? detail.fleets : [];
      const nextOrderTypeLabel = toStringSafe(
        detail.order_type_label ??
          detail.orderTypeLabel ??
          detail.rent_type_label ??
          detail.rentTypeLabel ??
          detail.category ??
          'Armada'
      ).trim();

      const nextCustomerName = toStringSafe(customer.customer_name ?? customer.customerName ?? detail.customer_name ?? detail.customerName).trim();
      const nextCustomerPhone = toStringSafe(
        customer.customer_phone ?? customer.customerPhone ?? customer.customer_telephone ?? customer.customerTelephone ?? customer.telephone,
      ).trim();
      const nextCustomerEmail = toStringSafe(customer.customer_email ?? customer.customerEmail ?? customer.email).trim();
      const pickupLocationRaw = toStringSafe(pickup.pickup_location ?? pickup.pickupLocation).trim();
      const pickupCityLabel = toStringSafe(pickup.city_label ?? pickup.cityLabel).trim();
      const nextCustomerAddress = (pickupLocationRaw && pickupCityLabel ? `${pickupLocationRaw}, ${pickupCityLabel}` : pickupLocationRaw).trim();

      const pickupAtRaw = toStringSafe(pickup.pickup_at ?? pickup.pickupAt).trim();
      const pickupDateRaw = toStringSafe(pickup.start_date ?? pickup.startDate ?? detail.start_date ?? detail.startDate).trim();
      const pickupTimeRaw = toStringSafe(pickup.pickup_time ?? pickup.pickupTime).trim();
      const scheduleStartCandidate = pickupAtRaw || (pickupDateRaw && pickupTimeRaw ? `${pickupDateRaw}T${pickupTimeRaw}` : pickupDateRaw);

      const dropoffAtRaw = toStringSafe(pickup.dropoff_at ?? pickup.dropoffAt).trim();
      const dropoffDateRaw = toStringSafe(pickup.end_date ?? pickup.endDate ?? detail.end_date ?? detail.endDate).trim();
      const dropoffTimeRaw = toStringSafe(pickup.dropoff_time ?? pickup.dropoffTime).trim();
      const scheduleEndCandidate = dropoffAtRaw || (dropoffDateRaw && dropoffTimeRaw ? `${dropoffDateRaw}T${dropoffTimeRaw}` : dropoffDateRaw);

      let destinationCity = '';
      if (Array.isArray(itineraryRaw)) {
        const labels = itineraryRaw
          .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
          .map((x) => {
            const o = x as Record<string, unknown>;
            return toStringSafe(o.city_label ?? o.cityLabel).trim();
          })
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i);
        destinationCity = labels.join(' - ');
      }
      const nextDestinationText = destinationCity;

      const nextFleetSlotsFromResponse = rawFleets
        .map((raw) => record(raw))
        .flatMap((fleet) => {
          const fleetIdValue = toStringSafe(fleet.fleet_id ?? fleet.fleetId ?? fleet.id).trim();
          const fleetNameValue = toStringSafe(fleet.fleet_name ?? fleet.fleetName ?? fleet.name).trim() || 'Armada';
          const qty = Math.max(0, toNumberSafe(fleet.quantity ?? fleet.qty ?? fleet.unit_qty ?? fleet.unitQty));
          if (!fleetIdValue || qty <= 0) return [];
          return Array.from({ length: qty }, () => ({ fleetId: fleetIdValue, fleetName: fleetNameValue }));
        });

      const fallbackFleetSlots =
        nextFleetId && nextQty > 0 ? Array.from({ length: nextQty }, () => ({ fleetId: nextFleetId, fleetName: 'Armada' })) : [];
      const nextFleetSlots = nextFleetSlotsFromResponse.length > 0 ? nextFleetSlotsFromResponse : fallbackFleetSlots;

      setResolvedOrderId(nextResolvedOrderId);
      setOrderTypeLabel(nextOrderTypeLabel);
      setCustomerName(nextCustomerName);
      setCustomerPhone(nextCustomerPhone);
      setCustomerEmail(nextCustomerEmail);
      setCustomerAddress(nextCustomerAddress);
      setScheduleStartAt(scheduleStartCandidate);
      setScheduleEndAt(scheduleEndCandidate);
      setDestinationText(nextDestinationText);
      setQuantity(nextFleetSlots.length || nextQty);
      setFleetUnitSlots(nextFleetSlots);
    };
    loadDetail();
  }, [orderId, searchParams]);

  useEffect(() => {
    setAssignments((prev) => {
      const target = Math.max(0, quantity);
      const next = [...prev];
      while (next.length < target) next.push({ unitId: '', driverUuid: '', crewUuid: '', extraPairs: [] });
      if (next.length > target) next.splice(target);
      return next;
    });
  }, [quantity]);

  useEffect(() => {
    const fleetIds = Array.from(new Set(fleetUnitSlots.map((slot) => slot.fleetId).filter(Boolean)));
    if (fleetIds.length === 0) {
      setUnitOptionsByFleet({});
      return;
    }
    const loadUnits = async () => {
      setLoadingUnits(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const entries = await Promise.all(
          fleetIds.map(async (currentFleetId) => {
            const qs = new URLSearchParams();
            qs.set('fleet_id', currentFleetId);
            qs.set('limit', '200');
            const res = await api.get<unknown>(`/services/fleet-units?${qs.toString()}`, token ? { Authorization: token } : undefined);
            if (res.status !== 'success') return [currentFleetId, []] as const;

            const payload = res.data as unknown;
            let items: unknown[] = [];
            if (Array.isArray(payload)) items = payload;
            else if (payload && typeof payload === 'object') {
              const root = payload as Record<string, unknown>;
              const dataNode = root.data as unknown;
              const listNode =
                (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).items : undefined) ??
                (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).units : undefined) ??
                (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).rows : undefined) ??
                (dataNode && typeof dataNode === 'object' ? (dataNode as Record<string, unknown>).data : undefined) ??
                root.items ??
                root.units ??
                root.rows ??
                root.data;
              if (Array.isArray(listNode)) items = listNode;
              else if (Array.isArray(dataNode)) items = dataNode;
            }

            const mapped = items
              .map((raw) => record(raw))
              .map((o) => {
                const unitId = toStringSafe(o.unit_id ?? o.unitId ?? o.id).trim();
                const vehicleId = toStringSafe(o.vehicle_id ?? o.vehicleId).trim();
                const plate = toStringSafe(o.plate_number ?? o.plateNumber).trim();
                const label = `${vehicleId || '-'} - ${plate || '-'}`;
                return unitId ? { value: unitId, label } : null;
              })
              .filter((x): x is { value: string; label: string } => Boolean(x));

            return [currentFleetId, mapped] as const;
          })
        );
        setUnitOptionsByFleet(Object.fromEntries(entries));
      } finally {
        setLoadingUnits(false);
      }
    };
    loadUnits();
  }, [fleetUnitSlots]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!orderId.trim()) nextErrors.orderId = 'Order ID wajib dipilih';
    if (fleetUnitSlots.length <= 0) nextErrors.orderId = nextErrors.orderId || 'Order tidak valid';
    if (quantity <= 0) nextErrors.orderId = nextErrors.orderId || 'Order tidak valid';
    if (!garageOutTime) nextErrors.garageOutTime = 'Jam keluar garasi wajib diisi';
    if (isEditMode && !garageInTime) nextErrors.garageInTime = 'Jam kembali garasi wajib diisi';
    assignments.forEach((a, idx) => {
      const base = `assignments.${idx}`;
      if (!a.unitId) nextErrors[`${base}.unitId`] = 'Wajib';
      if (!a.driverUuid) nextErrors[`${base}.driverUuid`] = 'Wajib';
      if (!a.crewUuid) nextErrors[`${base}.crewUuid`] = 'Wajib';
      (a.extraPairs ?? []).forEach((p, j) => {
        const extraBase = `${base}.extraPairs.${j}`;
        if (!p.driverUuid) nextErrors[`${extraBase}.driverUuid`] = 'Wajib';
        if (!p.crewUuid) nextErrors[`${extraBase}.crewUuid`] = 'Wajib';
      });
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitReady = useMemo(() => {
    if (!orderId.trim()) return false;
    if (fleetUnitSlots.length <= 0) return false;
    if (quantity <= 0) return false;
    if (!garageOutTime) return false;
    if (isEditMode && !garageInTime) return false;
    if (assignments.length !== quantity) return false;
    for (const a of assignments) {
      if (!a.unitId || !a.driverUuid || !a.crewUuid) return false;
      for (const p of a.extraPairs ?? []) {
        if (!p.driverUuid || !p.crewUuid) return false;
      }
    }
    return true;
  }, [assignments, fleetUnitSlots, garageInTime, garageOutTime, isEditMode, orderId, quantity]);

  const formatDdMmmmYyyyHhMm = (value: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/[.,]/g, '');
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date} ${time}`.replace(/\s+/g, ' ').trim();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setSubmitError('');
    setSaving(true);
    try {
      const assignmentUnits = assignments.map((assignment, index) => {
        const slot = fleetUnitSlots[index];
        const extraPairs = assignment.extraPairs ?? [];
        const driverId = [assignment.driverUuid, ...extraPairs.map((pair) => pair.driverUuid)].filter((id) => Boolean(id.trim()));
        const crewIds = [assignment.crewUuid, ...extraPairs.map((pair) => pair.crewUuid)].filter((id) => Boolean(id.trim()));
        return {
          fleet_id: slot?.fleetId ?? '',
          unit_id: assignment.unitId,
          driver_id: driverId,
          crew_ids: crewIds,
        };
      });

      const payload = {
        order_id: (resolvedOrderId || orderId).trim(),
        departure_time: garageOutTime,
        assignment_units: assignmentUnits,
      };
      const token = localStorage.getItem('token') ?? '';
      const res = await api.post<unknown>('/services/schedule/create', payload, token ? { Authorization: token } : undefined);
      if (res.status !== 'success') {
        const errorCode = getErrorCode(res);
        if (errorCode === 'ORDER_UNPAID') {
          await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order belum dibayar. Silakan lakukan pembayaran' });
          return;
        }
        if (errorCode === 'ORDER_CANCELLED') {
          await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order telah dibatalkan' });
          return;
        }
        if (errorCode === 'ORDER_ID_NOT_FOUND') {
          await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order tidak ditemukan. Coba lagi' });
          return;
        }
        setSubmitError('Gagal menyimpan jadwal. Silakan coba lagi.');
        return;
      }
      navigate(`${basePrefix}/team/schedule-armada`);
    } catch (error) {
      const errorCode = getErrorCode(error);
      if (errorCode === 'ORDER_UNPAID') {
        await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order belum dibayar. Silakan lakukan pembayaran' });
        return;
      }
      if (errorCode === 'ORDER_CANCELLED') {
        await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order telah dibatalkan' });
        return;
      }
      if (errorCode === 'ORDER_ID_NOT_FOUND') {
        await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Order tidak ditemukan. Coba lagi' });
        return;
      }
      setSubmitError('Gagal menyimpan jadwal. Periksa koneksi dan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${basePrefix}/team/schedule-armada`)}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Penjadwalan Armada
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Tambahkan jadwal baru untuk armada
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Informasi Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID *</label>
                  <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-center">
                    {resolvedOrderId || orderId || '-'}
                  </div>
                  {errors.orderId ? <p className="text-sm text-red-500">{errors.orderId}</p> : null}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Type</div>
                  <div className="h-10 flex items-center text-gray-900 dark:text-white">{orderTypeLabel || 'Armada'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Jadwal Keberangkatan</div>
                  <div className="text-gray-900 dark:text-white">{formatDdMmmmYyyyHhMm(scheduleStartAt)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Jadwal Kembali</div>
                  <div className="text-gray-900 dark:text-white">{formatDdMmmmYyyyHhMm(scheduleEndAt)}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Tujuan</div>
                <div className="text-gray-900 dark:text-white">{destinationText || '-'}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jam Keluar Garasi *</label>
                  <Input
                    type="datetime-local"
                    value={garageOutTime}
                    onChange={(e) => {
                      setGarageOutTime(e.target.value);
                      if (errors.garageOutTime) setErrors((prev) => ({ ...prev, garageOutTime: '' }));
                    }}
                    disabled={!orderId}
                    className={errors.garageOutTime ? 'border-red-500' : ''}
                  />
                  {errors.garageOutTime ? <p className="text-sm text-red-500">{errors.garageOutTime}</p> : null}
                </div>

                {isEditMode ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jam Kembali Garasi *</label>
                    <Input
                      type="time"
                      value={garageInTime}
                      onChange={(e) => {
                        setGarageInTime(e.target.value);
                        if (errors.garageInTime) setErrors((prev) => ({ ...prev, garageInTime: '' }));
                      }}
                      disabled={!orderId}
                      className={errors.garageInTime ? 'border-red-500' : ''}
                    />
                    {errors.garageInTime ? <p className="text-sm text-red-500">{errors.garageInTime}</p> : null}
                  </div>
                ) : (
                  <div className="hidden lg:block" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Nama Pelanggan</div>
                <div className="text-gray-900 dark:text-white">{customerName || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">No. HP</div>
                <div className="text-gray-900 dark:text-white">{customerPhone || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</div>
                <div className="text-gray-900 dark:text-white">{customerEmail || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Alamat Penjemputan</div>
                <div className="text-gray-900 dark:text-white">{customerAddress || '-'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informasi Armada dan Petugas
            </CardTitle>
            {quantity > 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">{quantity} unit perlu ditugaskan sebelum jadwal disimpan.</p>
            ) : null}
          </CardHeader>
          <CardContent>
            {quantity <= 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Pilih order untuk memuat petugas.</div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-slate-900/40 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Unit {idx + 1}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{fleetUnitSlots[idx]?.fleetName || 'Armada'}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() =>
                          setAssignments((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, extraPairs: [...(x.extraPairs ?? []), { driverUuid: '', crewUuid: '' }] } : x
                            )
                          )
                        }
                      >
                        Tambah Driver / Crew
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Pilih Armada *</label>
                        <Popover
                          open={Boolean(unitPickerOpen[idx])}
                          onOpenChange={(open) => setUnitPickerOpen((prev) => ({ ...prev, [idx]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={Boolean(unitPickerOpen[idx])}
                              className={cn('w-full justify-between', errors[`assignments.${idx}.unitId`] && 'border-red-500')}
                              disabled={loadingUnits}
                            >
                              {loadingUnits
                                ? 'Memuat...'
                                : a.unitId
                                  ? (unitOptionsByFleet[fleetUnitSlots[idx]?.fleetId || ''] ?? []).find((u) => u.value === a.unitId)?.label ?? a.unitId
                                  : 'Pilih unit'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari unit..." />
                              <CommandList>
                                <CommandEmpty>Tidak ada data</CommandEmpty>
                                <CommandGroup>
                                  {(unitOptionsByFleet[fleetUnitSlots[idx]?.fleetId || ''] ?? []).map((o) => (
                                    <CommandItem
                                      key={o.value}
                                      value={`${o.label} ${o.value}`}
                                      onSelect={() => {
                                        setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, unitId: o.value } : x)));
                                        const k = `assignments.${idx}.unitId`;
                                        if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                                        setUnitPickerOpen((prev) => ({ ...prev, [idx]: false }));
                                      }}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', a.unitId === o.value ? 'opacity-100' : 'opacity-0')} />
                                      {o.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors[`assignments.${idx}.unitId`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.unitId`]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Driver 1 *</label>
                        <Select
                          value={a.driverUuid}
                          onValueChange={(v) => {
                            setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, driverUuid: v } : x)));
                            const k = `assignments.${idx}.driverUuid`;
                            if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                          }}
                          disabled={loadingEmployees}
                        >
                          <SelectTrigger className={errors[`assignments.${idx}.driverUuid`] ? 'border-red-500' : ''}>
                            <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih driver'} />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`assignments.${idx}.driverUuid`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.driverUuid`]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Crew 1 *</label>
                        <Select
                          value={a.crewUuid}
                          onValueChange={(v) => {
                            setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, crewUuid: v } : x)));
                            const k = `assignments.${idx}.crewUuid`;
                            if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                          }}
                          disabled={loadingEmployees}
                        >
                          <SelectTrigger className={errors[`assignments.${idx}.crewUuid`] ? 'border-red-500' : ''}>
                            <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih crew'} />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`assignments.${idx}.crewUuid`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.crewUuid`]}</p>
                        ) : null}
                      </div>
                    </div>

                    {(a.extraPairs ?? []).length > 0 ? (
                      <div className="space-y-4">
                        {(a.extraPairs ?? []).map((p, j) => (
                          <div key={j} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div className="hidden lg:block" />
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Driver {j + 2} *</label>
                              <Select
                                value={p.driverUuid}
                                onValueChange={(v) => {
                                  setAssignments((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            extraPairs: (x.extraPairs ?? []).map((z, zi) => (zi === j ? { ...z, driverUuid: v } : z)),
                                          }
                                        : x
                                    )
                                  );
                                  const k = `assignments.${idx}.extraPairs.${j}.driverUuid`;
                                  if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                                }}
                                disabled={loadingEmployees}
                              >
                                <SelectTrigger className={errors[`assignments.${idx}.extraPairs.${j}.driverUuid`] ? 'border-red-500' : ''}>
                                  <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih driver'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {employeeOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors[`assignments.${idx}.extraPairs.${j}.driverUuid`] ? (
                                <p className="text-sm text-red-500">{errors[`assignments.${idx}.extraPairs.${j}.driverUuid`]}</p>
                              ) : null}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Crew {j + 2} *</label>
                              <Select
                                value={p.crewUuid}
                                onValueChange={(v) => {
                                  setAssignments((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            extraPairs: (x.extraPairs ?? []).map((z, zi) => (zi === j ? { ...z, crewUuid: v } : z)),
                                          }
                                        : x
                                    )
                                  );
                                  const k = `assignments.${idx}.extraPairs.${j}.crewUuid`;
                                  if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                                }}
                                disabled={loadingEmployees}
                              >
                                <SelectTrigger className={errors[`assignments.${idx}.extraPairs.${j}.crewUuid`] ? 'border-red-500' : ''}>
                                  <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih crew'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {employeeOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors[`assignments.${idx}.extraPairs.${j}.crewUuid`] ? (
                                <p className="text-sm text-red-500">{errors[`assignments.${idx}.extraPairs.${j}.crewUuid`]}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {submitError ? <span className="text-red-500">{submitError}</span> : '* Wajib diisi'}
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`${basePrefix}/team/schedule-armada`)}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit" className="bg-blue-700 text-white" disabled={!submitReady || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
