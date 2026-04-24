import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { isTokenValid } from '@/lib/utils';
import travegoLightLogo from '@/assets/general/travego-light.png';
import travegoLogo from '@/assets/general/travego.svg';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; role: string; avatar?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token && isTokenValid(token)) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const heroBottomThreshold = Math.max(window.innerHeight - 96, 320);
      setIsScrolled(window.scrollY >= heroBottomThreshold);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateDarkMode = () => setIsDarkMode(root.classList.contains('dark'));

    updateDarkMode();
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Fitur', href: '/services' },
    { name: 'Team', href: '/team' },
    { name: 'Kontak', href: '/contact' },
  ];

  const isActive = (href: string) => location.pathname === href;
  const isLightTop = !isDarkMode && !isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 [font-family:Inter,sans-serif] ${
        isScrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-gray-800/70 shadow-xl shadow-slate-900/5'
          : 'bg-transparent dark:bg-black/95 backdrop-blur-md dark:border-gray-800/40'
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={isDarkMode ? travegoLightLogo : isScrolled ? travegoLogo : travegoLightLogo} alt="TraveGO" className="h-8 w-auto transition-all duration-500" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? isScrolled
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'bg-white/20 text-white shadow-sm'
                    : isScrolled
                      ? 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Theme Toggle and Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <div className={isLightTop ? 'text-white [&_button]:border-white/30 [&_button]:text-white [&_button]:hover:bg-white/10' : 'text-slate-900'}>
            <ThemeToggle />
          </div>
          {user ? (
            <>
              <Link to="/dashboard/partner">
                <Button
                  variant="outline"
                  size="icon"
                  className={`!h-10 !w-10 rounded-xl border hover:-translate-y-0.5 ${
                    isLightTop
                      ? 'border-white/40 bg-white/10 hover:bg-white/20'
                      : 'border-slate-200/80 bg-white/80 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900'
                  }`}
                  title="Dashboard"
                >
                  <LayoutDashboard className={`h-5 w-5 ${isLightTop ? 'text-white' : 'text-gray-700 dark:text-white'}`} />
                </Button>
              </Link>
              <Link to="/myprofile">
                <Button
                  variant="outline"
                  size="icon"
                  className={`!h-10 !w-10 rounded-xl border hover:-translate-y-0.5 ${
                    isLightTop
                      ? 'border-white/40 bg-white/10 hover:bg-white/20'
                      : 'border-slate-200/80 bg-white/80 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900'
                  }`}
                >
                  <User className={`h-5 w-5 ${isLightTop ? 'text-white' : 'text-gray-700 dark:text-white'}`} />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button
                  variant="outline"
                  className={`rounded-xl px-5 transition-all duration-300 hover:-translate-y-0.5 ${
                    isLightTop
                      ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
                      : 'text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900'
                  }`}
                >
                  Login
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="rounded-xl bg-blue-600 px-5 text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500">
                  Coba Gratis
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <div className={isLightTop ? 'text-white [&_button]:border-white/30 [&_button]:text-white [&_button]:hover:bg-white/10' : 'text-slate-900'}>
            <ThemeToggle />
          </div>
          {!user && (
            <Link to="/auth/register">
              <Button size="sm" className="rounded-xl bg-blue-600 px-4 text-white">
                Coba Gratis
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-xl ${isLightTop ? 'text-white hover:bg-white/10 hover:text-white' : 'text-slate-900'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/70 dark:border-gray-700/70">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200/70 dark:border-gray-700/70">
                <div className="flex flex-col space-y-2">
                  {user ? (
                    <>
                      <Link to="/dashboard/partner" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full rounded-xl mb-2">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/myprofile" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full rounded-xl">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-4 w-4 mr-2 rounded-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 mr-2" />
                          )}
                          Profil Saya
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full rounded-xl">
                          Login
                        </Button>
                      </Link>
                      <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                        <Button size="sm" className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white">
                          Coba Gratis
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
