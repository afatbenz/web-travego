import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  ShoppingBag,
  Package,
  Car,
  User,
  Users,
  Code,
  Shield,
  CalendarClock,
  Menu,
  X,
  Handshake,
  Mails,
  MapPin,
  SlidersHorizontal,
  Building2,
  CalendarCheck,
  CalendarArrowUp,
  HandCoinsIcon,
  CreditCard,
  Gauge,
  Shapes
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEffectiveOrganization } from '@/hooks/useEffectiveOrganization';
import { clearAuthStorage } from '@/lib/utils';
import dashboardLogo from '@/assets/general/logo.svg';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dashboard_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, hasEffectiveOrganization, isAdmin, role, isSuperAdmin } = useEffectiveOrganization();

  const orgName = React.useMemo(() => {
    const nameFromJwt = String(
      claims?.organization_name ??
      claims?.org_name ??
      claims?.organizationName ??
      claims?.orgName ??
      ''
    );
    return nameFromJwt || (localStorage.getItem('organization_name') ?? '');
  }, [claims]);

  const basePrefix = '/dashboard';
  const profileHref = isAdmin ? '/dashboard/profile' : `${basePrefix}/profile`;
  const canUseDashboardMenus = hasEffectiveOrganization || isAdmin;
  const taskbarThirdHref = canUseDashboardMenus ? profileHref : `${basePrefix}/organization/register`;
  const taskbarThirdActive = canUseDashboardMenus ? '/dashboard/profile' : `${basePrefix}/organization/register`;
  const TaskbarThirdIcon = canUseDashboardMenus ? User : Building2;

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

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  type IconType = React.ComponentType<{ className?: string }>;
  type NavItem = { title: string; href: string; icon: IconType; access?: string[] };
  type NavSection = { label: string; items: NavItem[]; access?: string[] };

  const bottomMenuItems: NavItem[] = [{ title: 'Logout', icon: LogOut, href: '/auth/login' }];

  const fullNavSections: NavSection[] = useMemo(
    () => [
      {
        label: 'Ringkasan',
        items: [
          { title: 'Dashboard', icon: Home, href: basePrefix, access: ['Admin', 'Members'] },
          { title: 'Performance', icon: Gauge, href: '/performance', access: ['SuperAdmin'] }
        ],
        access: ['SuperAdmin', 'Admin', 'Members']
      },
      {
        label: 'Orders',
        items: [
          { title: 'Armad Pariwisata', icon: Car, href: `${basePrefix}/orders/fleet`, access: ['Admin', 'Members'] },
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'Data Master',
        items: [
          // { title: 'Paket Wisata', icon: Package, href: `${basePrefix}/services/packages` },
          { title: 'Daftar Armada', icon: Car, href: `${basePrefix}/services/fleet`, access: ['Admin', 'Members'] },
          { title: 'Unit Armada', icon: Car, href: `${basePrefix}/fleet-units`, access: ['Admin', 'Members'] },
          { title: 'Daftar Garasi', icon: Building2, href: `${basePrefix}/organization/garages`, access: ['Admin', 'Members'] },
          { title: 'Device ID', icon: Code, href: `${basePrefix}/device-ids`, access: ['SuperAdmin'] },
          { title: 'Pesan Masuk', icon: Mails, href: `${basePrefix}/system/messages`, access: ['SuperAdmin'] },
          { title: 'Perusahaan', icon: Building2, href: `${basePrefix}/system/organizations`, access: ['SuperAdmin'] },
          { title: 'Pengguna', icon: Users, href: `${basePrefix}/system/users`, access: ['SuperAdmin'] },
        ],
        access: ['Admin', 'Members', 'SuperAdmin']
      },
      {
        label: 'Preferensi',
        items: [
          { title: 'Preferensi Kota', icon: MapPin, href: `${basePrefix}/preferences/cities`, access: ['Admin', 'Members', 'SuperAdmin'] }
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'Jadwal',
        items: [
          { title: 'Jadwal Tim', icon: CalendarClock, href: `${basePrefix}/schedules/team-schedules`, access: ['Admin'], },
          { title: 'Kalender Armada', icon: CalendarCheck, href: `${basePrefix}/schedules/fleet-management`, access: ['Admin', 'Members'] },
          { title: 'Jadwal Armada', icon: CalendarArrowUp, href: `${basePrefix}/schedules/fleet-schedules`, access: ['Admin', 'Members'] },
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'Finance',
        items: [
          { title: 'Pendapatan', icon: HandCoinsIcon, href: `${basePrefix}/finance/revenue`, access: ['Admin', 'Members'] },
          { title: 'Pengeluaran Umum', icon: ShoppingBag, href: `${basePrefix}/finance/expenses`, access: ['Admin', 'Members'] }
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'Inventories',
        items: [
          { title: 'Asset Tersedia', icon: Package, href: `${basePrefix}/inventories/items`, access: ['Admin'] },
          { title: 'Permintaan Asset', icon: ShoppingBag, href: `${basePrefix}/inventories/request`, access: ['Admin', 'Members'] },
          { title: 'Pemesanan Asset', icon: Package, href: `${basePrefix}/inventories/orders`, access: ['Admin'] }
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'CRM',
        items: [
          { title: 'Daftar Pelanggan', icon: Users, href: `${basePrefix}/customers`, access: ['Admin'] },
          { title: 'Mitra Operasional', icon: Handshake, href: `${basePrefix}/partner-operations`, access: ['Admin'] },
          { title: 'Pesan Masuk', icon: Mails, href: `${basePrefix}/inquiry`, access: ['Admin'] },
        ],
        access: ['Admin']
      },
      {
        label: 'Organisasi',
        items: [
          { title: 'Perusahaan Saya', icon: Building2, href: `${basePrefix}/organization/company`, access: ['Admin', 'Members'] },
          { title: 'Anggota Tim', icon: Users, href: `${basePrefix}/organization/team-members`, access: ['Admin', 'Members'] },
          { title: 'Peran', icon: Shield, href: `${basePrefix}/organization/roles`, access: ['Admin'] },
          { title: 'Divisi', icon: Package, href: `${basePrefix}/organization/division`, access: ['Admin'] }
        ],
        access: ['Admin', 'Members']
      },
      {
        label: 'Pengaturan',
        items: [
          { title: 'User', icon: Users, href: `${basePrefix}/organization/users`, access: ['Admin'] },
          { title: 'Nomor Rekening', icon: CreditCard, href: `${basePrefix}/content/bank-account`, access: ['Admin'] },
          { title: 'Subscription', icon: Shapes, href: `${basePrefix}/accounts/subscription`, access: ['Admin'] },
          { title: 'AI Assistant', icon: Code, href: `${basePrefix}/organization/account-assistant`, access: ['Admin'] },
          { title: 'Organisasi', icon: Building2, href: `${basePrefix}/organization/settings`, access: ['Admin'] },
          { title: 'Open API', icon: Code, href: `${basePrefix}/organization/open-api`, access: ['Admin'] },
          { title: 'Manajemen Konten', icon: SlidersHorizontal, href: `${basePrefix}/content`, access: ['Admin', 'Members'] }
        ],
        access: ['Admin', 'Members']
      }
    ],
    [basePrefix, isAdmin]
  );

  const organizationOnlySections: NavSection[] = useMemo(
    () => [
      {
        label: 'Organisasi',
        items: [
          { title: 'Pilih Organisasi', icon: Building2, href: `${basePrefix}/organization/choice`, access: ['Admin', 'Members'] },
          { title: 'Buat Organisasi', icon: Building2, href: `${basePrefix}/organization/register`, access: ['Admin', 'Members'] },
          { title: 'Gabung Organisasi', icon: Users, href: `${basePrefix}/organization/join`, access: ['Admin', 'Members'] },
        ],
        access: ['Admin', 'Members']
      },
    ],
    [basePrefix],
  );

  // Function to check if user has access
  const hasAccess = (accessList: string[] | undefined): boolean => {
    if (!accessList || accessList.length === 0) return false;
    if (isSuperAdmin) return true;
    return accessList.includes(role);
  };

  // Filter sections and items based on role
  const filteredNavSections = useMemo(() => {
    const isOrgSetupMode = !hasEffectiveOrganization && !isAdmin;
    const sections = isOrgSetupMode
      ? organizationOnlySections
      : fullNavSections;

    return sections.map(section => {
      // If it's org setup mode, always show the section and items
      if (isOrgSetupMode) {
        return section;
      }
      
      // Check if section has access
      if (!hasAccess(section.access)) {
        return null;
      }
      
      // Filter items in the section
      const filteredItems = section.items.filter(item => hasAccess(item.access));
      
      if (filteredItems.length === 0) {
        return null;
      }
      console.log({myrole: role, isAdmin})
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(Boolean) as NavSection[];
  }, [fullNavSections, organizationOnlySections, hasEffectiveOrganization, isAdmin, role]);

  // Check if current path is accessible
  React.useEffect(() => {
    const checkAccess = () => {
      // Skip auth paths and organization setup paths
      if (location.pathname.startsWith('/auth/')) return;
      
      const isOrgSetupMode = !hasEffectiveOrganization && !isAdmin;
      const isOrgSetupPath = location.pathname.includes('/organization/choice') || 
                           location.pathname.includes('/organization/register') || 
                           location.pathname.includes('/organization/join');
      
      // In org setup mode, only allow org setup paths
      if (isOrgSetupMode) {
        if (!isOrgSetupPath) {
          const basePrefix = '/dashboard';
          navigate(`${basePrefix}/organization/choice`, { replace: true });
        }
        return;
      }
      
      // Find if current path is in any accessible menu item
      let isAccessible = false;
      
      for (const section of filteredNavSections) {
        for (const item of section.items) {
          if (location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)) {
            isAccessible = true;
            break;
          }
        }
        if (isAccessible) break;
      }
      
      // Also check if user is on performance page (SuperAdmin only)
      if (location.pathname === '/performance' || location.pathname.startsWith('/performance/')) {
        isAccessible = isSuperAdmin;
      }
      
      if (!isAccessible && !isSuperAdmin) {
        // Redirect to 404 or 403 - let's use 404 for now or create a 403
        // For now, redirect to dashboard home or 404
        const basePrefix = '/dashboard';
        navigate(basePrefix, { replace: true });
      }
    };
    
    checkAccess();
  }, [location.pathname, filteredNavSections, isSuperAdmin, isAdmin, navigate, hasEffectiveOrganization]);

  const navSections = filteredNavSections;

  const SidebarContent: React.FC<{
    collapsed: boolean;
    headerRight: React.ReactNode;
    onNavigate?: () => void;
  }> = ({ collapsed: collapsedValue, headerRight, onNavigate }) => {
    const navRef = useRef<HTMLElement | null>(null);
    
    useEffect(() => {
      const savedScrollTop = localStorage.getItem('sidebar_scroll_top');
      if (savedScrollTop && navRef.current) {
        navRef.current.scrollTop = parseInt(savedScrollTop, 10);
      }
    }, []);
    return (
      <>
        <div
          className={cn(
            'flex gap-3',
            collapsedValue ? 'flex-col items-center px-2 pt-3 pb-3' : 'items-center px-3 pt-4 pb-3'
          )}
        >
          <Link
            to="/"
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 min-w-0',
              collapsedValue ? 'rounded-xl p-1' : 'rounded-full px-2 py-1.5',
              'transition-colors hover:bg-white/5'
            )}
          >
            <img src={dashboardLogo} alt="TraveGO" className="h-8 w-8 object-contain" />
            {!collapsedValue && (
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

          <div className={cn(collapsedValue ? '' : 'ml-auto')}>{headerRight}</div>
        </div>

        <TooltipProvider delayDuration={150}>
          <nav
            ref={navRef}
            onScroll={(e) => localStorage.setItem('sidebar_scroll_top', String(e.currentTarget.scrollTop))}
            className={cn('flex-1 overflow-y-auto sidebar-scroll', collapsedValue ? 'px-2 pb-3' : 'px-3 pb-3')}
          >
            {navSections.map((section, sectionIdx) => (
              <div key={section.label} className={cn(sectionIdx === 0 ? '' : collapsedValue ? 'mt-3' : 'mt-5')}>
                {collapsedValue ? (
                  <div className="mx-1 h-px bg-white/10" />
                ) : (
                  <div className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/45">
                    {section.label}
                  </div>
                )}

                <div className={cn('space-y-1', collapsedValue ? 'mt-2' : '')}>
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    const content = (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'group flex items-center gap-3 rounded-full transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-0',
                          collapsedValue ? 'h-11 justify-center px-1' : 'h-10 px-3',
                          active
                            ? 'bg-gradient-to-r from-indigo-500/25 hover:text-yellow-100 via-indigo-400/10 to-sky-400/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_12px_40px_rgba(0,0,0,0.35)]'
                            : 'text-slate-200/75 hover:bg-white/5 hover:text-yellow-50 hover:shadow-[0_0_0_1px_rgba(129,140,248,0.25),0_0_20px_rgba(129,140,248,0.10)]'
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span
                          className={cn(
                            'grid place-items-center rounded-full',
                            collapsedValue ? 'h-10 w-10' : 'h-9 w-9',
                            active ? 'bg-white/5' : 'bg-transparent group-hover:bg-white/5'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        {!collapsedValue && (
                          <span className="min-w-0 truncate text-[13px] font-medium tracking-tight">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    );

                    if (!collapsedValue) return content;

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

        <div className={cn('mt-auto px-3 pb-4 pt-3', collapsedValue ? 'px-2' : 'px-3')}>
          <div className={cn('h-px bg-white/10', collapsedValue ? 'mx-1' : 'mx-2')} />
          <div className={cn('mt-3', collapsedValue ? '' : 'px-0')}>
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
onClick={() => {
                    if (item.title === 'Logout') {
                      clearAuthStorage();
                      console.log('Auth storage cleared on logout');
                    }
                    onNavigate?.();
                  }}
                  className={cn(
                    'group flex items-center gap-3 rounded-full transition-all duration-200',
                    collapsedValue ? 'h-11 justify-center px-1' : 'h-10 px-3',
                    'text-rose-200/85 hover:text-white hover:bg-rose-500/10 hover:shadow-[0_0_0_1px_rgba(244,63,94,0.25),0_0_20px_rgba(244,63,94,0.14)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-0'
                  )}
                  title={collapsedValue ? item.title : undefined}
                >
                  <span className={cn('grid place-items-center rounded-full', collapsedValue ? 'h-10 w-10' : 'h-9 w-9')}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {!collapsedValue && <span className="text-[13px] font-medium tracking-tight">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={cn(
          'hidden md:flex md:flex-col h-screen fixed left-0 top-0 z-10 transition-[width] duration-300 ease-out',
          'bg-gradient-to-b from-[#020617] via-[#133537] to-[#020617]',
          'text-slate-100'
        )}
        style={{ width: collapsed ? '4rem' : '16rem' }}
      >
        <SidebarContent
          collapsed={collapsed}
          headerRight={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              className={cn(
                'h-9 w-9 rounded-full bg-white/5 text-white/80 transition-all',
                'hover:bg-white/10 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_18px_rgba(129,140,248,0.18)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-0'
              )}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          }
        />
      </div>

      <div
        className={cn('md:hidden fixed inset-0 z-40', mobileOpen ? '' : 'pointer-events-none')}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-transform duration-300 ease-out',
            'bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950',
            'text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ width: '16rem' }}
        >
          <div className="flex h-full flex-col">
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              headerRight={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'h-9 w-9 rounded-full bg-white/5 text-white/80 transition-all',
                    'hover:bg-white/10 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_18px_rgba(129,140,248,0.18)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-0'
                  )}
                >
                  <X className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md px-4">
          <div
            className={cn(
              'mb-3 grid grid-cols-3 items-center gap-2 rounded-full border border-white/10',
              'bg-slate-950/90 shadow-[0_10px_40px_rgba(0,0,0,0.40)] backdrop-blur'
            )}
          >
            <Button
              variant="ghost"
              onClick={() => setMobileOpen((v) => !v)}
              className={cn(
                'h-12 w-full rounded-full text-slate-200/85 hover:bg-white/5 hover:text-white',
                mobileOpen ? 'bg-white/5 text-white' : ''
              )}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link
              to={basePrefix}
              className={cn(
                'h-12 w-full rounded-full grid place-items-center transition-colors',
                'text-slate-200/85 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60',
                isActive(basePrefix) ? 'bg-white/5 text-white' : ''
              )}
            >
              <Home className="h-5 w-5" />
            </Link>

            <Link
              to={taskbarThirdHref}
              className={cn(
                'h-12 w-full rounded-full grid place-items-center transition-colors',
                'text-slate-200/85 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60',
                isActive(taskbarThirdActive) ? 'bg-white/5 text-white' : ''
              )}
            >
              <TaskbarThirdIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};