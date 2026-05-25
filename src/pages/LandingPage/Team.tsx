import React from 'react';
import { Linkedin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Team: React.FC = () => {
  const members = [
    {
      name: 'Arif Setiawan',
      role: 'Founder & CEO',
      bio: 'Membangun Travego dari pengalaman langsung mengelola bisnis travel. Bertanggung jawab atas visi produk, pengembangan sistem, dan pertumbuhan bisnis.',
      tags: ['Product', 'Bisnis travel', 'ERP system', 'Strategi'],
      initials: 'AS',
      photo:
        'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1200',
      accentFrom: '#4F46E5',
      accentTo: '#7C3AED',
      avatarFrom: 'bg-indigo-100 text-indigo-700',
      linkedInHref: '#',
      whatsappHref: '#',
    },
    {
      name: 'Tegar Mahendra',
      role: 'Technical Lead',
      bio: 'Memimpin pengembangan teknis platform, memastikan sistem berjalan stabil, aman, dan terus berkembang untuk kebutuhan operasional travel modern.',
      tags: ['Engineering', 'Infrastructure', 'AI/ML'],
      initials: 'TM',
      photo:
        'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=1200',
      accentFrom: '#4F46E5',
      accentTo: '#7C3AED',
      avatarFrom: 'bg-violet-100 text-violet-700',
      linkedInHref: '#',
      whatsappHref: '#',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#111827]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071733] via-[#101a4f] to-[#1B0B3B] px-4 pt-24 pb-16 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[-6rem] h-[420px] w-[420px] rounded-full bg-[#4F46E5]/25 blur-3xl" />
          <div className="absolute right-[-7rem] top-20 h-[480px] w-[480px] rounded-full bg-[#7C3AED]/20 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl" />
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.22]"
            viewBox="0 0 1200 520"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M40 370C190 240 300 260 410 300C552 352 630 200 780 210C940 220 1006 330 1160 250"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 10"
            />
            <path
              d="M82 354C210 262 305 268 408 306C553 360 635 214 782 222C948 231 1010 334 1136 264"
              stroke="rgba(79,70,229,0.55)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="1 14"
            />
            <path
              d="M1030 270l18-10-6 20-12-10Z"
              fill="rgba(255,255,255,0.75)"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="flex justify-center">
            <Badge className="rounded-2xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-md">
              Tim di balik Travego
            </Badge>
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Dibangun oleh praktisi, untuk{' '}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              pelaku travel
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:text-lg">
            Travego lahir untuk solusi nyata mengelola bisnis travel yang saling terintegrasi, efisien, dan siap scale.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px]">
          <svg viewBox="0 0 1440 110" className="h-[110px] w-full" preserveAspectRatio="none" aria-hidden="true">
            <path
              fill="#F5F7FB"
              d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,110L1360,110C1280,110,1120,110,960,110C800,110,640,110,480,110C320,110,160,110,80,110L0,110Z"
            />
          </svg>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
                    <div className="relative overflow-hidden sm:min-h-[520px]">
                      <div
                        className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full blur-3xl"
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
                          <div className="text-2xl font-extrabold tracking-tight text-[#111827]">
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
                        <div className={['h-11 w-11 rounded-2xl grid place-items-center font-bold', m.avatarFrom].join(' ')}>
                          {m.initials}
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

                      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
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
