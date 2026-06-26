import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthLayout } from './AuthLayout';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { isTokenValid } from '@/lib/utils';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveDirection, setLeaveDirection] = useState<'left' | 'right'>('right');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 0);
    const token = localStorage.getItem('token');
    if (token && isTokenValid(token)) {
      try {
        const payloadStr = token.split('.')[1];
        const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const claims = JSON.parse(atob(padded)) as {
          is_admin?: boolean;
          organization_id?: string;
        };
        const claimsIsAdmin = claims.is_admin ?? false;
        const organizationId = claims.organization_id ?? '';
        const isSuperAdmin = claimsIsAdmin && organizationId === '00';
        const isAdminRole = claimsIsAdmin && organizationId !== '00' && organizationId !== '0';
        navigate(isSuperAdmin ? '/performance' : isAdminRole ? '/dashboard' : '/dashboard/partner', { replace: true });
      } catch {
        const userStr = localStorage.getItem('user');
        const isAdmin = userStr ? JSON.parse(userStr).role === 'admin' : false;
        navigate(isAdmin ? '/dashboard' : '/dashboard/partner', { replace: true });
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue && isTokenValid(e.newValue)) {
        try {
          const payloadStr = e.newValue.split('.')[1];
          const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const claims = JSON.parse(atob(padded)) as {
            is_admin?: boolean;
            organization_id?: string;
          };
          const claimsIsAdmin = claims.is_admin ?? false;
          const organizationId = claims.organization_id ?? '';
          const isSuperAdmin = claimsIsAdmin && organizationId === '00';
          const isAdminRole = claimsIsAdmin && organizationId !== '00' && organizationId !== '0';
          navigate(isSuperAdmin ? '/performance' : isAdminRole ? '/dashboard' : '/dashboard/partner', { replace: true });
        } catch {
          const userStr = localStorage.getItem('user');
          const isAdmin = userStr ? JSON.parse(userStr).role === 'admin' : false;
          navigate(isAdmin ? '/dashboard' : '/dashboard/partner', { replace: true });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const navigateWithTransition = (to: string, direction: 'left' | 'right') => {
    if (isLeaving) return;
    setLeaveDirection(direction);
    setIsLeaving(true);
    window.setTimeout(() => navigate(to), 220);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await api.post<{
        token?: string;
        refresh_token?: string;
        user?: { role?: string };
        fullname?: string;
        email?: string;
        avatar?: string;
        username?: string;
      }>(
        '/auth/login',
        { email: formData.email, password: formData.password }
      );
      if (res.status === 'success') {
        toast({
          title: 'Login berhasil',
          description: 'Selamat datang kembali!',
          duration: 5000,
        });
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('isLoggedIn', 'true');
          if (res.data.refresh_token) {
            localStorage.setItem('refresh_token', res.data.refresh_token);
          }
          try {
            const payloadStr = res.data.token.split('.')[1];
            const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const claims = JSON.parse(atob(padded)) as {
              fullname?: string;
              username?: string;
              name?: string;
              email?: string;
              role?: string;
              user_role?: string;
              is_admin?: boolean;
              isAdmin?: boolean;
              organization_name?: string;
              organization_id?: string;
            };

            const name = res.data?.fullname ?? claims.fullname ?? res.data?.username ?? claims.username ?? claims.name ?? '';
            const email = res.data?.email ?? claims.email ?? '';
            const claimsIsAdmin = claims.is_admin ?? false;
            const organizationId = claims.organization_id ?? '';
            const isSuperAdmin = claimsIsAdmin && organizationId === '00';
            const isAdminRole = claimsIsAdmin && organizationId !== '00' && organizationId !== '0';
            let userRole = 'Members';
            if (isSuperAdmin) {
              userRole = 'SuperAdmin';
            } else if (isAdminRole) {
              userRole = 'Admin';
            }
            const avatar = res.data?.avatar ?? '';
            const username = res.data?.username ?? claims.username ?? '';

            localStorage.setItem('user', JSON.stringify({ name, email, role: userRole, avatar, username, isSuperAdmin, isAdmin: isAdminRole }));

            const redirectPath = localStorage.getItem('redirect_path');
            if (redirectPath) {
              localStorage.removeItem('redirect_path');
              navigate(redirectPath);
            } else {
              navigate(isSuperAdmin ? '/performance' : '/dashboard');
            }
            return;
          } catch {
            void 0;
          }
        }
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }

        const redirectPath = localStorage.getItem('redirect_path');
        if (redirectPath) {
          localStorage.removeItem('redirect_path');
          navigate(redirectPath);
        } else {
          navigate('/dashboard/partner');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk dan kelola operasional hari ini"
      cardClassName="min-h-[520px] sm:min-h-[540px] lg:min-h-[560px] flex flex-col"
      contentWrapperClassName={`transition-[opacity,transform] duration-300 ease-out ${
        entered && !isLeaving
          ? 'opacity-100 translate-x-0'
          : `opacity-0 ${leaveDirection === 'right' ? 'translate-x-3' : '-translate-x-3'}`
      }`}
    >
      <form id="login-form" onSubmit={handleSubmit} className="flex flex-1 flex-col mt-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                className="pl-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                className="pl-11 pr-11 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-2xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))}
                className="bg-transparent data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-300">
                Ingat saya
              </label>
            </div>
            <Link to="/auth/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:no-underline font-semibold">
              Lupa password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold rounded-3xl shadow-lg bg-[#3B5BDB] hover:bg-[#2B4BC0]"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                Masuk
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative bg-white dark:bg-gray-800 px-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">atau</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum punya akun?{' '}
              <Link
                to="/auth/register"
                onClick={(e) => {
                  e.preventDefault();
                  navigateWithTransition('/auth/register', 'left');
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:no-underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};