import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Car, DollarSign, Plus, ReceiptText, Save } from 'lucide-react';
import { api } from '@/lib/api';
import BackButton from '@/components/common/BackButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeaderWithBadge } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ScheduleDetail = {
  orderId: string;
  orderStatus: string;
  tripDate: string;
  tripEndDate: string;
  customerName: string;
  customerPhone: string;
  route: string;
  fleetName: string;
  plateNumber: string;
  driverName: string;
  coDriverName: string;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  expensesTotal: number;
};

type ExpenseLabelOption = { value: string; label: string };

type ExpenseDraft = {
  labelId: string;
  labelText: string;
  description: string;
  amount: number;
  fundingType: 1 | 2;
};

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const toStringSafe = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'bigint' ? String(v) : '';

const toNumberSafe = (v: unknown): number => {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? Number(v)
        : typeof v === 'bigint'
          ? Number(v)
          : NaN;
  return Number.isFinite(n) ? n : 0;
};

const pickString = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const s = toStringSafe(obj[k]).trim();
    if (s) return s;
  }
  return '';
};

const tryFormatDate = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

const statusVariant = (statusRaw: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const s = statusRaw.trim().toLowerCase();
  if (!s) return 'outline';
  if (['selesai', 'done', 'completed', 'success'].includes(s)) return 'secondary';
  if (['dibatalkan', 'cancelled', 'canceled', 'failed', 'reject', 'rejected'].includes(s)) return 'destructive';
  return 'default';
};

const parseDetail = (payload: unknown, orderIdFallback: string): ScheduleDetail => {
  const root = toRecord(payload);
  const data = toRecord(root.data ?? root.detail ?? root);

  const order = toRecord(data.order ?? data.order_detail ?? data.orderDetail);
  const schedule = toRecord(data.schedule ?? data.fleet_schedule ?? data.fleetSchedule);
  const finance = toRecord(data.finance ?? data.financial ?? data.payment ?? data.billing);
  const customer = toRecord(data.customer ?? order.customer ?? data.user);
  const fleet = toRecord(data.fleet ?? data.armada ?? data.vehicle ?? schedule.vehicle);

  const orderId =
    pickString(data, ['order_id', 'orderId', 'id']) || pickString(order, ['order_id', 'orderId', 'id']) || orderIdFallback;

  const orderStatus =
    pickString(data, ['status', 'status_label', 'statusLabel']) ||
    pickString(order, ['status', 'order_status', 'orderStatus', 'status_label', 'statusLabel']) ||
    pickString(schedule, ['status', 'schedule_status', 'scheduleStatus']) ||
    '-';

  const tripDate =
    pickString(data, ['trip_date', 'start_date', 'departure_date']) ||
    pickString(order, ['trip_date', 'start_date', 'departure_date', 'created_at']) ||
    pickString(schedule, ['trip_date', 'start_date', 'departure_date', 'schedule_date']) ||
    '';
  const tripEndDate =
    pickString(data, ['end_date', 'finish_date']) ||
    pickString(order, ['end_date', 'finish_date']) ||
    pickString(schedule, ['end_date', 'finish_date']) ||
    '';

  const customerName =
    pickString(customer, ['customer_name', 'name', 'fullname', 'full_name']) ||
    pickString(order, ['customer_name', 'customerName']) ||
    '-';
  const customerPhone =
    pickString(customer, ['customer_phone', 'phone', 'telephone', 'customer_telephone']) ||
    pickString(order, ['customer_phone', 'phone']) ||
    '-';

  const pickup = pickString(data, ['pickup', 'pickup_city_label', 'pickupCityLabel']) || pickString(order, ['pickup', 'pickup_city_label']);
  const destination =
    pickString(data, ['destination', 'destination_name', 'dropoff', 'dropoff_location']) ||
    pickString(order, ['destination', 'destination_name', 'dropoff', 'dropoff_location']);
  const route = pickup || destination ? [pickup, destination].filter(Boolean).join(' → ') : '-';

  const fleetName =
    pickString(fleet, ['fleet_name', 'fleetName', 'vehicle_name', 'vehicleName', 'unit_name', 'unitName', 'name']) ||
    pickString(schedule, ['fleet_name', 'fleetName', 'vehicle_name', 'vehicleName']) ||
    '-';
  const plateNumber =
    pickString(fleet, ['plate_number', 'plateNumber', 'license_plate', 'licensePlate', 'nopol']) ||
    pickString(schedule, ['plate_number', 'plateNumber']) ||
    '-';
  const driverName =
    pickString(data, ['driver_name', 'driverName']) ||
    pickString(schedule, ['driver_name', 'driverName']) ||
    pickString(toRecord(data.driver), ['fullname', 'name']) ||
    '-';
  const coDriverName =
    pickString(data, ['co_driver_name', 'coDriverName', 'codriver_name']) ||
    pickString(schedule, ['co_driver_name', 'coDriverName', 'codriver_name']) ||
    pickString(toRecord(data.co_driver), ['fullname', 'name']) ||
    '-';

  const totalAmount =
    toNumberSafe(finance.total_amount ?? finance.totalAmount ?? finance.total ?? order.total_amount ?? data.total_amount ?? data.total);
  const downPayment =
    toNumberSafe(finance.down_payment ?? finance.downPayment ?? finance.dp_amount ?? order.down_payment ?? data.down_payment);
  const remainingAmount =
    toNumberSafe(finance.remaining_amount ?? finance.remainingAmount ?? finance.remaining ?? order.remaining_amount ?? data.remaining_amount);
  const expensesTotal = toNumberSafe(finance.expenses_total ?? finance.expensesTotal ?? finance.expense_total ?? data.expenses_total);

  return {
    orderId: orderId || '-',
    orderStatus: orderStatus || '-',
    tripDate,
    tripEndDate,
    customerName,
    customerPhone,
    route,
    fleetName,
    plateNumber,
    driverName,
    coDriverName,
    totalAmount,
    downPayment,
    remainingAmount,
    expensesTotal,
  };
};

