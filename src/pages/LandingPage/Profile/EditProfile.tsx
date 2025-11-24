import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data - in real app, this would come from API
const initialUserData = {
  id: 1,
  name: "Ahmad Rizki",
  email: "ahmad.rizki@email.com",
  phone: "+62 812-3456-7890",
  address: "Jl. Sudirman No. 123, RT 05/RW 02, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310",
  birthDate: "1995-03-15",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
};

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: ''
  });
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user data from localStorage or API
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate || ''
      });
      setAvatar(user.avatar || initialUserData.avatar);
    } else {
      // Fallback to initial data
      setFormData({
        name: initialUserData.name,
        email: initialUserData.email,
        phone: initialUserData.phone,
        address: initialUserData.address,
        birthDate: initialUserData.birthDate
      });
      setAvatar(initialUserData.avatar);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user data in localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = {
          ...user,
          ...formData,
          avatar
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Show success message (you can use toast here)
      alert('Profil berhasil diperbarui!');
      navigate('/myprofile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Terjadi kesalahan saat memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Profil
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Perbarui informasi profil Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Foto Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Ganti Foto
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Format: JPG, PNG. Maksimal 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nama Lengkap
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nomor Telepon
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="birthDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tanggal Lahir
                  </label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alamat Lengkap
                </label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="px-8"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
