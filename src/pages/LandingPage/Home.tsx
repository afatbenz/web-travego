import React, { useState, useEffect } from 'react';
import { Star, Shield, Clock, Headphones, Phone, Check, Users, LayoutDashboard, ShoppingCart, Truck, Quote, Sparkles, BarChart2, Receipt, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PricingSection } from './Pricing';
import { PreviewSistemSection } from './PreviewSistemSection';
import { AnalyticsDashboardSection } from './AnalyticsDashboardSection';
import { CustomerCloserSection } from './CustomerCloserSection';
import heroIllustration from '@/assets/general/dashboard-devices.png';
import relationIllustration from '@/assets/landing-page/relation-ilustration.svg';
import { api } from '@/lib/api';

type Review = {
  created_by: string;
  organization_name: string;
  reviews: string;
  stars: number;
  created_at: string;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeOptimizationIndex, setActiveOptimizationIndex] = useState(0);
  const [activeControlIndex, setActiveControlIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const response = await api.get<Review[]>('/services/reviews', { 'api-key': 'trv-lasoa30sal&1ajshdkahsd012-12' });
      if (response.status === 'success' && response.data) {
        setTestimonials(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Amanah & Professional',
      description: 'Profesional dengan integritas tinggi dalam setiap layanan yang diberikan.'
    },
    {
      icon: Clock,
      title: 'Pelayanan 24/7',
      description: 'Support perbaikan, penambahan fitur, dan pemeliharaan sistem berkelanjutan'
    },
    {
      icon: Star,
      title: 'End-To-End Service',
      description: 'Memudahkan pengaturan bisnis anda dengan efisien dan efektif.'
    },
    {
      icon: Headphones,
      title: 'Support Lengkap',
      description: 'Dukungan penuh dari booking hingga perjalanan selesai dengan teknologi AI.'
    }
  ];

  const optimizationFeatures = [
    {
      icon: Sparkles,
      title: 'Data terpusat, dibantu Trave si AI-Assitant',
      description: 'Di manapun dan kapanpun, kamu bisa manage pesanan, armada, tim bahkan generate dokumen hanya dengan chat dengan Trave AI-Assitant.',
      label: 'Management',
    },
    {
      icon: LayoutDashboard,
      title: 'Bantu analisa bisnis dan rencana strategis',
      description: 'Dengan realtime dashboard, kamu bisa melihat potensi bisnis Anda dan rencana strategis Anda.',
      label: 'Dashboard',
    },
    {
      icon: Users,
      title: 'Lebih dekat dengan pelanggan',
      description: 'Riwayat perjalanan, preferensi, dan follow-up otomatis membuat pelanggan merasa dikenal dan kembali lagi.',
      label: 'CRM',
    },
    {
      icon: BarChart2,
      title: 'Laporan instan, keputusan lebih cepat',
      description: 'Dashboard real-time tunjukkan pendapatan, performa agen, dan tren bisnis kapan saja.',
      label: 'Analitik',
    }
  ];

  const controlFeatures = [
    {
      icon: LayoutDashboard,
      title: 'Inventories',
      description: 'Kelola asset dan suku cadang lebih mudah',
      tag: 'Real-time',
      badgeClassName: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      iconClassName: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200',
      previewTitle: 'Kelola asset dan suku cadang lebih mudah',
      previewDescription:
        'Pantau ketersediaan dan distribusi suku cadang anda secara realtime dengan mudah dan efisien.',
      previewFeatures: ['Ketersediaan asset dan suku cadang', 'Distribusi asset ke beberapa lokasi / garasi', 'Catat transaksi dan riwayat keluar masuk asset'],
      stats: ['42 / Order hari ini', 'Rp8,4jt / Pendapatan'],
    },
    {
      icon: ShoppingCart,
      title: 'Order',
      description: 'Terima dan kelola semua pesanan tanpa satu pun terlewat',
      tag: 'Multi-channel',
      badgeClassName: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200',
      iconClassName: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200',
      previewTitle: 'Nol pesanan terlewat, nol pelanggan kecewa',
      previewDescription:
        'Order masuk dari WhatsApp, telepon, maupun website langsung terkumpul di satu antrian. Konfirmasi, ubah, atau batalkan hanya dengan beberapa klik.',
      previewFeatures: ['Agregasi order dari semua channel', 'Auto-konfirmasi & notifikasi pelanggan', 'Riwayat order lengkap & mudah dicari'],
      stats: ['18 / Pending', '24 / Confirmed'],
    },
    {
      icon: Receipt,
      title: 'Finance',
      description: 'Laporan keuangan akurat tanpa kerja ekstra di spreadsheet',
      tag: 'Auto-rekonsiliasi',
      badgeClassName: 'bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200',
      iconClassName: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
      previewTitle: 'Keuangan beres tanpa akuntan tambahan',
      previewDescription:
        'Invoice otomatis, rekonsiliasi pembayaran, dan laporan laba rugi siap dalam hitungan detik. Tidak perlu lagi rekap manual di akhir bulan.',
      previewFeatures: ['Invoice & kwitansi otomatis', 'Rekonsiliasi payment gateway', 'Ekspor laporan ke PDF & Excel'],
      stats: ['Rp48jt / Bulan ini', '↑18% / vs bulan lalu'],
    },
    {
      icon: CalendarDays,
      title: 'Schedule',
      description: 'Jadwal perjalanan teratur, bebas bentrok dan miskomunikasi',
      tag: 'Conflict-free',
      badgeClassName: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      iconClassName: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200',
      previewTitle: 'Jadwal rapi, driver tidak bingung',
      previewDescription:
        'Atur jadwal keberangkatan, tetapkan driver, dan bagikan itinerary ke tim — semua sinkron otomatis. Tidak ada lagi bentrok jadwal.',
      previewFeatures: ['Kalender perjalanan visual', 'Deteksi bentrok jadwal otomatis', 'Notifikasi ke driver via WhatsApp'],
      stats: ['7 / Perjalanan hari ini', '0 / Bentrok'],
    },
    {
      icon: Truck,
      title: 'Fleet',
      description: 'Armada dan pemeliharaan terpantau agar selalu siap jalan',
      tag: 'Live tracking',
      badgeClassName: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200',
      iconClassName: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200',
      previewTitle: 'Armada terpantau, tidak ada yang mangkrak',
      previewDescription:
        'Lihat status setiap kendaraan secara real-time, catat riwayat servis, dan terima pengingat pemeliharaan agar armada selalu prima.',
      previewFeatures: ['Status kendaraan live', 'Riwayat & jadwal servis otomatis', 'Penugasan driver terintegrasi'],
      stats: ['8 / Aktif', '1 / Servis'],
    }
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
      <section className="py-20 bg-slate-100 dark:bg-slate-900">
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
            <Badge className="rounded-xl border border-blue-200 bg-blue-50 hover:bg-transparent px-4 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-200">
              Kenapa Travego?
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Satu sistem yang menggantikan puluhan aplikasi
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Berhenti copy-paste dari WhatsApp ke spreadsheet. Travego mengotomasi seluruh alur kerja Anda — dari pemesanan masuk hingga laporan keluar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 items-start">
            <div className="space-y-3">
              {optimizationFeatures.map((item, index) => {
                const isActive = activeOptimizationIndex === index;
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveOptimizationIndex(index)}
                    className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-blue-200 bg-blue-50/70 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/40 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-base font-semibold ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="p-7">
                  <div className="mt-3">
                    {activeOptimizationIndex === 0 ? (
                      <PreviewSistemSection />
                    ) : activeOptimizationIndex === 1 ? (
                      <AnalyticsDashboardSection />
                    ) : activeOptimizationIndex === 2 ? (
                      <CustomerCloserSection />
                    ) : (
                      <div className="relative overflow-hidden rounded-2xl bg-secondary p-6">
                        <div className="pointer-events-none absolute inset-0 opacity-25">
                          <img src={relationIllustration} alt="" className="h-full w-full object-contain" />
                        </div>
                        <div className="relative text-sm font-medium text-gray-700 dark:text-gray-200">
                          Preview sistem
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex-1 py-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">70%</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Lebih sedikit kerja manual</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1 py-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Pesanan terlewat</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1 py-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2 jam</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Waktu setup</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Control Easy Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-12">
            <Badge className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-200">
              Semua dalam genggaman
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Kelola Bisnis Transportasi Lebih Flexible
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Lima modul inti yang saling terhubung.
            </p>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
              {controlFeatures.map((module, index) => {
                const isActive = activeControlIndex === index;
                const Icon = module.icon;
                return (
                  <button
                    key={module.title}
                    type="button"
                    onClick={() => setActiveControlIndex(index)}
                    className={`rounded-2xl border bg-white p-5 text-left transition-all duration-300 dark:bg-gray-900 ${
                      isActive
                        ? 'border-2 border-blue-600 shadow-sm dark:border-blue-400'
                        : 'border-gray-200 hover:border-blue-200 hover:shadow-sm dark:border-gray-800 dark:hover:border-blue-900/40'
                    }`}
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${module.iconClassName}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{module.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{module.description}</div>
                    <div className="mt-4">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                        {module.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-stretch">
              <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Badge className={`rounded-xl px-3 py-1 text-xs font-semibold ${controlFeatures[activeControlIndex]?.badgeClassName}`}>
                  {controlFeatures[activeControlIndex]?.title}
                </Badge>
                <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {controlFeatures[activeControlIndex]?.previewTitle}
                </h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {controlFeatures[activeControlIndex]?.previewDescription}
                </p>

                <div className="mt-6 space-y-3">
                  {controlFeatures[activeControlIndex]?.previewFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
                      <div className="text-sm text-gray-700 dark:text-gray-200">{feature}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-secondary p-7">
                <div className="grid grid-cols-2 gap-4">
                  {controlFeatures[activeControlIndex]?.stats.map((stat) => {
                    const [value, label] = stat.split(' / ');
                    return (
                      <div
                        key={stat}
                        className="rounded-2xl border border-gray-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800/80 dark:bg-white/5"
                      >
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="h-3 w-11/12 rounded-full bg-white/70 dark:bg-white/10" />
                  <div className="h-3 w-9/12 rounded-full bg-white/60 dark:bg-white/10" />
                  <div className="h-3 w-10/12 rounded-full bg-white/50 dark:bg-white/10" />
                </div>
              </div>
            </div>
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
      {testimonials.length > 0 && (
        <section className="py-20 bg-slate-100 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Apa Kata Mereka?</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <Card key={index} className="rounded-2xl border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <CardContent className="p-6">
                    <Quote className="h-5 w-5 text-blue-500 mb-3" />
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-5">{item.reviews}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.created_by}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Owner {item.organization_name}</p>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} className={`h-3.5 w-3.5 ${starIndex < item.stars ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA + Footer */}
      <section className="py-10 bg-slate-100 dark:bg-slate-900">
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
