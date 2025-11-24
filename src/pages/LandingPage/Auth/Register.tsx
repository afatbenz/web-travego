import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthLayout } from './AuthLayout';

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
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
    
    if (formData.password !== formData.confirmPassword) {
      alert('Password tidak sama!');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Harap menyetujui syarat dan ketentuan');
      return;
    }

    console.log('Register attempted:', formData);
    // Simulate registration success
    navigate('/auth/login');
  };

  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Bergabunglah dengan TraveGO untuk pengalaman perjalanan terbaik"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                value={formData.fullName}
                onChange={handleInputChange}
                className="pl-10 h-12"
              />
            </div>
          </div>

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
            <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nomor Telefon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+62 812 3456 7890"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <div className="mt-1">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
              }
              className="cursor-pointer bg-transparent data-[state=checked]:bg-transparent data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600"
            />
          </div>
          <label 
            htmlFor="acceptTerms" 
            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1 select-none"
          >
            Saya menyetujui{' '}
            <Link 
              to="/terms" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Syarat dan Ketentuan
            </Link>
            {' '}serta{' '}
            <Link 
              to="/privacy" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Kebijakan Privasi
            </Link>
            {' '}TraveGO
          </label>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
          Daftar Sekarang
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};