import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type PricingPlan = {
  name: string;
  priceDescription: string;
  monthlyPrice: string;
  popular: boolean;
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
  features: string[];
};

type PricingSectionProps = {
  title?: string;
  description?: string;
  className?: string;
};

export const PricingSection: React.FC<PricingSectionProps> = ({ title, description, className }) => {
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchPackages = async () => {
      setLoading(true);
      const res = await api.get<PackageApiResponse[]>('/services/packages/pricing', { 'api-key': 'trv-lasoa30sal&1ajshdkahsd012-12' });
      if (res.status === 'success' && res.data) {
        setPricingPlans(res.data.map((pkg, index) => ({
          name: pkg.package_name,
          priceDescription: pkg.package_description,
          monthlyPrice: `Rp${pkg.package_price}`,
          popular: index === 1,
          features: pkg.features,
        })));
      }
      setLoading(false);
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

  const resolvedTitle = title ?? 'Sesuaikan Kebutuhan Bisnis Anda';
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
            <span>Tahunan</span>
            <span className="ml-2 inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700 shadow-sm">
              Hemat 20%
            </span>
          </button>
        </div>
      </div>

      <div
        ref={pricingContainerRef}
        style={{ paddingBottom: '6rem' }}
        className="relative tp-2 pb-6 mx-auto flex max-w-5xl gap-6 overflow-x-auto snap-x snap-mandatory px-4 hide-scrollbar sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3"
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
                  <div className="text-center mb-4">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{plan.priceDescription}</div>
                    <div className="mt-1 relative h-10">
                      <div
                        className={`absolute inset-0 flex items-end justify-center whitespace-nowrap transition-[opacity,transform] duration-300 ${
                          pricingPeriod === 'monthly' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                        }`}
                      >
                        <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                          {formatRupiah(parseRupiah(plan.monthlyPrice))}
                        </span>
                        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/ bulan</span>
                      </div>
                      <div
                        className={`absolute inset-0 flex items-end justify-center whitespace-nowrap transition-[opacity,transform] duration-300 ${
                          pricingPeriod === 'yearly' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}
                      >
                        <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                          {formatRupiah(parseRupiah(plan.monthlyPrice) * 12 * 0.8)}
                        </span>
                        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/ tahun</span>
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
          ))
        )}
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Apakah bisa upgrade atau downgrade paket sewaktu-waktu?',
      answer: 'Ya, perubahan berlaku di siklus tagihan berikutnya dan sisa saldo dikreditkan otomatis.',
    },
    {
      question: 'Apakah ada biaya setup atau biaya tersembunyi?',
      answer: 'Tidak ada. Harga sudah all-in. Paket Diamond sudah termasuk onboarding dan migrasi data.',
    },
    {
      question: 'Bagaimana cara kerja uji coba 14 hari gratis?',
      answer: 'Nikmati semua fitur Premiere selama 14 hari tanpa kartu kredit. Setelah itu pilih lanjut atau kembali ke Basic.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#03102b] via-[#0a2458] to-[#040d22] px-4 pt-20 pb-12 sm:px-6 sm:pb-16 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="text-sm font-semibold tracking-wide text-blue-100/90 mt-8"></h1>
          <div className="mt-4 flex justify-center">
            <Badge className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 shadow-sm backdrop-blur-md">
              Paket Berlangganan
            </Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Mulai gratis, berkembang sesuai bisnis anda</h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Pilih paket yang tepat untuk tim Anda. Upgrade atau downgrade kapan saja tidak ada kontrak jangka panjang.
          </p>
        </div>
      </section>

      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-10">
        <PricingSection
          title=""
          className="mx-auto max-w-7xl"
        />

        <div className="mx-auto max-w-7xl mt-12 space-y-10">
          <Card className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/20">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Butuh paket khusus untuk bisnis Anda?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Kami menyediakan solusi Enterprise untuk franchise, agen travel besar, dan kebutuhan integrasi khusus.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                    Hubungi Sales
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    Jadwalkan Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pertanyaan Umum</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Jawaban singkat untuk pertanyaan yang paling sering ditanyakan.</p>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {faqs.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={item.question} className="py-1">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between py-4 text-left"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{item.question}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`pb-4 text-sm leading-relaxed text-gray-600 transition-[opacity,transform] duration-300 dark:text-gray-300 ${
                              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                            }`}
                          >
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
