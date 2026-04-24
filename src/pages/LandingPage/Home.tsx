import React, { useState, useRef, useEffect } from 'react';
import { Star, Shield, Clock, Headphones, Phone, Check, ChevronDown, ChevronUp, Globe, ClipboardList, Bell, Users, Bot, LayoutDashboard, ShoppingCart, DollarSign, Calendar, Truck, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import heroIllustration from '@/assets/general/dashboard-devices.png';
import relationIllustration from '@/assets/landing-page/relation-ilustration.svg';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const pricingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the second card (index 1) on mobile load
    if (pricingContainerRef.current) {
      const container = pricingContainerRef.current;
      const scrollContainer = () => {
        // Check if container is scrollable (mobile view)
        if (container.scrollWidth > container.clientWidth) {
          const cards = container.children;
          if (cards.length > 1) {
            const middleIndex = 1; // 2nd card
            const targetCard = cards[middleIndex] as HTMLElement;
            // Calculate center position: cardLeft - containerHalfWidth + cardHalfWidth
            const scrollLeft = targetCard.offsetLeft - (container.clientWidth / 2) + (targetCard.clientWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }
      };
      
      // Use setTimeout to ensure layout is ready
      setTimeout(scrollContainer, 100);
    }
  }, []);

  const toggleExpand = (planName: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planName]: !prev[planName]
    }));
  };

  const pricingPlans = [
    {
      name: 'Basic',
      sixMonthPrice: 'Rp 425.000',
      yearlyPrice: 'Rp 750.000',
      popular: false,
      features: [
        'Support 24/7',
        'Sharing hosting ERP',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        '2 account 1 company'
      ]
    },
    {
      name: 'Standar',
      sixMonthPrice: 'Rp 1.250.000',
      yearlyPrice: 'Rp 2.200.000',
      popular: true,
      features: [
        'Support 24/7',
        'Sharing hosting ERP',
        'Sharing memory',
        'Dedicated Hosting Website',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        'Finance Report',
        '5 account',
        'Whatsapp AI Sales Assistant',
        '200 chat/day'
      ]
    },
    {
      name: 'Platinum',
      sixMonthPrice: 'Rp 2.250.000',
      yearlyPrice: 'Rp 4.000.000',
      popular: false,
      features: [
        'Support 24/7',
        'Dedicated hosting ERP',
        'Dedicated Memory up to 100GB',
        'Dedicated Hosting Website',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        'Finance Report',
        'Unlimited account',
        'Whatsapp AI Sales Assistant',
        '500 chat/day',
        'Customer Relationship Program',
        'Loyalty Program'
      ]
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Amanah & Professional',
      description: 'Komitmen profesional dengan integritas tinggi dalam setiap layanan yang kami berikan.'
    },
    {
      icon: Clock,
      title: 'Pelayanan 24/7',
      description: 'Tim customer service yang dibantu dengan teknologi AI siap melayani Anda kapan saja.'
    },
    {
      icon: Star,
      title: 'End-To-End Service',
      description: 'Memudahkan pengaturan bisnis anda dengan efisien'
    },
    {
      icon: Headphones,
      title: 'Support Lengkap',
      description: 'Dukungan penuh dari booking hingga perjalanan selesai dengan teknologi AI.'
    }
  ];

  const optimizationFeatures = [
    {
      icon: Globe,
      title: 'Integrasi Website',
      description: 'Dapat diintegrasikan dengan website anda'
    },
    {
      icon: ClipboardList,
      title: 'Pencatatan Rapi',
      description: 'Semua aktifitas tercatat rapi'
    },
    {
      icon: Bell,
      title: 'Anti Missed Order',
      description: 'Tidak ada pesanan yang terlewatkan'
    },
    {
      icon: Users,
      title: 'Hubungan Pelanggan',
      description: 'Lebih dekat dengan Customer'
    },
    {
      icon: Bot,
      title: 'Asisten AI',
      description: 'AI assistant siap membantu anda'
    }
  ];

  const controlFeatures = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Pantau performa bisnis dalam satu tampilan'
    },
    {
      icon: ShoppingCart,
      title: 'Order',
      description: 'Kelola pesanan pelanggan dengan mudah'
    },
    {
      icon: DollarSign,
      title: 'Finance',
      description: 'Laporan keuangan yang akurat dan transparan'
    },
    {
      icon: Calendar,
      title: 'Schedule',
      description: 'Atur jadwal perjalanan tanpa bentrok'
    },
    {
      icon: Truck,
      title: 'Fleet Management',
      description: 'Kontrol armada dan pemeliharaan rutin'
    }
  ];

  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Owner, Wisata Pro',
      content: 'TraveGO sangat membantu kami kelola booking dan jadwal sopir. Tim jadi lebih fokus closing.',
    },
    {
      name: 'Dewi Lestari',
      role: 'Owner, Explore Nusantara',
      content: 'Fitur AI assistant-nya cepat respon. Customer lebih puas dan repeat order meningkat signifikan.',
    },
    {
      name: 'Ricky Pratama',
      role: 'Manager, Mandala Travel',
      content: 'Sistemnya stabil, laporan keuangan rapi, dan support timnya responsif saat dibutuhkan.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#03102b] via-[#0a2458] to-[#040d22] pt-20 md:pt-26">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl items-center px-6 py-20 [font-family:Inter,sans-serif]">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6 text-white">
              <Badge className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 shadow-sm backdrop-blur-md">
                Trusted by growing travel operators
              </Badge>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Jalankan bisnis travel lebih cepat dengan <span className="text-orange-200">TraveGO</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-blue-100/90">
                Otomatiskan booking, jadwal, dan follow-up pelanggan dengan AI agar tim lebih fokus menutup lebih banyak penjualan.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-xl bg-blue-500 px-8 text-white shadow-xl shadow-blue-900/40 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-400"
                  onClick={() => navigate('/auth/register')}
                >
                  Coba Gratis
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/40 bg-white/5 px-8 text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                  onClick={() => navigate('/contact')}
                >
                  Lihat Demo
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-blue-100/90">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span>4.9/5 rating dari 500+ pengguna</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>120+ bisnis travel aktif</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
                <img
                  src={heroIllustration}
                  alt="Travel Business Dashboard"
                  className="w-full rounded-xl object-contain"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50 shadow-lg backdrop-blur-xl">
                <p className="font-semibold">+32% booking conversion</p>
              </div>
              <div className="absolute -right-4 -top-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50 shadow-lg backdrop-blur-xl">
                <p className="font-semibold">Response lebih cepat 3x</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Kenapa Pilih TraveGO?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Solusi yang dirancang untuk membantu operasional travel jadi lebih cepat dan terukur.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimization Section */}
      <section className="relative pb-16 bg-white dark:bg-gray-950">
        {/* Trapezoid Shape Top for Optimization Section */}
  

        <div className="relative max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-12 sm:pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Optimasi Travel Anda
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Mulailah beralih dengan digitalisasi dan automatisasi untuk mempermudah pekerjaan anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Illustration */}
            <div className="hidden justify-center md:flex">
              <img 
                src={relationIllustration}
                alt="Optimization Illustration" 
                className="w-full h-auto object-contain max-w-md"
              />
            </div>

            {/* Right Column - Features */}
            <div className="space-y-6">
              {optimizationFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-12 h-12 mr-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Control Easy Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Kontrol mudah kapanpun dimanapun
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Akses seluruh operasional bisnis travel Anda dalam satu genggaman
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {controlFeatures.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                  <feature.icon className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[160px]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Pilih Paket yang Sesuai dengan Kebutuhan Anda
            </h2>
            <div className="mx-auto inline-flex rounded-xl border border-blue-200 bg-blue-50 p-1 text-sm dark:border-blue-900/30 dark:bg-blue-900/20">
              <button className="rounded-lg bg-blue-600 px-4 py-1.5 font-medium text-white">Bulanan</button>
              <button className="rounded-lg px-4 py-1.5 font-medium text-blue-600 dark:text-blue-300">Tahunan hemat 20%</button>
            </div>
          </div>
          
          <div 
            ref={pricingContainerRef}
            className="relative mx-auto flex max-w-5xl gap-6 overflow-x-auto snap-x snap-mandatory px-4 pb-6 hide-scrollbar sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3"
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
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                  </div>
                  
                  <div className="mb-6 flex-1">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-orange-500 dark:text-orange-400 mb-1">
                        {plan.sixMonthPrice}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /6 bulan
                      </div>
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                        atau
                      </div>
                      <div className="text-2xl font-bold text-cyan-500 dark:text-cyan-400 mt-1">
                        {plan.yearlyPrice}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /tahun
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Fitur:</h4>
                      {(expandedPlans[plan.name] ? plan.features : plan.features.slice(0, 4)).map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(plan.name)}
                          className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium mt-2 w-full justify-center pt-2 bg-transparent hover:bg-transparent"
                        >
                          <span>{expandedPlans[plan.name] ? 'Tutup' : 'Lihat Semua Fitur'}</span>
                          {expandedPlans[plan.name] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                    <Button className={`w-full rounded-xl ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'}`}>
                      Pilih Paket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Apa Kata Mereka?</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="p-6">
                  <Quote className="h-5 w-5 text-blue-500 mb-3" />
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-5">{item.content}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Footer */}
      <section className="">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 rounded-2xl bg-blue-600 px-6 py-6 shadow-xl shadow-blue-900/30">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Siap Naik Level Bersama TraveGO?</h3>
                <p className="text-blue-100">Mulai digitalisasi bisnis travel Anda sekarang juga.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="outline" className="rounded-xl border-white/40 bg-white text-blue-700 hover:bg-blue-50" onClick={() => navigate('/auth/register')}>
                  Coba Gratis Sekarang
                </Button>
                <Button size="lg" className="rounded-xl bg-transparent border border-white/40 text-white hover:bg-white/10" onClick={() => navigate('/contact')}>
                  <Phone className="mr-2 h-4 w-4" />
                  Hubungi Kami
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
