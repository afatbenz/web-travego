import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type PricingPlan = {
  name: string;
  monthlyPrice: string;
  popular: boolean;
  features: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    name: 'Basic',
    monthlyPrice: 'Rp0',
    popular: false,
    features: [
      'Support 24/7 ERP',
      'Sharing hosting ERP',
      'Manajemen Tim dan Armada',
      'Katalog',
      'Generate Dokumen Order',
      'Generate Surat Jalan',
      'Akses 1 akun',
    ],
  },
  {
    name: 'Premiere',
    monthlyPrice: 'Rp83.000',
    popular: true,
    features: [
      'Support 24/7',
      'Sharing hosting ERP',
      'Manajemen Tim dan Armada',
      'Katalog',
      'Generate Dokumen Order',
      'Generate Surat Jalan',
      'Custom Template Dokumen',
      'AI Bot Assistant - Telegram',
      'AI Sales & Marketing - Whatsapp',
      'Akses hingga 3 akun',
    ],
  },
  {
    name: 'Diamond',
    monthlyPrice: 'Rp125.000',
    popular: false,
    features: [
      'Support 24/7 ERP & Web Katalog',
      'Dedicated hosting ERP',
      'Manajemen Tim dan Armada',
      'Katalog',
      'Generate Dokumen Order',
      'Generate Surat Jalan',
      'Custom Template Dokumen',
      'AI Bot Assistant - Telegram',
      'AI Sales & Marketing - Whatsapp',
      'Akses hingga 10 akun',
    ],
  },
];

type PricingSectionProps = {
  title?: string;
  description?: string;
  className?: string;
};

export const PricingSection: React.FC<PricingSectionProps> = ({ title, description, className }) => {
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const pricingContainerRef = useRef<HTMLDivElement>(null);
  const extraFeaturesRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [extraFeaturesHeights, setExtraFeaturesHeights] = useState<Record<string, number>>({});

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
  }, []);

  const resolvedTitle = title ?? 'Pilih Paket yang Sesuai dengan Kebutuhan Anda';
  const shouldShowTitle = resolvedTitle.trim().length > 0;

  return (
    <div className={className}>
      
      <div className="text-center mb-8 sm:mb-12">
        {shouldShowTitle && (
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{resolvedTitle}</h2>
        )}
        {description && (
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{description}</p>
        )}
        <div className="mx-auto mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 p-1 text-sm dark:border-blue-900/30 dark:bg-blue-900/20">
          <button
            type="button"
            onClick={() => setPricingPeriod('monthly')}
            className={`rounded-lg px-4 py-1.5 font-medium transition-all duration-300 ${
              pricingPeriod === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-600 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/30'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setPricingPeriod('yearly')}
            className={`rounded-lg px-4 py-1.5 font-medium transition-all duration-300 ${
              pricingPeriod === 'yearly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-600 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/30'
            }`}
          >
            Tahunan hemat 20%
          </button>
        </div>
      </div>

      <div
        ref={pricingContainerRef}
        style={{ paddingBottom: '6rem' }}
        className="relative tp-2 pb-6 mx-auto flex max-w-5xl gap-6 overflow-x-auto snap-x snap-mandatory px-4 hide-scrollbar sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3"
      >
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={`group overflow-hidden transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col relative min-w-[85%] sm:min-w-0 shrink-0 sm:shrink snap-center rounded-2xl ${
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
                <div className="text-center mb-4">
                  <div className="relative mb-1 h-10">
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-3xl font-bold text-orange-500 transition-[opacity,transform] duration-300 dark:text-orange-400 ${
                        pricingPeriod === 'monthly' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                      }`}
                    >
                      {formatRupiah(parseRupiah(plan.monthlyPrice))}
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-3xl font-bold text-orange-500 transition-[opacity,transform] duration-300 dark:text-orange-400 ${
                        pricingPeriod === 'yearly' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                      }`}
                    >
                      {formatRupiah(parseRupiah(plan.monthlyPrice) * 12 * 0.8)}
                    </div>
                  </div>
                  <div className="relative h-5 text-sm text-gray-500 dark:text-gray-400">
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ${
                        pricingPeriod === 'monthly' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
                      }`}
                    >
                      / bulan
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ${
                        pricingPeriod === 'yearly' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-0.5'
                      }`}
                    >
                      / tahun
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Fitur:</h4>
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
                <Button
                  className={`w-full rounded-xl ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
                  }`}
                >
                  Pilih Paket
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#03102b] via-[#0a2458] to-[#040d22] px-4 pt-20 pb-12 sm:px-6 sm:pb-16 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="text-sm font-semibold tracking-wide text-blue-100/90 mt-6"></h1>
          <div className="mt-4 flex justify-center">
            <Badge className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 shadow-sm backdrop-blur-md">
              Paket Berlangganan
            </Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Pilih paket yang sesuai kebutuhan bisnis Anda</h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Bayar bulanan atau hemat 20% untuk paket tahunan — semua fitur inti TraveGO tersedia dalam satu platform.
          </p>
        </div>
      </section>

      <div className="max-w-none mx-auto px-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-10">
        <PricingSection
          title=""
          className="mx-auto max-w-7xl"
        />
      </div>
    </div>
  );
};
