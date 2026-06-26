import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Star, Calendar, CreditCard, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { api, toApiUrl } from '@/lib/api';
import moment from 'moment';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

const formatDate = (dateStr: string, format: 'long' | 'short' = 'long') => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  if (format === 'long') {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const calculateRemainingDays = (expiryDateStr: string) => {
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  const diffMs = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

type SubscriptionData = {
  package_id: string;
  package_name: string;
  package_price: number;
  payment_amount: number;
  start_date: string;
  expiry_date: string;
  status: string;
};

type PaymentHistoryItem = {
  transaction_date: string;
  invoice_number: string;
  package_name: string;
  package_duration: string;
  package_price: number;
  start_date: string;
  expiry_date: string;
  payment_amount: number;
  payment_method: string;
};

type PackageBenefit = {
  id: string;
  name: string;
  description: string;
};

export const SubscriptionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefits, setBenefits] = useState<PackageBenefit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [processingInvoiceNumber, setProcessingInvoiceNumber] = useState<string | null>(null);

  const fetchSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get<unknown>('/account/subscription', token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const data = res.data as Record<string, unknown>;
        setSubscription({
          package_id: String(data.package_id || ''),
          package_name: String(data.package_name || ''),
          package_price: Number(data.package_price || 0),
          status: String(data.status || ''),
          payment_amount: Number(data.payment_amount || 0),
          start_date: String(data.start_date || ''),
          expiry_date: String(data.expiry_date || ''),
        });
      }
    } catch {
      console.error('Failed to fetch subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get<unknown>('/account/subscription/history', token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const data = res.data as unknown;
        let list: unknown[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          if (Array.isArray(obj.data)) list = obj.data;
          else if (Array.isArray(obj.items)) list = obj.items;
          else if (Array.isArray(obj.rows)) list = obj.rows;
        }
        const mapped = list.map((item) => {
          const o = item as Record<string, unknown>;
          return {
            transaction_date: String(o.transaction_date || ''),
            invoice_number: String(o.invoice_number || ''),
            package_name: String(o.package_name || ''),
            package_duration: String(o.package_duration || ''),
            package_price: Number(o.package_price || 0),
            payment_method: String(o.payment_method || ''),
            payment_amount: Number(o.payment_amount || 0),
            start_date: moment(o.start_date || '').format('DD MMM YYYY'),
            expiry_date: moment(o.expiry_date || '').format('DD MMM YYYY'),
          };
        });
        setPaymentHistory(mapped);
      }
    } catch {
      console.error('Failed to fetch payment history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPackageBenefits = async () => {
    if (!subscription?.package_id) return;
    setBenefitsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get<unknown>(`/services/packages/detail/${subscription.package_id}`, token ? { Authorization: token } : undefined);
      if (res.status === 'success') {
        const data = res.data as Record<string, unknown>;
        const features = data.features as string[];
        const mapped = features.map((feature, idx) => ({
          id: String(idx),
          name: feature,
          description: '',
        }));
        setBenefits(mapped);
      }
    } catch {
      console.error('Failed to fetch package benefits');
    } finally {
      setBenefitsLoading(false);
    }
  };

  const handleViewBenefits = () => {
    setBenefitDialogOpen(true);
    fetchPackageBenefits();
  };

  const handleViewInvoice = async (invoiceNumber: string) => {
    try {
      setProcessingInvoiceNumber(invoiceNumber);
      const token = localStorage.getItem('token');
      const res = await fetch(toApiUrl('/services/print-management/subscription'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ invoice_number: invoiceNumber }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const blob = await res.blob();
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Failed to open invoice:', error);
    } finally {
      setProcessingInvoiceNumber(null);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPaymentHistory();
  }, []);

  const historyColumns: Array<DataTableColumn<PaymentHistoryItem>> = [
    {
      label: 'Tanggal',
      key: 'transaction_date',
      sortable: true,
      width: 140,
      render: (row) => <span className="text-sm text-foreground">{formatDate(row.transaction_date, 'short')}</span>,
    },
    {
      label: 'Invoice ID',
      key: 'invoice_number',
      sortable: true,
      width: 180,
      render: (row) => <span className="text-sm text-foreground font-medium">{row.invoice_number}</span>,
    },
    {
      label: 'Paket',
      key: 'package_name',
      sortable: true,
      width: 200,
      render: (row) => <span className="text-sm text-foreground">{row.package_name}</span>,
    },
    {
      label: 'Periode',
      key: 'package_duration',
      sortable: true,
      width: 200,
      render: (row) => <span className="text-sm text-foreground">{row.start_date} - {row.expiry_date}</span>,
    },
    {
      label: 'Jumlah',
      key: 'package_price',
      sortable: true,
      width: 160,
      align: 'right',
      render: (row) => <span className="text-sm font-semibold text-foreground">{formatRupiah(row.payment_amount)}</span>,
    },
  ];

  const remainingDays = subscription ? calculateRemainingDays(subscription.expiry_date) : 0;
  const isActive = subscription?.status.toLowerCase() === 'aktif' || subscription?.status.toLowerCase() === 'active';

  const getIconAndColor = (packageName: string) => {
    if (packageName === 'Basic Class') {
      return {
        icon: <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />,
        bg: 'bg-amber-700',
      };
    } else if (packageName === 'Silver Class') {
      return {
        icon: <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />,
        bg: 'bg-gray-300',
      };
    } else if (packageName === 'Diamond Class') {
      return {
        icon: <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />,
        bg: 'bg-emerald-600',
      };
    }
    return {
      icon: <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />,
      bg: 'bg-blue-600',
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Kelola paket berlangganan dan riwayat pembayaran Anda.
        </p>
      </div>

      {/* Current Package Section */}
      <Card className="rounded-2xl shadow-sm overflow-hidden border-none">
        <CardContent className="p-6 sm:p-8">
          {subscriptionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ) : subscription ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${getIconAndColor(subscription.package_name).bg} flex items-center justify-center`}>
                  {getIconAndColor(subscription.package_name).icon}
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {subscription.package_name}
                  </h2>
                  <Badge
                    className={
                      isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }
                  >
                    {isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nikmati semua fitur premium untuk mengelola armada dan operasional bisnis Anda.
                </p>

                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {formatRupiah(subscription.package_price)}
                      <span className="text-sm font-normal text-gray-500 ml-1">/ bulan</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-sm text-gray-900 dark:text-white">
                        Kadaluarsa: {formatDate(subscription.expiry_date)}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          remainingDays > 30
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : remainingDays > 7
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        ({remainingDays} hari tersisa)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-3">
                  <Button
                    onClick={() => navigate(`${basePrefix}/accounts/subscription/pricing`)}
                    className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Lihat Penawaran
                  </Button>
                <Button
                  onClick={handleViewBenefits}
                  className="h-10 rounded-xl bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Benefit
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-6">Tidak ada paket langganan aktif.</p>
              <Button
                onClick={() => navigate(`${basePrefix}/accounts/subscription/pricing`)}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Lihat Penawaran
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className="rounded-2xl shadow-sm overflow-hidden border-none">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Pembayaran</h3>
          </div>

          <DataTable
            data={paymentHistory}
            columns={historyColumns}
            loading={historyLoading}
            stickyHeader
            zebra
            emptyTitle="Tidak ada riwayat pembayaran"
            emptyDescription="Anda belum memiliki riwayat pembayaran paket langganan."
            pagination={{
              page: currentPage,
              pageSize,
              onPageChange: setCurrentPage,
              onPageSizeChange: (n) => {
                setPageSize(n);
                setCurrentPage(1);
              },
              pageSizeOptions: [10, 20, 50, 100],
            }}
            sorting={{ initialSort: { key: 'transaction_date', direction: 'desc' } }}
            rowKey={(row) => row.invoice_number}
            actions={{
              actions: [
                {
                  key: 'view-invoice',
                  label: (row) => processingInvoiceNumber === row.invoice_number ? 'Proses Invoice ....' : 'Lihat Invoice',
                  icon: Eye,
                  disabled: (row) => processingInvoiceNumber === row.invoice_number,
                  onSelect: (row) => handleViewInvoice(row.invoice_number),
                },
              ],
            }}
          />
        </CardContent>
      </Card>

      {/* Benefit Dialog */}
      <Dialog open={benefitDialogOpen} onOpenChange={setBenefitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Benefit Paket</DialogTitle>
            <DialogDescription>Daftar benefit yang Anda dapatkan dari paket langganan.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {benefitsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ))
            ) : benefits.length > 0 ? (
              benefits.map((benefit) => (
                <div key={benefit.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{benefit.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Tidak ada benefit yang tersedia.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
