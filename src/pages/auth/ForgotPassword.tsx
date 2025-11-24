import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../LandingPage/Auth/AuthLayout';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Reset password requested for:', email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Email Terkirim"
        subtitle="Periksa inbox email Anda"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-300">
              Kami telah mengirimkan link reset password ke email:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {email}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Silakan periksa inbox (atau folder spam) Anda dan ikuti instruksi yang diberikan.
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={() => setIsSubmitted(false)} className="w-full h-12">
              Kirim Ulang Email
            </Button>
            
            <Link to="/auth/login" className="block">
              <Button variant="outline" className="w-full h-12">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Lupa Password"
      subtitle="Masukkan email Anda untuk reset password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kami akan mengirimkan link reset password ke email ini
          </p>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
          Kirim Reset Password
        </Button>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Login
          </Link>
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Belum punya akun?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};