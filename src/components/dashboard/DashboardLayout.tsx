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
  const { effectiveOrgId, isAdmin, isChecking, isSuperAdmin } = useEffectiveOrganization();
  const hasEffectiveOrganization = effectiveOrgId !== '';

  useEffect(() => {
    if (isChecking) return;
    if (location.pathname.startsWith('/auth/')) return;

    // If SuperAdmin, navigate to /performance if not already there
    if (isSuperAdmin) {
      if (location.pathname !== '/performance' && !location.pathname.startsWith('/performance/')) {
        navigate('/performance', { replace: true });
        return;
      }
    }

    const noOrg = !isSuperAdmin && !isAdmin && !hasEffectiveOrganization;
    const basePrefix = '/dashboard';
    const allowedNoOrgPaths = [
      `${basePrefix}/organization/choice`,
      `${basePrefix}/organization/register`,
      `${basePrefix}/organization/join`,
    ];
    const isAllowedNoOrgPath = allowedNoOrgPaths.some((path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

    if (noOrg && !isAllowedNoOrgPath && !isSuperAdmin) {
      navigate(`${basePrefix}/organization/choice`, { replace: true });
      return;
    }

    if (hasEffectiveOrganization && !isSuperAdmin) {
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

      const onDashboardHome = location.pathname === '/dashboard';
      if (noOrg && onDashboardHome) {
        navigate('/dashboard/organization/choice');
      } else if (!isAdmin && location.pathname.startsWith('/dashboard/')) {
        navigate(location.pathname);
      }
    }

    if (!isSuperAdmin) {
      const onDashboardHome = location.pathname === '/dashboard';
      if (noOrg && onDashboardHome) {
        navigate('/dashboard/organization/choice');
      }
      const pathIsAdminArea = location.pathname.startsWith('/dashboard/');
      if (!isAdmin && pathIsAdminArea) {
        navigate(location.pathname);
      }
    }
  }, [effectiveOrgId, isAdmin, isChecking, isSuperAdmin, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950">
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
