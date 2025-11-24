import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full">
      {/* Full width background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 -z-10"></div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="flex h-screen w-full py-2 sm:py-4 lg:py-6 xl:py-8">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 lg:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Logo */}
            <div className="text-center mb-2 sm:mb-3 lg:mb-4">
              <Link to="/" className="inline-flex items-center space-x-2">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 dark:text-blue-400" />
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>
                </span>
              </Link>
            </div>

            {/* Auth Card */}
            <Card className="p-3 sm:p-4 lg:p-6 xl:p-8 shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 overflow-hidden">
              <div className="mb-3 sm:mb-4 lg:mb-6 text-center">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-600 dark:text-gray-300">
                  {subtitle}
                </p>
              </div>

              {children}
            </Card>

            {/* Footer */}
            <div className="mt-2 sm:mt-3 lg:mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <p>
                &copy; 2025 <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Visual/Info (Desktop only) */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center max-w-lg xl:max-w-xl">
            <div className="mb-4 xl:mb-6 2xl:mb-8">
              <div className="w-24 h-24 xl:w-32 xl:h-32 2xl:w-40 2xl:h-40 mx-auto mb-4 xl:mb-6 2xl:mb-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <MapPin className="h-12 w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900 dark:text-white mb-3 xl:mb-4 2xl:mb-6">
                Jelajahi Indonesia
              </h2>
              <p className="text-sm xl:text-base 2xl:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Temukan pengalaman perjalanan terbaik dengan layanan transportasi dan wisata berkualitas tinggi di seluruh Indonesia.
              </p>
            </div>
            
            <div className="space-y-4 xl:space-y-6 2xl:space-y-8">
              <div className="flex items-center space-x-3 xl:space-x-4 2xl:space-x-6 text-left">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-sm xl:text-base 2xl:text-lg">✓</span>
                </div>
                <span className="text-sm xl:text-base 2xl:text-lg text-gray-700 dark:text-gray-300">Layanan Terpercaya & Berlisensi</span>
              </div>
              <div className="flex items-center space-x-3 xl:space-x-4 2xl:space-x-6 text-left">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm xl:text-base 2xl:text-lg">✓</span>
                </div>
                <span className="text-sm xl:text-base 2xl:text-lg text-gray-700 dark:text-gray-300">Support 24/7</span>
              </div>
              <div className="flex items-center space-x-3 xl:space-x-4 2xl:space-x-6 text-left">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm xl:text-base 2xl:text-lg">✓</span>
                </div>
                <span className="text-sm xl:text-base 2xl:text-lg text-gray-700 dark:text-gray-300">Harga Kompetitif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};