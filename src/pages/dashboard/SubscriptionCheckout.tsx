import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type SubscriptionSummaryData = {
  package_id: string;
  package_name: string;
  package_duration: number;
  package_description: string;
  package_price: number;
  original_price: number;
  discount_price: number;
  payment_amount: number;
  features: string[];
};

export const SubscriptionCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const basePrefix = location.pathname.startsWith('/dashboard/partner') ? '/dashboard/partner' : '/dashboard';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SubscriptionSummaryData | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(amount));
  };

  useEffect(() => {
    // Load Midtrans Snap script
    if (!(window as any).snap) {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
      script.onload = () => setSnapLoaded(true);
      script.onerror = () => setError('Failed to load payment gateway');
      document.body.appendChild(script);
    } else {
      setSnapLoaded(true);
    }

    const fetchSummary = async () => {
      const packageId = searchParams.get('package_id');
      if (!packageId) {
        setError('Package ID not found');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.post('/subscription/summary', { package_id: packageId });
        if (res.status === 'success' && res.data) {
          setSummaryData(res.data as SubscriptionSummaryData);
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err);
        setError('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [searchParams]);

  const handlePayment = async () => {
    if (!summaryData || !snapLoaded) return;
    setProcessingPayment(true);
    try {
      const res = await api.post('/subscription/submit', { package_id: summaryData.package_id });
      if (res.status === 'success' && res.data) {
        const { snap_token } = res.data as { snap_token: string };
        if ((window as any).snap) {
          (window as any).snap.pay(snap_token, {
            onSuccess: () => {
              navigate(`${basePrefix}/subscription`);
            },
            onPending: () => {
              navigate(`${basePrefix}/subscription`);
            },
            onError: (result: any) => {
              console.error('Payment error:', result);
              setError('Payment failed');
            },
            onClose: () => {
              setError('Payment not completed');
            },
          });
        } else {
          throw new Error('Midtrans Snap not available');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateSavingsPercentage = () => {
    if (!summaryData) return 0;
    return Math.round((1 - summaryData.payment_amount / summaryData.package_price) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Checkout
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Checkout
            </h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">{error || 'Something went wrong'}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Subscription &gt; Checkout
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Banner */}

          {/* Package Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {summaryData.package_name}
                    </h3>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                      {summaryData.package_duration} hari
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {summaryData.package_description}
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-lg text-gray-500 line-through">
                      {formatRupiah(summaryData.original_price)}
                    </span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatRupiah(summaryData.package_price)}
                    </span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Hemat {calculateSavingsPercentage()}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Ringkasan Manfaat</h4>
              <div className="border border-slate-100 mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summaryData.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div>
          <div className="sticky top-6 space-y-4">
            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Ringkasan Pesanan
                </h3>
                <div className="border border-slate-100 mb-3"></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Paket</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {summaryData.package_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Durasi</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {summaryData.package_duration} hari
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Harga Normal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatRupiah(summaryData.original_price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Diskon</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatRupiah(summaryData.discount_price)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Pembayaran</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatRupiah(summaryData.payment_amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Termasuk PPN 11%
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Paket akan aktif setelah pembayaran berhasil. Anda akan menerima invoice melalui email.
                  </p>
                </div>

                {/* Pay Button */}
                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handlePayment}
                  disabled={processingPayment || !snapLoaded}
                >
                  {processingPayment || !snapLoaded ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {!snapLoaded ? 'Memuat Gateway...' : 'Lanjutkan ke Pembayaran'}
                </Button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Transaksi aman dan terenkripsi
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="bg-blue-200 dark:bg-blue-900/20 p-4 rounded-xl text-center">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Periksa kembali detail pesanan Anda sebelum melanjutkan ke pembayaran.
        </p>
      </div>

      {/* Footer Text */}
      <div className="text-center space-y-1 pb-8">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Kebijakan pembatalan: Paket dapat dibatalkan kapan saja.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Sisa durasi akan dihitung prorata sesuai ketentuan yang berlaku.
        </p>
      </div>
    </div>
  );
};
