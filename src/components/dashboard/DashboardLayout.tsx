import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payloadStr = token.split('.')[1];
      const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = JSON.parse(atob(padded));
      const name = json.name ?? json.username ?? json.fullname ?? '';
      const email = json.email ?? '';
      const role = json.role ?? json.user_role ?? 'user';
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        localStorage.setItem('user', JSON.stringify({ name, email, role }));
      }
      const orgId = json.organization_id ?? json.org_id ?? json.organizationId ?? '';
      const isAdmin = json.is_admin ?? json.isAdmin ?? false;
      if (location.pathname.startsWith('/auth/')) return;
      const noOrg = isAdmin === false && String(orgId).trim() === '';
      const onDashboardHome = location.pathname === '/dashboard/partner' || location.pathname === '/dashboard/partner/';
      if (noOrg && onDashboardHome) {
        navigate('/dashboard/partner/organization/choice');
      }
      const pathIsAdminArea = location.pathname.startsWith('/dashboard/') && !location.pathname.startsWith('/dashboard/partner');
      if (!isAdmin && pathIsAdminArea) {
        const target = location.pathname.replace('/dashboard/', '/dashboard/partner/');
        navigate(target);
      }
    } catch {
      // ignore decode errors
    }
  }, [navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col min-w-0 ml-16 lg:ml-72 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 2xl:p-12 overflow-x-auto">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
