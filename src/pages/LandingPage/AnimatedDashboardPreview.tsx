import React, { useEffect, useRef, useState } from 'react';

export const AnimatedDashboardPreview: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  useEffect(() => {
    // Animate scroll to chart
    const animateScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTarget = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
      let startTime: number | null = null;
      const duration = 1500;
      const startScrollTop = 0;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScrollTop = startScrollTop + (scrollTarget - startScrollTop) * easeOutCubic;
        
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = currentScrollTop;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Scroll back after delay
          setTimeout(() => {
            if (!scrollContainerRef.current) return;
            let startTimeBack: number | null = null;
            const durationBack = 1000;
            const startScrollTopBack = scrollTarget;

            const stepBack = (timestamp: number) => {
              if (!startTimeBack) startTimeBack = timestamp;
              const elapsed = timestamp - startTimeBack;
              const progress = Math.min(elapsed / durationBack, 1);
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              const currentScrollTop = startScrollTopBack - (startScrollTopBack - 0) * easeOutCubic;

              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = currentScrollTop;
              }

              if (progress < 1) {
                requestAnimationFrame(stepBack);
              } else {
                // Repeat after delay
                setTimeout(animateScroll, 2000);
              }
            };

            requestAnimationFrame(stepBack);
          }, 2000);
        }
      };

      requestAnimationFrame(step);
    };

    // Start animation after initial delay
    setTimeout(animateScroll, 500);
  }, []);

  return (
    <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-lg">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-[180px] bg-[#17212b] flex-shrink-0 border-r border-white/10">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <div className="text-white text-xs font-semibold">TraveGo</div>
            </div>
            <nav className="space-y-1">
              {[
                { icon: '📊', label: 'Dashboard', active: true },
                { icon: '🚐', label: 'Armada' },
                { icon: '📅', label: 'Jadwal' },
                { icon: '💰', label: 'Keuangan' },
                { icon: '👥', label: 'Pelanggan' },
                { icon: '📦', label: 'Inventaris' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                    item.active ? 'bg-blue-900 text-white' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  {/* <span className="text-sm">{item.icon}</span> */}
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-[#141a2e] overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto scrollbar-hide"
            style={{ scrollBehavior: 'auto' }}
          >
            {/* Header */}
            <div className="bg-[#1d2541] border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Dashboard</h2>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Revenue', value: 47000000, change: '+12%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Expenses', value: 23500000, change: '+5%', color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Total Orders', value: 13, change: '+1', color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((card, idx) => (
                  <div key={idx} className={`bg-[#1d2541] rounded-xl p-3 shadow-sm border border-blue-950`}>
                    <div className="text-[10px] text-white/80 mb-1">{card.label}</div>
                    <div className="text-sm font-bold text-white mb-1">
                      {idx === 2 ? card.value : formatIDR(card.value)}
                    </div>
                    <div className={`text-[9px] font-medium ${card.color}`}>{card.change}</div>
                  </div>
                ))}
              </div>

              {/* Chart Section */}
              <div className="bg-[#1d2541] rounded-xl p-3 shadow-sm border border-blue-950">
                <h3 className="text-xs font-semibold text-white mb-3">Revenue & Expenses</h3>
                <svg viewBox="0 0 400 150" className="w-full h-auto">
                  {/* Grid */}
                  {[0, 37.5, 75, 112.5, 150].map((y, i) => (
                    <line
                      key={i}
                      x1="20"
                      y1={y}
                      x2="380"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="2"
                    />
                  ))}

                  {/* Y-axis labels */}
                  {[0, 20, 40, 60].map((val, i) => (
                    <text
                      key={i}
                      x="15"
                      y={150 - i * 37.5 - 2}
                      fontSize="8"
                      fill="#6b7280"
                      textAnchor="end"
                    >
                      {val === 0 ? '0' : val + 'M'}
                    </text>
                  ))}

                  {/* X-axis labels */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map((label, i) => (
                    <text
                      key={i}
                      x={20 + (i * 340) / 5}
                      y="145"
                      fontSize="8"
                      fill="#6b7280"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  ))}

                  {/* Expenses Line (Red) */}
                  <path
                    d="M20,130 L80,110 L140,90 L200,70 L260,40 L320,30 L380,20"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <path
                    d="M20,130 L80,110 L140,90 L200,70 L260,40 L320,30 L380,20 L380,150 L20,150 Z"
                    fill="rgba(239, 68, 68, 0.1)"
                  />

                  {/* Revenue Line (Green) */}
                  <path
                    d="M20,120 L80,100 L140,70 L200,80 L260,60 L320,50 L380,40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  <path
                    d="M20,120 L80,100 L140,70 L200,80 L260,60 L320,50 L380,40 L380,150 L20,150 Z"
                    fill="rgba(34, 197, 94, 0.1)"
                  />

                  {/* Data Points */}
                  {[
                    { x: 20, y: 130, color: '#ef4444' },
                    { x: 80, y: 110, color: '#ef4444' },
                    { x: 140, y: 90, color: '#ef4444' },
                    { x: 200, y: 70, color: '#ef4444' },
                    { x: 260, y: 40, color: '#ef4444' },
                    { x: 320, y: 30, color: '#ef4444' },
                    { x: 380, y: 20, color: '#ef4444' },
                    { x: 20, y: 120, color: '#22c55e' },
                    { x: 80, y: 100, color: '#22c55e' },
                    { x: 140, y: 70, color: '#22c55e' },
                    { x: 200, y: 80, color: '#22c55e' },
                    { x: 260, y: 60, color: '#22c55e' },
                    { x: 320, y: 50, color: '#22c55e' },
                    { x: 380, y: 40, color: '#22c55e' },
                  ].map((point, idx) => (
                    <circle
                      key={idx}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill={point.color}
                    />
                  ))}
                </svg>
              </div>

              {/* Extra space to allow scrolling */}
              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
