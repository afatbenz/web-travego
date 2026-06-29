import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import travegoLogo from '@/assets/general/travego.svg';
import travegoLogoLight from '@/assets/general/travego-light.png';
import authBackground from '@/assets/auth/3d-auth.png';
import { cn } from '@/lib/utils';
import { Shield, Zap, BarChart3 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  belowCard?: React.ReactNode;
  cardClassName?: string;
  belowCardClassName?: string;
  contentWrapperClassName?: string;
  leftPanelContent?: React.ReactNode;
  leftPanelClassName?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, belowCard, cardClassName, belowCardClassName, contentWrapperClassName, leftPanelContent, leftPanelClassName }) => {
  const defaultLeftPanel = (
    <div className="flex flex-col h-full relative overflow-hidden w-full" style={{ 
      backgroundImage: `url(${authBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,20,60,0.75), rgba(10,20,60,0.5))' }}></div>

      <div className="flex flex-col justify-between h-full relative z-10">
        <div className="pt-10 pl-10">
          <Link to="/" className="inline-flex items-center mb-6">
            <img src={travegoLogoLight} alt="TraveGO" className="h-8 w-auto" />
          </Link>
          <h2 className="text-2xl sm:text-3xl xl:text-5xl font-bold text-white leading-loose mb-3">
            Kelola Bisnis Transportasi<br />Dari Mana Saja.
          </h2>
          <div className="w-20 h-[3px] bg-orange-500 my-3"></div>
          <p className="text-xl text-white/70 max-w-lg leading-relaxed">
            Sistem operasional travel modern untuk pengelolaan yang lebih efisien.
          </p>
        </div>

        <div className="pb-8 pl-10 pr-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Shield, label: 'Aman & Terpercaya' },
              { icon: Zap, label: 'Cepat & Efisien' },
              { icon: BarChart3, label: 'Laporan Real-time' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <Icon className="h-5 w-5 text-blue-200 mx-auto mb-1.5" />
                <p className="text-[10px] sm:text-xs text-white font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full">
      {/* ============ DESKTOP LAYOUT (min-width: 769px) ============ */}
      <div className="hidden lg:block">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="flex min-h-screen w-full flex-col lg:flex-row">
          <div className={`order-first lg:order-first w-full lg:w-[43%] h-screen hidden lg:flex ${leftPanelClassName || ''}`}>
            {leftPanelContent || defaultLeftPanel}
          </div>

          <div className="order-last lg:order-last w-full lg:w-[57%]" style={{ backgroundColor: '#F0F2F5' }}>
            <div className="flex min-h-screen w-full items-start lg:items-center justify-center px-6 lg:px-10 xl:px-16 py-8 lg:py-10">
              <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
                <div className={cn(contentWrapperClassName)}>
                  <Card
                    className={cn(
                      'p-5 sm:p-6 lg:p-8 shadow-2xl bg-white dark:bg-gray-800 border-0 rounded-3xl overflow-hidden',
                      cardClassName
                    )}
                  >
                    <div className="mb-3 sm:mb-4 lg:mb-6 text-center">
                      <Link to="/" className="inline-flex items-center space-x-2 mb-3">
                        <img
                          src={travegoLogo}
                          alt="TraveGO"
                          className="h-8 sm:h-9 lg:h-10 w-auto"
                        />
                      </Link>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                        {title}
                      </h1>
                      <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-500 dark:text-gray-400 whitespace-pre-line mt-0">
                        {subtitle}
                      </p>
                    </div>

                    {children}
                  </Card>

                  {belowCard && <div className={cn('mt-4', belowCardClassName)}>{belowCard}</div>}
                </div>

                <div className="mt-4 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                  <p>&copy; {new Date().getFullYear()} TraveGO. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT (max-width: 768px) ============ */}
      <div className="lg:hidden fixed inset-0 w-screen h-screen overflow-y-auto mobile-bg">
        <div className="relative min-h-screen flex flex-col">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${authBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,20,70,0.85) 0%, rgba(10,20,70,0.6) 40%, rgba(10,20,70,0.92) 100%)'
            }}
          />

          <div className="absolute top-4 right-4 z-30">
            <ThemeToggle />
          </div>

          {/* Top section: Logo + Tagline */}
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center pt-10 px-6">
            <Link to="/" className="inline-flex items-center">
              <img src={travegoLogo} alt="TraveGO" className="h-10 w-auto" />
            </Link>
            <p className="mt-3 text-sm text-white/70 text-center">
              Kelola perjalanan dengan mudah.
            </p>
          </div>

          {/* Floating Card Form */}
          <div className="relative z-20 flex-1 mx-4 mt-6 mb-6">
            <Card
              className={cn(
                'p-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border-0',
                cardClassName
              )}
            >
              <div className="mb-5 text-center">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                  {title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              </div>

              <div className={cn(contentWrapperClassName)}>
                {children}
              </div>
            </Card>

            {belowCard && <div className={cn('mt-4', belowCardClassName)}>{belowCard}</div>}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex-shrink-0 pb-6">
            <p className="text-center text-xs text-white/50">
              &copy; {new Date().getFullYear()} TraveGO. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
