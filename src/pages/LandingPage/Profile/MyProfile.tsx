import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Star, 
  Edit,
  ChevronRight,
  Award,
  ShoppingBag,
  Gift,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data - in real app, this would come from API
const userProfile = {
  id: 1,
  name: "Ahmad Rizki",
  email: "ahmad.rizki@email.com",
  phone: "+62 812-3456-7890",
  address: "Jl. Sudirman No. 123, RT 05/RW 02, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310",
  birthDate: "1995-03-15",
  joinDate: "2023-06-15",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  totalOrders: 8,
  totalSpent: "Rp 15.500.000",
  points: 1250,
  favoriteDestination: "Bangkok, Thailand"
};

export const MyProfile: React.FC = () => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profil Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Kelola informasi profil dan riwayat pemesanan Anda
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300"
              onClick={handleEditProfile}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profil
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informasi Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-start space-x-4">
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {userProfile.name}
                      </h2>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Mail className="h-4 w-4 mr-2" />
                          {userProfile.email}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Phone className="h-4 w-4 mr-2" />
                          {userProfile.phone}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2" />
                          {userProfile.address}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          Tanggal Lahir: {formatDate(userProfile.birthDate)}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          Bergabung {formatDate(userProfile.joinDate)}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2" />
                          Destinasi favorit: {userProfile.favoriteDestination}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle>Statistik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {userProfile.totalOrders}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Total Pemesanan
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {userProfile.totalSpent}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Total Pengeluaran
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Award className="h-5 w-5 text-purple-500 mr-1" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.points.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Poin Reward
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="text-xl font-bold text-gray-900 dark:text-white">4.8</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Rating Rata-rata
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Menu List Section */}
          <Card>
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {/* Pesanan Saya */}
                <button
                  onClick={() => navigate('/myorders')}
                  className="w-full flex items-center justify-between p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pesanan Saya</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Lihat riwayat pemesanan</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Promo dan Discount */}
                <button
                  onClick={() => navigate('/promo-discount')}
                  className="w-full flex items-center justify-between p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Promo dan Discount</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Kode promo dan diskon</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Kode Referral */}
                <button
                  onClick={() => navigate('/referral')}
                  className="w-full flex items-center justify-between p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Kode Referral</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Bagikan kode referral Anda</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Keluar */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Keluar</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Logout dari akun Anda</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};