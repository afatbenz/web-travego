import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import travegoLogo from '@/assets/general/travego.svg';

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
      
      <div className="flex min-h-screen w-full py-4 sm:py-6 lg:py-8">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-4 lg:px-8 xl:px-12 2xl:px-16 py-4 lg:py-0">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Logo */}
            <div className="text-center mb-4 sm:mb-5 lg:mb-6">
              <Link to="/" className="inline-flex items-center space-x-2">
                <img
                  src={travegoLogo}
                  alt="TraveGO"
                  className="h-7 sm:h-9 lg:h-11 w-auto"
                />
              </Link>
            </div>

            {/* Auth Card */}
            <Card className="p-3 sm:p-4 lg:p-6 xl:p-8 shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 overflow-hidden">
              <div className="mb-3 sm:mb-4 lg:mb-6 text-center">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {subtitle}
                </p>
              </div>

              {children}
            </Card>

            {/* Footer */}
            <div className="mt-2 sm:mt-3 lg:mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <p>
                &copy; 2025 TraveGO. All rights reserved.
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};
