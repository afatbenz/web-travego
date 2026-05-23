import React, { useEffect, useMemo, useRef, useState } from 'react';

type ChatRole = 'user' | 'bot';
type ChatKind = 'text' | 'invoice' | 'typing';
type ChatMessage = { id: string; role: ChatRole; kind: ChatKind; time: string; text?: string };

type PreviewSistemSectionProps = {
  className?: string;
};

export const PreviewSistemSection: React.FC<PreviewSistemSectionProps> = ({ className }) => {
  const script = useMemo(
    () => ({
      step1User: 'Tolong check armada bigbus 40 seat yang ready besok untuk 2 hari',
      step3Bot:
        'Besok tersedia 4 unit, line up:\n- Jetbus HD5 Mercedes Benz OH1626 — 2 unit\n- SR3 Laksana RM280 — 2 unit\nMau aku buatkan pesanan?',
      step5User: 'Reservasi Jetbus HD5 1 unit atasnama John Doe,\npickup Terminal Poris tujuan Bandung 2 hari',
      step7Bot: '✅ OrderID FO-202505250-CLS001 berhasil dibuat.\nTerlampir invoice 🧾',
      invoice: { name: 'John Doe', route: 'Poris→Bandung', total: 5700000 },
      dashboard: { ordersStart: 12, ordersEnd: 13, revStart: 41300000, revEnd: 47000000 },
    }),
    []
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isFading, setIsFading] = useState(false);
  const [headerStatus, setHeaderStatus] = useState<'Online' | 'Mengetik…'>('Online');

  const [ordersDisplay, setOrdersDisplay] = useState(script.dashboard.ordersStart);
  const [revenueDisplay, setRevenueDisplay] = useState(script.dashboard.revStart);
  const [revenueFlash, setRevenueFlash] = useState(false);

  const loopIdRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

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

  const fmtIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  const resetScene = () => {
    setHeaderStatus('Online');
    setIsFading(false);
    setMessages([]);
    setOrdersDisplay(script.dashboard.ordersStart);
    setRevenueDisplay(script.dashboard.revStart);
    setRevenueFlash(false);
  };

  const animateNumber = (from: number, to: number, durationMs: number, onUpdate: (v: number) => void, token: number) => {
    const start = performance.now();
    const tick = (now: number) => {
      if (loopIdRef.current !== token) return;
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const v = Math.round(from + (to - from) * eased);
      onUpdate(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const pushMessage = (msg: Omit<ChatMessage, 'id' | 'time'>, time?: string) => {
    const m: ChatMessage = { id: makeId(), time: time ?? fmtTime(), ...msg };
    setMessages((prev) => [...prev, m]);
  };

  const removeTyping = () => setMessages((prev) => prev.filter((m) => m.kind !== 'typing'));

  useEffect(() => {
    const token = ++loopIdRef.current;
    clearTimers();
    resetScene();

    const run = () => {
      resetScene();

      schedule(() => {
        pushMessage({ role: 'user', kind: 'text', text: script.step1User });
      }, 400);

      schedule(() => {
        setHeaderStatus('Mengetik…');
        pushMessage({ role: 'bot', kind: 'typing' });
      }, 1100);

      schedule(() => {
        removeTyping();
        setHeaderStatus('Online');
        pushMessage({ role: 'bot', kind: 'text', text: script.step3Bot });
      }, 1100 + 1500);

      schedule(() => {
        setIsFading(true);
      }, 1100 + 1500 + 1200);

      schedule(() => {
        setIsFading(false);
        setMessages([]);
      }, 1100 + 1500 + 1200 + 520);

      schedule(() => {
        pushMessage({ role: 'user', kind: 'text', text: script.step5User });
      }, 1100 + 1500 + 1200 + 520 + 250);

      schedule(() => {
        setHeaderStatus('Mengetik…');
        pushMessage({ role: 'bot', kind: 'typing' });
      }, 1100 + 1500 + 1200 + 520 + 250 + 900);

      schedule(() => {
        if (loopIdRef.current !== token) return;
        removeTyping();
        setHeaderStatus('Online');
        const t = fmtTime();
        pushMessage({ role: 'bot', kind: 'text', text: script.step7Bot }, t);
        pushMessage({ role: 'bot', kind: 'invoice' }, t);

        animateNumber(script.dashboard.ordersStart, script.dashboard.ordersEnd, 820, setOrdersDisplay, token);
        animateNumber(script.dashboard.revStart, script.dashboard.revEnd, 980, setRevenueDisplay, token);
        setRevenueFlash(true);
        schedule(() => setRevenueFlash(false), 520);
      }, 1100 + 1500 + 1200 + 520 + 250 + 900 + 2000);

      schedule(() => {
        if (loopIdRef.current !== token) return;
        run();
      }, 1100 + 1500 + 1200 + 520 + 250 + 900 + 2000 + 3000);
    };

    run();
    return () => {
      loopIdRef.current += 1;
      clearTimers();
    };
  }, [script]);

  return (
    <div className={className}>
      <style>{`
        @keyframes tgSlideInRight { from { transform: translateX(14px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes tgSlideInLeft { from { transform: translateX(-14px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes tgDots { 0%,100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-3px); opacity: .95; } }
        @keyframes tgFadeUp { to { transform: translateY(-18px); opacity: 0; } }
        @keyframes tgFlashGreen { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.0); } 35% { box-shadow: 0 0 0 10px rgba(34,197,94,.18); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.0); } }

        @media (prefers-reduced-motion: reduce) {
          .tg-anim, .tg-anim * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="tg-anim rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr] md:items-stretch">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#17212B] dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#1E2A38] px-4 py-3 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#3B5BDB] text-sm font-bold shadow-sm">
                  T
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-semibold">TraveGo - AI Assistant</div>
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
                      Bot
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 0 6px rgba(52,211,153,.12)' }} />
                    <span>{headerStatus}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-sm">⋯</div>
              </div>
            </div>

            <div className="p-4">
              <div
                className="grid min-h-[320px] content-start gap-2"
                style={isFading ? { animation: 'tgFadeUp 520ms ease-in-out forwards' } : undefined}
              >
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  const align = isUser ? 'justify-end' : 'justify-start';
                  const bubbleBg = isUser ? 'bg-[#2B5278]' : 'bg-[#182533]';
                  const anim = isUser ? 'tgSlideInRight' : 'tgSlideInLeft';

                  if (m.kind === 'typing') {
                    return (
                      <div key={m.id} className={`flex ${align}`}>
                        <div
                          className={`w-fit rounded-2xl ${bubbleBg} px-3 py-2 text-white shadow-sm`}
                          style={{ animation: `${anim} 420ms ease-out forwards` }}
                          aria-label="Typing indicator"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'tgDots 1.1s ease-in-out infinite' }} />
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'tgDots 1.1s ease-in-out infinite 140ms' }} />
                            <span className="h-[7px] w-[7px] rounded-full bg-white/70" style={{ animation: 'tgDots 1.1s ease-in-out infinite 280ms' }} />
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

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-gray-950">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#3B5BDB]/10 to-transparent px-4 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard Realtime</div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">Auto-update saat chat menjadi order</div>
              </div>
            </div>

            <div className="grid gap-3 bg-gradient-to-b from-white to-slate-50 p-4 dark:from-gray-950 dark:to-slate-900/30">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pesanan Hari Ini</div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{ordersDisplay}</div>
              </div>

              <div
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-900"
                style={revenueFlash ? { animation: 'tgFlashGreen 520ms ease-in-out' } : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Revenue Hari Ini</div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                    +{fmtIDR(script.invoice.total)}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{fmtIDR(revenueDisplay)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

