import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthLayout } from './AuthLayout';
import { authenticateUser } from '@/data/dummyUsers';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted:', formData);
    
    // Authenticate user
    const user = authenticateUser(formData.email, formData.password);
    
    if (user) {
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/welcome');
      }
    } else {
      alert('Email atau password salah!');
    }
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk ke akun TraveGO Anda"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
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
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 h-12"
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
              }
              className="bg-transparent data-[state=checked]:bg-transparent data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-300">
              Ingat saya
            </label>
          </div>
          <Link
            to="/auth/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Lupa password?
          </Link>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
          Masuk
        </Button>

        <div className="text-center">
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

        {/* Dummy Users Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Dummy Users untuk Testing:
          </h4>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <div><strong>Admin:</strong> admin@TraveGO.com / admin123</div>
            <div><strong>User:</strong> user@TraveGO.com / user123</div>
            <div><strong>User 2:</strong> john.doe@email.com / john123</div>
            <div><strong>User 3:</strong> sarah.wilson@email.com / sarah123</div>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};