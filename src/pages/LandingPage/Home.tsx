import React, { useState, useRef, useEffect } from 'react';
import { Star, Shield, Clock, Headphones, ArrowRight, Phone, Check, ChevronDown, ChevronUp, Globe, ClipboardList, Bell, Users, Bot, LayoutDashboard, ShoppingCart, DollarSign, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import heroIllustration from '@/assets/landing-page/hero-illustration.png';
import relationIllustration from '@/assets/landing-page/relation-ilustration.png';

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

  return (
    <div className="min-h-screen">
      {/* Hero Section with 60/40 Split */}
      <section className="relative w-full bg-white overflow-hidden min-h-screen flex flex-col justify-center pt-28 md:pt-0 md:items-center">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
          <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-16">
            {/* Left Column (60%) */}
            <div className="w-full md:w-[60%] flex flex-col justify-center text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                All-in-One Operating System for Travel Businesses
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                Otomatiskan pemesanan, penjadwalan, dan interaksi pelanggan dengan AI cerdas dan real-time application. Pekerjaan lebih ringan, sisakan banyak waktu untuk pengembangan bisnis anda.
              </p>

              {/* Mobile Image (Visible only on mobile) */}
              <div className="w-full block md:hidden mb-8 flex justify-center">
                <img 
                  src={heroIllustration}
                  alt="Travel Business Flat Design" 
                  className="w-full h-auto object-contain max-w-md mx-auto"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={() => navigate('/auth/register')}>
                  Daftar Sekarang
                </Button>
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8">
                  Hubungi Kami
                </Button>
              </div>
            </div>

            {/* Right Column (40%) - Image (Hidden on mobile) */}
            <div className="hidden md:flex w-full md:w-[40%] justify-center items-center">
              <img 
                src={heroIllustration}
                alt="Travel Business Flat Design" 
                className="w-full h-auto object-contain max-w-md mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Trapezoid Shape Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg 
            className="relative block w-full h-8 sm:h-12 md:h-16 lg:h-20" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,120 L1200,120 L1200,40 L0,20 Z" 
              className="fill-blue-600 dark:fill-blue-900"
            />
          </svg>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative py-16 bg-blue-600 dark:bg-blue-900 text-white overflow-hidden">
        <div className="relative max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Kenapa Pilih TraveGO?
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Kami berkomitmen memberikan layanan terbaik dengan standar internasional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimization Section */}
      <section className="relative py-16 bg-white dark:bg-gray-950">
        {/* Trapezoid Shape Top for Optimization Section */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10 -mt-[1px]">
          <svg 
            className="relative block w-full h-12 sm:h-16 md:h-20 lg:h-24" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0 L1200,0 L1200,40 Z" 
              className="fill-blue-600 dark:fill-blue-900"
            />
          </svg>
        </div>

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
            <div className="flex justify-center hidden md:flex">
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
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Pricing
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Pilih paket yang sesuai dengan kebutuhan bisnis Anda
            </p>
          </div>
          
          <div 
            ref={pricingContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 sm:mx-auto sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto hide-scrollbar relative"
          >
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name}
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col relative min-w-[85%] sm:min-w-0 shrink-0 sm:shrink snap-center ${
                  plan.popular 
                    ? 'border-2 border-blue-600 dark:border-blue-400' 
                    : 'hover:border-2 hover:border-orange-500 dark:hover:border-orange-400'
                }`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {plan.popular && (
                    <Badge className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-600 text-white z-10">
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
                    <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}>
                      Pilih Paket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Inquiry Section */}
      <section className="relative py-20 bg-slate-100 dark:bg-slate-900 pb-48">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Siap memulai?
          </h2>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            Hubungi tim kami untuk konsultasi gratis dan penawaran terbaik
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/contact')}
            >
              <Phone className="mr-2 h-5 w-5" />
              Hubungi Kami
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              onClick={() => navigate('/auth/register')}
            >
              Daftar Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Trapezoid Shape Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
          <svg 
            className="relative block w-full h-16 sm:h-24 md:h-32 lg:h-40" 
            data-name="Layer 1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M1200,120 L0,120 L0,60 L1200,80 Z" 
              className="fill-gray-900 dark:fill-black"
            />
          </svg>
        </div>
      </section>
    </div>
  );
};