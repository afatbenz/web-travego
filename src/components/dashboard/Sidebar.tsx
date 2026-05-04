import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  DollarSign,
  FileText,
  LogOut,
  ShoppingBag,
  Clock,
  Package,
  Car,
  Settings,
  User,
  Users,
  Code,
  Shield,
  Calendar,
  UserCheck,
  Gift,
  CalendarClock,
  Ticket,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import dashboardLogo from '@/assets/general/logo.svg';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dashboard_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const [orgName, setOrgName] = useState('');

  const decodeJwtPayload = React.useCallback((jwt: string) => {
    try {
      const payloadStr = jwt.split('.')[1];
      if (!payloadStr) return null;
      const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    let nameFromJwt = '';
    const json = decodeJwtPayload(token);
    if (json) {
      nameFromJwt = String(
        json.organization_name ?? json.org_name ?? json.organizationName ?? json.orgName ?? ''
      );
    }
    const name = nameFromJwt || (localStorage.getItem('organization_name') ?? '');
    setOrgName(name);
  }, [decodeJwtPayload]);

  const token = localStorage.getItem('token') ?? '';
  const claims = decodeJwtPayload(token) ?? {};
  const isAdmin = Boolean(claims.is_admin ?? claims.isAdmin ?? false);
  const basePrefix = isAdmin ? '/dashboard' : '/dashboard/partner';

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const orgTitle = orgName || 'Organization';
  const orgTitleDisplay = orgTitle.length > 15 ? orgTitle.slice(0, 12) + '...' : orgTitle;

  React.useEffect(() => {
    const w = collapsed ? '4rem' : '16rem';
    document.documentElement.style.setProperty('--sidebar-width', w);
    try {
      localStorage.setItem('dashboard_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {
      void 0;
    }
  }, [collapsed]);

  type IconType = React.ComponentType<{ className?: string }>;
  type NavItem = { title: string; href: string; icon: IconType };
  type NavSection = { label: string; items: NavItem[] };

  const bottomMenuItems: NavItem[] = [{ title: 'Logout', icon: LogOut, href: '/auth/login' }];

  const navSections: NavSection[] = useMemo(
    () => [
      {
        label: 'Ringkasan',
        items: [{ title: 'Dashboard', icon: Home, href: basePrefix }]
      },
      {
        label: 'Pesanan',
        items: [
          { title: 'Pesanan Armada', icon: Car, href: `${basePrefix}/orders/fleet` },
          { title: 'Pesanan Wisata', icon: Package, href: `${basePrefix}/orders/tour` },
        ]
      },
      {
        label: 'Layanan',
        items: [
          { title: 'Paket Wisata', icon: Package, href: `${basePrefix}/services/packages` },
          { title: 'Daftar Armada', icon: Car, href: `${basePrefix}/services/fleet` },
          { title: 'Unit Armada', icon: Car, href: `${basePrefix}/fleet-units` }
        ]
      },
      {
        label: 'Jadwal',
        items: [
          { title: 'Jadwal Armada', icon: Car, href: `${basePrefix}/schedules/fleet-management` },
          { title: 'Jadwal Tim', icon: CalendarClock, href: `${basePrefix}/schedules/team-schedules` },
          { title: 'Manajemen Cuti', icon: Calendar, href: `${basePrefix}/schedules/leave-management` }
        ]
      },
      {
        label: 'Keuangan',
        items: [
          { title: 'Pendapatan', icon: DollarSign, href: `${basePrefix}/finance/revenue` },
          { title: 'Buku Besar', icon: FileText, href: `${basePrefix}/finance/general-ledger` },
          { title: 'Pengeluaran Umum', icon: ShoppingBag, href: `${basePrefix}/finance/general-expenses` },
          { title: 'Pengeluaran Armada', icon: Car, href: `${basePrefix}/finance/fleet-expenses` },
          { title: 'Pengeluaran Operasional', icon: Settings, href: `${basePrefix}/finance/operational-expenses` }
        ]
      },
      {
        label: 'Pelanggan',
        items: [
          { title: 'Semua Pelanggan', icon: Users, href: `${basePrefix}/customers` },
          { title: 'Pelanggan Terdaftar', icon: UserCheck, href: `${basePrefix}/customers/registered` },
          { title: 'Hadiah Pelanggan', icon: Gift, href: `${basePrefix}/customers/rewards` }
        ]
      },
      {
        label: 'Organisasi',
        items: [
          { title: 'Perusahaan Saya', icon: FileText, href: `${basePrefix}/organization/company` },
          { title: 'Anggota Tim', icon: Users, href: `${basePrefix}/organization/team-members` },
          { title: 'Peran', icon: Shield, href: `${basePrefix}/organization/roles` },
          { title: 'Divisi', icon: Package, href: `${basePrefix}/organization/division` }
        ]
      },
      {
        label: 'Kupon',
        items: [
          { title: 'Semua Kupon', icon: Ticket, href: `${basePrefix}/coupons/all` },
          { title: 'Tambah Kupon', icon: PlusCircle, href: `${basePrefix}/coupons/add` }
        ]
      },
      {
        label: 'Pengaturan',
        items: [
          { title: 'Organisasi', icon: FileText, href: `${basePrefix}/organization/settings` },
          { title: 'Pengguna', icon: User, href: `${basePrefix}/organization/users` },
          { title: 'Open API', icon: Code, href: `${basePrefix}/organization/open-api` },
          { title: 'Manajemen Konten', icon: FileText, href: `${basePrefix}/content` }
        ]
      }
    ],
    [basePrefix]
  );

  return (
    <div
      className={cn(
        'hidden md:flex md:flex-col h-screen fixed left-0 top-0 z-10 transition-[width] duration-300 ease-out',
        'bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950',
        'text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]'
      )}
      style={{ width: collapsed ? '4rem' : '16rem' }}
    >
      <div
        className={cn(
          'flex gap-3',
          collapsed ? 'flex-col items-center px-2 pt-3 pb-3' : 'items-center px-3 pt-4 pb-3'
        )}
      >
        <Link
          to="/"
          className={cn(
            'group flex items-center gap-3 min-w-0',
            collapsed ? 'rounded-xl p-1' : 'rounded-full px-2 py-1.5',
            'transition-colors hover:bg-white/5'
          )}
        >
          <img src={dashboardLogo} alt="TraveGO" className="h-8 w-8 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold tracking-tight text-white/95">
                {orgTitleDisplay}
              </div>
              <div className="truncate text-[11px] font-medium tracking-wide text-white/50">
                TraveGO Dashboard
              </div>
            </div>
          )}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'h-9 w-9 rounded-full bg-white/5 text-white/80 transition-all',
            'hover:bg-white/10 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_18px_rgba(129,140,248,0.18)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-0',
            collapsed ? '' : 'ml-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <TooltipProvider delayDuration={150}>
        <nav className={cn('flex-1 overflow-y-auto sidebar-scroll', collapsed ? 'px-2 pb-3' : 'px-3 pb-3')}>
          {navSections.map((section, sectionIdx) => (
            <div key={section.label} className={cn(sectionIdx === 0 ? '' : collapsed ? 'mt-3' : 'mt-5')}>
              {collapsed ? (
                <div className="mx-1 h-px bg-white/10" />
              ) : (
                <div className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/45">
                  {section.label}
                </div>
              )}

              <div className={cn('space-y-1', collapsed ? 'mt-2' : '')}>
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  const content = (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-full transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-0',
                        collapsed ? 'h-11 justify-center px-1' : 'h-10 px-3',
                        active
                          ? 'bg-gradient-to-r from-indigo-500/25 hover:text-yellow-100 via-indigo-400/10 to-sky-400/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_12px_40px_rgba(0,0,0,0.35)]'
                          : 'text-slate-200/75 hover:bg-white/5 hover:text-yellow-50 hover:shadow-[0_0_0_1px_rgba(129,140,248,0.25),0_0_20px_rgba(129,140,248,0.10)]'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span
                        className={cn(
                          'grid place-items-center rounded-full',
                          collapsed ? 'h-10 w-10' : 'h-9 w-9',
                          active ? 'bg-white/5' : 'bg-transparent group-hover:bg-white/5'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {!collapsed && (
                        <span className="min-w-0 truncate text-[13px] font-medium tracking-tight">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  );

                  if (!collapsed) return content;

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{content}</TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={10}
                        className="border border-white/10 bg-slate-950 text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
                      >
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </TooltipProvider>

      <div className={cn('mt-auto px-3 pb-4 pt-3', collapsed ? 'px-2' : 'px-3')}>
        <div className={cn('h-px bg-white/10', collapsed ? 'mx-1' : 'mx-2')} />
        <div className={cn('mt-3', collapsed ? '' : 'px-0')}>
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => {
                  if (item.title === 'Logout') {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                  }
                }}
                className={cn(
                  'group flex items-center gap-3 rounded-full transition-all duration-200',
                  collapsed ? 'h-11 justify-center px-1' : 'h-10 px-3',
                  'text-rose-200/85 hover:text-white hover:bg-rose-500/10 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.25),0_0_20px_rgba(244,63,94,0.14)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-0'
                )}
                title={collapsed ? item.title : undefined}
              >
                <span className={cn('grid place-items-center rounded-full', collapsed ? 'h-10 w-10' : 'h-9 w-9')}>
                  <Icon className="h-5 w-5" />
                </span>
                {!collapsed && <span className="text-[13px] font-medium tracking-tight">{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
