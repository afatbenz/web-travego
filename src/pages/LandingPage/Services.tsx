import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PreviewSistemSection } from './PreviewSistemSection';
import {
  Truck,
  CalendarDays,
  CircleDollarSign,
  Package,
  Users,
  Code2,
  ShieldCheck,
  Bot,
  TrendingUp,
  Globe,
  Check,
  Sparkles,
  Network,
  Activity,
  LayoutDashboard,
} from 'lucide-react';

type FeatureItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  checklist: string[];
  bg: string;
};

const features: FeatureItem[] = [
  {
    icon: Truck,
    title: 'Fleet Management',
    description: 'Kelola armada, pemesanan, dan kerjasama operasional dalam satu sistem terpusat.',
    checklist: ['Manajemen Pemesanan', 'Unit Armada', 'Kerjasama Operasional (KSO)'],
    bg: '#EEF2FF',
  },
  {
    icon: CalendarDays,
    title: 'Schedule',
    description: 'Atur jadwal operasional dengan fleksibel dan terstruktur.',
    checklist: ['Jadwal Armada', 'Jadwal Tim', 'Jadwal Shifting', 'Surat Jalan'],
    bg: '#F0FDF4',
  },
  {
    icon: CircleDollarSign,
    title: 'Finance',
    description: 'Pantau arus keuangan bisnis secara real-time dan akurat.',
    checklist: ['Revenue', 'Expenses'],
    bg: '#FFFBEB',
  },
  {
    icon: Package,
    title: 'Inventories',
    description: 'Kelola aset dan pengadaan secara terstruktur untuk memastikan ketersediaan optimal.',
    checklist: ['Management Assets', 'Pengadaan Barang', 'Pemesanan Asset', 'Distribusi Assets'],
    bg: '#F5F3FF',
  },
  {
    icon: Users,
    title: 'CRM',
    description: 'Tingkatkan hubungan pelanggan dan dorong pertumbuhan bisnis.',
    checklist: ['Daftar Pelanggan', 'Riwayat Pemesanan', 'Promosi dan Iklan', 'AI Business Assistant'],
    bg: '#FFF1F2',
  },
  {
    icon: Code2,
    title: 'Open API',
    description: 'Hubungkan katalog dan layanan Anda ke website atau sistem lain dengan mudah.',
    checklist: ['Hubungkan katalog ke website sendiri'],
    bg: '#EFF6FF',
  },
];

type AdvantageItem = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const advantages: AdvantageItem[] = [
  {
    icon: TrendingUp,
    title: 'Kelola Bisnis Lebih Mudah',
    description: 'Semua proses terintegrasi dan otomatis, menghemat waktu dan tenaga Anda.',
  },
  {
    icon: Bot,
    title: 'Dibantu asisten AI yang bekerja 24/7',
    description: 'AI Assistant siap membantu kapan saja untuk operasional yang lebih cepat dan tepat.',
  },
  {
    icon: Globe,
    title: 'Mempermudah ekspansi dan strategi bisnis',
    description: 'Data yang akurat dan insights yang kuat untuk keputusan yang lebih strategis.',
  },
];

export const Services: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[280px] px-4 pt-20 pb-12 sm:px-6 sm:pb-8 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          {/* Left Column - Text */}
          <div className="space-y-6">
            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Semua yang Anda butuhkan,<br />
              Tersedia dalam <span style={{ color: '#F97316' }}>satu platform.</span>
            </h1>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-sm">
                <Network className="h-4 w-4" />
                <span>Terintegrasi dalam satu sistem</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-sm">
                <Activity className="h-4 w-4" />
                <span>Data real-time & akurat</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-sm">
                <Bot className="h-4 w-4" />
                <span>AI Assistant 24/7</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Aman & berstandar tinggi</span>
              </div>
            </div>
          </div>

          {/* Right Column - Animated Mockup */}
          <div className="max-h-[260px] overflow-hidden pb-5 mt-2">
            <PreviewSistemSection className="bg-transparent" page="services" />
          </div>
        </div>
      </section>

      {/* FEATURE GRID SECTION */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">
              Semua Fitur dalam Satu Platform Terintegrasi
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Kelola bisnis travel & transport Anda lebih efisien, terkontrol, dan siap berkembang.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="p-7">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: item.bg }}
                      >
                        <Icon className="h-6 w-6 text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-800">{item.title}</h4>
                        <p className="mt-2 text-slate-500 leading-relaxed">{item.description}</p>
                        <ul className="mt-4 space-y-2">
                          {item.checklist.map((text) => (
                            <li key={text} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                <Check className="h-3 w-3 text-indigo-600" />
                              </span>
                              <span className="leading-relaxed">{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ADVANTAGE SECTION */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-blue-600 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                {advantages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-indigo-500 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border shadow-sm">
                        <Icon className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <p className="text-xs leading-relaxed text-indigo-100">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
