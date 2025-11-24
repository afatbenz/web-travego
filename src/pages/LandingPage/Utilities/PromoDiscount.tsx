import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample promo data
const promoData = [
  {
    id: 1,
    code: "WELCOME20",
    title: "Welcome Bonus 20%",
    description: "Diskon 20% untuk pemesanan pertama",
    discount: "20%",
    type: "percentage",
    minAmount: "Rp 1.000.000",
    maxDiscount: "Rp 500.000",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "active",
    used: false,
    applicableFor: ["catalog", "armada"]
  },
  {
    id: 2,
    code: "SUMMER50",
    title: "Summer Special 50%",
    description: "Diskon 50% untuk paket wisata musim panas",
    discount: "50%",
    type: "percentage",
    minAmount: "Rp 2.000.000",
    maxDiscount: "Rp 1.000.000",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    status: "active",
    used: false,
    applicableFor: ["catalog"]
  },
  {
    id: 3,
    code: "FAMILY100",
    title: "Family Package",
    description: "Potongan Rp 100.000 untuk paket keluarga",
    discount: "Rp 100.000",
    type: "fixed",
    minAmount: "Rp 3.000.000",
    maxDiscount: "Rp 100.000",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    status: "expired",
    used: false,
    applicableFor: ["catalog"]
  },
  {
    id: 4,
    code: "TRANSPORT30",
    title: "Armada Rental 30%",
    description: "Diskon 30% untuk sewa armada",
    discount: "30%",
    type: "percentage",
    minAmount: "Rp 500.000",
    maxDiscount: "Rp 300.000",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    status: "active",
    used: true,
    applicableFor: ["armada"]
  },
  {
    id: 5,
    code: "EARLYBIRD15",
    title: "Early Bird 15%",
    description: "Diskon 15% untuk pemesanan 30 hari sebelumnya",
    discount: "15%",
    type: "percentage",
    minAmount: "Rp 1.500.000",
    maxDiscount: "Rp 400.000",
    startDate: "2024-02-01",
    endDate: "2024-04-30",
    status: "active",
    used: false,
    applicableFor: ["catalog"]
  }
];

export const PromoDiscount: React.FC = () => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPromoIcon = (status: string, used: boolean) => {
    if (used) return <CheckCircle className="h-5 w-5 text-gray-500" />;
    if (status === 'active') return <Gift className="h-5 w-5 text-green-600" />;
    if (status === 'expired') return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getPromoStatusBadge = (status: string, used: boolean) => {
    if (used) return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Digunakan</Badge>;
    if (status === 'active') return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Aktif</Badge>;
    if (status === 'expired') return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Kadaluarsa</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const isPromoActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Promo & Diskon
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Kode promo dan diskon yang tersedia untuk Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              Promo & Diskon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promoData.map((promo) => (
                <div
                  key={promo.id}
                  className={`p-4 border rounded-lg ${
                    promo.status === 'active' && !promo.used && isPromoActive(promo.startDate, promo.endDate)
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : promo.used
                      ? 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getPromoIcon(promo.status, promo.used)}
                      <div className="ml-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {promo.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {promo.description}
                        </p>
                      </div>
                    </div>
                    {getPromoStatusBadge(promo.status, promo.used)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Kode Promo:</span>
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {promo.code}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Diskon:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {promo.discount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Min. Belanja:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {promo.minAmount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Berlaku:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Berlaku untuk:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {promo.applicableFor.join(', ')}
                      </span>
                    </div>
                    
                    {!promo.used && promo.status === 'active' && isPromoActive(promo.startDate, promo.endDate) && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          size="sm" 
                          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300"
                          onClick={() => {
                            navigator.clipboard.writeText(promo.code);
                            alert(`Kode promo ${promo.code} telah disalin!`);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Salin Kode Promo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
