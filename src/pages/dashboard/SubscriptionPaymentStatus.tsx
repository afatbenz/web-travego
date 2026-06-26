
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, XCircle, Download, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api, toApiUrl } from '@/lib/api';

type InvoiceData = {
  package_id: string;
  package_name: string;
  package_duration: number;
  start_date: string;
  expiry_date: string;
  created_at: string;
  payment_method: string;
  payment_amount: number;
  transaction_id?: string;
};

export const SubscriptionPaymentStatus: React.FC = () => {
  const { status } = useParams<{ status: string }>();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isSuccess = status === 'success';

  const fetchInvoiceData = async () => {
    if (!orderId) {
      setError('Order ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get<InvoiceData>(`/subscription/detail/${orderId}`);
      if (res.status === 'success' && res.data) {
        setInvoiceData(res.data);
      } else {
        setError('Failed to load invoice data');
      }
    } catch (err) {
      console.error('Error fetching invoice data:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;

    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(toApiUrl('/services/print-management/subscription'), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_number: orderId
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.onload = () => {
            window.URL.revokeObjectURL(url);
          };
        }
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    return format(date, 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full mx-auto" />
            <div className="space-y-4 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gagal Memuat Data
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {error || 'Terjadi kesalahan saat memuat data invoice'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={fetchInvoiceData} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              <Button onClick={() => navigate(basePrefix)} variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(basePrefix + '/subscription')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {isSuccess ? 'Pembayaran Berhasil' : 'Pembayaran Gagal'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Subscription &gt; {isSuccess ? 'Pembayaran Berhasil' : 'Pembayaran Gagal'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            {/* Icon and Title */}
            <div className="text-center space-y-4 mb-8">
              <div className="relative inline-block">
                <div
                  className={`flex items-center justify-center w-24 h-24 rounded-full mx-auto ${
                    isSuccess
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-14 w-14 text-red-600 dark:text-red-400" />
                  )}
                </div>
                {/* Sparkle decoration */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75" />
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isSuccess ? 'Pembayaran Berhasil!' : 'Pembayaran Gagal!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {isSuccess
                    ? 'Terima kasih, pembayaran Anda telah berhasil diproses. Langganan Anda sekarang aktif dan dapat digunakan.'
                    : 'Maaf, pembayaran Anda tidak dapat diproses. Silakan coba kembali atau hubungi tim support kami.'}
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-green-600 dark:text-green-400">📄</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nomor Invoice</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {orderId}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <span className="text-purple-600 dark:text-purple-400">🎁</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Paket</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {invoiceData.package_name} ({invoiceData.package_duration} hari)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <span className="text-orange-600 dark:text-orange-400">🏷️</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Harga Paket</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatRupiah(invoiceData.payment_amount)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <span className="text-yellow-600 dark:text-yellow-400">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Pembayaran</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(invoiceData.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 space-y-4">
              {isSuccess ? (
                <Button
                  onClick={handleDownloadInvoice}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl text-white"
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Invoice sedang disiapkan...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(basePrefix + '/subscription/pricing')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate(basePrefix)}
                className="w-full bg-transparent text-blue-600 hover:bg-blue-50 border border-blue-600 rounded-2xl"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
