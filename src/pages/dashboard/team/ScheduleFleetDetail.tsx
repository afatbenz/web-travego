import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Car, Users, Check, ChevronsUpDown, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export const ScheduleFleetDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const params = useParams();
  const [searchParams] = useSearchParams();

  const orderIdParam = (params.order_id ?? params.orderid ?? params.id ?? '').toString().trim();
  const orderIdQuery = (searchParams.get('order_id') ?? '').trim();
  const orderId = (orderIdParam || orderIdQuery).trim();

  const [resolvedOrderId, setResolvedOrderId] = useState(orderId);
  const [orderTypeLabel, setOrderTypeLabel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [scheduleStartAt, setScheduleStartAt] = useState('');
  const [scheduleEndAt, setScheduleEndAt] = useState('');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [quantity, setQuantity] = useState(0);

  const [scheduleId, setScheduleId] = useState('');
  const [garageOutTime, setGarageOutTime] = useState('');
  const [garageInTime, setGarageInTime] = useState('');
  const [scheduleFleetRows, setScheduleFleetRows] = useState<
    Array<{ unitId: string; driverIds: string[]; crewIds: string[] }>
  >([]);

  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitOptionsByFleet, setUnitOptionsByFleet] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [unitPickerOpen, setUnitPickerOpen] = useState<Record<number, boolean>>({});
  const [fleetUnitSlots, setFleetUnitSlots] = useState<Array<{ fleetId: string; fleetName: string }>>([]);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [crewNameById, setCrewNameById] = useState<Record<string, string>>({});

  const [assignments, setAssignments] = useState<
    Array<{ unitId: string; driverUuid: string; crewUuid: string; extraPairs: Array<{ driverUuid: string; crewUuid: string }> }>
  >([]);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);

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
    const nestedResponse = obj.response && typeof obj.response === 'object' ? (obj.response as Record<string, unknown>) : {};
    const nestedResponseData =
      nestedResponse.data && typeof nestedResponse.data === 'object' ? (nestedResponse.data as Record<string, unknown>) : {};
    return toStringSafe(
      obj.message ??
        obj.error ??
        nestedData.message ??
        nestedData.error ??
        nestedResponseData.message ??
        nestedResponseData.error
    ).trim();
  };

  const toDatetimeLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const parseDateMaybe = (value: string) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const isoCandidate = (() => {
      const s = raw.replace(' ', 'T');
      const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? `${s}:00` : s;
      if (/[+-]\d{2}$/.test(withSeconds)) return `${withSeconds}:00`;
      if (/[+-]\d{2}:\d{2}$/.test(withSeconds)) return withSeconds;
      return withSeconds;
    })();
    const d = new Date(isoCandidate);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const isOrderStartDateInFuture = useMemo(() => {
    const raw = String(orderStartDate ?? '').trim();
    if (!raw) return false;

    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const startDateOnly = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : parseDateMaybe(raw);
    if (!startDateOnly) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDateOnly);
    start.setHours(0, 0, 0, 0);
    return start.getTime() > today.getTime();
  }, [orderStartDate]);

  useEffect(() => {
    if (isEditing && isOrderStartDateInFuture) setIsEditing(false);
  }, [isEditing, isOrderStartDateInFuture]);

  const resolveEmployeeValue = useCallback(
    (id: string) => {
      const needle = String(id ?? '').trim();
      if (!needle) return '';
      const exact = employeeOptions.find((o) => o.value === needle);
      if (exact) return exact.value;
      const starts = employeeOptions.find((o) => o.label.startsWith(`${needle} `) || o.label.startsWith(`${needle}-`) || o.label === needle);
      if (starts) return starts.value;
      const includes = employeeOptions.find((o) => o.label.includes(needle));
      if (includes) return includes.value;
      return needle;
    },
    [employeeOptions]
  );

  const getEmployeeLabel = useCallback(
    (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '-';
      return employeeOptions.find((o) => o.value === v)?.label ?? v;
    },
    [employeeOptions]
  );

  const getCrewLabel = useCallback(
    (value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return '-';
      const crewName = crewNameById[v];
      if (crewName) return crewName;
      return getEmployeeLabel(v);
    },
    [crewNameById, getEmployeeLabel]
  );

  const getUnitLabel = useCallback(
    (slotIdx: number, unitId: string) => {
      const v = String(unitId ?? '').trim();
      if (!v) return '-';
      const fleetId = fleetUnitSlots[slotIdx]?.fleetId || '';
      const list = unitOptionsByFleet[fleetId] ?? [];
      return list.find((u) => u.value === v)?.label ?? v;
    },
    [fleetUnitSlots, unitOptionsByFleet]
  );

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
      setOrderStartDate('');
      setPeriodStartDate('');
      setPeriodEndDate('');
      setDestinationText('');
      setQuantity(0);
      setFleetUnitSlots([]);
      setUnitOptionsByFleet({});
      setGarageOutTime('');
      setGarageInTime('');
      setAssignments([]);
      setScheduleId('');
      setScheduleFleetRows([]);
      return;
    }

    const loadOrderDetail = async () => {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/fleet/order/detail/${encodeURIComponent(orderId)}`, token ? { Authorization: token } : undefined);
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
        customer.customer_phone ?? customer.customerPhone ?? customer.customer_telephone ?? customer.customerTelephone ?? customer.telephone
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
      setOrderStartDate(pickupDateRaw || scheduleStartCandidate);
      setPeriodStartDate(pickupDateRaw || scheduleStartCandidate);
      setPeriodEndDate(dropoffDateRaw || scheduleEndCandidate);
      setDestinationText(nextDestinationText);
      setQuantity(nextFleetSlots.length || nextQty);
      setFleetUnitSlots(nextFleetSlots);
    };

    loadOrderDetail();
  }, [orderId, reloadKey]);

  useEffect(() => {
    if (!orderId) return;

    const loadScheduleDetail = async () => {
      const token = localStorage.getItem('token') ?? '';
      const res = await api.get<unknown>(`/services/schedule/detail/${encodeURIComponent(orderId)}`, token ? { Authorization: token } : undefined);
      if (res.status !== 'success') return;

      const root = record(res.data);
      const detail = record(root.data ?? root.schedule ?? root.detail ?? root);
      const nextScheduleId = toStringSafe(detail.schedule_id ?? detail.scheduleId ?? root.schedule_id ?? root.scheduleId).trim();
      const departureRaw = toStringSafe(detail.departure_time ?? detail.departureTime).trim();
      const arrivalRaw = toStringSafe(detail.arrival_time ?? detail.arrivalTime).trim();
      const departureDate = parseDateMaybe(departureRaw);
      const arrivalDate = parseDateMaybe(arrivalRaw);

      const fleetsRaw = Array.isArray(detail.fleets) ? detail.fleets : Array.isArray(root.fleets) ? root.fleets : [];
      const nextCrewMap: Record<string, string> = {};
      const rows = fleetsRaw
        .map((raw) => record(raw))
        .map((o) => {
          const unitId = toStringSafe(o.unit_id ?? o.unitId).trim();
          const driverRaw = o.driver_id ?? o.driverId ?? o.drivers ?? o.driver;
          const crewRaw = o.crew_ids ?? o.crewIds ?? o.crews ?? o.crew;
          const crewIdSingle = toStringSafe(o.crew_id ?? o.crewId).trim();
          const crewNameSingle = toStringSafe(o.crew_name ?? o.crewName).trim();
          if (crewIdSingle && crewNameSingle) nextCrewMap[crewIdSingle] = crewNameSingle;

          const crewNamesRaw = o.crew_names ?? o.crewNames;
          const crewNames = Array.isArray(crewNamesRaw)
            ? crewNamesRaw.map((x) => toStringSafe(x).trim()).filter(Boolean)
            : [];

          const driverIds = Array.isArray(driverRaw)
            ? driverRaw.map((x) => toStringSafe(x).trim()).filter(Boolean)
            : toStringSafe(driverRaw).trim()
              ? [toStringSafe(driverRaw).trim()]
              : [];

          let crewIds = (() => {
            if (Array.isArray(crewRaw)) {
              if (crewRaw.length > 0 && crewRaw.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
                const ids = (crewRaw as Array<Record<string, unknown>>)
                  .map((x) => record(x))
                  .map((c) => {
                    const id = toStringSafe(c.crew_id ?? c.crewId ?? c.id ?? c.uuid).trim();
                    const name = toStringSafe(c.crew_name ?? c.crewName ?? c.name ?? c.fullname).trim();
                    if (id && name) nextCrewMap[id] = name;
                    return id;
                  })
                  .filter(Boolean);
                return ids;
              }
              return crewRaw.map((x) => toStringSafe(x).trim()).filter(Boolean);
            }
            const rawStr = toStringSafe(crewRaw).trim();
            return rawStr ? [rawStr] : [];
          })();

          if (crewIds.length === 0 && crewIdSingle) crewIds = [crewIdSingle];

          crewIds.forEach((id, idx) => {
            const name = crewNames[idx] ?? '';
            if (id && name) nextCrewMap[id] = name;
          });

          return { unitId, driverIds, crewIds };
        });

      setCrewNameById((prev) => ({ ...prev, ...nextCrewMap }));
      setScheduleId(nextScheduleId);
      setGarageOutTime(departureDate ? toDatetimeLocal(departureDate) : departureRaw);
      setGarageInTime(arrivalDate ? toDatetimeLocal(arrivalDate) : arrivalRaw);
      setScheduleFleetRows(rows);
    };

    loadScheduleDetail();
  }, [orderId, reloadKey]);

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
    if (quantity <= 0) return;
    if (scheduleFleetRows.length <= 0) return;
    const mapByResolved: Record<string, string> = {};
    for (const row of scheduleFleetRows) {
      for (const crewId of row.crewIds ?? []) {
        const name = crewNameById[crewId];
        if (!name) continue;
        const resolved = resolveEmployeeValue(crewId);
        if (resolved && resolved !== crewId && !crewNameById[resolved]) mapByResolved[resolved] = name;
      }
    }
    if (Object.keys(mapByResolved).length > 0) {
      setCrewNameById((prev) => ({ ...prev, ...mapByResolved }));
    }
    setAssignments((prev) => {
      const next = Array.from({ length: quantity }, (_, idx) => prev[idx] ?? { unitId: '', driverUuid: '', crewUuid: '', extraPairs: [] });
      for (let i = 0; i < next.length; i++) {
        const row = scheduleFleetRows[i];
        if (!row) continue;
        const driverIds = row.driverIds ?? [];
        const crewIds = row.crewIds ?? [];
        const primaryDriver = driverIds[0] ?? '';
        const primaryCrew = crewIds[0] ?? '';
        const extraDriverIds = driverIds.slice(1);
        const extraCrewIds = crewIds.slice(1);
        const extraCount = Math.max(extraDriverIds.length, extraCrewIds.length);
        next[i] = {
          ...next[i],
          unitId: row.unitId || next[i].unitId,
          driverUuid: primaryDriver ? resolveEmployeeValue(primaryDriver) : next[i].driverUuid,
          crewUuid: primaryCrew ? resolveEmployeeValue(primaryCrew) : next[i].crewUuid,
          extraPairs: Array.from({ length: extraCount }, (_, j) => ({
            driverUuid: extraDriverIds[j] ? resolveEmployeeValue(extraDriverIds[j]) : '',
            crewUuid: extraCrewIds[j] ? resolveEmployeeValue(extraCrewIds[j]) : '',
          })),
        };
      }
      return next;
    });
  }, [crewNameById, employeeOptions, quantity, resolveEmployeeValue, scheduleFleetRows]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!orderId.trim()) nextErrors.orderId = 'Order ID tidak valid';
    if (!scheduleId.trim()) nextErrors.scheduleId = 'Schedule ID tidak ditemukan';
    if (fleetUnitSlots.length <= 0) nextErrors.orderId = nextErrors.orderId || 'Order tidak valid';
    if (quantity <= 0) nextErrors.orderId = nextErrors.orderId || 'Order tidak valid';
    if (!garageOutTime) nextErrors.garageOutTime = 'Jam keluar garasi wajib diisi';
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
    if (!isEditing) return false;
    if (!orderId.trim()) return false;
    if (!scheduleId.trim()) return false;
    if (fleetUnitSlots.length <= 0) return false;
    if (quantity <= 0) return false;
    if (!garageOutTime) return false;
    if (assignments.length !== quantity) return false;
    for (const a of assignments) {
      if (!a.unitId || !a.driverUuid) return false;
      for (const p of a.extraPairs ?? []) {
        if (!p.driverUuid) return false;
      }
    }
    return true;
  }, [assignments, fleetUnitSlots, garageOutTime, isEditing, orderId, quantity, scheduleId]);

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
    if (!isEditing) return;
    if (saving) return;
    if (!validate()) return;
    setSubmitError('');
    setSaving(true);
    try {
      const units = assignments.flatMap((assignment, index) => {
        const slot = fleetUnitSlots[index];
        const fleetId = slot?.fleetId ?? '';
        const baseUnit = assignment.driverUuid.trim()
          ? [
              {
                fleet_id: fleetId,
                unit_id: assignment.unitId,
                driver_id: assignment.driverUuid.trim(),
                ...(assignment.crewUuid.trim() ? { crew_id: assignment.crewUuid.trim() } : {}),
              },
            ]
          : [];
        const extraUnits = (assignment.extraPairs ?? [])
          .filter((p) => Boolean(p.driverUuid.trim()))
          .map((p) => ({
            fleet_id: fleetId,
            unit_id: assignment.unitId,
            driver_id: p.driverUuid.trim(),
            ...(p.crewUuid.trim() ? { crew_id: p.crewUuid.trim() } : {}),
          }));
        return [...baseUnit, ...extraUnits];
      });

      const payload: Record<string, unknown> = {
        schedule_id: scheduleId.trim(),
        order_id: (resolvedOrderId || orderId).trim(),
        departure_time: garageOutTime,
        schedule_units: units,
      };
      if (garageInTime) payload.arrival_time = garageInTime;

      const token = localStorage.getItem('token') ?? '';
      const res = await api.post<unknown>('/services/schedule/update', payload, token ? { Authorization: token } : undefined);
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
        if (errorCode === 'SCHEDULE_NOT_FOUND') {
          await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Jadwal tidak ditemukan. Coba muat ulang' });
          return;
        }
        setSubmitError('Gagal memperbarui jadwal. Silakan coba lagi.');
        return;
      }
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal berhasil diperbarui.' });
      setIsEditing(false);
      setReloadKey((x) => x + 1);
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
      if (errorCode === 'SCHEDULE_NOT_FOUND') {
        await Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Jadwal tidak ditemukan. Coba muat ulang' });
        return;
      }
      setSubmitError('Gagal memperbarui jadwal. Periksa koneksi dan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${basePrefix}/orders/fleet/detail/${encodeURIComponent(orderId)}`)}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Jadwal Armada</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 truncate">{resolvedOrderId || orderId || '-'}</p>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Order ID</label>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {isEditing ? 'Jam Keluar Garasi *' : 'Jam Keluar Garasi'}
                  </label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={garageOutTime}
                      onChange={(e) => {
                        setGarageOutTime(e.target.value);
                        if (errors.garageOutTime) setErrors((prev) => ({ ...prev, garageOutTime: '' }));
                      }}
                      className={errors.garageOutTime ? 'border-red-500' : ''}
                    />
                  ) : (
                    <div className="text-gray-900 dark:text-white">{formatDdMmmmYyyyHhMm(garageOutTime)}</div>
                  )}
                  {errors.garageOutTime ? <p className="text-sm text-red-500">{errors.garageOutTime}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Jam Kembali Garasi</label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={garageInTime}
                      onChange={(e) => {
                        setGarageInTime(e.target.value);
                        if (errors.garageInTime) setErrors((prev) => ({ ...prev, garageInTime: '' }));
                      }}
                      className={errors.garageInTime ? 'border-red-500' : ''}
                    />
                  ) : (
                    <div className="text-gray-900 dark:text-white">{formatDdMmmmYyyyHhMm(garageInTime)}</div>
                  )}
                  {errors.garageInTime ? <p className="text-sm text-red-500">{errors.garageInTime}</p> : null}
                </div>
              </div>
              {errors.scheduleId ? <p className="text-sm text-red-500">{errors.scheduleId}</p> : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informasi Armada dan Petugas
            </CardTitle>
            {quantity > 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">{quantity} unit ditugaskan pada jadwal ini.</p>
            ) : null}
          </CardHeader>
          <CardContent>
            {quantity <= 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Data armada tidak ditemukan.</div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-slate-900/40 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Unit {idx + 1}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{fleetUnitSlots[idx]?.fleetName || 'Armada'}</div>
                      </div>
                      {isEditing ? (
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
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {isEditing ? 'Pilih Armada *' : 'Armada'}
                        </label>
                        {isEditing ? (
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
                                {loadingUnits ? 'Memuat...' : a.unitId ? getUnitLabel(idx, a.unitId) : 'Pilih unit'}
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
                        ) : (
                          <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-start break-words">
                            {getUnitLabel(idx, a.unitId)}
                          </div>
                        )}
                        {isEditing && errors[`assignments.${idx}.unitId`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.unitId`]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {isEditing ? 'Driver 1 *' : 'Driver 1'}
                        </label>
                        {isEditing ? (
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
                        ) : (
                          <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-start break-words">
                            {getEmployeeLabel(a.driverUuid)}
                          </div>
                        )}
                        {isEditing && errors[`assignments.${idx}.driverUuid`] ? (
                          <p className="text-sm text-red-500">{errors[`assignments.${idx}.driverUuid`]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Crew 1</label>
                        {isEditing ? (
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
                        ) : (
                          <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-start break-words">
                            {getCrewLabel(a.crewUuid)}
                          </div>
                        )}
                        {isEditing && errors[`assignments.${idx}.crewUuid`] ? (
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
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {isEditing ? `Driver ${j + 2} *` : `Driver ${j + 2}`}
                              </label>
                              {isEditing ? (
                                <Select
                                  value={p.driverUuid}
                                  onValueChange={(v) => {
                                    setAssignments((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? { ...x, extraPairs: (x.extraPairs ?? []).map((z, zi) => (zi === j ? { ...z, driverUuid: v } : z)) }
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
                              ) : (
                                <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-start break-words">
                                  {getEmployeeLabel(p.driverUuid)}
                                </div>
                              )}
                              {isEditing && errors[`assignments.${idx}.extraPairs.${j}.driverUuid`] ? (
                                <p className="text-sm text-red-500">{errors[`assignments.${idx}.extraPairs.${j}.driverUuid`]}</p>
                              ) : null}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Crew {j + 2}</label>
                              {isEditing ? (
                                <Select
                                  value={p.crewUuid}
                                  onValueChange={(v) => {
                                    setAssignments((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? { ...x, extraPairs: (x.extraPairs ?? []).map((z, zi) => (zi === j ? { ...z, crewUuid: v } : z)) }
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
                              ) : (
                                <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white flex items-start break-words">
                                  {getCrewLabel(p.crewUuid)}
                                </div>
                              )}
                              {isEditing && errors[`assignments.${idx}.extraPairs.${j}.crewUuid`] ? (
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
        {!isEditing && !isOrderStartDateInFuture ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-blue-700 text-white"
                  onClick={() => setIsEditing(true)}
                  disabled={!scheduleId || !orderId}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Jadwal
                </Button>
              </div>
            ) : null}

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {submitError ? <span className="text-red-500">{submitError}</span> : isEditing ? '* Wajib diisi' : null}
          </div>
          {isEditing ? (
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  setSubmitError('');
                  setReloadKey((x) => x + 1);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" className="bg-blue-700 text-white" disabled={!submitReady || saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
              </Button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
};
