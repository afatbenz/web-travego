import React from 'react';
import { Star, Shield, Clock, Headphones, Phone, Check, Globe, ClipboardList, Bell, Users, Bot, LayoutDashboard, ShoppingCart, DollarSign, Calendar, Truck, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PricingSection } from './Pricing';
import heroIllustration from '@/assets/general/dashboard-devices.png';
import relationIllustration from '@/assets/landing-page/relation-ilustration.svg';

export const Home: React.FC = () => {
  const navigate = useNavigate();

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
      name: 'Restu Anggoro',
      role: 'Owner, Calista Prima Wisata',
      content: 'TraveGO sangat membantu kami kelola booking dan jadwal sopir. Tim jadi lebih fokus closing.',
    },
    {
      name: 'Danu Aji Pangestu',
      role: 'Owner, Putra Handayani',
      content: 'Fitur AI assistant-nya cepat respon. Customer lebih puas dan repeat order meningkat signifikan.',
    },
    {
      name: 'Lengkung Kusumo',
      role: 'Owner, Joymar Express',
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
          <PricingSection />
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
