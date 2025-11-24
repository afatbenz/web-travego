import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Fitur', href: '/services' },
    { name: 'Team', href: '/team' },
    { name: 'Kontak', href: '/contact' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-800/50 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Theme Toggle and Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/myorders">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="!w-auto !h-auto p-2 border-2 border-gray-100 dark:border-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <ShoppingBag className="h-5 w-5 text-gray-700 dark:text-white" />
                  </Button>
                </Link>
                <Link to="/myprofile">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="!w-auto !h-auto p-2 border-2 border-gray-100 dark:border-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <User className="h-5 w-5 text-gray-700 dark:text-white" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-2">
                  {user ? (
                    <>
                      <Link to="/myorders" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Pesanan Saya
                        </Button>
                      </Link>
                      <Link to="/myprofile" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Profil Saya
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
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