import React, { useEffect, useMemo, useRef, useState } from 'react';

type AnalyticsDashboardSectionProps = {
  className?: string;
};

type Insight = {
  title: string;
  lines: string[];
};

export const AnalyticsDashboardSection: React.FC<AnalyticsDashboardSectionProps> = ({ className }) => {
  const data = useMemo(
    () => ({
      stats: {
        revenueStart: 127_400_000,
        revenueDelta: 2_850_000,
        armadaStart: 9,
        armadaEnd: 10,
        ordersStart: 48,
        ordersEnd: 49,
      },
      line: {
        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        valuesStart: [14_800_000, 16_200_000, 18_100_000, 17_250_000, 20_600_000, 22_900_000, 19_500_000],
        valuesEnd: [14_800_000, 16_200_000, 18_100_000, 17_250_000, 20_600_000, 22_900_000, 22_350_000],
      },
      donut: {
        parts: [
          { label: 'Big Bus', value: 0.4, color: '#3B5BDB' },
          { label: 'Medium', value: 0.35, color: '#40C057' },
          { label: 'Minibus', value: 0.25, color: '#FD7E14' },
        ],
      },
      insights: [
        {
          title: 'Trave AI',
          lines: [
            '📈 Revenue naik 23% vs bulan lalu.',
            'Peak order terjadi Jumat–Minggu.',
            'Rekomendasi: tambah 1 unit Sabtu depan.',
          ],
        },
        {
          title: 'Trave AI',
          lines: [
            '🚌 Unit SR3 Laksana utilisasi 94%.',
            'Jadwal servis terdekat: 3 hari lagi.',
            'Ingatkan mekanik sekarang?',
          ],
        },
        {
          title: 'Trave AI',
          lines: [
            '👥 Pelanggan John Doe belum',
            'konfirmasi perjalanan Sabtu.',
            'Kirim follow-up otomatis?',
          ],
        },
      ] satisfies Insight[],
      cycleMs: 17_000,
    }),
    []
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const startRef = useRef<number>(0);
  const lastInsightRef = useRef<number>(-1);
  const insightTimeoutRef = useRef<number | null>(null);

  const [revenue, setRevenue] = useState(0);
  const [armada, setArmada] = useState(0);
  const [orders, setOrders] = useState(0);
  const [revenueFlash, setRevenueFlash] = useState(false);
  const [armadaBadge, setArmadaBadge] = useState(false);
  const [insightIndex, setInsightIndex] = useState<number>(-1);
  const [insightKey, setInsightKey] = useState(0);
  const [insightOut, setInsightOut] = useState(false);
  const [fadeAll, setFadeAll] = useState(false);

  const fmtIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

  const setCanvasSize = (canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const w = Math.max(1, Math.floor(cssWidth * dpr));
    const h = Math.max(1, Math.floor(cssHeight * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  };

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    values: number[],
    labels: string[],
    drawProgress: number,
    updateProgress: number
  ) => {
    const dpr = window.devicePixelRatio || 1;
    const padX = 22 * dpr;
    const padTop = 18 * dpr;
    const padBottom = 28 * dpr;
    const w = width;
    const h = height;
    ctx.clearRect(0, 0, w, h);

    const all = [...data.line.valuesStart, ...data.line.valuesEnd];
    const minV = Math.min(...all);
    const maxV = Math.max(...all);
    const range = Math.max(1, maxV - minV);
    const x0 = padX;
    const x1 = w - padX;
    const y0 = padTop;
    const y1 = h - padBottom;
    const innerW = Math.max(1, x1 - x0);
    const innerH = Math.max(1, y1 - y0);

    const interpValues = values.map((v, i) => {
      const start = data.line.valuesStart[i] ?? v;
      const end = data.line.valuesEnd[i] ?? v;
      return Math.round(start + (end - start) * updateProgress);
    });

    const points = interpValues.map((v, i) => {
      const x = x0 + (innerW * i) / Math.max(1, interpValues.length - 1);
      const y = y0 + innerH * (1 - (v - minV) / range);
      return { x, y };
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(226,232,240,0.9)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const clipW = x0 + innerW * clamp01(drawProgress);
    ctx.beginPath();
    ctx.rect(0, 0, clipW, h);
    ctx.clip();

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });

    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, 'rgba(59,91,219,0.22)');
    grad.addColorStop(1, 'rgba(59,91,219,0)');

    ctx.lineTo(points[points.length - 1].x, y1);
    ctx.lineTo(points[0].x, y1);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = '#3B5BDB';
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    const dotScale = 0.85 + 0.35 * updateProgress;
    const dotR = 4.2 * dpr * dotScale;
    ctx.beginPath();
    ctx.arc(last.x, last.y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#3B5BDB';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, (dotR + 2.5 * dpr) * (updateProgress > 0 ? 1 : 0), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59,91,219,0.35)';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(100,116,139,0.85)';
    ctx.font = `${11 * dpr}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = 'center';
    labels.forEach((lab, i) => {
      const x = x0 + (innerW * i) / Math.max(1, labels.length - 1);
      ctx.fillText(lab, x, h - 10 * dpr);
    });
    ctx.restore();
  };

  const drawDonut = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const rOuter = Math.min(width, height) * 0.36;
    const rInner = rOuter * 0.62;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip('evenodd');

    const totalAngle = Math.PI * 2 * clamp01(progress);
    let acc = -Math.PI / 2;
    let remaining = totalAngle;
    for (const p of data.donut.parts) {
      if (remaining <= 0) break;
      const seg = Math.PI * 2 * p.value;
      const draw = Math.min(seg, remaining);
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, acc, acc + draw);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = (rOuter - rInner) * 0.95;
      ctx.lineCap = 'butt';
      ctx.stroke();
      acc += seg;
      remaining -= draw;
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.font = `${12 * dpr}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Komposisi', cx, cy - 4 * dpr);
    ctx.fillStyle = 'rgba(100,116,139,0.9)';
    ctx.font = `${11 * dpr}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText('Armada', cx, cy + 14 * dpr);
    ctx.restore();
  };

  useEffect(() => {
    const root = rootRef.current;
    const lineCanvas = lineCanvasRef.current;
    const donutCanvas = donutCanvasRef.current;
    if (!root || !lineCanvas || !donutCanvas) return;

    const lineCtx = lineCanvas.getContext('2d');
    const donutCtx = donutCanvas.getContext('2d');
    if (!lineCtx || !donutCtx) return;

    startRef.current = performance.now();
    lastInsightRef.current = -1;

    const resize = () => {
      const lineBox = lineCanvas.parentElement?.getBoundingClientRect();
      const donutBox = donutCanvas.parentElement?.getBoundingClientRect();
      if (lineBox) setCanvasSize(lineCanvas, lineBox.width, lineBox.height);
      if (donutBox) setCanvasSize(donutCanvas, donutBox.width, donutBox.height);
    };

    resize();
    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => resize());
    roRef.current.observe(root);

    const render = (now: number) => {
      const t = (now - startRef.current) % data.cycleMs;

      const loadProgress = easeInOut(clamp01(t / 1800));
      const lineProgress = t < 3000 ? loadProgress : 1;
      const donutProgress = t < 3000 ? loadProgress : 1;
      const updateProgress = t < 3000 ? 0 : t < 5000 ? easeInOut(clamp01((t - 3000) / 900)) : 1;

      const rev0 = data.stats.revenueStart;
      const rev1 = data.stats.revenueStart + data.stats.revenueDelta;
      const revVal = t < 3000 ? Math.round(rev0 * loadProgress) : Math.round(rev0 + (rev1 - rev0) * updateProgress);
      const arm0 = data.stats.armadaStart;
      const arm1 = data.stats.armadaEnd;
      const ord0 = data.stats.ordersStart;
      const ord1 = data.stats.ordersEnd;
      const armVal = t < 3000 ? Math.round(arm0 * loadProgress) : Math.round(arm0 + (arm1 - arm0) * updateProgress);
      const ordVal = t < 3000 ? Math.round(ord0 * loadProgress) : Math.round(ord0 + (ord1 - ord0) * updateProgress);

      setRevenue(revVal);
      setArmada(armVal);
      setOrders(ordVal);

      const flashOn = t >= 3000 && t <= 3600;
      setRevenueFlash(flashOn);
      setArmadaBadge(t >= 3000 && t <= 5200 && armVal > arm0);
      setFadeAll(t >= 16_000);

      const nextInsight =
        t < 5000 ? -1 : t < 9000 ? 0 : t < 13_000 ? 1 : 2;
      if (nextInsight !== lastInsightRef.current && insightTimeoutRef.current === null) {
        const prev = lastInsightRef.current;
        lastInsightRef.current = nextInsight;
        if (prev < 0) {
          setInsightOut(false);
          setInsightIndex(nextInsight);
          setInsightKey((v) => v + 1);
        } else {
          setInsightOut(true);
          insightTimeoutRef.current = window.setTimeout(() => {
            insightTimeoutRef.current = null;
            setInsightIndex(nextInsight);
            setInsightKey((v) => v + 1);
            setInsightOut(false);
          }, 260);
        }
      }

      const lw = lineCanvas.width;
      const lh = lineCanvas.height;
      drawLineChart(lineCtx, lw, lh, data.line.valuesStart, data.line.labels, lineProgress, updateProgress);

      const dw = donutCanvas.width;
      const dh = donutCanvas.height;
      drawDonut(donutCtx, dw, dh, donutProgress);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (insightTimeoutRef.current !== null) window.clearTimeout(insightTimeoutRef.current);
      insightTimeoutRef.current = null;
      roRef.current?.disconnect();
      roRef.current = null;
    };
  }, [data]);

  const insight = insightIndex >= 0 ? data.insights[insightIndex] : null;

  return (
    <div className={className}>
      <style>{`
        @keyframes adInUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes adOut { to { transform: translateY(-6px); opacity: 0; } }
        @keyframes adSoftOut { to { opacity: 0; filter: blur(1px); transform: translateY(-4px); } }
        @keyframes adFlashGreen { 0%{ box-shadow: 0 0 0 0 rgba(64,192,87,0);} 45%{ box-shadow: 0 0 0 10px rgba(64,192,87,.18);} 100%{ box-shadow: 0 0 0 0 rgba(64,192,87,0);} }
        @media (prefers-reduced-motion: reduce) { .ad-anim, .ad-anim * { animation: none !important; transition: none !important; } }
      `}</style>

      <div ref={rootRef} className="ad-anim w-full">
        <div
          className="w-full h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gray-900 flex flex-col"
          style={fadeAll ? { animation: 'adSoftOut 900ms ease-in-out forwards' } : undefined}
        >
          <div className="flex items-center justify-between gap-3 bg-[#3B5BDB] px-5 py-4 text-white">
            <div className="min-w-0">
              <div className="text-sm font-semibold">Analytics Dashboard</div>
              <div className="truncate text-xs text-white/80">Bantu analisa bisnis dan rencana strategis</div>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold md:flex">
              Live
              <span className="h-2 w-2 rounded-full bg-emerald-300" style={{ boxShadow: '0 0 0 6px rgba(52,211,153,.18)' }} />
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-5">
            <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-[#3B5BDB] bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-950">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Revenue Bulan Ini</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{fmtIDR(revenue)}</div>
                  </div>
                  <div
                    className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                    style={revenueFlash ? { animation: 'adFlashGreen 520ms ease-in-out' } : undefined}
                  >
                    +{fmtIDR(data.stats.revenueDelta)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-[#40C057] bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-950">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Armada Aktif</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {armada} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">unit</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    {armadaBadge ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                        +1 unit siap jalan
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-gray-900 dark:text-slate-300">
                        Stabil
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-[#FD7E14] bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-950">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pesanan</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {orders} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">order</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Realtime counter +1</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[7fr_3fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-950">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Revenue 7 Hari Terakhir</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sen–Ming</div>
                  </div>
                  <div className="h-[150px] w-full">
                    <canvas ref={lineCanvasRef} className="block h-full w-full" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-gray-950">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Komposisi Armada</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">%</div>
                  </div>
                  <div className="h-[150px] w-full">
                    <canvas ref={donutCanvasRef} className="block h-full w-full" />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs">
                    {data.donut.parts.map((p) => (
                      <div key={p.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{p.label}</span>
                        </div>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{Math.round(p.value * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 border-l-4 border-l-[#3B5BDB] bg-[#EEF2FF] p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                {insight ? (
                  <div
                    key={insightKey}
                    style={insightOut ? { animation: 'adOut 240ms ease-in forwards' } : { animation: 'adInUp 520ms ease-out forwards' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#3B5BDB] text-xs font-bold text-white shadow-sm">
                        AI
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</div>
                    </div>
                    <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      {insight.lines.join('\n')}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Menyiapkan insight…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
