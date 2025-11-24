import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Car, User, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const AddSchedule: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleType: '',
    orderId: '',
    drivers: [] as string[],
    crew: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sample data for dropdowns
  const vehicleTypes = [
    'Toyota Hiace Premio',
    'Innova Reborn',
    'Fortuner 4x4',
    'Elf Long',
    'Avanza Veloz',
    'Grand Max'
  ];

  const availableDrivers = [
    'Ahmad Rizki',
    'Siti Nurhaliza',
    'Budi Santoso',
    'Dewi Kartika',
    'Rizki Pratama',
    'Maya Sari',
    'Joko Widodo',
    'Sri Mulyani'
  ];

  const availableCrew = [
    'Andi Susanto',
    'Budi Hartono',
    'Citra Dewi',
    'Dedi Kurniawan',
    'Eka Putri',
    'Fajar Nugroho',
    'Gita Sari',
    'Hendra Wijaya'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleType.trim()) newErrors.vehicleType = 'Jenis kendaraan wajib diisi';
    if (!formData.orderId.trim()) newErrors.orderId = 'Order ID wajib diisi';
    if (formData.drivers.length === 0) newErrors.drivers = 'Minimal 1 driver harus dipilih';
    if (formData.crew.length === 0) newErrors.crew = 'Minimal 1 crew harus dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission
      console.log('Form submitted:', formData);
      // In real app, this would make API call
      navigate('/dashboard/team/schedule-armada');
    }
  };

  const handleGenerateSuratJalan = () => {
    if (validateForm()) {
      // Handle generate surat jalan
      console.log('Generate Surat Jalan for:', formData);
      // In real app, this would generate and download the document
      alert('Surat Jalan berhasil digenerate!');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addDriver = (driver: string) => {
    if (!formData.drivers.includes(driver)) {
      setFormData(prev => ({
        ...prev,
        drivers: [...prev.drivers, driver]
      }));
    }
  };

  const removeDriver = (driver: string) => {
    setFormData(prev => ({
      ...prev,
      drivers: prev.drivers.filter(d => d !== driver)
    }));
  };

  const addCrew = (crewMember: string) => {
    if (!formData.crew.includes(crewMember)) {
      setFormData(prev => ({
        ...prev,
        crew: [...prev.crew, crewMember]
      }));
    }
  };

  const removeCrew = (crewMember: string) => {
    setFormData(prev => ({
      ...prev,
      crew: prev.crew.filter(c => c !== crewMember)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/team/schedule-armada')}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tambah Jadwal Armada
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Tambahkan jadwal baru untuk armada
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Jenis Kendaraan *
                  </label>
                  <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger className={errors.vehicleType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih jenis kendaraan" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleType && <p className="text-sm text-red-500 mt-1">{errors.vehicleType}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Order ID *
                  </label>
                  <Input
                    value={formData.orderId}
                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                    placeholder="Masukkan Order ID"
                    className={errors.orderId ? 'border-red-500' : ''}
                  />
                  {errors.orderId && <p className="text-sm text-red-500 mt-1">{errors.orderId}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Pilih Driver *
                </label>
                <Select onValueChange={addDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers
                      .filter(driver => !formData.drivers.includes(driver))
                      .map((driver) => (
                        <SelectItem key={driver} value={driver}>
                          {driver}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.drivers && <p className="text-sm text-red-500 mt-1">{errors.drivers}</p>}
              </div>

              {formData.drivers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Driver Terpilih
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.drivers.map((driver) => (
                      <Badge key={driver} variant="secondary" className="flex items-center space-x-1">
                        <span>{driver}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeDriver(driver)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crew Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Crew
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Pilih Crew *
                </label>
                <Select onValueChange={addCrew}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCrew
                      .filter(crewMember => !formData.crew.includes(crewMember))
                      .map((crewMember) => (
                        <SelectItem key={crewMember} value={crewMember}>
                          {crewMember}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.crew && <p className="text-sm text-red-500 mt-1">{errors.crew}</p>}
              </div>

              {formData.crew.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Crew Terpilih
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.crew.map((crewMember) => (
                      <Badge key={crewMember} variant="secondary" className="flex items-center space-x-1">
                        <span>{crewMember}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCrew(crewMember)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            * Wajib diisi
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/team/schedule-armada')}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateSuratJalan}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Surat Jalan
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Simpan Jadwal
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
