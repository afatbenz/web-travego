import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

// Sample data - in real app, this would come from API
const sampleCatalogData = {
  id: 1,
  title: "Thailand Bangkok Tour Package - 4 Days 3 Nights",
  price: "Rp 2.500.000",
  originalPrice: "Rp 3.000.000",
  image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
  duration: "4 Days 3 Nights",
  location: "Bangkok, Thailand",
  features: [
    "Hotel bintang 4",
    "Transportasi AC",
    "Guide berbahasa Indonesia",
    "Makan sesuai itinerary",
    "Tiket masuk semua tempat wisata",
    "Airport transfer"
  ],
  additionalFacilities: [
    "Asuransi perjalanan",
    "SIM card Thailand",
    "Porter service",
    "Upgrade kamar hotel",
    "Makanan halal khusus",
    "Fotografer profesional"
  ]
};

export const CatalogCheckout: React.FC = () => {
  const navigate = useNavigate();
  
  // In real app, fetch data based on id
  const data = sampleCatalogData;

  const [formData, setFormData] = useState({
    // Nama dan Kontak Pemesan
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    
    // Tanggal Wisata
    travelDate: '',
    pickupTime: '',
    
    // Jumlah peserta
    participants: 1,
    organizers: 0,
    
    // Fasilitas tambahan
    additionalFacilities: [] as string[],
    
    // Titik penjemputan
    pickupLocation: '',
    pickupAddress: '',
    pickupNotes: ''
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
      [name]: Math.max(0, value)
    }));
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      additionalFacilities: prev.additionalFacilities.includes(facility)
        ? prev.additionalFacilities.filter(f => f !== facility)
        : [...prev.additionalFacilities, facility]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Checkout data:', formData);
    // Handle checkout submission
    navigate(`/payment/catalog/${data.id}`);
  };

  const totalParticipants = formData.participants + formData.organizers;
  const basePrice = 2500000;
  const totalPrice = basePrice * totalParticipants;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <PageHeader
        title="Checkout Paket Wisata"
        maxWidth="6xl"
        className="py-4"
      />

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

              {/* 2. Tanggal Wisata */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    2. Tanggal Wisata
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Tanggal Keberangkatan *
                      </label>
                      <Input
                        name="travelDate"
                        type="date"
                        value={formData.travelDate}
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
                  </div>
                </CardContent>
              </Card>

              {/* 3. Jumlah Peserta */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    3. Jumlah Peserta
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Users className="inline h-4 w-4 mr-2" />
                        Jumlah Peserta *
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNumberChange('participants', formData.participants - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-medium w-12 text-center">
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
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Jumlah Panitia
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNumberChange('organizers', formData.organizers - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-medium w-12 text-center">
                          {formData.organizers}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleNumberChange('organizers', formData.organizers + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Total peserta: <span className="font-semibold">{totalParticipants} orang</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Fasilitas Tambahan */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    4. Fasilitas Tambahan (Opsional)
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.additionalFacilities.map((facility) => (
                      <div
                        key={facility}
                        onClick={() => handleFacilityToggle(facility)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.additionalFacilities.includes(facility)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.additionalFacilities.includes(facility)}
                            onChange={() => {}}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {facility}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Titik Penjemputan */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    5. Titik Penjemputan
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Catatan Khusus
                      </label>
                      <Textarea
                        name="pickupNotes"
                        value={formData.pickupNotes}
                        onChange={handleInputChange}
                        placeholder="Catatan khusus untuk tim penjemputan"
                        rows={2}
                      />
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
                  
                  {/* Package Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img
                      src={data.image}
                      alt={data.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                        {data.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.duration} • {data.location}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Harga per orang
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {data.price}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Jumlah peserta
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {totalParticipants} orang
                      </span>
                    </div>
                    
                    {formData.additionalFacilities.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Fasilitas tambahan:
                        </p>
                        {formData.additionalFacilities.map((facility) => (
                          <div key={facility} className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                              {facility}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              +Rp 50.000
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
