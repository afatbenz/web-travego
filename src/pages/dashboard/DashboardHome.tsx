import React, { useCallback, useEffect, useState } from 'react';
import { Users, ShoppingBag, TrendingUp, Car, MapPin, DollarSign, ChartSpline, MapPinCheck, MapPinHouse, PersonStanding, ArrowDownRight, ArrowRight, ArrowUpRight, Minus, AlertTriangle, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useEffectiveOrganization } from '@/hooks/useEffectiveOrganization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';

interface TransactionMetric { label: string; value: number }
interface PeriodStat { current: number; previous: number; total_amount: number; prev_amount: number; transaction_metrics: TransactionMetric[] }
interface TopItem { label: string; total: number }
interface FinanceSeries { name: string; data: number[] }
interface FinanceData {
  group_by: 'day' | 'week' | 'month';
  labels: string[];
  series: FinanceSeries[];
  summary: { total_revenue: number; total_expenses: number; net: number };
}
interface DashboardData {
  messages?: { current: number; previous: number };
  revenue?: PeriodStat;
  expenses?: PeriodStat;
  transaction?: { total_order?: number; prev_total_orders?: number; order_percentage?: number };
  customers?: { total_customers?: number; prev_total_customers?: number; customer_percentage?: number };
}

export const DashboardHome: React.FC = () => {
  const { hasEffectiveOrganization, isAdmin, isChecking } = useEffectiveOrganization();
  const shouldFetchDashboard = (isAdmin || hasEffectiveOrganization) && !isChecking;
  const [periodPreset, setPeriodPreset] = useState('Bulan Ini');
  const [totalOrders, setTotalOrders] = useState(0);
  const [previousTotalOrders, setPreviousTotalOrders] = useState(0);
  const [orderPercentage, setOrderPercentage] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [previousTotalCustomers, setPreviousTotalCustomers] = useState(0);
  const [customerPercentage, setCustomerPercentage] = useState(0);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [revenueStat, setRevenueStat] = useState<PeriodStat | null>(null);
  const [expensesStat, setExpensesStat] = useState<PeriodStat | null>(null);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [topDestinations, setTopDestinations] = useState<TopItem[]>([]);
  const [topPickupCity, setTopPickupCity] = useState<TopItem[]>([]);
  const [topFleets, setTopFleets] = useState<{ plate_number: string; vehicle_id: string; total: number }[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopItem[]>([]);

  const toYmd = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const getPeriod = useCallback((preset: string): { start_date: string; end_date: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (preset === 'Bulan Ini') {
      const start = new Date(year, month, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }
    if (preset === 'Bulan Lalu') {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start_date: toYmd(start), end_date: toYmd(end) };
    }
    if (preset === '3 Bulan Terakhir') {
      const start = new Date(year, month - 3, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }
    if (preset === 'Tahun Ini') {
      const start = new Date(year, 0, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }
    if (preset === 'Tahun Lalu') {
      const start = new Date(year - 1, 0, 1);
      const end = new Date(year - 1, 11, 31);
      return { start_date: toYmd(start), end_date: toYmd(end) };
    }

    const start = new Date(year, month, 1);
    return { start_date: toYmd(start), end_date: toYmd(now) };
  }, [toYmd]);

  useEffect(() => {
    if (isChecking) return;
    if (!shouldFetchDashboard) {
      setLoadingDashboard(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: token } : undefined;
      const { start_date, end_date } = getPeriod(periodPreset);
      const qs = `start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`;

      const toFiniteNumber = (value: unknown) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };

      const parseTransactionMetrics = (value: unknown): TransactionMetric[] => {
        if (!Array.isArray(value)) return [];
        return value
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const node = item as Record<string, unknown>;
            const label = typeof node.label === 'string' ? node.label : '';
            const v = toFiniteNumber(node.value);
            if (!label) return null;
            return { label, value: v } satisfies TransactionMetric;
          })
          .filter((x): x is TransactionMetric => Boolean(x));
      };

      const parsePeriodStat = (value: unknown): PeriodStat | null => {
        if (!value || typeof value !== 'object') return null;
        const node = value as Record<string, unknown>;
        return {
          current: toFiniteNumber(node.current),
          previous: toFiniteNumber(node.previous),
          total_amount: toFiniteNumber(node.total_amount),
          prev_amount: toFiniteNumber(node.prev_amount),
          transaction_metrics: parseTransactionMetrics(node.transaction_metrics),
        };
      };

      const parseFinanceData = (value: unknown): FinanceData | null => {
        if (!value || typeof value !== 'object') return null;
        const node = value as Record<string, unknown>;
        const groupBy = typeof node.group_by === 'string' ? node.group_by : 'day';
        const group_by = groupBy === 'week' || groupBy === 'month' ? groupBy : 'day';

        const labels = Array.isArray(node.labels) ? node.labels.filter((x): x is string => typeof x === 'string') : [];
        const seriesRaw = Array.isArray(node.series) ? node.series : [];
        const series: FinanceSeries[] = seriesRaw
          .map((s) => {
            if (!s || typeof s !== 'object') return null;
            const sn = s as Record<string, unknown>;
            const name = typeof sn.name === 'string' ? sn.name : '';
            const data = Array.isArray(sn.data) ? sn.data.map(toFiniteNumber) : [];
            if (!name) return null;
            return { name, data };
          })
          .filter((x): x is FinanceSeries => Boolean(x));

        const summaryNode = node.summary && typeof node.summary === 'object' ? (node.summary as Record<string, unknown>) : {};
        const summary = {
          total_revenue: toFiniteNumber(summaryNode.total_revenue),
          total_expenses: toFiniteNumber(summaryNode.total_expenses),
          net: toFiniteNumber(summaryNode.net),
        };

        return { group_by, labels, series, summary };
      };

      const parseTopItems = (value: unknown, labelKey: string): TopItem[] => {
        if (!Array.isArray(value)) return [];
        return value
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const node = item as Record<string, unknown>;
            const label = typeof node[labelKey] === 'string' ? (node[labelKey] as string) : '';
            const total = toFiniteNumber(node.total);
            if (!label) return null;
            return { label, total } satisfies TopItem;
          })
          .filter((x): x is TopItem => Boolean(x));
      };

      const parseTopFleets = (value: unknown) => {
        if (!Array.isArray(value)) return [];
        return value
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const node = item as Record<string, unknown>;
            const plate_number = typeof node.plate_number === 'string' ? node.plate_number : '';
            const vehicle_id = typeof node.vehicle_id === 'string' ? node.vehicle_id : '';
            const total = toFiniteNumber(node.total);
            if (!plate_number && !vehicle_id) return null;
            return { plate_number, vehicle_id, total };
          })
          .filter((x): x is { plate_number: string; vehicle_id: string; total: number } => Boolean(x));
      };

      try {
        const [
          financeRes,
          dashboardRes,
          destinationsRes,
          pickupCityRes,
          fleetsRes,
          driversRes,
          customersRes,
        ] = await Promise.all([
          api.get<unknown>(`/dashboard/finance?${qs}`, headers),
          api.get<unknown>(`/dashboard?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/destinations?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/pickup_city?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/fleets?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/tour_packages?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/drivers?${qs}`, headers),
          api.get<unknown>(`/dashboard/top/customers?${qs}`, headers),
        ]);

        if (financeRes.status === 'success') {
          setFinanceData(parseFinanceData(financeRes.data));
        } else {
          setFinanceData(null);
        }

        if (dashboardRes.status === 'success' && dashboardRes.data && typeof dashboardRes.data === 'object') {
          const root = dashboardRes.data as DashboardData;
          const nextTotalOrders = toFiniteNumber(root.transaction?.total_order);
          const nextPreviousTotalOrders = toFiniteNumber(root.transaction?.prev_total_orders);
          const nextOrderPct = toFiniteNumber(root.transaction?.order_percentage);
          const nextTotalCustomers = toFiniteNumber(root.customers?.total_customers);
          const nextPreviousTotalCustomers = toFiniteNumber(root.customers?.prev_total_customers);
          const nextCustomerPct = toFiniteNumber(root.customers?.customer_percentage);
          setTotalOrders(nextTotalOrders);
          setPreviousTotalOrders(nextPreviousTotalOrders);
          setOrderPercentage(nextOrderPct);
          setTotalCustomers(nextTotalCustomers);
          setPreviousTotalCustomers(nextPreviousTotalCustomers);
          setCustomerPercentage(nextCustomerPct);
          setRevenueStat(parsePeriodStat(root.revenue));
          setExpensesStat(parsePeriodStat(root.expenses));
        }

        if (destinationsRes.status === 'success') {
          setTopDestinations(parseTopItems(destinationsRes.data, 'city_label').slice(0, 10));
        }
        if (pickupCityRes.status === 'success') {
          setTopPickupCity(parseTopItems(pickupCityRes.data, 'pickup_city_label').slice(0, 10));
        }
        if (fleetsRes.status === 'success') {
          setTopFleets(parseTopFleets(fleetsRes.data).slice(0, 10));
        }
        // if (tourPackagesRes.status === 'success') {
        //   setTopTourPackages(parseTopItems(tourPackagesRes.data, 'package_name').slice(0, 10));
        // }
        if (driversRes.status === 'success') {
          setTopDrivers(parseTopItems(driversRes.data, 'fullname').slice(0, 10));
        }
        if (customersRes.status === 'success') {
          setTopCustomers(parseTopItems(customersRes.data, 'customer_name').slice(0, 10));
        }
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, [periodPreset, getPeriod, shouldFetchDashboard, isChecking]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatChangePercent = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return { pct: 0, direction: 'flat' as const };
      return { pct: 100, direction: 'up' as const };
    }
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    const rounded = Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0;
    if (rounded > 0) return { pct: rounded, direction: 'up' as const };
    if (rounded < 0) return { pct: rounded, direction: 'down' as const };
    return { pct: 0, direction: 'flat' as const };
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    icon: React.ElementType;
    color: string;
    previousPeriodText?: string;
    footerLabel?: string;
    footerHref?: string;
  }> = ({ title, value, change, changeType, icon: Icon, color, previousPeriodText, footerLabel, footerHref }) => {
    const trendStyles =
      changeType === 'increase'
        ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
        : changeType === 'decrease'
          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-300';
    const TrendIcon = changeType === 'increase' ? ArrowUpRight : changeType === 'decrease' ? ArrowDownRight : Minus;

    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 pb-0">
        <CardContent className="px-4 py-3 md:p-4 lg:p-6">
          <div className="space-y-3">
            <div className="space-y-1 md:flex md:items-center md:justify-between md:space-y-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <p className="text-[11px] md:text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    {title}
                  </p>
                </div>
                <p className="mt-1 text-base md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </p>
                <div className="mt-2 space-y-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs lg:text-sm font-medium ${trendStyles}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {change}
                  </span>
                  {previousPeriodText ? (
                    <p className="text-[11px] lg:text-xs text-gray-500 dark:text-gray-400">
                      {previousPeriodText}
                    </p>
                  ) : null}
                </div>
              </div>
              <div
                className={`hidden md:flex w-10 h-10 lg:w-12 lg:h-12 ${color} bg-opacity-10 rounded-lg items-center justify-center flex-shrink-0`}
              >
                <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${color}`} />
              </div>
            </div>
            {footerLabel && footerHref ? (
              <Link
                to={footerHref}
                className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:border-gray-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>{footerLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  const summaryCards = [
    {
      title: 'Total Pesanan',
      value: totalOrders.toLocaleString('id-ID'),
      change: `${orderPercentage >= 0 ? '+' : ''}${orderPercentage}%`,
      changeType: (orderPercentage > 0 ? 'increase' : orderPercentage < 0 ? 'decrease' : 'neutral') as 'increase' | 'decrease' | 'neutral',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400',
      previousPeriodText: `periode sebelumnya ${previousTotalOrders}`,
      footerLabel: 'Lihat Detail',
      footerHref: '/dashboard/partner/services/fleet',
    },
    {
      title: 'Jumlah Pelanggan',
      value: totalCustomers.toLocaleString('id-ID'),
      change: `${customerPercentage >= 0 ? '+' : ''}${customerPercentage}%`,
      changeType: (customerPercentage > 0 ? 'increase' : customerPercentage < 0 ? 'decrease' : 'neutral') as 'increase' | 'decrease' | 'neutral',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      previousPeriodText: `periode sebelumnya ${previousTotalCustomers.toLocaleString('id-ID')}`,
      footerLabel: 'Lihat Detail',
      footerHref: '/dashboard/partner/customers',
    },
    (() => {
      const current = revenueStat?.total_amount ?? 0;
      const previous = revenueStat?.prev_amount ?? 0;
      const change = formatChangePercent(current, previous);
      return {
        title: 'Pemasukan Bulan Ini',
        value: formatCurrency(current),
        change: `${change.pct > 0 ? '+' : ''}${change.pct}%`,
        changeType: (change.direction === 'flat' ? 'neutral' : change.pct > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease' | 'neutral',
        icon: TrendingUp,
        color: 'text-orange-600 dark:text-orange-400',
        previousPeriodText: `periode sebelumnya ${formatCurrency(previous)}`,
        footerLabel: 'Lihat Detail',
        footerHref: '/dashboard/partner/finance/revenue',
      } as const;
    })(),
    (() => {
      const current = expensesStat?.total_amount ?? 0;
      const previous = expensesStat?.prev_amount ?? 0;
      const change = formatChangePercent(current, previous);
      return {
        title: 'Pengeluaran Bulan Ini',
        value: formatCurrency(current),
        change: `${change.pct > 0 ? '+' : ''}${change.pct}%`,
        changeType: (change.direction === 'flat' ? 'neutral' : change.pct > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease' | 'neutral',
        icon: DollarSign,
        color: 'text-red-600 dark:text-red-400',
        previousPeriodText: `periode sebelumnya ${formatCurrency(previous)}`,
        footerLabel: 'Lihat Detail',
        footerHref: '/dashboard/partner/finance/expenses',
      } as const;
    })(),
  ];

  const TransactionMetricsChart: React.FC<{ data: TransactionMetric[]; title: string }> = ({ data, title }) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e', '#f97316'];
    const chartData = (data ?? []).map((d) => ({ name: d.label, value: d.value }));
    const total = chartData.reduce((acc, cur) => acc + (Number.isFinite(cur.value) ? cur.value : 0), 0);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg lg:text-xl">
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-xl mr-5">
              <DollarSign className="h-7 w-7 lg:h-5 lg:w-5 text-blue-500" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-48 lg:h-64 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <>
              <div className="h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string, name: string) => [
                        `${Number(value).toLocaleString('id-ID')}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3 lg:mt-4">
                {chartData.map((m, idx) => (
                  <div key={`${m.name}-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div
                        className="w-2 h-2 lg:w-3 lg:h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">{m.name}</span>
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white ml-2">
                      {m.value.toLocaleString('id-ID')}
                      {total > 0 ? ` (${Math.round((m.value / total) * 100)}%)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const FinanceChart: React.FC<{ data: FinanceData | null }> = ({ data }) => {
    const group_by = data?.group_by ?? 'day';
    const labels = data?.labels ?? [];
    const series = data?.series ?? [];
    const summary = data?.summary;

    const chartData = labels.map((label, i) => {
      const revenue = series.find((s) => s.name === 'Revenue')?.data[i] ?? 0;
      const expenses = series.find((s) => s.name === 'Expenses')?.data[i] ?? 0;
      return { label, Revenue: revenue, Expenses: expenses };
    });

    const formatTick = (value: string) => {
      try {
        if (group_by === 'month') {
          const d =
            /^\d{4}-\d{2}$/.test(value) ? parseISO(`${value}-01`) : /^\d{4}-\d{2}-\d{2}/.test(value) ? parseISO(value.slice(0, 10)) : null;
          return d ? format(d, 'MMM yyyy') : value;
        }
        const d = /^\d{4}-\d{2}-\d{2}/.test(value) ? parseISO(value.slice(0, 10)) : null;
        return d ? format(d, 'dd MMM') : value;
      } catch {
        return value;
      }
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg lg:text-xl">
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-xl mr-5">
              <ChartSpline className="h-7 w-7 lg:h-5 lg:w-5 text-blue-500" />
            </div>
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="label" tickFormatter={formatTick} className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <YAxis tickFormatter={(v) => formatCurrency(Number(v))} className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <Tooltip
                      formatter={(value: number | string, name: string) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label: string) => formatTick(label)}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(summary?.total_revenue ?? 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(summary?.total_expenses ?? 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Net</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(summary?.net ?? 0)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const TopListCard: React.FC<{
    title: string;
    data: TopItem[];
    valuePrefix?: string;
    orientation?: 'horizontal' | 'vertical';
    icon?: React.ElementType;
  }> = ({ title, data, valuePrefix, orientation = 'horizontal', icon: Icon = MapPin }) => {
    const safeData = (data ?? []).slice(0, 10);
    const prefix = valuePrefix ?? '';
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg lg:text-xl">
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-xl mr-5">
              <Icon className="h-7 w-7 lg:h-5 lg:w-5 text-blue-500" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeData.length === 0 ? (
            <div className="h-56 lg:h-64 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {orientation === 'vertical' ? (
                  <BarChart data={safeData} margin={{ left: 8, right: 8, top: 8, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <YAxis className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <Tooltip
                      formatter={(value: number | string) => [`${prefix}${Number(value).toLocaleString('id-ID')}`, 'Total']}
                      labelFormatter={(label: string) => label}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={safeData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis type="number" className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number | string) => [`${prefix}${Number(value).toLocaleString('id-ID')}`, 'Total']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TopFleetsCard: React.FC<{
    data: { plate_number: string; vehicle_id: string; total: number }[];
    icon?: React.ElementType;
  }> = ({ data, icon: Icon = Car }) => {
    const safeData = (data ?? [])
      .slice(0, 10)
      .map((d) => ({
        label: `${d.plate_number}${d.vehicle_id ? ` (${d.vehicle_id})` : ''}`,
        total: d.total,
      }));

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg lg:text-xl">
            <div className="flex items-center justify-center p-2 bg-blue-50 rounded-xl mr-5">
              <Icon className="h-7 w-7 lg:h-5 lg:w-5 text-blue-500" />
            </div>
            Armada Terpopuler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeData.length === 0 ? (
            <div className="h-56 lg:h-64 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              Tidak ada data
            </div>
          ) : (
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" className="text-gray-600 dark:text-gray-400" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={160}
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${Number(value).toLocaleString('id-ID')}`, 'Total']}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const OrganizationRequiredState: React.FC = () => (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-100">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
          <AlertTriangle className="h-6 w-6 text-yellow-700 dark:text-yellow-200" />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Perlu tergabung dalam organisasi</h2>
            <p className="mt-1 text-sm text-yellow-800/80 dark:text-yellow-100/70">
              Dashboard belum dapat menampilkan data karena organization_id belum tersedia. Buat organisasi baru atau bergabung dengan organisasi yang sudah ada.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard/partner/organization/register"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Buat Organisasi
            </Link>
            <Link
              to="/dashboard/partner/organization/join"
              className="inline-flex items-center justify-center rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-900 transition-colors hover:bg-yellow-100 dark:border-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <Users className="mr-2 h-4 w-4" />
              Gabung Organisasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-6 pb-24 md:pb-0">
      {isChecking ? null : !hasEffectiveOrganization && !isAdmin ? (
        <OrganizationRequiredState />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={periodPreset} onValueChange={setPeriodPreset}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bulan Ini">Bulan Ini</SelectItem>
                  <SelectItem value="Bulan Lalu">Bulan Lalu</SelectItem>
                  <SelectItem value="3 Bulan Terakhir">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="Tahun Ini">Tahun Ini</SelectItem>
                  <SelectItem value="Tahun Lalu">Tahun Lalu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

      {loadingDashboard ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`sk-${i}`} className="animate-pulse">
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="animate-pulse">
            <CardContent className="p-4 lg:p-6">
              <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={`skm-${i}`} className="animate-pulse">
                <CardContent className="p-4 lg:p-6">
                  <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {summaryCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                change={card.change}
                changeType={card.changeType}
                icon={card.icon}
                color={card.color}
                previousPeriodText={card.previousPeriodText}
                footerLabel={card.footerLabel}
                footerHref={card.footerHref}
              />
            ))}
          </div>

          <FinanceChart data={financeData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* <TransactionMetricsChart data={revenueStat?.transaction_metrics ?? []} title="Transaksi Pemasukan" /> */}
            <TopFleetsCard data={topFleets} icon={Car} />
            <TransactionMetricsChart data={expensesStat?.transaction_metrics ?? []} title="Transaksi Pengeluaran" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TopListCard title="Kota Tujuan Terpopuler" data={topDestinations} orientation="vertical" icon={MapPinCheck} />
            <TopListCard title="Kota Penjemputan Terpopuler" data={topPickupCity} orientation="vertical" icon={MapPinHouse} />
          </div>

          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TopListCard title=" Paket Tour Terpopuler" data={topTourPackages} orientation="vertical" icon={TreePalm} />
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <TopListCard title="Pengemudi Tersibuk" data={topDrivers} orientation="vertical" icon={PersonStanding} />
            <TopListCard title="Customer Paling Loyal" data={topCustomers} orientation="vertical" icon={Users} />
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
};
