import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

// Sample data - in real app, this would come from API
const sampleArmadaData = {
  id: 1,
  name: "Toyota Hiace Premio",
  type: "Minibus",
  capacity: "12-15 orang",
  price: "Rp 800.000",
  originalPrice: "Rp 1.000.000",
  image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
  features: [
    "AC",
    "Audio System",
    "Kursi empuk",
    "Driver berpengalaman",
    "Bahan bakar",
    "Parkir tol"
  ]
};

export const ArmadaCheckout: React.FC = () => {
  const navigate = useNavigate();
  
  // In real app, fetch data based on id
  const data = sampleArmadaData;

  const [formData, setFormData] = useState({
    // Nama dan kontak pemesan
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    
    // Tanggal dan jam
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    
    // Titik penjemputan
    pickupLocation: '',
    pickupAddress: '',
    
    // Tujuan
    destinations: [''],
    
    // Jumlah peserta
    participants: 1
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: Math.max(1, value)
    }));
  };

  const handleDestinationChange = (index: number, value: string) => {
    const newDestinations = [...formData.destinations];
    newDestinations[index] = value;
    setFormData(prev => ({
      ...prev,
      destinations: newDestinations
    }));
  };

  const addDestination = () => {
    setFormData(prev => ({
      ...prev,
      destinations: [...prev.destinations, '']
    }));
  };

  const removeDestination = (index: number) => {
    if (formData.destinations.length > 1) {
      const newDestinations = formData.destinations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        destinations: newDestinations
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Armada checkout data:', formData);
    // Handle checkout submission
    navigate(`/payment/armada/${data.id}`);
  };

  const calculateDays = () => {
    if (formData.pickupDate && formData.returnDate) {
      const pickup = new Date(formData.pickupDate);
      const returnDate = new Date(formData.returnDate);
      const diffTime = Math.abs(returnDate.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  const days = calculateDays();
  const basePrice = 800000;
  const totalPrice = basePrice * days;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Checkout Armada
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Nama dan Kontak Pemesan */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    1. Nama dan Kontak Pemesan
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Lengkap *
                      </label>
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contoh@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomor Telepon *
                      </label>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="08xxxxxxxxxx"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kontak Darurat
                      </label>
                      <Input
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        placeholder="Nomor telepon darurat"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Tanggal dan Jam */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    2. Tanggal dan Jam
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Tanggal Penjemputan *
                      </label>
                      <Input
                        name="pickupDate"
                        type="date"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock className="inline h-4 w-4 mr-2" />
                        Jam Penjemputan *
                      </label>
                      <Input
                        name="pickupTime"
                        type="time"
                        value={formData.pickupTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Tanggal Kembali *
                      </label>
                      <Input
                        name="returnDate"
                        type="date"
                        value={formData.returnDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  {formData.pickupDate && formData.returnDate && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Durasi sewa: <span className="font-semibold">{days} hari</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3. Titik Penjemputan */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    3. Titik Penjemputan
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="inline h-4 w-4 mr-2" />
                        Lokasi Penjemputan *
                      </label>
                      <Input
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        placeholder="Contoh: Hotel Grand Indonesia, Jakarta"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alamat Lengkap
                      </label>
                      <Textarea
                        name="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={handleInputChange}
                        placeholder="Masukkan alamat lengkap untuk penjemputan"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Tujuan */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    4. Tujuan
                  </h2>
                  
                  <div className="space-y-4">
                    {formData.destinations.map((destination, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tujuan {index + 1} *
                          </label>
                          <Input
                            value={destination}
                            onChange={(e) => handleDestinationChange(index, e.target.value)}
                            placeholder="Masukkan tujuan"
                            required
                          />
                        </div>
                        {formData.destinations.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDestination(index)}
                            className="mt-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDestination}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Tujuan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 5. Jumlah Peserta */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    5. Jumlah Peserta
                  </h2>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        <Users className="inline h-4 w-4 mr-2" />
                        Jumlah Peserta *
                      </label>
                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNumberChange('participants', formData.participants - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold w-16 text-center">
                          {formData.participants}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNumberChange('participants', formData.participants + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Kapasitas maksimal: {data.capacity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" size="lg" className="px-8">
                  Lanjutkan Pembayaran
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ringkasan Pesanan
                  </h3>
                  
                  {/* Armada Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img
                      src={data.image}
                      alt={data.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {data.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.type} • {data.capacity}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Harga per hari
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {data.price}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Durasi sewa
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {days} hari
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Jumlah peserta
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formData.participants} orang
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-3">
                      <span className="text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Rp {totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Termasuk:
                    </h4>
                    <div className="space-y-1">
                      {data.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Destinations */}
                  {formData.destinations.some(dest => dest.trim() !== '') && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Tujuan:
                      </h4>
                      <div className="space-y-1">
                        {formData.destinations
                          .filter(dest => dest.trim() !== '')
                          .map((destination, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                              {destination}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
