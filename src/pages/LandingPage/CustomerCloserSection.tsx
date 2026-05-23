import React, { useEffect, useMemo, useRef, useState } from 'react';

type ChatRole = 'user' | 'bot';
type ChatKind = 'text' | 'voucher' | 'typing';
type ChatMessage = { id: string; role: ChatRole; kind: ChatKind; time: string; text?: string };

type Customer = {
  name: string;
  badgeLabel: string;
  trips: number;
  route: string;
  birthdayText: string;
};

type Scenario = {
  customer: Customer;
  botText: string;
  voucher?: { amountText: string; code: string; validText: string };
  userReplyText: string;
};

type CustomerCloserSectionProps = {
  className?: string;
};

export const CustomerCloserSection: React.FC<CustomerCloserSectionProps> = ({ className }) => {
  const scenarios = useMemo<Scenario[]>(
    () => [
      {
        customer: {
          name: 'John Doe',
          badgeLabel: 'Pelanggan Setia',
          trips: 12,
          route: 'Poris → Bandung',
          birthdayText: '25 Mei 🎂',
        },
        botText:
          'Halo Kak John! 🎂 Selamat ulang tahun!\nSebagai pelanggan setia kami, ada\nsurprise spesial buat kakak hari ini.\nCek voucher di bawah ya! 🎁',
        voucher: {
          amountText: 'Diskon Rp 150.000',
          code: 'JOHNDOE25',
          validText: 'Berlaku 7 hari',
        },
        userReplyText: 'Wah makasih banyak! 😊\nKebetulan mau pesan lagi nih\nminggu depan ke Bandung',
      },
      {
        customer: {
          name: 'Siti Rahayu',
          badgeLabel: 'Pelanggan Setia',
          trips: 8,
          route: 'Jogja → Surabaya',
          birthdayText: '-',
        },
        botText:
          'Halo Kak Siti! Sudah 30 hari nih\nsejak perjalanan terakhir.\nMau kami bantu rencanakan\nperjalanan berikutnya? 🚌',
        userReplyText: 'Boleh! Mau tanya paket\nJogja-Surabaya dong',
      },
    ],
    []
  );

  const loopIdRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customerVisible, setCustomerVisible] = useState(false);
  const [fadeAll, setFadeAll] = useState(false);

  const fmtTime = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const makeId = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  const push = (msg: Omit<ChatMessage, 'id' | 'time'>, time?: string) => {
    const m: ChatMessage = { id: makeId(), time: time ?? fmtTime(), ...msg };
    setMessages((prev) => [...prev, m]);
  };

  const removeTyping = () => setMessages((prev) => prev.filter((m) => m.kind !== 'typing'));

  const resetScene = (idx: number) => {
    setScenarioIndex(idx);
    setMessages([]);
    setCustomerVisible(false);
    setFadeAll(false);
  };

  useEffect(() => {
    const token = ++loopIdRef.current;
    clearTimers();
    resetScene(0);

    const run = (idx: number) => {
      resetScene(idx);
      const s = scenarios[idx];

      schedule(() => {
        if (loopIdRef.current !== token) return;
        setCustomerVisible(true);
      }, 0);

      schedule(() => {
        if (loopIdRef.current !== token) return;
        push({ role: 'bot', kind: 'text', text: s.botText });
      }, 2000);

      if (s.voucher) {
        schedule(() => {
          if (loopIdRef.current !== token) return;
          push({ role: 'bot', kind: 'voucher' });
        }, 4000);
      }

      schedule(() => {
        if (loopIdRef.current !== token) return;
        push({ role: 'user', kind: 'typing' });
      }, 6000);

      schedule(() => {
        if (loopIdRef.current !== token) return;
        removeTyping();
        push({ role: 'user', kind: 'text', text: s.userReplyText });
      }, 6000 + 1200);

      const fadeAt = idx === 0 ? 10_000 : 17_000;
      schedule(() => {
        if (loopIdRef.current !== token) return;
        setFadeAll(true);
      }, fadeAt);

      schedule(() => {
        if (loopIdRef.current !== token) return;
        const next = (idx + 1) % scenarios.length;
        run(next);
      }, fadeAt + 700);
    };

    run(0);
    return () => {
      loopIdRef.current += 1;
      clearTimers();
    };
  }, [scenarios]);

  const scenario = scenarios[scenarioIndex];

  return (
    <div className={className}>
      <style>{`
        @keyframes ccSlideInLeft { from { transform: translateX(-18px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes ccSlideInRight { from { transform: translateX(18px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes ccDots { 0%,100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-3px); opacity: .95; } }
        @keyframes ccSoftFade { to { opacity: 0; filter: blur(1px); transform: translateY(-6px); } }
        @keyframes ccPop { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .cc-anim, .cc-anim * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div
        className="cc-anim w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900"
        style={fadeAll ? { animation: 'ccSoftFade 700ms ease-in-out forwards' } : undefined}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-950">
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900"
              style={customerVisible ? { animation: 'ccSlideInLeft 520ms ease-out forwards' } : { opacity: 0, transform: 'translateX(-18px)' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3B5BDB]" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">👤 {scenario.customer.name}</div>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                    ⭐ {scenario.customer.badgeLabel}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {scenario.customer.trips} perjalanan bersama
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rute favorit</div>
                  <div className="mt-1 font-semibold">📍 {scenario.customer.route}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ulang tahun</div>
                  <div className="mt-1 font-semibold">{scenario.customer.birthdayText}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Riwayat terbaru</div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-200">
                    <span className="font-semibold">Poris → Bandung</span>
                    <span className="text-slate-500 dark:text-slate-400">2 hari</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-gray-950 dark:text-slate-200">
                    <span className="font-semibold">Bandung → Poris</span>
                    <span className="text-slate-500 dark:text-slate-400">1 hari</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#17212B] dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#1E2A38] px-4 py-3 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#3B5BDB] text-sm font-bold shadow-sm">
                  AI
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-semibold">Trave AI</div>
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
                      Bot
                    </span>
                  </div>
                  <div className="text-xs text-white/70">Online</div>
                </div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-sm text-white/70">⋯</div>
            </div>

            <div className="p-4">
              <div className="grid min-h-[320px] content-start gap-2">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  const align = isUser ? 'justify-end' : 'justify-start';
                  const bubbleBg = isUser ? 'bg-[#2B5278]' : 'bg-[#182533]';
                  const anim = isUser ? 'ccSlideInRight' : 'ccSlideInLeft';

                  if (m.kind === 'typing') {
                    return (
                      <div key={m.id} className={`flex ${align}`}>
                        <div className={`w-fit rounded-2xl ${bubbleBg} px-3 py-2 text-white shadow-sm`} style={{ animation: `${anim} 420ms ease-out forwards` }}>
                          <div className="flex items-center gap-1.5" aria-label="Typing indicator">
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'ccDots 1.1s ease-in-out infinite' }} />
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'ccDots 1.1s ease-in-out infinite 140ms' }} />
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'ccDots 1.1s ease-in-out infinite 280ms' }} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (m.kind === 'voucher' && scenario.voucher) {
                    return (
                      <div key={m.id} className={`flex ${align}`}>
                        <div className={`max-w-[92%] rounded-2xl ${bubbleBg} p-2 text-white shadow-sm`} style={{ animation: `${anim} 420ms ease-out forwards` }}>
                          <div className="rounded-xl bg-gradient-to-r from-[#3B5BDB] to-[#4C6EF5] p-3 text-white">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs font-extrabold tracking-wide">🎟️ VOUCHER TRAVEGO</div>
                              <div className="text-[11px] text-white/80">{m.time}</div>
                            </div>
                            <div className="mt-2 rounded-xl border border-dashed border-white/60 bg-white/10 p-3">
                              <div className="text-sm font-bold">{scenario.voucher.amountText}</div>
                              <div className="mt-1 text-xs text-white/90">Kode: <span className="font-extrabold">{scenario.voucher.code}</span></div>
                              <div className="mt-1 text-xs text-white/80">{scenario.voucher.validText}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex ${align}`}>
                      <div className={`max-w-[92%] rounded-2xl ${bubbleBg} px-3 py-2 text-white shadow-sm`} style={{ animation: `${anim} 420ms ease-out forwards` }}>
                        <div className="whitespace-pre-line text-sm leading-relaxed">{m.text}</div>
                        <div className="mt-1 flex justify-end text-[11px] text-white/55">{m.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Loop: profil → pesan bot → voucher → typing → balasan → ganti pelanggan</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600 dark:border-slate-800 dark:bg-gray-900 dark:text-slate-300">
            Customer CRM
          </span>
        </div>
      </div>
    </div>
  );
};

