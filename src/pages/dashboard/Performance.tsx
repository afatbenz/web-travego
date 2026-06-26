import React, { useCallback, useEffect, useState } from 'react';
import { Users, ShoppingBag, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, ChartSpline } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetricItem {
  package_name?: string;
  revenue?: number;
  [key: string]: unknown;
}

interface MetricPeriod {
  period: string;
  items: MetricItem[];
}

interface VisitorMetric {
  period: string;
  total_visit: number;
}

interface SummaryData {
  revenue?: { current_period: number; last_period: number };
  total_users?: { current_period: number; last_period: number };
  active_users?: { current_period: number; last_period: number };
  organization?: { current_period: number; last_period: number };
  total_visit?: { current_period: number; last_period: number };
  period?: string;
  matrics?: MetricPeriod[];
  visitor_matrics?: VisitorMetric[];
  [key: string]: unknown;
}

export const Performance: React.FC = () => {
  const [periodPreset, setPeriodPreset] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

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

    if (preset === 'this_month') {
      const start = new Date(year, month, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }
    if (preset === 'last_month') {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start_date: toYmd(start), end_date: toYmd(end) };
    }
    if (preset === 'this_year') {
      const start = new Date(year, 0, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }
    if (preset === 'last_year') {
      const start = new Date(year - 1, 0, 1);
      const end = new Date(year - 1, 11, 31);
      return { start_date: toYmd(start), end_date: toYmd(end) };
    }
    if (preset === 'all_time') {
      const start = new Date(2000, 0, 1);
      return { start_date: toYmd(start), end_date: toYmd(now) };
    }

    const start = new Date(year, month, 1);
    return { start_date: toYmd(start), end_date: toYmd(now) };
  }, [toYmd]);

  const toFiniteNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { start_date, end_date } = getPeriod(periodPreset);
        const qs = `start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}`;

        const summarizeRes = await api.get<unknown>(`/system/summarize?${qs}`);

        if (summarizeRes.status === 'success' && summarizeRes.data) {
          setSummaryData(summarizeRes.data as SummaryData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodPreset, getPeriod]);

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
  }> = ({ title, value, change, changeType, icon: Icon, color, previousPeriodText }) => {
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
          </div>
        </CardContent>
      </Card>
    );
  };

  const TrafficChart: React.FC<{ data: SummaryData | null }> = ({ data }) => {
    const visitorMatrics = data?.visitor_matrics ?? [];
    const chartData = visitorMatrics.map((metric) => ({
      label: metric.period,
      'Total Visit': metric.total_visit
    }));

    const formatTick = (value: string) => {
      try {
        const d = /^\d{4}-\d{2}-\d{2}/.test(value) ? parseISO(value.slice(0, 10)) : /^\d{4}-\d{2}/.test(value) ? parseISO(`${value}-01`) : null;
        return d ? format(d, 'dd MMM') : value;
      } catch {
        return value;
      }
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg lg:text-xl">
            <div className="flex items-center justify-center p-2 bg-purple-50 rounded-xl mr-5">
              <ChartSpline className="h-7 w-7 lg:h-5 lg:w-5 text-purple-500" />
            </div>
            Traffic Trend
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
                    <YAxis className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <Tooltip
                      formatter={(value: number | string, name: string) => [Number(value).toLocaleString('id-ID'), name]}
                      labelFormatter={(label: string) => formatTick(label)}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Total Visit" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const FinanceChart: React.FC<{ data: SummaryData | null }> = ({ data }) => {
    const matrics = data?.matrics ?? [];
    const chartData = matrics.map((metricPeriod) => {
      const totalRevenue = metricPeriod.items.reduce((sum, item) => sum + toFiniteNumber(item.revenue), 0);
      return {
        label: metricPeriod.period,
        Revenue: totalRevenue
      };
    });

    const formatTick = (value: string) => {
      try {
        const d = /^\d{4}-\d{2}-\d{2}/.test(value) ? parseISO(value.slice(0, 10)) : /^\d{4}-\d{2}/.test(value) ? parseISO(`${value}-01`) : null;
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
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  interface SummaryCardItem {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    icon: React.ElementType;
    color: string;
    previousPeriodText: string;
  }

  const summaryCards: SummaryCardItem[] = [
    {
      title: 'Total Perusahaan',
      value: (summaryData?.organization?.current_period ?? 0).toLocaleString('id-ID'),
      change: `${formatChangePercent(summaryData?.organization?.current_period ?? 0, summaryData?.organization?.last_period ?? 0).pct >= 0 ? '+' : ''}${formatChangePercent(summaryData?.organization?.current_period ?? 0, summaryData?.organization?.last_period ?? 0).pct}%`,
      changeType: formatChangePercent(summaryData?.organization?.current_period ?? 0, summaryData?.organization?.last_period ?? 0).direction === 'flat' ? 'neutral' : formatChangePercent(summaryData?.organization?.current_period ?? 0, summaryData?.organization?.last_period ?? 0).pct > 0 ? 'increase' : 'decrease',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400',
      previousPeriodText: `periode sebelumnya ${(summaryData?.organization?.last_period ?? 0).toLocaleString('id-ID')}`,
    },
    {
      title: 'Jumlah Pengguna',
      value: (summaryData?.total_users?.current_period ?? 0).toLocaleString('id-ID'),
      change: `${formatChangePercent(summaryData?.total_users?.current_period ?? 0, summaryData?.total_users?.last_period ?? 0).pct >= 0 ? '+' : ''}${formatChangePercent(summaryData?.total_users?.current_period ?? 0, summaryData?.total_users?.last_period ?? 0).pct}%`,
      changeType: formatChangePercent(summaryData?.total_users?.current_period ?? 0, summaryData?.total_users?.last_period ?? 0).direction === 'flat' ? 'neutral' : formatChangePercent(summaryData?.total_users?.current_period ?? 0, summaryData?.total_users?.last_period ?? 0).pct > 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      previousPeriodText: `periode sebelumnya ${(summaryData?.total_users?.last_period ?? 0).toLocaleString('id-ID')}`,
    },
    {
      title: 'Pengguna Aktif',
      value: (summaryData?.active_users?.current_period ?? 0).toLocaleString('id-ID'),
      change: `${formatChangePercent(summaryData?.active_users?.current_period ?? 0, summaryData?.active_users?.last_period ?? 0).pct >= 0 ? '+' : ''}${formatChangePercent(summaryData?.active_users?.current_period ?? 0, summaryData?.active_users?.last_period ?? 0).pct}%`,
      changeType: formatChangePercent(summaryData?.active_users?.current_period ?? 0, summaryData?.active_users?.last_period ?? 0).direction === 'flat' ? 'neutral' : formatChangePercent(summaryData?.active_users?.current_period ?? 0, summaryData?.active_users?.last_period ?? 0).pct > 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      previousPeriodText: `periode sebelumnya ${(summaryData?.active_users?.last_period ?? 0).toLocaleString('id-ID')}`,
    },
    {
      title: 'Pemasukan',
      value: formatCurrency(summaryData?.revenue?.current_period ?? 0),
      change: `${formatChangePercent(summaryData?.revenue?.current_period ?? 0, summaryData?.revenue?.last_period ?? 0).pct >= 0 ? '+' : ''}${formatChangePercent(summaryData?.revenue?.current_period ?? 0, summaryData?.revenue?.last_period ?? 0).pct}%`,
      changeType: formatChangePercent(summaryData?.revenue?.current_period ?? 0, summaryData?.revenue?.last_period ?? 0).direction === 'flat' ? 'neutral' : formatChangePercent(summaryData?.revenue?.current_period ?? 0, summaryData?.revenue?.last_period ?? 0).pct > 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      previousPeriodText: `periode sebelumnya ${formatCurrency(summaryData?.revenue?.last_period ?? 0)}`,
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Super Admin Dashboard</p>
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={periodPreset} onValueChange={setPeriodPreset}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="last_month">Bulan Lalu</SelectItem>
              <SelectItem value="this_year">Tahun Ini</SelectItem>
              <SelectItem value="last_year">Tahun Lalu</SelectItem>
              <SelectItem value="all_time">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 lg:gap-6">
            <Card className="animate-pulse lg:col-span-3">
              <CardContent className="p-4 lg:p-6">
                <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
            <Card className="animate-pulse lg:col-span-7">
              <CardContent className="p-4 lg:p-6">
                <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          </div>
          <Card className="animate-pulse">
            <CardContent className="p-4 lg:p-6">
              <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
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
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 lg:gap-6">
            {/* Jumlah Pengunjung (30% width on desktop) */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg lg:text-xl">
                  <div className="flex items-center justify-center p-2 bg-purple-50 rounded-xl mr-5">
                    <Users className="h-7 w-7 lg:h-5 lg:w-5 text-purple-500" />
                  </div>
                  Jumlah Pengunjung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <div className="mt-5 mb-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Periode Saat Ini</p>
                  <p className="text-2xl md:text-6xl font-bold text-gray-900 dark:text-white mt-1">
                    {(summaryData?.total_visit?.current_period ?? 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xl text-gray-400 font-normal mb-6">Visitors</p>
                </div>
                <div className="mt-10">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Periode Sebelumnya</p>
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
                    {(summaryData?.total_visit?.last_period ?? 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pengunjung Terbanyak</p>
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                    <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                      {(() => {
                        const matrics = summaryData?.visitor_matrics ?? [];
                        if (matrics.length === 0) return '-';
                        const max = matrics.reduce((prev, current) => prev.total_visit > current.total_visit ? prev : current);
                        try {
                          const d = /^\d{4}-\d{2}-\d{2}/.test(max.period) ? parseISO(max.period.slice(0, 10)) : /^\d{4}-\d{2}/.test(max.period) ? parseISO(`${max.period}-01`) : null;
                          return d ? format(d, 'dd MMM yyyy') : max.period;
                        } catch {
                          return max.period;
                        }
                      })()}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      {(() => {
                        const matrics = summaryData?.visitor_matrics ?? [];
                        if (matrics.length === 0) return '0';
                        const max = matrics.reduce((prev, current) => prev.total_visit > current.total_visit ? prev : current);
                        return max.total_visit.toLocaleString('id-ID');
                      })()} pengunjung
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Chart (70% width on desktop) */}
            <div className="lg:col-span-7">
              <TrafficChart data={summaryData} />
            </div>
          </div>

          <FinanceChart data={summaryData} />
        </>
      )}
    </div>
  );
};
