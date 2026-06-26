import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../LandingPage/Auth/AuthLayout';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  if (!token) {
    return (
      <AuthLayout title="Link Tidak Valid" subtitle="Link reset password Anda tidak valid atau sudah kadaluarsa">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-300">
              Link yang Anda gunakan tidak valid atau sudah kadaluarsa.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan minta link reset password baru.
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/auth/login" className="block">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Button>
            </Link>
          </div>
          <Link to="/auth/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:no-underline font-semibold">
            Minta link baru
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout title="Password Berhasil Diubah" subtitle="Password Anda telah berhasil diperbarui">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-300">
              Password Anda telah berhasil diubah.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan login dengan password baru Anda.
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/auth/login" className="block">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password baru tidak boleh kosong';
    } else if (password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak boleh kosong';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password dan konfirmasi password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/auth/update-password', {
        token,
        new_password: password,
        confirm_password: confirmPassword
      });
      if (res.status === 'success') {
        toast({
          title: 'Password berhasil diubah',
          description: 'Silakan login dengan password baru Anda.',
          duration: 5000,
        });
        setIsSuccess(true);
      }
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui password',
        description: error?.response?.data?.message || 'Link tidak valid atau sudah kadaluarsa.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Buat Password Baru"
      subtitle="Masukkan password baru Anda di bawah ini"
      contentWrapperClassName="animate-[fadeIn_0.5s_ease-out]"
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 pr-11 h-12 rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Konfirmasi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-11 pr-11 h-12 rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl mt-6" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memperbarui...
            </span>
          ) : (
            'Update Password'
          )}
        </Button>

        <div className="text-center pt-4">
          <Link
            to="/auth/login"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:no-underline font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
