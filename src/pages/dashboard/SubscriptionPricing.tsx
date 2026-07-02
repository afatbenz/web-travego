import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

type PricingPlan = {
  packageId: string;
  name: string;
  priceDescription: string;
  packageNotes: string;
  monthlyPrice: string;
  popular: boolean;
  originalPrice: string;
  isCurrentPackage: boolean;
  duration: string;
  features: string[];
};

type PackageApiResponse = {
  package_id: string;
  package_name: string;
  package_description: string;
  package_notes: string;
  package_price: number;
  package_original_price: number;
  package_duration: number;
  is_current_package: boolean;
  features: string[];
};

export const SubscriptionPricing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location.pathname.startsWith('/dashboard') ? '/dashboard' : '';
  
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const pricingContainerRef = useRef<HTMLDivElement>(null);
  const extraFeaturesRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [extraFeaturesHeights, setExtraFeaturesHeights] = useState<Record<string, number>>({});
  const [selectingPackage, setSelectingPackage] = useState<string | null>(null);
  const isFreePackage = String(import.meta.env.VITE_FREE_PACKAGE).toLowerCase() === 'true';

  const handleSelectPackage = async (packageId: string) => {
    if (isFreePackage) {
      await Swal.fire({
        icon: 'info',
        title: 'Selamat !!',
        text: 'Saat ini paket masih gratis, anda bisa gunakan layanan yang ada tanpa biaya',
        confirmButtonText: 'OK',
      });
      return;
    }

    setSelectingPackage(packageId);
    try {
      const res = await api.post('/subscription/summary', { package_id: packageId });
      if (res.status === 'success' && res.data) {
        navigate(`${basePrefix}/subscription/checkout?package_id=${packageId}`);
      }
    } catch (err) {
      console.error('Failed to get subscription summary', err);
    } finally {
      setSelectingPackage(null);
    }
  };

  const toggleExpand = (planName: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planName]: !prev[planName],
    }));
  };

  const parseRupiah = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : 0;
  };

  const formatRupiah = (amount: number) => {
    return `Rp${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
  };

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get<PackageApiResponse[]>('/services/packages/pricing', token ? { Authorization: token } : { 'api-key': 'trv-lasoa30sal&1ajshdkahsd012-12' });
        if (res.status === 'success' && res.data) {
        setPricingPlans(res.data.map((pkg, index) => ({
          packageId: pkg.package_id,
          name: pkg.package_name,
          priceDescription: pkg.package_description,
          packageNotes: pkg.package_notes,
          monthlyPrice: formatRupiah(pkg.package_price),
          originalPrice: `Rp ${pkg.package_original_price}`,
          isCurrentPackage: pkg.is_current_package,
          duration: `${pkg.package_duration} days`,
          popular: index === 1,
          features: pkg.features,
        })));
      }
      } catch {
        console.error('Failed to fetch pricing');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (pricingContainerRef.current) {
      const container = pricingContainerRef.current;
      const scrollContainer = () => {
        if (container.scrollWidth > container.clientWidth) {
          const cards = container.children;
          if (cards.length > 1) {
            const middleIndex = 1;
            const targetCard = cards[middleIndex] as HTMLElement;
            const scrollLeft = targetCard.offsetLeft - (container.clientWidth / 2) + (targetCard.clientWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }
      };

      setTimeout(scrollContainer, 100);
    }
  }, []);

  useEffect(() => {
    const measureExtraFeaturesHeights = () => {
      const next: Record<string, number> = {};
      for (const plan of pricingPlans) {
        const el = extraFeaturesRefs.current[plan.name];
        if (el) {
          next[plan.name] = el.scrollHeight;
        }
      }
      setExtraFeaturesHeights(next);
    };

    measureExtraFeaturesHeights();
    window.addEventListener('resize', measureExtraFeaturesHeights);

    return () => {
      window.removeEventListener('resize', measureExtraFeaturesHeights);
    };
  }, [pricingPlans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Pricing</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Pilih paket langganan yang sesuai dengan kebutuhan bisnis Anda.
          </p>
        </div>
      </div>

      <div
        ref={pricingContainerRef}
        className="relative pb-10 mx-auto pt-10 flex max-w-5xl gap-6 overflow-x-auto snap-x snap-mandatory px-4 hide-scrollbar sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3"
      >
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : pricingPlans.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">Tidak ada paket tersedia</div>
        ) : (
          pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`group overflow-hidden transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col relative w-[92%] max-w-[28rem] flex-none sm:w-auto sm:max-w-none sm:flex-auto sm:min-w-0 snap-center rounded-2xl ${
                plan.popular
                  ? 'border-2 border-blue-600 shadow-xl shadow-blue-100 dark:border-blue-400 dark:shadow-none'
                  : 'border border-gray-200 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-blue-500'
              }`}
            >
              <CardContent className="p-6 flex flex-col h-full">
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-600 text-white z-10 rounded-lg">
                    Paling Populer
                  </Badge>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                </div>

                <div className="mb-6 flex-1">
                  <div className="text-center mb-6">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{plan.priceDescription}</div>
                    <div className="mt-1 relative h-14">
                      <div className='flex items-end justify-center whitespace-nowrap'>
                        {plan.originalPrice !== "Rp0" && (
                        <span className="text-md font-semibold text-gray-500 dark:text-gray-300 line-through">
                          {formatRupiah(parseRupiah(plan.originalPrice))}
                        </span>
                        )}
                      </div>
                      <div className="flex items-end justify-center whitespace-nowrap">
                        <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                          {formatRupiah(parseRupiah(plan.monthlyPrice))}
                        </span>
                        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/{plan.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs bg-blue-100 px-2.5 py-2 font-medium text-blue-950 rounded-2xl text-center dark:text-gray-400">{plan.packageNotes}</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-5">Fitur:</h4>
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}

                    {plan.features.length > 4 && (
                      <div
                        ref={(node) => {
                          extraFeaturesRefs.current[plan.name] = node;
                        }}
                        style={{
                          maxHeight: expandedPlans[plan.name]
                            ? `${extraFeaturesHeights[plan.name] ?? extraFeaturesRefs.current[plan.name]?.scrollHeight ?? 0}px`
                            : '0px',
                        }}
                        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-in-out ${
                          expandedPlans[plan.name] ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                        }`}
                      >
                        <div className="pt-2 space-y-2">
                          {plan.features.slice(4).map((feature, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {plan.features.length > 4 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(plan.name)}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium mt-2 w-full justify-center pt-2 bg-transparent hover:bg-transparent"
                      >
                        <span>{expandedPlans[plan.name] ? 'Tutup' : 'Lihat Semua Fitur'}</span>
                        {expandedPlans[plan.name] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                  {/* {!plan.isCurrentPackage && ( */}
                  <Button
                    className={`w-full rounded-xl ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
                    }`}
                    onClick={() => handleSelectPackage(plan.packageId)}
                    disabled={selectingPackage === plan.packageId}
                  >
                    {selectingPackage === plan.packageId ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Pilih Paket
                  </Button>
                {/* // )} */}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
