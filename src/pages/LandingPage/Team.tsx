import React from 'react';
import { Linkedin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import fatihPhoto from '@/assets/general/fatih.png';
import haidarPhoto from '@/assets/general/haidar.jpg';

export const Team: React.FC = () => {
  const members = [
    {
      name: 'Mafatichul Fuadi',
      role: 'Founder & CTO',
      bio: 'Membangun Travego dari pengalaman langsung mengelola bisnis travel. Bertanggung jawab atas visi produk, pengembangan sistem, dan pertumbuhan bisnis.',
      tags: ['Product', 'ERP system', 'Technology', 'AI Engineer'],
      initials: 'AS',
      photo: fatihPhoto,
      accentFrom: '#4F46E5',
      accentTo: '#7C3AED',
      avatarFrom: 'bg-indigo-100 text-indigo-700',
      linkedInHref: '#',
      whatsappHref: '#',
    },
    {
      name: 'Haidar Al-Mutwakkil',
      role: 'Co-Founder & CEO',
      bio: 'Memimpin pengembangan teknis platform, memastikan sistem berjalan stabil, aman, dan terus berkembang untuk kebutuhan operasional travel modern.',
      tags: ['Strategy', 'UI/UX', 'Business'],
      initials: 'TM',
      photo: haidarPhoto,
      accentFrom: '#4F46E5',
      accentTo: '#7C3AED',
      avatarFrom: 'bg-violet-100 text-violet-700',
      linkedInHref: '#',
      whatsappHref: '#',
    },
  ] as const;
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mb-20">
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

      <section className="py-14 sm:py-10 mt-20 mb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {members.map((m, idx) => (
              <Card
                key={m.name}
                className={[
                  'group relative overflow-hidden rounded-[28px] pb-0',
                  'border border-white/50 bg-white/65 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_50px_rgba(15,23,42,0.08)]',
                  'backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_1px_0_rgba(15,23,42,0.05),0_26px_70px_rgba(15,23,42,0.14)]',
                  'animate-in fade-in-0 slide-in-from-bottom-3 duration-500',
                  idx === 0 ? 'lg:delay-75' : 'lg:delay-150',
                ].join(' ')}
              >
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-[0.95fr_1.25fr]">
                    <div className="relative overflow-hidden sm:min-h-[420px]">
                      <div
                        className="pointer-events-none absolute -left-12 top-8 h-30 w-30 rounded-full blur-3xl"
                        style={{ background: `rgba(79,70,229,0.22)` }}
                        aria-hidden="true"
                      />
                      <div
                        className="pointer-events-none absolute -right-10 bottom-10 h-44 w-44 rounded-full blur-3xl"
                        style={{ background: `rgba(124,58,237,0.18)` }}
                        aria-hidden="true"
                      />

                      <div className="relative h-[320px] w-full sm:h-full">
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                      </div>
                    </div>

                    <div className="p-7 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-2xl font-bold tracking-tight text-[#111827]">
                            {m.name}
                          </div>
                          <div
                            className="mt-2 text-sm font-semibold"
                            style={{
                              backgroundImage: `linear-gradient(90deg, ${m.accentFrom}, ${m.accentTo})`,
                              WebkitBackgroundClip: 'text',
                              color: 'transparent',
                            }}
                          >
                            {m.role}
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-2">
                        {m.bio}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {m.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:absolute sm:bottom-4">
                        <a href={m.linkedInHref} className="w-full sm:w-auto">
                          <Button
                            variant="outline"
                            className="h-11 w-full rounded-full border-slate-200 bg-white/70 px-5 shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md"
                          >
                            <Linkedin className="mr-2 h-4 w-4" />
                            LinkedIn
                          </Button>
                        </a>
                        {m.whatsappHref ? (
                          <a href={m.whatsappHref} className="w-full sm:w-auto">
                            <Button
                              variant="outline"
                              className="h-11 w-full rounded-full border-slate-200 bg-white/70 px-5 shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              WhatsApp
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
