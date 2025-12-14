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

  const nonceLength = 12;

  function base64UrlToUint8Array(str: string): Uint8Array {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function getAesGcmKeyFromSecret(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const sBytes = enc.encode(secret);
    const keyBytes = new Uint8Array(32);
    keyBytes.set(sBytes.subarray(0, Math.min(sBytes.length, 32)));
    return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  }

  async function decryptAuthToken(token: string, secret: string): Promise<{
    organization_id: string;
    user_id: string;
    organization_role: number;
    is_admin: boolean;
  }> {
    const bytes = base64UrlToUint8Array(token);
    const iv = bytes.slice(0, nonceLength);
    const ct = bytes.slice(nonceLength);
    const key = await getAesGcmKeyFromSecret(secret);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const plainText = new TextDecoder().decode(new Uint8Array(plainBuf));
    return JSON.parse(plainText);
  }

  function decodeJwt(jwt: string): any {
    const parts = jwt.split('.');
    if (parts.length < 2) throw new Error('invalid jwt');
    let s = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    const json = atob(s);
    return JSON.parse(json);
  }

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const claims = decodeJwt(token);
        const secret = import.meta.env.VITE_JWT_SECRET ?? '';
        let sensitive: { organization_id?: string; user_id?: string; organization_role?: number; is_admin?: boolean } = {};
        if (claims?.token && secret) {
          try {
            sensitive = await decryptAuthToken(String(claims.token), String(secret));
          } catch {}
        }

        const name = claims.name ?? claims.username ?? claims.fullname ?? '';
        const email = claims.email ?? '';
        const role = claims.role ?? claims.user_role ?? 'user';
        const currentUser = localStorage.getItem('user');
        if (!currentUser) {
          localStorage.setItem('user', JSON.stringify({ name, email, role }));
        }

        const orgIdFromJwt = claims.organization_id ?? claims.org_id ?? claims.organizationId ?? '';
        const orgIdFromSensitive = sensitive.organization_id ?? '';
        const orgIdLocal = localStorage.getItem('organization_id') ?? '';
        const effectiveOrgId = String(orgIdFromSensitive || orgIdFromJwt || '').trim() || String(orgIdLocal ?? '').trim();

        const isAdmin = Boolean(sensitive.is_admin ?? claims.is_admin ?? claims.isAdmin ?? false);
        if (location.pathname.startsWith('/auth/')) return;
        const noOrg = isAdmin === false && effectiveOrgId === '';
        const onDashboardHome = location.pathname === '/dashboard/partner' || location.pathname === '/dashboard/partner/';
        if (noOrg && onDashboardHome) {
          navigate('/dashboard/partner/organization/choice');
        }
        const pathIsAdminArea = location.pathname.startsWith('/dashboard/') && !location.pathname.startsWith('/dashboard/partner');
        if (!isAdmin && pathIsAdminArea) {
          const target = location.pathname.replace('/dashboard/', '/dashboard/partner/');
          navigate(target);
        }
      } catch {}
    })();
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