const KeyValueGrid: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-gray-200/70 bg-white/70 p-4">
          <div className="text-[11px] font-medium text-muted-foreground">{item.label}</div>
          <div className="mt-1 text-sm font-semibold text-foreground break-words">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export const FleetScheduleManage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard');
  const params = useParams();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token') ?? '';

  const orderIdParam = (params.order_id ?? params.orderid ?? params.id ?? '').toString().trim();
  const orderIdQuery = (searchParams.get('order_id') ?? '').trim();
  const orderId = (orderIdParam || orderIdQuery).trim();

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ScheduleDetail | null>(null);

  const [labelsLoading, setLabelsLoading] = useState(false);
  const [expenseLabels, setExpenseLabels] = useState<ExpenseLabelOption[]>([]);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>({
    labelId: '',
    labelText: '',
    description: '',
    amount: 0,
    fundingType: 1,
  });
  const [expenses, setExpenses] = useState<ExpenseDraft[]>([]);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.post<unknown>(
          '/services/schedule/detail',
          { order_id: orderId },
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setDetail(null);
          return;
        }
        setDetail(parseDetail(res.data, orderId));
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, token]);

  useEffect(() => {
    (async () => {
      setLabelsLoading(true);
      try {
        const res = await api.get<unknown>(
          '/services/transactions/labels?filteredby=expense',
          token ? { Authorization: token } : undefined
        );
        if (res.status !== 'success') {
          setExpenseLabels([]);
          return;
        }
        const root = toRecord(res.data);
        const arr = (Array.isArray(root.data) ? root.data : Array.isArray(res.data) ? (res.data as unknown[]) : Array.isArray(root.labels) ? root.labels : []) as unknown[];
        const options = arr
          .map((raw) => {
            const rec = toRecord(raw);
            const value = pickString(rec, ['id', 'label_id', 'labelId', 'value', 'code']);
            const label = pickString(rec, ['label', 'name', 'title', 'text']) || value;
            if (!value) return null;
            return { value, label };
          })
          .filter(Boolean) as ExpenseLabelOption[];
        setExpenseLabels(options);
      } finally {
        setLabelsLoading(false);
      }
    })();
  }, [token]);

  const orderInfoItems = useMemo(() => {
    const d = detail;
    return [
      { label: 'Order ID', value: d?.orderId ?? '-' },
      {
        label: 'Status',
        value: d ? (
          <Badge variant={statusVariant(d.orderStatus)} className="capitalize">
            {d.orderStatus || '-'}
          </Badge>
        ) : (
          '-'
        ),
      },
      { label: 'Tanggal Perjalanan', value: d ? tryFormatDate(d.tripDate) : '-' },
      { label: 'Tanggal Selesai', value: d ? tryFormatDate(d.tripEndDate) : '-' },
      { label: 'Customer', value: d?.customerName ?? '-' },
      { label: 'Telepon', value: d?.customerPhone ?? '-' },
      { label: 'Rute', value: d?.route ?? '-' },
    ];
  }, [detail]);

  const fleetInfoItems = useMemo(() => {
    const d = detail;
    return [
      { label: 'Armada', value: d?.fleetName ?? '-' },
      { label: 'Plat Nomor', value: d?.plateNumber ?? '-' },
      { label: 'Driver', value: d?.driverName ?? '-' },
      { label: 'Co-Driver', value: d?.coDriverName ?? '-' },
    ];
  }, [detail]);

  const financeItems = useMemo(() => {
    const d = detail;
    return [
      { label: 'Total', value: d ? formatCurrency(d.totalAmount) : '-' },
      { label: 'Down Payment', value: d ? formatCurrency(d.downPayment) : '-' },
      { label: 'Sisa Tagihan', value: d ? formatCurrency(d.remainingAmount) : '-' },
      { label: 'Total Pengeluaran (API)', value: d ? formatCurrency(d.expensesTotal) : '-' },
    ];
  }, [detail]);

  const expensesTotalLocal = useMemo(() => expenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0), [expenses]);

  const resetExpenseDraft = () => {
    setExpenseDraft({ labelId: '', labelText: '', description: '', amount: 0, fundingType: 1 });
  };

  const canSaveExpense = expenseDraft.labelId.trim() !== '' && expenseDraft.amount > 0;

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BackButton to={`${basePrefix}/schedules/fleet-schedules`} />
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Jadwal</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {detail?.orderId ? `Order ID: ${detail.orderId}` : orderId ? `Order ID: ${orderId}` : '—'}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl"
          onClick={() => {
            const resolved = detail?.orderId || orderId;
            if (!resolved) return;
            navigate(`${basePrefix}/schedules/fleet-schedules/detail/${encodeURIComponent(resolved)}`);
          }}
        >
          Lihat Detail
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderWithBadge
            title="Informasi Pesanan"
            subtitle={loading ? 'Memuat detail…' : 'Ringkasan data pesanan dan perjalanan'}
            badgeIcon={ReceiptText}
          />
          <CardContent>
            <KeyValueGrid items={orderInfoItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeaderWithBadge
            title="Informasi Armada"
            subtitle={loading ? 'Memuat data armada…' : 'Armada dan awak yang bertugas'}
            badgeIcon={Car}
          />
          <CardContent>
            <KeyValueGrid items={fleetInfoItems} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeaderWithBadge
            title="Informasi Keuangan"
            subtitle={loading ? 'Memuat data finansial…' : 'Tambah dan pantau pengeluaran perjalanan'}
            badgeIcon={DollarSign}
            actions={
              <Button
                type="button"
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                onClick={() => setExpenseModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengeluaran
              </Button>
            }
          />
          <CardContent className="space-y-4">
            <KeyValueGrid items={financeItems} />

            <div className="rounded-2xl border border-gray-200/70 bg-white/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">Daftar Pengeluaran (Draft)</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Total draft: {formatCurrency(expensesTotalLocal)}
                  </div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="mt-3 text-sm text-muted-foreground">Belum ada pengeluaran yang ditambahkan.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {expenses.map((e, idx) => (
                    <div
                      key={`${e.labelId}-${idx}`}
                      className="flex flex-col gap-1 rounded-xl border border-gray-200/70 bg-white p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{e.labelText}</div>
                        <div className="text-xs text-muted-foreground break-words">{e.description || '—'}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Pendanaan:{' '}
                          {e.fundingType === 1 ? 'Tagihan Reimbursement' : 'Uang Jalan'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(e.amount)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button type="button" variant="outline" className="h-10 rounded-xl" disabled>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={expenseModalOpen}
        onOpenChange={(open) => {
          setExpenseModalOpen(open);
          if (!open) resetExpenseDraft();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
            <DialogDescription>Isi detail pengeluaran untuk perjalanan ini.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Jenis Pengeluaran</div>
              <Select
                value={expenseDraft.labelId}
                onValueChange={(val) => {
                  const selected = expenseLabels.find((o) => o.value === val);
                  setExpenseDraft((prev) => ({
                    ...prev,
                    labelId: val,
                    labelText: selected?.label ?? prev.labelText,
                  }));
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={labelsLoading ? 'Memuat…' : 'Pilih jenis pengeluaran'} />
                </SelectTrigger>
                <SelectContent>
                  {expenseLabels.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {labelsLoading ? 'Memuat…' : 'Tidak ada label'}
                    </SelectItem>
                  ) : (
                    expenseLabels.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Keterangan</div>
              <Textarea
                value={expenseDraft.description}
                onChange={(e) => setExpenseDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Contoh: Biaya tol / parkir / konsumsi"
                className="min-h-[92px] rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Nominal</div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={expenseDraft.amount ? String(expenseDraft.amount) : ''}
                  onChange={(e) => setExpenseDraft((prev) => ({ ...prev, amount: toNumberSafe(e.target.value) }))}
                  placeholder="0"
                  className="h-10"
                />
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Jenis Pendanaan</div>
                <Select
                  value={String(expenseDraft.fundingType)}
                  onValueChange={(val) => setExpenseDraft((prev) => ({ ...prev, fundingType: val === '2' ? 2 : 1 }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Pilih pendanaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tagihan Reimbursement</SelectItem>
                    <SelectItem value="2">Uang Jalan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setExpenseModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!canSaveExpense}
              onClick={() => {
                if (!canSaveExpense) return;
                const labelText =
                  expenseDraft.labelText || expenseLabels.find((o) => o.value === expenseDraft.labelId)?.label || expenseDraft.labelId;
                setExpenses((prev) => [
                  ...prev,
                  {
                    labelId: expenseDraft.labelId,
                    labelText,
                    description: expenseDraft.description.trim(),
                    amount: expenseDraft.amount,
                    fundingType: expenseDraft.fundingType,
                  },
                ]);
                setExpenseModalOpen(false);
              }}
            >
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

