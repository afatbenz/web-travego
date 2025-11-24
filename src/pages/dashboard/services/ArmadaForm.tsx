import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const ArmadaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Sample data for edit mode
  const sampleData = {
    id: 1,
    name: 'Toyota Hiace Premio',
    type: 'Minibus',
    capacity: 15,
    year: 2022,
    engine: '2.5L Diesel',
    features: ['AC', 'Reclining seats', 'Audio system', 'Safety equipment'],
    pickupPoints: ['Jakarta', 'Bandung', 'Yogyakarta'],
    rentalPrices: [
      { duration: '1-3 hari', price: 200000, type: 'citytour' },
      { duration: '4-7 hari', price: 180000, type: 'overland' },
      { duration: '8+ hari', price: 160000, type: 'citytour' }
    ],
    addons: [
      { name: 'Driver', description: 'Driver profesional', price: 100000 },
      { name: 'Bahan Bakar', description: 'Full tank', price: 500000 }
    ],
    status: 'active',
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop'],
    description: 'Minibus nyaman untuk perjalanan jarak jauh dengan fasilitas lengkap.'
  };

  const [formData, setFormData] = useState({
    name: isEdit ? sampleData.name : '',
    type: isEdit ? sampleData.type : '',
    capacity: isEdit ? sampleData.capacity : 0,
    year: isEdit ? sampleData.year : new Date().getFullYear(),
    engine: isEdit ? sampleData.engine : '',
    features: isEdit ? sampleData.features : [''],
    pickupPoints: isEdit ? sampleData.pickupPoints : [],
    rentalPrices: isEdit ? sampleData.rentalPrices : [{ duration: '', price: 0, type: 'citytour' }],
    addons: isEdit ? sampleData.addons : [{ name: '', description: '', price: 0 }],
    status: isEdit ? sampleData.status : 'active',
    images: isEdit ? sampleData.images : [],
    description: isEdit ? sampleData.description : ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama armada wajib diisi';
    if (!formData.type.trim()) newErrors.type = 'Jenis armada wajib diisi';
    if (formData.capacity <= 0) newErrors.capacity = 'Kapasitas harus lebih dari 0';
    if (formData.year <= 0) newErrors.year = 'Tahun produksi harus valid';
    if (!formData.engine.trim()) newErrors.engine = 'Mesin wajib diisi';
    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (formData.images.length === 0) newErrors.images = 'Minimal 1 gambar wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission
      console.log('Form submitted:', formData);
      // In real app, this would make API call
      navigate('/dashboard/services/fleet');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const totalImages = formData.images.length + files.length;
      
      if (totalImages > 10) {
        alert('Maksimal 10 gambar');
        return;
      }

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            newImages.push(result);
            if (newImages.length === files.length) {
              setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addPickupPoint = () => {
    const input = document.querySelector('input[placeholder="Masukkan titik jemput"]') as HTMLInputElement;
    if (input && input.value.trim()) {
      const currentPoints = formData.pickupPoints;
      if (!currentPoints.includes(input.value.trim())) {
        setFormData(prev => ({
          ...prev,
          pickupPoints: [...prev.pickupPoints, input.value.trim()]
        }));
        input.value = '';
      }
    }
  };

  const removePickupPoint = (point: string) => {
    setFormData(prev => ({
      ...prev,
      pickupPoints: prev.pickupPoints.filter(p => p !== point)
    }));
  };

  const addRentalPrice = () => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: [...prev.rentalPrices, { duration: '', price: 0, type: 'citytour' }]
    }));
  };

  const removeRentalPrice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: prev.rentalPrices.filter((_, i) => i !== index)
    }));
  };

  const updateRentalPrice = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      rentalPrices: prev.rentalPrices.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
  };

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', description: '', price: 0 }]
    }));
  };

  const removeAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const updateAddon = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    }));
  };

  // WYSIWYG Editor Functions
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      handleInputChange('description', content);
    }
  };

  const changeFontSize = (size: string) => {
    executeCommand('fontSize', size);
  };

  useEffect(() => {
    if (editorRef.current && formData.description) {
      if (editorRef.current.innerHTML !== formData.description) {
        editorRef.current.innerHTML = formData.description;
      }
    }
  }, [formData.description]);

  // Add CSS for placeholder
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [contenteditable]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/services/fleet')}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Armada' : 'Tambah Armada'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {isEdit ? 'Ubah informasi armada' : 'Tambahkan armada baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thumbnail Section - Moved to top */}
        <Card>
          <CardHeader>
            <CardTitle>Gambar Thumbnail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Gambar</span>
              </Button>
              <span className="text-sm text-gray-500">
                Maksimal 10 gambar ({formData.images.length}/10)
              </span>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
          </CardContent>
        </Card>

        {/* Basic Information - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Jenis Armada *
                    </label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Minibus">Minibus</SelectItem>
                        <SelectItem value="MPV">MPV</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Bus Kecil">Bus Kecil</SelectItem>
                        <SelectItem value="Bus Besar">Bus Besar</SelectItem>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Nama Armada *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Masukkan nama armada"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Kapasitas (pax) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                      placeholder="Contoh: 15"
                      className={errors.capacity ? 'border-red-500' : ''}
                    />
                    {errors.capacity && <p className="text-sm text-red-500 mt-1">{errors.capacity}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Tahun Produksi *
                    </label>
                    <Input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear()}
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
                      placeholder="2022"
                      className={errors.year ? 'border-red-500' : ''}
                    />
                    {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Mesin *
                  </label>
                  <Input
                    value={formData.engine}
                    onChange={(e) => handleInputChange('engine', e.target.value)}
                    placeholder="Contoh: 2.5L Diesel"
                    className={errors.engine ? 'border-red-500' : ''}
                  />
                  {errors.engine && <p className="text-sm text-red-500 mt-1">{errors.engine}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Titik Jemput
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Masukkan titik jemput"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPickupPoint();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPickupPoint}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.pickupPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.pickupPoints.map((point, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{point}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removePickupPoint(point)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Deskripsi *
              </label>
              <div className="border rounded-md">
                <div className="flex items-center space-x-2 p-2 border-b bg-gray-50 dark:bg-gray-800">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('bold')}
                    title="Bold"
                  >
                    <span className="font-bold text-gray-700 dark:text-gray-300">B</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('italic')}
                    title="Italic"
                  >
                    <span className="italic text-gray-700 dark:text-gray-300">I</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('underline')}
                    title="Underline"
                  >
                    <span className="underline text-gray-700 dark:text-gray-300">U</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('insertUnorderedList')}
                    title="Bullet List"
                  >
                    <span className="text-gray-700 dark:text-gray-300">•</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('insertOrderedList')}
                    title="Numbered List"
                  >
                    <span className="text-gray-700 dark:text-gray-300">1.</span>
                  </Button>
                  <div className="flex items-center space-x-1 ml-2">
                    <Type className="h-4 w-4 text-gray-500" />
                    <Select onValueChange={changeFontSize}>
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Small</SelectItem>
                        <SelectItem value="3">Normal</SelectItem>
                        <SelectItem value="5">Large</SelectItem>
                        <SelectItem value="7">X-Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorChange}
                  className={`min-h-[150px] p-3 border-0 resize-none focus:outline-none ${errors.description ? 'border-red-500' : ''}`}
                  style={{ 
                    minHeight: '150px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                  data-placeholder="Deskripsikan armada secara detail..."
                />
              </div>
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Features - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fasilitas</span>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Fasilitas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Masukkan fasilitas"
                    className="flex-1"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rental Prices - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Harga Sewa</span>
              <Button type="button" variant="outline" size="sm" onClick={addRentalPrice}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Durasi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.rentalPrices.map((price, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Durasi
                    </label>
                    <Input
                      value={price.duration}
                      onChange={(e) => updateRentalPrice(index, 'duration', e.target.value)}
                      placeholder="Contoh: 1-3 hari"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Jenis Sewa
                    </label>
                    <Select 
                      value={price.type} 
                      onValueChange={(value) => updateRentalPrice(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis sewa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citytour">Citytour</SelectItem>
                        <SelectItem value="overland">Overland</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga (Rp)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={price.price.toLocaleString()}
                        onChange={(e) => updateRentalPrice(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                        placeholder="200,000"
                        className="flex-1"
                      />
                      {formData.rentalPrices.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRentalPrice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Addon Packages - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Paket Addon</span>
              <Button type="button" variant="outline" size="sm" onClick={addAddon}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Addon
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.addons.map((addon, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Nama Addon
                    </label>
                    <Input
                      value={addon.name}
                      onChange={(e) => updateAddon(index, 'name', e.target.value)}
                      placeholder="Contoh: Driver"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Deskripsi
                    </label>
                    <Input
                      value={addon.description}
                      onChange={(e) => updateAddon(index, 'description', e.target.value)}
                      placeholder="Contoh: Driver profesional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga Tambahan (Rp)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={addon.price.toLocaleString()}
                        onChange={(e) => updateAddon(index, 'price', parseInt(formatCurrency(e.target.value)) || 0)}
                        placeholder="100,000"
                        className="flex-1"
                      />
                      {formData.addons.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAddon(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Status:
            </label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/services/fleet')}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Update Armada' : 'Simpan Armada'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
