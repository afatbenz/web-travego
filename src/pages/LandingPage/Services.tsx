import React from 'react';
import {
  BarChart3,
  Bus,
  CalendarDays,
  Code,
  CreditCard,
  FileSpreadsheet,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Receipt,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type ModuleItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  tags: string[];
  iconClassName: string;
  iconWrapperClassName: string;
};

const modules: ModuleItem[] = [
  {
    icon: CalendarDays,
    title: 'Manajemen Pemesanan',
    description:
      'Kelola order masuk dari berbagai channel dalam satu tampilan terpusat, lengkap dengan status real-time.',
    tags: ['Multi-channel', 'Status tracking', 'Auto-konfirmasi'],
    iconClassName: 'text-blue-600 dark:text-blue-400',
    iconWrapperClassName: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    icon: Users,
    title: 'CRM Pelanggan',
    description:
      'Riwayat perjalanan, preferensi, dan komunikasi tiap pelanggan tersimpan rapi dan mudah diakses kapan saja.',
    tags: ['Profil lengkap', 'Histori order', 'Follow-up otomatis'],
    iconClassName: 'text-teal-600 dark:text-teal-400',
    iconWrapperClassName: 'bg-teal-100 dark:bg-teal-900/20',
  },
  {
    icon: Receipt,
    title: 'Keuangan & Invoicing',
    description: 'Buat invoice, kelola pembayaran, rekonsiliasi, dan pantau arus kas bisnis travel secara akurat.',
    tags: ['Invoice otomatis', 'Rekonsiliasi', 'Laporan laba rugi'],
    iconClassName: 'text-amber-600 dark:text-amber-400',
    iconWrapperClassName: 'bg-amber-100 dark:bg-amber-900/20',
  },
  {
    icon: Bus,
    title: 'Manajemen Armada',
    description: 'Pantau kendaraan, jadwal pemeliharaan, ketersediaan unit, dan penugasan driver secara terpusat.',
    tags: ['Tracking kendaraan', 'Jadwal servis', 'Penugasan driver'],
    iconClassName: 'text-purple-600 dark:text-purple-400',
    iconWrapperClassName: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    icon: IdCard,
    title: 'Manajemen SDM',
    description: 'Kelola data karyawan, jadwal kerja, absensi, komisi agen, dan penggajian dalam satu sistem.',
    tags: ['Jadwal kerja', 'Komisi agen', 'Penggajian'],
    iconClassName: 'text-rose-600 dark:text-rose-400',
    iconWrapperClassName: 'bg-rose-100 dark:bg-rose-900/20',
  },
  {
    icon: BarChart3,
    title: 'Laporan & Analitik',
    description:
      'Dashboard visual dengan metrik penting: pendapatan, okupansi, performa agen, dan tren penjualan.',
    tags: ['Dashboard real-time', 'Export laporan', 'Tren penjualan'],
    iconClassName: 'text-green-600 dark:text-green-400',
    iconWrapperClassName: 'bg-green-100 dark:bg-green-900/20',
  },
];

type IntegrationItem = {
  icon: React.ElementType;
  label: string;
  iconClassName: string;
  wrapperClassName: string;
};

const integrations: IntegrationItem[] = [
  {
    icon: MessageCircle,
    label: 'WhatsApp Business',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    wrapperClassName: 'bg-emerald-100 dark:bg-emerald-900/20',
  },
  {
    icon: CreditCard,
    label: 'Payment Gateway',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    wrapperClassName: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    icon: MapPin,
    label: 'Google Maps',
    iconClassName: 'text-red-600 dark:text-red-400',
    wrapperClassName: 'bg-red-100 dark:bg-red-900/20',
  },
  {
    icon: Mail,
    label: 'Email / SMTP',
    iconClassName: 'text-slate-700 dark:text-slate-200',
    wrapperClassName: 'bg-slate-100 dark:bg-slate-800/60',
  },
  {
    icon: FileSpreadsheet,
    label: 'Akuntansi (Jurnal/Accurate)',
    iconClassName: 'text-amber-700 dark:text-amber-300',
    wrapperClassName: 'bg-amber-100 dark:bg-amber-900/20',
  },
  {
    icon: Smartphone,
    label: 'Aplikasi mobile agent',
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
    wrapperClassName: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  {
    icon: Code,
    label: 'Open API',
    iconClassName: 'text-purple-600 dark:text-purple-400',
    wrapperClassName: 'bg-purple-100 dark:bg-purple-900/20',
  },
];

export const Services: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#03102b] via-[#0a2458] to-[#040d22] px-4 pt-20 pb-12 sm:px-6 sm:pb-16 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <h1 className="text-sm font-semibold tracking-wide text-blue-100/90 mt-8">Layanan Kami</h1>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Semua yang Anda butuhkan, dalam satu platform
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Dari pemesanan hingga laporan keuangan — dikelola otomatis dengan dukungan kecerdasan buatan.
          </p>
        </div>
      </section>

      <section className="w-full bg-purple-50 dark:bg-purple-950/30">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-6xl py-10 sm:py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-200/70 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ditenagai AI — bukan sekadar sistem biasa
              </h3>
              <p className="mt-3 max-w-3xl text-gray-700 dark:text-gray-300 leading-relaxed">
                Travego menggunakan kecerdasan buatan untuk otomatisasi tugas berulang, prediksi permintaan,
                rekomendasi harga, hingga deteksi anomali keuangan secara real-time.
              </p>
              <div className="mt-6 flex w-full max-w-4xl gap-2 overflow-x-auto pb-2 hide-scrollbar justify-center flex-wrap">
                {['Prediksi permintaan', 'Auto-reply pelanggan', 'Smart pricing', 'Deteksi fraud', 'Laporan otomatis'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="shrink-0 rounded-full border border-purple-200 bg-white px-4 py-1.5 text-sm font-medium text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-6xl py-12 sm:py-14">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {modules.map((item) => (
              <Card key={item.title} className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="p-7">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconWrapperClassName}`}>
                      <item.icon className={`h-6 w-6 ${item.iconClassName}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-6xl pb-6">
          <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Terintegrasi dengan</div>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {integrations.map((item) => (
              <div
                key={item.label}
                className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.wrapperClassName}`}>
                  <item.icon className={`h-4 w-4 ${item.iconClassName}`} />
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
