import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Car, Users, Check, ChevronsUpDown, Plus, ShoppingCart, CarFront, Building2, MessageCircleWarning } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardHeaderWithBadge, CardTitle } from '@/components/ui/card';
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
  const [garageOutDate, setGarageOutDate] = useState('');
  const [garageOutClock, setGarageOutClock] = useState('');
  const [garageInTime, setGarageInTime] = useState('');
  const [garageInDate, setGarageInDate] = useState('');
  const [garageInClock, setGarageInClock] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');

  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitOptionsByFleet, setUnitOptionsByFleet] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [unitPickerOpen, setUnitPickerOpen] = useState<Record<number, boolean>>({});
  const [unitSearchByIndex, setUnitSearchByIndex] = useState<Record<number, string>>({});
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

  const formFieldClass =
  'h-12 rounded-[18px] border-blue-200/60 bg-white shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0';
  const isEditMode = Boolean(searchParams.get('mode') === 'edit' || searchParams.get('schedule_id') || searchParams.get('scheduleId'));

  const formatYmdLong = (ymd: string) => {
    const value = String(ymd ?? '').trim();
    if (!value) return '';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d
      .toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      .replace(/[.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const allowedGarageOutDates = useMemo(() => {
    const toYmdFromAny = (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '';
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : '';
    };
    const start = toYmdFromAny(periodStartDate);
    if (!start) return [] as string[];
    const date = new Date(`${start}T00:00:00`);
    if (Number.isNaN(date.getTime())) return [start];
    const minusOne = new Date(date);
    minusOne.setDate(minusOne.getDate() - 1);
    const formatYmd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startMinusOne = formatYmd(minusOne);
    return [startMinusOne, start].filter(Boolean);
  }, [periodStartDate]);

  const allowedGarageInDates = useMemo(() => {
    const toYmdFromAny = (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '';
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : '';
    };
    const end = toYmdFromAny(periodEndDate);
    if (!end) return [] as string[];
    const date = new Date(`${end}T00:00:00`);
    if (Number.isNaN(date.getTime())) return [end];
    const plusOne = new Date(date);
    plusOne.setDate(plusOne.getDate() + 1);
    const formatYmd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const endPlusOne = formatYmd(plusOne);
    return [end, endPlusOne].filter(Boolean);
  }, [periodEndDate]);

  useEffect(() => {
    if (!orderId) {
      setGarageOutDate('');
      setGarageOutClock('');
      setGarageOutTime('');
      return;
    }
    if (allowedGarageOutDates.length <= 0) return;

    const m = garageOutTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    const existingDate = (m?.[1] ?? '').trim();
    const existingClock = (m?.[2] ?? '').trim();
    const nextDateCandidate = garageOutDate || existingDate;
    const nextDate = allowedGarageOutDates.includes(nextDateCandidate)
      ? nextDateCandidate
      : allowedGarageOutDates[allowedGarageOutDates.length - 1] ?? '';
    const nextClock = garageOutClock || existingClock;

    setGarageOutDate(nextDate);
    setGarageOutClock(nextClock);
    setGarageOutTime(nextClock && nextDate ? `${nextDate}T${nextClock}` : '');
  }, [allowedGarageOutDates, orderId]);

  useEffect(() => {
    if (!orderId) {
      setGarageInDate('');
      setGarageInClock('');
      setGarageInTime('');
      return;
    }
    if (allowedGarageInDates.length <= 0) return;

    const m = garageInTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    const existingDate = (m?.[1] ?? '').trim();
    const existingClock = (m?.[2] ?? '').trim();
    const nextDateCandidate = garageInDate || existingDate;
    const nextDate = allowedGarageInDates.includes(nextDateCandidate) ? nextDateCandidate : allowedGarageInDates[0] ?? '';
    const nextClock = garageInClock || existingClock;

    setGarageInDate(nextDate);
    setGarageInClock(nextClock);
    setGarageInTime(nextClock && nextDate ? `${nextDate}T${nextClock}` : '');
  }, [allowedGarageInDates, orderId]);

  useEffect(() => {
    const toYmdFromAny = (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '';
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : '';
    };

    const start = toYmdFromAny(periodStartDate);
    const end = toYmdFromAny(periodEndDate);
    if (!start || !end) {
      setEmployeeOptions([]);
      return;
    }

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const qs = new URLSearchParams();
        qs.set('start_date', start);
        qs.set('end_date', end);
        const res = await api.get<unknown>(
          `/services/schedule/operations/availibility?${qs.toString()}`,
          token ? { Authorization: token } : undefined
        );
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
  }, [periodEndDate, periodStartDate]);

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
      setGarageOutDate('');
      setGarageOutClock('');
      setGarageInTime('');
      setGarageInDate('');
      setGarageInClock('');
      setAssignments([]);
      setUnitSearchByIndex({});
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
      setPeriodStartDate(pickupDateRaw || scheduleStartCandidate);
      setPeriodEndDate(dropoffDateRaw || scheduleEndCandidate);
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
    const toYmdFromAny = (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '';
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : '';
    };

    const fleetIds = Array.from(new Set(fleetUnitSlots.map((slot) => slot.fleetId).filter(Boolean)));
    const start = toYmdFromAny(periodStartDate);
    const end = toYmdFromAny(periodEndDate);
    if (fleetIds.length === 0 || !start || !end) {
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
            qs.set('start_date', start);
            qs.set('end_date', end);
            qs.set('fleet_id', currentFleetId);
            const res = await api.get<unknown>(
              `/services/schedule/fleet-units/availibility?${qs.toString()}`,
              token ? { Authorization: token } : undefined
            );
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
  }, [fleetUnitSlots, periodEndDate, periodStartDate]);

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
      (a.extraPairs ?? []).forEach((p, j) => {
        const extraBase = `${base}.extraPairs.${j}`;
        if (!p.driverUuid) nextErrors[`${extraBase}.driverUuid`] = 'Wajib';
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
      if (!a.unitId || !a.driverUuid) return false;
      for (const p of a.extraPairs ?? []) {
        if (!p.driverUuid) return false;
      }
    }
    return true;
  }, [assignments, fleetUnitSlots, garageInTime, garageOutTime, isEditMode, orderId, quantity]);

  const selectedUnitIds = useMemo(() => {
    return new Set(assignments.map((a) => a.unitId).filter((v): v is string => Boolean(v)));
  }, [assignments]);

  const selectedEmployeeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of assignments) {
      if (a.driverUuid) ids.add(a.driverUuid);
      if (a.crewUuid) ids.add(a.crewUuid);
      for (const p of a.extraPairs ?? []) {
        if (p.driverUuid) ids.add(p.driverUuid);
        if (p.crewUuid) ids.add(p.crewUuid);
      }
    }
    return ids;
  }, [assignments]);

  const getEmployeeOptions = (currentValue: string) => {
    return employeeOptions.filter((o) => !selectedEmployeeIds.has(o.value) || o.value === currentValue);
  };

  const getUnitOptions = (fleetId: string, currentValue: string) => {
    return (unitOptionsByFleet[fleetId] ?? []).filter((o) => !selectedUnitIds.has(o.value) || o.value === currentValue);
  };

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
      const units = assignments.flatMap((assignment, index) => {
        const slot = fleetUnitSlots[index];
        const fleetId = slot?.fleetId ?? '';
        const unitIdValue = assignment.unitId.trim();
        const isKnownUnitId = Boolean(fleetId && unitIdValue && (unitOptionsByFleet[fleetId] ?? []).some((u) => u.value === unitIdValue));
        const baseUnit = assignment.driverUuid.trim()
          ? [
              {
                fleet_id: fleetId,
                ...(isKnownUnitId ? { unit_id: unitIdValue } : { fleet_partner: unitIdValue }),
                driver_id: assignment.driverUuid.trim(),
                ...(assignment.crewUuid.trim() ? { crew_id: assignment.crewUuid.trim() } : {}),
              },
            ]
          : [];
        const extraUnits = (assignment.extraPairs ?? [])
          .filter((p) => Boolean(p.driverUuid.trim()))
          .map((p) => ({
            fleet_id: fleetId,
            ...(isKnownUnitId ? { unit_id: unitIdValue } : { fleet_partner: unitIdValue }),
            driver_id: p.driverUuid.trim(),
            ...(p.crewUuid.trim() ? { crew_id: p.crewUuid.trim() } : {}),
          }));
        return [...baseUnit, ...extraUnits];
      });

      const payload = {
        order_id: (resolvedOrderId || orderId).trim(),
        departure_time: garageOutTime,
        schedule_units: units,
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
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal berhasil ditambahkan.' });
      navigate(`${basePrefix}/schedules/fleet-management`);
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
            <CardHeaderWithBadge
              badgeIcon={ShoppingCart}
              title="Informasi Pesanan"
              subtitle="Lengkapi customer, paket, dan jadwal perjalanan."
            />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      value={garageOutDate}
                      onValueChange={(v) => {
                        setGarageOutDate(v);
                        const nextValue = garageOutClock && v ? `${v}T${garageOutClock}` : '';
                        setGarageOutTime(nextValue);
                        if (errors.garageOutTime) setErrors((prev) => ({ ...prev, garageOutTime: '' }));
                      }}
                      disabled={!orderId || allowedGarageOutDates.length <= 0}
                    >
                      <SelectTrigger className={errors.garageOutTime ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Tanggal" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedGarageOutDates.map((d) => (
                          <SelectItem key={d} value={d}>
                            {formatYmdLong(d)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={garageOutClock}
                      // className={formFieldClass}
                      onChange={(e) => {
                        const t = e.target.value;
                        setGarageOutClock(t);
                        const nextValue = garageOutDate && t ? `${garageOutDate}T${t}` : '';
                        setGarageOutTime(nextValue);
                        if (errors.garageOutTime) setErrors((prev) => ({ ...prev, garageOutTime: '' }));
                      }}
                      disabled={!orderId}
                      className={formFieldClass ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.garageOutTime ? <p className="text-sm text-red-500">{errors.garageOutTime}</p> : null}
                </div>

                {isEditMode ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jam Kembali Garasi *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select
                        value={garageInDate}
                        className={formFieldClass}
                        onValueChange={(v) => {
                          setGarageInDate(v);
                          const nextValue = garageInClock && v ? `${v}T${garageInClock}` : '';
                          setGarageInTime(nextValue);
                          if (errors.garageInTime) setErrors((prev) => ({ ...prev, garageInTime: '' }));
                        }}
                        disabled={!orderId || allowedGarageInDates.length <= 0}
                      >
                        <SelectTrigger className={errors.garageInTime ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Tanggal" />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedGarageInDates.map((d) => (
                            <SelectItem key={d} value={d}>
                              {formatYmdLong(d)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={garageInClock}
                        onChange={(e) => {
                          const t = e.target.value;
                          setGarageInClock(t);
                          const nextValue = garageInDate && t ? `${garageInDate}T${t}` : '';
                          setGarageInTime(nextValue);
                          if (errors.garageInTime) setErrors((prev) => ({ ...prev, garageInTime: '' }));
                        }}
                        disabled={!orderId}
                        className={errors.garageInTime ? 'border-red-500' : ''}
                      />
                    </div>
                    {errors.garageInTime ? <p className="text-sm text-red-500">{errors.garageInTime}</p> : null}
                  </div>
                ) : (
                  <div className="hidden lg:block" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeaderWithBadge
              badgeIcon={ShoppingCart}
              title="Informasi Pelanggan"
              subtitle="Periksa Kembai informasi pelanggan sebelum armada dijadwalkan"
            />
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
          <CardHeaderWithBadge
                badgeIcon={CarFront}
                title="Armada dan crew yang bertugas"
                subtitle="Lengkapi armada dan crew yang ditugaskan untuk perjalanan ini"
              />
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
                              <CommandInput
                                placeholder="Cari atau ketik armada..."
                                value={unitSearchByIndex[idx] ?? ''}
                                onValueChange={(v) => setUnitSearchByIndex((prev) => ({ ...prev, [idx]: v }))}
                              />
                              <CommandList>
                                <CommandEmpty>Tidak ada data</CommandEmpty>
                                <CommandGroup>
                                  {(() => {
                                    const q = (unitSearchByIndex[idx] ?? '').trim();
                                    const fleetId = fleetUnitSlots[idx]?.fleetId || '';
                                    const all = unitOptionsByFleet[fleetId] ?? [];
                                    const matched =
                                      q &&
                                      all.some(
                                        (u) =>
                                          u.value.toLowerCase() === q.toLowerCase() || u.label.toLowerCase() === q.toLowerCase()
                                      );
                                    if (!q || matched) return null;
                                    return (
                                      <CommandItem
                                        key={`free-text-${idx}`}
                                        value={`free-text ${q}`}
                                        onSelect={() => {
                                          setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, unitId: q } : x)));
                                          const k = `assignments.${idx}.unitId`;
                                          if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                                          setUnitPickerOpen((prev) => ({ ...prev, [idx]: false }));
                                          setUnitSearchByIndex((prev) => ({ ...prev, [idx]: '' }));
                                        }}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', a.unitId === q ? 'opacity-100' : 'opacity-0')} />
                                        {`Gunakan: ${q}`}
                                      </CommandItem>
                                    );
                                  })()}
                                  {getUnitOptions(fleetUnitSlots[idx]?.fleetId || '', a.unitId).map((o) => (
                                    <CommandItem
                                      key={o.value}
                                      value={`${o.label} ${o.value}`}
                                      onSelect={() => {
                                        setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, unitId: o.value } : x)));
                                        const k = `assignments.${idx}.unitId`;
                                        if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                                        setUnitPickerOpen((prev) => ({ ...prev, [idx]: false }));
                                        setUnitSearchByIndex((prev) => ({ ...prev, [idx]: '' }));
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
                            {getEmployeeOptions(a.driverUuid).map((o) => (
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
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Select
                              value={a.crewUuid}
                              onValueChange={(v) => {
                                setAssignments((prev) => prev.map((x, i) => (i === idx ? { ...x, crewUuid: v } : x)));
                                const k = `assignments.${idx}.crewUuid`;
                                if (errors[k]) setErrors((prev) => ({ ...prev, [k]: '' }));
                              }}
                              disabled={loadingEmployees}
                            >
                              <SelectTrigger className={cn('w-full', errors[`assignments.${idx}.crewUuid`] && 'border-red-500')}>
                                <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih crew'} />
                              </SelectTrigger>
                              <SelectContent>
                                {getEmployeeOptions(a.crewUuid).map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            className="h-10 w-10 p-0 bg-blue-700 hover:bg-blue-800 text-white"
                            aria-label="Tambah Driver / Crew"
                            title="Tambah Driver / Crew"
                            onClick={() =>
                              setAssignments((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, extraPairs: [...(x.extraPairs ?? []), { driverUuid: '', crewUuid: '' }] } : x
                                )
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors[`assignments.${idx}.crewUuid`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.crewUuid`]}</p>
                        ) : null}
                      </div>
                    </div>

                    {(a.extraPairs ?? []).length > 0 ? (
                      <div className="space-y-4">
                        {(a.extraPairs ?? []).map((p, j) => (
                          <div key={j} className="rounded-lg border border-gray-200/70 p-4 dark:border-gray-800/70 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                  {getEmployeeOptions(p.driverUuid).map((o) => (
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
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
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
                                    <SelectTrigger
                                      className={cn('w-full', errors[`assignments.${idx}.extraPairs.${j}.crewUuid`] && 'border-red-500')}
                                    >
                                      <SelectValue placeholder={loadingEmployees ? 'Memuat...' : 'Pilih crew'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getEmployeeOptions(p.crewUuid).map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  className="h-10 w-10 p-0 bg-red-600 hover:bg-red-700 text-white"
                                  aria-label="Hapus"
                                  title="Hapus"
                                  onClick={() => {
                                    setAssignments((prev) =>
                                      prev.map((x, i) =>
                                        i === idx ? { ...x, extraPairs: (x.extraPairs ?? []).filter((_, zi) => zi !== j) } : x
                                      )
                                    );
                                    setErrors((prev) => {
                                      const next = { ...prev };
                                      Object.keys(next).forEach((k) => {
                                        if (k.startsWith(`assignments.${idx}.extraPairs.`)) delete next[k];
                                      });
                                      return next;
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {errors[`assignments.${idx}.extraPairs.${j}.crewUuid`] ? (
                                <p className="text-sm text-red-500">{errors[`assignments.${idx}.extraPairs.${j}.crewUuid`]}</p>
                              ) : null}
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-3 mt-5 bg-blue-100 rounded-2xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-blue-700 ring-1 ring-blue-200/60">
                <MessageCircleWarning className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">Armada tidak tersedia?</div>
                <div className="mt-0.5 text-sm text-gray-600">Kamu bisa menambahkan armada dari operator lain, dengan menuliskan nama armada / operator di kolom pilihan armada.</div>
              </div>
            </div>
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
            <Button type="submit" className="bg-blue-500 hover:bg-blue-700 transition-all text-white" disabled={!submitReady || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
