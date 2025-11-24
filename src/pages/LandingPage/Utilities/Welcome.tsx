import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Car, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleViewCatalog = () => {
    navigate('/catalog');
  };

  const handleViewArmada = () => {
    navigate('/armada');
  };

  const handleViewProfile = () => {
    navigate('/myprofile');
  };

  const handleViewOrders = () => {
    navigate('/myorders');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
        <div className="text-center">
          {/* Welcome Message */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Selamat Datang di TraveGO
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Tentukan perjalananmu bersama kami
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleViewCatalog}>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <Package className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Lihat Katalog
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Jelajahi paket wisata terbaik dengan harga menarik
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Lihat Katalog
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleViewArmada}>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <Car className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Lihat Armada
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Pilih kendaraan terbaik untuk perjalanan Anda
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Lihat Armada
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleViewProfile}>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <User className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Profil Saya
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Kelola informasi profil dan pengaturan akun
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Profil Saya
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleViewOrders}>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <ShoppingBag className="h-16 w-16 text-orange-600 dark:text-orange-400 mx-auto group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Pesanan Saya
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Lihat riwayat pemesanan dan status pesanan
                </p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Pesanan Saya
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Destinasi Terbaik
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Nikmati perjalanan ke destinasi wisata terpopuler
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Armada Nyaman
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Kendaraan terawat dengan driver berpengalaman
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Paket Lengkap
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Semua kebutuhan perjalanan dalam satu paket
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
