import React from 'react';
import { Linkedin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Team: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              Tim di balik Travego
            </Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Dibangun oleh praktisi, untuk pelaku travel
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Travego lahir untuk solusi nyata mengelola bisnis travel yang saling terintegrasi dan efisien.
          </p>
        </div>
      </section>

      <section className="py-14 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-6">
            <Card className="rounded-2xl border-2 border-blue-600 bg-white dark:border-blue-400 dark:bg-gray-900">
              <CardContent className="p-7">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 flex items-center justify-center font-semibold">
                    AS
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">Arif Setiawan</div>
                  </div>
                </div>

                <div className="mt-5 aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <img
                    src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=900"
                    alt="Arif Setiawan"
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Membangun Travego dari pengalaman langsung mengelola bisnis travel. Bertanggung jawab atas visi produk,
                  pengembangan sistem, dan pertumbuhan bisnis.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {['Product', 'Bisnis travel', 'ERP system', 'Strategi'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-blue-600 dark:text-blue-400 font-medium">Founder &amp; CEO</div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="p-7">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200 flex items-center justify-center font-semibold">
                      IS
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">Intan Sari</div>
                    </div>
                  </div>

                  <div className="mt-5 mx-auto aspect-square w-36 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 sm:w-40">
                    <img
                      src="https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=900"
                      alt="Intan Sari"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                    Mengelola operasional harian, hubungan pelanggan, dan memastikan setiap pengguna mendapat pengalaman terbaik.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Operasional', 'Customer success', 'Admin'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-gray-700 dark:text-gray-300 font-medium">Co-founder &amp; Operasional</div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <CardContent className="p-7">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-200 flex items-center justify-center font-semibold">
                      TM
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">Tegar Mahendra</div>
                    </div>
                  </div>

                  <div className="mt-5 mx-auto aspect-square w-36 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 sm:w-40">
                    <img
                      src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=900"
                      alt="Tegar Mahendra"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                    Memimpin pengembangan teknis platform, memastikan sistem berjalan stabil dan terus berkembang.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Engineering', 'Infrastructure', 'AI/ML'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-gray-700 dark:text-gray-300 font-medium">Technical Lead</div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
