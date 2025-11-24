import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

// Sample data - in real app, this would come from API
const sampleCatalogData = {
  id: 1,
  title: "Thailand Bangkok Tour Package - 4 Days 3 Nights",
  price: "Rp 2.500.000",
  originalPrice: "Rp 3.000.000",
  image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
  duration: "4 Days 3 Nights",
  location: "Bangkok, Thailand"
};

const sampleArmadaData = {
  id: 1,
  name: "Toyota Hiace Premio",
  type: "Minibus",
  capacity: "12-15 orang",
  price: "Rp 800.000",
  originalPrice: "Rp 1.000.000",
  image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop",
  location: "Jakarta"
};

export const CustomOrder: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string; id: string }>();
  
  // Get data based on type
  const data = type === 'catalog' ? sampleCatalogData : sampleArmadaData;
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    pickupPoint: '',
    destinations: [''],
    pax: '',
    requestDetails: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    console.log('Custom order submitted:', formData);
    // Handle form submission logic here
    alert('Custom order berhasil diajukan! Tim kami akan menghubungi Anda dalam 1x24 jam.');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <PageHeader
        title="Ajukan Custom Order"
        subtitle="Isi form di bawah ini untuk mengajukan permintaan custom order"
        maxWidth="6xl"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Package/Armada Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Informasi {type === 'catalog' ? 'Paket' : 'Armada'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <img
                      src={data.image}
                      alt={type === 'catalog' ? (data as any).title : (data as any).name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {type === 'catalog' ? (data as any).title : (data as any).name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {type === 'catalog' ? (data as any).duration : (data as any).type} • {data.location}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {data.price}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Tanggal Perjalanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tanggal Mulai
                      </label>
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tanggal Berakhir
                      </label>
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pickup Point */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Titik Jemput
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alamat Lengkap Titik Jemput
                    </label>
                    <Input
                      name="pickupPoint"
                      value={formData.pickupPoint}
                      onChange={handleInputChange}
                      placeholder="Masukkan alamat lengkap titik jemput"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Tujuan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.destinations.map((destination, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={destination}
                          onChange={(e) => handleDestinationChange(index, e.target.value)}
                          placeholder={`Tujuan ${index + 1}`}
                          required
                          className="flex-1"
                        />
                        {formData.destinations.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDestination(index)}
                            className="px-2"
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

              {/* Number of Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Jumlah Peserta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jumlah Pax
                    </label>
                    <Input
                      type="number"
                      name="pax"
                      value={formData.pax}
                      onChange={handleInputChange}
                      placeholder="Masukkan jumlah peserta"
                      min="1"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detail Permintaan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jelaskan detail permintaan custom order Anda
                    </label>
                    <Textarea
                      name="requestDetails"
                      value={formData.requestDetails}
                      onChange={handleInputChange}
                      placeholder="Contoh: Ingin menambah destinasi tertentu, request makanan halal, kebutuhan khusus, dll."
                      rows={4}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Batal
                </Button>
                <Button type="submit" size="lg" className="px-8">
                  Ajukan Custom Order
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Ringkasan Permintaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Package/Armada Info */}
                <div className="flex items-center space-x-3">
                  <img
                    src={data.image}
                    alt={type === 'catalog' ? (data as any).title : (data as any).name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {type === 'catalog' ? (data as any).title : (data as any).name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {type === 'catalog' ? (data as any).duration : (data as any).type}
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tanggal Mulai:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.startDate || 'Belum dipilih'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tanggal Berakhir:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.endDate || 'Belum dipilih'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Jumlah Pax:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.pax || 'Belum diisi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Jumlah Tujuan:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.destinations.filter(d => d.trim()).length}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Catatan:</strong> Tim kami akan menghubungi Anda dalam 1x24 jam untuk konfirmasi dan penawaran harga.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
