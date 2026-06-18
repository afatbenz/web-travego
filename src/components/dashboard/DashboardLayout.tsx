import { useEffect, type FC, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useEffectiveOrganization } from '@/hooks/useEffectiveOrganization';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { effectiveOrgId, isAdmin, isChecking } = useEffectiveOrganization();
  const hasEffectiveOrganization = effectiveOrgId !== '';

  useEffect(() => {
    if (isChecking) return;
    if (location.pathname.startsWith('/auth/')) return;

    const noOrg = !isAdmin && !hasEffectiveOrganization;
    const basePrefix = isAdmin ? '/dashboard' : '/dashboard/partner';
    const allowedNoOrgPaths = [
      `${basePrefix}/organization/choice`,
      `${basePrefix}/organization/register`,
      `${basePrefix}/organization/join`,
    ];
    const isAllowedNoOrgPath = allowedNoOrgPaths.some((path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

    if (noOrg && !isAllowedNoOrgPath) {
      navigate(`${basePrefix}/organization/choice`, { replace: true });
      return;
    }

    if (hasEffectiveOrganization) {
      const orgOnlyPaths = [
        `${basePrefix}/organization/choice`,
        `${basePrefix}/organization/register`,
        `${basePrefix}/organization/join`,
      ];
      const onOrgOnlyPath = orgOnlyPaths.some((path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`),
      );
if (onOrgOnlyPath) {
        console.log('User has organization, redirecting from org-only path:', location.pathname);
        navigate(`${basePrefix}`, { replace: true });
        return;
      }

      const onDashboardHome = location.pathname === '/dashboard/partner' || location.pathname === '/dashboard/partner/';
      if (noOrg && onDashboardHome) {
        navigate('/dashboard/partner/organization/choice');
      } else if (!isAdmin && location.pathname.startsWith('/dashboard/') && !location.pathname.startsWith('/dashboard/partner')) {
        const target = location.pathname.replace('/dashboard/', '/dashboard/partner/');
        navigate(target);
      }
    }

    const onDashboardHome = location.pathname === '/dashboard/partner' || location.pathname === '/dashboard/partner/';
    if (noOrg && onDashboardHome) {
      navigate('/dashboard/partner/organization/choice');
    }
    const pathIsAdminArea = location.pathname.startsWith('/dashboard/') && !location.pathname.startsWith('/dashboard/partner');
    if (!isAdmin && pathIsAdminArea) {
      const target = location.pathname.replace('/dashboard/', '/dashboard/partner/');
      navigate(target);
    }
  }, [effectiveOrgId, isAdmin, isChecking, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col min-w-0 md:ml-[var(--sidebar-width,4rem)] transition-all duration-300">
        <Topbar />
        <main className="flex-1 pt-4 px-3 sm:px-4 pb-18 sm:pb-6 lg:px-6 lg:pb-6 xl:px-8 xl:pb-8 2xl:px-12 2xl:pb-12 overflow-x-auto">
          <div className="w-full dashboard-surface">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
